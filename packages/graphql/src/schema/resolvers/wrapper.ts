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
import type { GraphQLResolveInfo } from "graphql";
import { print } from "graphql";
import type { Driver } from "neo4j-driver";
import { Neo4jError } from "neo4j-driver";
import type { Neo4jGraphQLConfig, Node, Relationship } from "../../classes";
import type { Neo4jDatabaseInfo } from "../../classes/Neo4jDatabaseInfo";
import { getNeo4jDatabaseInfo } from "../../classes/Neo4jDatabaseInfo";
import { Executor } from "../../classes/Executor";
import type { ExecutorConstructorParam } from "../../classes/Executor";
import { AUTH_FORBIDDEN_ERROR, DEBUG_GRAPHQL } from "../../constants";
import createAuthParam from "../../translate/create-auth-param";
import type { Context, Neo4jGraphQLPlugins } from "../../types";
import type { SubscriptionConnectionContext, SubscriptionContext } from "./subscriptions/types";
import { decodeToken, verifyGlobalAuthentication } from "./wrapper-utils";
import type { Neo4jGraphQLSchemaModel } from "../../schema-model/Neo4jGraphQLSchemaModel";
import { IncomingMessage } from "http";
import Cypher from "@neo4j/cypher-builder";
import type { Neo4jGraphQLAuthorization } from "../../classes/authorization/Neo4jGraphQLAuthorization";
import { getToken, parseBearerToken } from "../../classes/authorization/parse-request-token";

const debug = Debug(DEBUG_GRAPHQL);

export type WrapResolverArguments = {
    driver?: Driver;
    config: Neo4jGraphQLConfig;
    nodes: Node[];
    relationships: Relationship[];
    jwtPayloadFieldsMap?: Map<string, string>;
    schemaModel: Neo4jGraphQLSchemaModel;
    plugins?: Neo4jGraphQLPlugins;
    dbInfo?: Neo4jDatabaseInfo;
    authorization?: Neo4jGraphQLAuthorization;
};

let neo4jDatabaseInfo: Neo4jDatabaseInfo;

export const wrapResolver =
    ({
        driver,
        config,
        nodes,
        relationships,
        jwtPayloadFieldsMap,
        schemaModel,
        plugins,
        dbInfo,
        authorization,
    }: WrapResolverArguments) =>
    // TODO: strongly type this, so that context argument accepts "full" context
    (next) =>
    // TODO: type this as Neo4jGraphQLContext
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

        context.info = info;

        if (!context?.driverConfig) {
            context.driverConfig = driverConfig;
        }

        context.nodes = nodes;
        context.relationships = relationships;
        context.schemaModel = schemaModel;
        context.plugins = plugins || {};
        context.subscriptionsEnabled = Boolean(context.plugins?.subscriptions);
        context.callbacks = config.callbacks;

        if (!context.jwt) {
            if (authorization) {
                try {
                    const jwt = await authorization.decode(context);
                    const isAuthenticated = true;

                    context.authorization = {
                        isAuthenticated,
                        jwt,
                        jwtParam: new Cypher.NamedParam("jwt", jwt),
                        isAuthenticatedParam: new Cypher.NamedParam("isAuthenticated", isAuthenticated),
                        claims: jwtPayloadFieldsMap,
                    };
                } catch (e) {
                    if (authorization.globalAuthentication) {
                        throw e;
                    }
                    const isAuthenticated = false;
                    context.authorization = {
                        isAuthenticated,
                        jwtParam: new Cypher.NamedParam("jwt", {}),
                        isAuthenticatedParam: new Cypher.NamedParam("isAuthenticated", isAuthenticated),
                    };
                }
            }

            // TODO: remove this if after migrating to new authorization constructor

            if (context.plugins.auth) {
                const req = context.req || context.request;
                context.plugins.auth.tryToResolveKeys(context instanceof IncomingMessage ? context : req);
                let token: string | undefined = undefined;
                const bearer = getToken(req);
                if (bearer) {
                    token = parseBearerToken(bearer);
                }
                context.jwt = await decodeToken(token, context.plugins.auth);
            }
        } else {
            const isAuthenticated = true;
            const jwt = context.jwt;

            context.authorization = {
                isAuthenticated,
                jwt,
                jwtParam: new Cypher.NamedParam("jwt", jwt),
                isAuthenticatedParam: new Cypher.NamedParam("isAuthenticated", isAuthenticated),
            };
        }

        verifyGlobalAuthentication(context, context.plugins?.auth);

        const authParam = createAuthParam({ context });

        context.auth = authParam;

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
            if (dbInfo) {
                neo4jDatabaseInfo = dbInfo;
            }
            if (!neo4jDatabaseInfo?.version) {
                neo4jDatabaseInfo = await getNeo4jDatabaseInfo(context.executor);
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
        const schemaModel = resolverArgs?.schemaModel;
        const contextParams = context?.connectionParams || {};

        if (!plugins.subscriptions) {
            debug("Subscription Plugin not set");
            return next(root, args, context, info);
        }

        const subscriptionContext: SubscriptionContext = {
            plugin: plugins.subscriptions,
            schemaModel,
        };

        if (context?.jwt) {
            subscriptionContext.jwt = context.jwt;
        } else {
            if (resolverArgs.authorization) {
                if (!contextParams.authorization && resolverArgs.authorization.globalAuthentication) {
                    throw new Neo4jError("Unauthenticated", AUTH_FORBIDDEN_ERROR);
                } else {
                    // TODO: verification was not part of this?!
                    try {
                        const authorization = resolverArgs.authorization;
                        const jwt = await authorization.decodeBearerTokenWithVerify(contextParams.authorization);
                        subscriptionContext.jwt = jwt;
                    } catch (e) {
                        if (resolverArgs.authorization.globalAuthentication) {
                            throw e;
                        }
                        subscriptionContext.jwt = undefined;
                    }
                }
            } else {
                if (contextParams.authorization) {
                    // TODO: remove this else after migrating to new authorization constructor
                    const token = parseBearerToken(contextParams.authorization);
                    subscriptionContext.jwt = await decodeToken(token, plugins.auth);
                }
            }
        }

        verifyGlobalAuthentication(subscriptionContext, plugins.auth);

        return next(root, args, { ...context, ...contextParams, ...subscriptionContext }, info);
    };
