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
import { GraphQLResolveInfo, GraphQLSchema, print } from "graphql";
import { Driver } from "neo4j-driver";
import { Neo4jGraphQLAuthenticationError, Neo4jGraphQLConfig, Node, Relationship } from "../../classes";
import { DEBUG_GRAPHQL } from "../../constants";
import createAuthParam from "../../translate/create-auth-param";
import { Context, Neo4jGraphQLPlugins, JwtPayload } from "../../types";
import { getToken } from "../../utils/get-token";

const debug = Debug(DEBUG_GRAPHQL);

type WrapResolverArguments = {
    driver?: Driver;
    config: Neo4jGraphQLConfig;
    nodes: Node[];
    relationships: Relationship[];
    schema: GraphQLSchema;
    plugins?: Neo4jGraphQLPlugins;
};

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
        context.plugins = plugins;
        context.subscriptionsEnabled = Boolean(context.plugins?.subscriptions);
        context.callbacks = config.callbacks;

        if (!context.jwt) {
            if (context.plugins?.auth) {
                const token = getToken(context);

                if (token) {
                    const jwt = await context.plugins.auth.decode<JwtPayload>(token);

                    if (typeof jwt === "string") {
                        throw new Neo4jGraphQLAuthenticationError("JWT payload cannot be a string");
                    }

                    context.jwt = jwt;
                }
            }
        }

        context.auth = createAuthParam({ context });

        context.queryOptions = config.queryOptions;

        return next(root, args, context, info);
    };

export const wrapSubscription =
    (resolverArgs: WrapResolverArguments) =>
    (next) =>
    (root, args, context: Record<string, any>, info: GraphQLResolveInfo) => {
        // TODO: context auth
        let subscriptionContext = {};
        if (resolverArgs.plugins?.subscriptions) {
            subscriptionContext = {
                plugin: resolverArgs.plugins.subscriptions,
            };
        }
        return next(root, args, { ...context, ...subscriptionContext }, info);
    };
