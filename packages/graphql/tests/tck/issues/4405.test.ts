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

import gql from "graphql-tag";
import { Neo4jGraphQL } from "../../../src";
import { createBearerToken } from "../../utils/create-bearer-token";
import { translateQuery, formatCypher, formatParams } from "../utils/tck-test-utils";

describe("https://github.com/neo4j/graphql/issues/4405", () => {
    test("authorization should work when the filter value is an array", async () => {
        const typeDefs = /* GraphQL */ `
            type Movie {
                title: String
            }

            type Actor
                @authorization(
                    validate: [
                        {
                            when: [BEFORE]
                            operations: [READ]
                            where: { node: { actedInConnection_SOME: { node: { title_IN: ["Matrix"] } } } }
                        }
                    ]
                ) {
                name: String!
                actedIn: [Movie!]! @relationship(type: "ACTED_IN", direction: OUT)
            }
        `;

        const neoSchema = new Neo4jGraphQL({ typeDefs, features: { authorization: { key: "secret" } } });

        const query = /* GraphQL */ `
            query actors {
                actors {
                    name
                }
            }
        `;

        const token = createBearerToken("secret", { roles: ["admin"], id: "something", email: "something" });
        const result = await translateQuery(neoSchema, query, { token });

        expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
            "MATCH (this:Actor)
            WITH *
            WHERE apoc.util.validatePredicate(NOT ($isAuthenticated = true AND size([(this)-[this1:ACTED_IN]->(this0:Movie) WHERE ($param1 IS NOT NULL AND this0.title IN $param1) | 1]) > 0), \\"@neo4j/graphql/FORBIDDEN\\", [0])
            RETURN this { .name } AS this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"isAuthenticated\\": true,
                \\"param1\\": [
                    \\"Matrix\\"
                ]
            }"
        `);
    });

    test("authorization should work when the filter value is an array, inside logical", async () => {
        const typeDefs = /* GraphQL */ `
            type Movie {
                title: String
            }

            type Actor
                @authorization(
                    validate: [
                        {
                            when: [BEFORE]
                            operations: [READ]
                            where: {
                                node: {
                                    actedInConnection_SOME: {
                                        node: {
                                            OR: [{ title_IN: ["Matrix"] }, { title_IN: ["Forrest Gump", "Top Gun"] }]
                                        }
                                    }
                                }
                            }
                        }
                    ]
                ) {
                name: String!
                actedIn: [Movie!]! @relationship(type: "ACTED_IN", direction: OUT)
            }
        `;

        const neoSchema = new Neo4jGraphQL({ typeDefs, features: { authorization: { key: "secret" } } });

        const query = /* GraphQL */ `
            query actors {
                actors {
                    name
                }
            }
        `;

        const token = createBearerToken("secret", { roles: ["admin"], id: "something", email: "something" });
        const result = await translateQuery(neoSchema, query, { token });

        expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
            "MATCH (this:Actor)
            WITH *
            WHERE apoc.util.validatePredicate(NOT ($isAuthenticated = true AND size([(this)-[this1:ACTED_IN]->(this0:Movie) WHERE (($param1 IS NOT NULL AND this0.title IN $param1) OR ($param2 IS NOT NULL AND this0.title IN $param2)) | 1]) > 0), \\"@neo4j/graphql/FORBIDDEN\\", [0])
            RETURN this { .name } AS this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"isAuthenticated\\": true,
                \\"param1\\": [
                    \\"Matrix\\"
                ],
                \\"param2\\": [
                    \\"Forrest Gump\\",
                    \\"Top Gun\\"
                ]
            }"
        `);
    });
});
