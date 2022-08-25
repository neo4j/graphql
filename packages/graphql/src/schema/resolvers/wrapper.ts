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

import Debug from "debug";
import type { GraphQLResolveInfo, GraphQLSchema } from "graphql";
import { print } from "graphql";
import type { Driver } from "neo4j-driver";
import { Neo4jGraphQLConfig, Node, Relationship, Neo4jDatabaseInfo } from "../../classes";
import { Executor } from "../../classes/Executor";
import type { ExecutorConstructorParam } from "../../classes/Executor";
import { DBMS_COMPONENTS_QUERY, DEBUG_GRAPHQL } from "../../constants";
import createAuthParam from "../../translate/create-auth-param";
import type { Context, Neo4jGraphQLPlugins } from "../../types";
import { getToken, parseBearerToken } from "../../utils/get-token";
import type { SubscriptionConnectionContext, SubscriptionContext } from "./subscriptions/types";
import type { Neo4jEdition } from "../../classes/Neo4jGraphQL";
import { decodeToken, verifyGlobalAuthentication } from "./wrapper-utils";

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

        verifyGlobalAuthentication(context, context.plugins?.auth);

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

        context.executor = new Executor(executorConstructorParam);

        if (!context.neo4jDatabaseInfo?.version) {
            if (!neo4jDatabaseInfo?.version) {
                const dbmsComponentsQueryResult = await context.executor.execute(
                    DBMS_COMPONENTS_QUERY as string,
                    {},
                    "READ"
                );
                const rawRow = dbmsComponentsQueryResult?.records[0];
                const [rawVersion, edition] = rawRow;
                neo4jDatabaseInfo = new Neo4jDatabaseInfo(rawVersion as string, edition as Neo4jEdition);
            }
            context.neo4jDatabaseInfo = neo4jDatabaseInfo;
        }

        return next(root, args, context, info);
    };

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

        verifyGlobalAuthentication(subscriptionContext, plugins.auth);

        return next(root, args, { ...context, ...contextParams, ...subscriptionContext }, info);
    };
