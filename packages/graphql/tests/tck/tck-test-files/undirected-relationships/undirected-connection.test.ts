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

import { gql } from "apollo-server";
import { DocumentNode } from "graphql";
import { Neo4jGraphQL } from "../../../../src";
import { createJwtRequest } from "../../../utils/create-jwt-request";
import { formatCypher, formatParams, translateQuery } from "../../utils/tck-test-utils";

describe("Undirected connections", () => {
    const secret = "secret";
    let typeDefs: DocumentNode;
    let neo4jgraphql: Neo4jGraphQL;

    test("query with undirected aggregation", async () => {
        typeDefs = gql`
            type User {
                name: String!
                friends: [User!]! @relationship(type: "FRIENDS_WITH", direction: OUT)
            }
        `;

        neo4jgraphql = new Neo4jGraphQL({
            typeDefs,
            config: { jwt: { secret } },
        });
        const query = gql`
            query FriendsAggregate {
                users {
                    friendsConnection(directed: false) {
                        totalCount
                    }
                }
            }
        `;

        const req = createJwtRequest("secret", {});
        const result = await translateQuery(neo4jgraphql, query, {
            req,
        });

        expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
"MATCH (this:User)
CALL {
WITH this
MATCH (this)-[this_friends_with_relationship:FRIENDS_WITH]-(this_user:User)
WITH collect({  }) AS edges
RETURN { totalCount: size(edges) } AS friendsConnection
}
RETURN this { friendsConnection } as this"
`);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`"{}"`);
    });
});
