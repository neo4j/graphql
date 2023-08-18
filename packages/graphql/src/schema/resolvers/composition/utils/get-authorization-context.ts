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

import Cypher from "@neo4j/cypher-builder";
import type { Neo4jGraphQLAuthorization } from "../../../../classes/authorization/Neo4jGraphQLAuthorization";
import type { AuthorizationContext } from "../../../../types";
import type { Neo4jGraphQLContext } from "../../../../types/neo4j-graphql-context";
import type { Neo4jGraphQLSubscriptionsConnectionParams } from "../../../../types/neo4j-graphql-subscriptions-context";

export async function getAuthorizationContext(
    context: Neo4jGraphQLContext | Neo4jGraphQLSubscriptionsConnectionParams,
    authorization?: Neo4jGraphQLAuthorization,
    jwtClaimsMap?: Map<string, string>
): Promise<AuthorizationContext> {
    if (!context.jwt && authorization) {
        const jwt = await authorization.decode(context);
        if (jwt) {
            context.jwt = jwt;
            const isAuthenticated = true;
            return {
                isAuthenticated,
                jwt: context.jwt,
                jwtParam: new Cypher.NamedParam("jwt", context.jwt),
                isAuthenticatedParam: new Cypher.NamedParam("isAuthenticated", isAuthenticated),
                claims: jwtClaimsMap,
            };
        } else {
            const isAuthenticated = false;
            return {
                isAuthenticated,
                jwtParam: new Cypher.NamedParam("jwt", {}),
                isAuthenticatedParam: new Cypher.NamedParam("isAuthenticated", isAuthenticated),
            };
        }
    }

    const isAuthenticated = true;
    const jwt = context.jwt;

    return {
        isAuthenticated,
        jwt,
        jwtParam: new Cypher.NamedParam("jwt", jwt),
        isAuthenticatedParam: new Cypher.NamedParam("isAuthenticated", isAuthenticated),
    };
}
