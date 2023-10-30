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

import type { GraphQLFieldResolver, GraphQLResolveInfo } from "graphql";
import Debug from "debug";
import type { Neo4jGraphQLAuthorization } from "../../../classes/authorization/Neo4jGraphQLAuthorization";
import type { Neo4jGraphQLSchemaModel } from "../../../schema-model/Neo4jGraphQLSchemaModel";
import type { AuthorizationContext, Neo4jGraphQLSubscriptionsEngine } from "../../../types";
import type { Neo4jGraphQLSubscriptionsContext } from "../../../types/neo4j-graphql-subscriptions-context";
import { getAuthorizationContext } from "./utils/get-authorization-context";
import { DEBUG_GRAPHQL } from "../../../constants";
import { debugGraphQLResolveInfo } from "../../../debug/debug-graphql-resolve-info";
import { debugObject } from "../../../debug/debug-object";

const debug = Debug(DEBUG_GRAPHQL);

export type WrapSubscriptionArgs = {
    schemaModel: Neo4jGraphQLSchemaModel;
    subscriptionsEngine: Neo4jGraphQLSubscriptionsEngine;
    authorization?: Neo4jGraphQLAuthorization;
    jwtPayloadFieldsMap?: Map<string, string>;
};

export interface Neo4jGraphQLComposedSubscriptionsContext extends Neo4jGraphQLSubscriptionsContext {
    authorization: AuthorizationContext;
    schemaModel: Neo4jGraphQLSchemaModel;
    subscriptionsEngine: Neo4jGraphQLSubscriptionsEngine;
}

export const wrapSubscription =
    (resolverArgs: WrapSubscriptionArgs) =>
    (next: GraphQLFieldResolver<any, Neo4jGraphQLComposedSubscriptionsContext>) =>
    async (root: any, args: any, context: Neo4jGraphQLSubscriptionsContext, info: GraphQLResolveInfo) => {
        debugGraphQLResolveInfo(debug, info);
        debugObject(debug, "incoming context", context);

        const subscriptionsEngine = resolverArgs.subscriptionsEngine;
        const schemaModel = resolverArgs.schemaModel;
        const authorization = resolverArgs.authorization;
        const jwtClaimsMap = resolverArgs.jwtPayloadFieldsMap;

        const authorizationContext = await getAuthorizationContext(
            context?.connectionParams || {},
            authorization,
            jwtClaimsMap
        );
        if (!context.connectionParams?.jwt) {
            context.connectionParams = { ...context.connectionParams, jwt: authorizationContext.jwt };
        }

        const internalContext = {
            authorization: authorizationContext,
            schemaModel,
            subscriptionsEngine,
        };

        return next(root, args, { ...context, ...internalContext }, info);
    };
