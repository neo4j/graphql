/*
 * Copyright (c) "Neo4j"
 * Neo4j Sweden AB [http://neo4j.com]
 *
 * This file is part of Neo4j.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
import semver from "semver";
import Debug from "debug";
import type { GraphQLResolveInfo, GraphQLSchema } from "graphql";
import { print } from "graphql";
import type { Driver } from "neo4j-driver";
import {
    Neo4jGraphQLConfig,
    Node,
    Relationship,
    VersionMismatchError,
    Neo4jGraphQLAuthenticationError,
} from "../../classes";
import { Executor } from "../../classes/Executor";
import type { ExecutorConstructorParam } from "../../classes/Executor";
import { DEBUG_GRAPHQL } from "../../constants";
import createAuthParam from "../../translate/create-auth-param";
import type {
    Context,
    Neo4jGraphQLPlugins,
    JwtPayload,
    Neo4jGraphQLAuthPlugin,
    Neo4jVersion,
    Neo4jEdition,
} from "../../types";
import { Neo4jDatabaseInfo } from "../../types";
import { getToken, parseBearerToken } from "../../utils/get-token";
import type { SubscriptionConnectionContext, SubscriptionContext } from "./subscriptions/types";

const debug = Debug(DEBUG_GRAPHQL);

type WrapResolverArguments = {
    driver?: Driver;
    config: Neo4jGraphQLConfig;
    nodes: Node[];
    relationships: Relationship[];
    schema: GraphQLSchema;
    plugins?: Neo4jGraphQLPlugins;
};

let neo4jDatabaseInfo: Neo4jDatabaseInfo;

export const wrapResolver =
    ({ driver, config, nodes, relationships, schema, plugins }: WrapResolverArguments) =>
    (next) =>
    async (root, args, context: Context, info: GraphQLResolveInfo) => {
        const { driverConfig } = config;

        if (debug.enabled) {
            const query = print(info.operation);

            debug(
                "%s",
                `Incoming GraphQL:\nQuery:\n${query}\nVariables:\n${JSON.stringify(info.variableValues, null, 2)}`
            );
        }

        if (!context?.executionContext) {
            if (context?.driver) {
                context.executionContext = context.driver;
            } else {
                if (!driver) {
                    throw new Error(
                        "A Neo4j driver instance must either be passed to Neo4jGraphQL on construction, or a driver, session or transaction passed as context.executionContext in each request."
                    );
                }
                context.executionContext = driver;
            }
        }

        if (!context?.driverConfig) {
            context.driverConfig = driverConfig;
        }

        context.nodes = nodes;
        context.relationships = relationships;
        context.schema = schema;
        context.plugins = plugins || {};
        context.subscriptionsEnabled = Boolean(context.plugins?.subscriptions);
        context.callbacks = config.callbacks;

        if (!context.jwt) {
            const token = getToken(context);
            context.jwt = await decodeToken(token, context.plugins.auth);
        }

        context.auth = createAuthParam({ context });

        const executorConstructorParam: ExecutorConstructorParam = {
            executionContext: context.executionContext,
            auth: context.auth,
        };

        if (config.queryOptions) {
            executorConstructorParam.queryOptions = config.queryOptions;
        }

        if (context.driverConfig?.database) {
            executorConstructorParam.database = context.driverConfig?.database;
        }

        if (context.driverConfig?.bookmarks) {
            executorConstructorParam.bookmarks = context.driverConfig?.bookmarks;
        }

        if (!neo4jDatabaseInfo?.version) {
            const dbmsComponentsQuery =
                "CALL dbms.components() YIELD versions, edition UNWIND versions AS version RETURN version, edition";
            const dbmsComponentsQueryResult = await new Executor(executorConstructorParam).execute(
                dbmsComponentsQuery,
                {},
                "READ"
            );
            const rawRow = dbmsComponentsQueryResult?.records[0];
            const [rawVersion, edition] = rawRow;
            const version = semver.coerce(rawVersion as string);
            if (rawRow === undefined || !semver.valid(version)) {
                throw new Error("Neo4j version not detectable");
            }
            const { major, minor } = version as semver.SemVer;
            const neo4jVersion = { major, minor } as Neo4jVersion;
            neo4jDatabaseInfo = new Neo4jDatabaseInfo(neo4jVersion, edition as Neo4jEdition);
        }
        executorConstructorParam.neo4jDatabaseInfo = neo4jDatabaseInfo;
        context.executor = new Executor(executorConstructorParam);
        context.neo4jDatabaseInfo = neo4jDatabaseInfo;

        return versionMismatchDecorator(next)(root, args, context, info);
    };

function versionMismatchDecorator(resolver: any) {
    return async (_root: any, args: any, _context: unknown, info: GraphQLResolveInfo) => {
        let resolverResponse;
        try {
            resolverResponse = await resolver(_root, args, _context, info);
        } catch (error) {
            if (error instanceof VersionMismatchError) {
                ((_context as Context).neo4jDatabaseInfo as Neo4jDatabaseInfo).version = {
                    major: error.major,
                    minor: error.minor,
                };
                resolverResponse = await resolver(_root, args, _context, info);
            }
        }
        return resolverResponse;
    };
}

export const wrapSubscription =
    (resolverArgs: WrapResolverArguments) =>
    (next) =>
    async (root: any, args: any, context: SubscriptionConnectionContext | undefined, info: GraphQLResolveInfo) => {
        const plugins = resolverArgs?.plugins || {};
        const contextParams = context?.connectionParams || {};

        if (!plugins.subscriptions) {
            debug("Subscription Plugin not set");
            return next(root, args, context, info);
        }

        const subscriptionContext: SubscriptionContext = {
            plugin: plugins.subscriptions,
        };

        if (!context?.jwt && contextParams.authorization) {
            const token = parseBearerToken(contextParams.authorization);
            subscriptionContext.jwt = await decodeToken(token, plugins.auth);
        }

        return next(root, args, { ...context, ...contextParams, ...subscriptionContext }, info);
    };

async function decodeToken(
    token: string | undefined,
    plugin: Neo4jGraphQLAuthPlugin | undefined
): Promise<JwtPayload | undefined> {
    if (token && plugin) {
        const jwt = await plugin.decode<JwtPayload>(token);
        if (typeof jwt === "string") {
            throw new Neo4jGraphQLAuthenticationError("JWT payload cannot be a string");
        }
        return jwt;
    }
    return undefined;
}
