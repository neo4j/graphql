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

import { Neo4jGraphQL } from "../../../src";
import { createBearerToken } from "../../utils/create-bearer-token";
import { formatCypher, formatParams, translateQuery } from "../utils/tck-test-utils";

describe("https://github.com/neo4j/graphql/issues/5270", () => {
    let typeDefs: string;
    let neoSchema: Neo4jGraphQL;
    const secret = "secret";

    beforeAll(() => {
        typeDefs = /* GraphQL */ `
            type User
                @node(labels: ["User"])
                @authorization(
                    filter: [
                        {
                            where: {
                                node: { NOT: { blockedUsers: { some: { to: { some: { id: { eq: "$jwt.sub" } } } } } } }
                            }
                        }
                    ]
                ) {
                id: ID! @id
                blockedUsers: [UserBlockedUser!]! @relationship(type: "HAS_BLOCKED", direction: OUT)
            }

            type UserBlockedUser
                @node(labels: ["UserBlockedUser"])
                @authorization(filter: [{ where: { node: { from: { some: { id: { eq: "$jwt.sub" } } } } } }]) {
                id: ID! @id
                from: [User!]!
                    @relationship(type: "HAS_BLOCKED", direction: IN)
                    @settable(onCreate: true, onUpdate: false)
                to: [User!]!
                    @relationship(type: "IS_BLOCKING", direction: OUT)
                    @settable(onCreate: true, onUpdate: false)
            }

            type Query {
                getMe: User @cypher(statement: "OPTIONAL MATCH (u:User {id: $jwt.sub}) RETURN u", columnName: "u")
            }
        `;

        neoSchema = new Neo4jGraphQL({
            typeDefs,
            features: {
                authorization: {
                    key: secret,
                },
            },
        });
    });

    test("should return filtered results according to authorization rule", async () => {
        const query = /* GraphQL */ `
            query GetMe {
                getMe {
                    id
                    __typename
                }
            }
        `;

        const userId = "my-user-id";

        const token = createBearerToken(secret, {
            sub: userId,
            name: "John Doe",
            iat: 1516239022,
        });

        const result = await translateQuery(neoSchema, query, {
            contextValues: {
                token,
            },
        });

        expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
            "CYPHER 5
            CALL {
                OPTIONAL MATCH (u:User {id: $jwt.sub}) RETURN u
            }
            WITH u AS this0
            WITH *
            WHERE ($isAuthenticated = true AND NOT (EXISTS {
                MATCH (this0)-[:HAS_BLOCKED]->(this1:UserBlockedUser)
                WHERE EXISTS {
                    MATCH (this1)-[:IS_BLOCKING]->(this2:User)
                    WHERE ($jwt.sub IS NOT NULL AND this2.id = $jwt.sub)
                }
            }))
            WITH this0 { .id } AS this0
            RETURN this0 AS this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"jwt\\": {
                    \\"roles\\": [],
                    \\"sub\\": \\"my-user-id\\",
                    \\"name\\": \\"John Doe\\"
                },
                \\"isAuthenticated\\": true
            }"
        `);
    });
});
