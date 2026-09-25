/*
 * Copyright (c) "Neo4j"
 * Neo4j Sweden AB [http://neo4j.com]
 */

import Debug from "debug";
import type { GraphQLFieldResolver, GraphQLResolveInfo } from "graphql";
import type { Neo4jGraphQLAuthorization } from "../../../classes/authorization/Neo4jGraphQLAuthorization";
import { DEBUG_GRAPHQL } from "../../../constants";
import { debugGraphQLResolveInfo } from "../../../debug/debug-graphql-resolve-info";
import { debugObject } from "../../../debug/debug-object";
import type { Neo4jGraphQLSchemaModel } from "../../../schema-model/Neo4jGraphQLSchemaModel";
import type { AuthorizationContext, Neo4jGraphQLSubscriptionsEngine } from "../../../types";
import type { Neo4jGraphQLSubscriptionsContext } from "../../../types/neo4j-graphql-subscriptions-context";
import { getAuthorizationContext } from "./utils/get-authorization-context";

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
            context.connectionParams ?? {},
            authorization,
            jwtClaimsMap,
            // Take jwt from context (set by server owner) instead of context.connectionParams (coming from the request).
            context.jwt
        );
        // Overwrite any client-supplied connectionParams.jwt as this can't be trusted.
        context.connectionParams = { ...context.connectionParams, jwt: authorizationContext.jwt };

        const internalContext = {
            authorization: authorizationContext,
            schemaModel,
            subscriptionsEngine,
        };

        return next(root, args, { ...context, ...internalContext }, info);
    };
