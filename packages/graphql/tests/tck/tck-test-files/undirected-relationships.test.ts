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
import { Neo4jGraphQL } from "../../../src";
import { createJwtRequest } from "../../utils/create-jwt-request";
import { formatCypher, formatParams, translateQuery } from "../utils/tck-test-utils";

describe("Undirected relationships", () => {
    const secret = "secret";
    let typeDefs: DocumentNode;
    let neoSchema: Neo4jGraphQL;

    beforeAll(() => {
        typeDefs = gql`
            type User {
                name: String!
                friends: [User!] @relationship(type: "FRIENDS_WITH", direction: OUT)
            }
        `;

        neoSchema = new Neo4jGraphQL({
            typeDefs,
            config: { enableRegex: true, jwt: { secret } }
        });
    });

    test("query with directed and undirected relationships", async () => {
        const query = gql`
            query {
                users {
                    name
                    friends: friends(directed: false) {
                        name
                    }
                    directedFriends: friends {
                        name
                    }
                }
            }
        `;

        const req = createJwtRequest("secret", {});
        const result = await translateQuery(neoSchema, query, {
            req
        });

        expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
"MATCH (this:User)
RETURN this { .name, friends: [ (this)-[:FRIENDS_WITH]-(this_friends:User)   | this_friends { .name } ], directedFriends: [ (this)-[:FRIENDS_WITH]->(this_directedFriends:User)   | this_directedFriends { .name } ] } as this"
`);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`"{}"`);
    });
});
