/*
 * Copyright (c) "Neo4j"
 * Neo4j Sweden AB [http://neo4j.com]
 */

import Cypher from "@neo4j/cypher-builder";
import Debug from "debug";
import type { Neo4jGraphQLAuthorization } from "../../../../classes/authorization/Neo4jGraphQLAuthorization";
import { DEBUG_AUTH } from "../../../../constants";
import { debugObject } from "../../../../debug/debug-object";
import type { AuthorizationContext } from "../../../../types";
import type { Neo4jGraphQLContext } from "../../../../types/neo4j-graphql-context";
import type { Neo4jGraphQLSubscriptionsConnectionParams } from "../../../../types/neo4j-graphql-subscriptions-context";

const debug = Debug(DEBUG_AUTH);

const unauthorizedContext = {
    isAuthenticated: false,
    jwtParam: new Cypher.NamedParam("jwt", {}),
    isAuthenticatedParam: new Cypher.NamedParam("isAuthenticated", false),
};

export async function getAuthorizationContext(
    context: Neo4jGraphQLContext | Neo4jGraphQLSubscriptionsConnectionParams,
    authorization?: Neo4jGraphQLAuthorization,
    jwtClaimsMap?: Map<string, string>
): Promise<AuthorizationContext> {
    if (context.jwt) {
        const isAuthenticated = true;
        const jwt = context.jwt;

        debugObject(debug, "using JWT provided in context", jwt);

        return {
            isAuthenticated,
            jwt,
            jwtParam: new Cypher.NamedParam("jwt", jwt),
            isAuthenticatedParam: new Cypher.NamedParam("isAuthenticated", isAuthenticated),
        };
    }

    if (!authorization) {
        debug("authorization settings not specified, request not authenticated");
        return unauthorizedContext;
    }

    if (context.token) {
        const jwt = await authorization.decode(context);
        if (jwt) {
            context.jwt = jwt;
            const isAuthenticated = true;

            debugObject(debug, "successfully decoded JWT", jwt);

            return {
                isAuthenticated,
                jwt: context.jwt,
                jwtParam: new Cypher.NamedParam("jwt", context.jwt),
                isAuthenticatedParam: new Cypher.NamedParam("isAuthenticated", isAuthenticated),
                claims: jwtClaimsMap,
            };
        }
    }

    debug("request not authenticated");
    return unauthorizedContext;
}
