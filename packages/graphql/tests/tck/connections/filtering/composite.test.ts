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

import { Neo4jGraphQLAuthJWTPlugin } from "@neo4j/graphql-plugin-auth";
import { gql } from "graphql-tag";
import type { DocumentNode } from "graphql";
import { Neo4jGraphQL } from "../../../../src";
import { createJwtRequest } from "../../../utils/create-jwt-request";
import { formatCypher, translateQuery, formatParams } from "../../utils/tck-test-utils";

describe("Cypher -> Connections -> Filtering -> Composite", () => {
    const secret = "secret";
    let typeDefs: DocumentNode;
    let neoSchema: Neo4jGraphQL;

    beforeAll(() => {
        typeDefs = gql`
            type Movie {
                title: String!
                actors: [Actor!]! @relationship(type: "ACTED_IN", properties: "ActedIn", direction: IN)
            }

            type Actor {
                firstName: String!
                lastName: String!
                movies: [Movie!]! @relationship(type: "ACTED_IN", properties: "ActedIn", direction: OUT)
            }

            interface ActedIn {
                screenTime: Int!
            }
        `;

        neoSchema = new Neo4jGraphQL({
            typeDefs,
            plugins: {
                auth: new Neo4jGraphQLAuthJWTPlugin({
                    secret,
                }),
            },
        });
    });

    test("Composite", async () => {
        const query = gql`
            query {
                movies(where: { title: "Forrest Gump" }) {
                    title
                    actorsConnection(
                        where: {
                            node: { AND: [{ firstName: "Tom" }, { lastName: "Hanks" }] }
                            edge: { AND: [{ screenTime_GT: 30 }, { screenTime_LT: 90 }] }
                        }
                    ) {
                        edges {
                            screenTime
                            node {
                                firstName
                                lastName
                            }
                        }
                    }
                }
            }
        `;

        const req = createJwtRequest("secret", {});
        const result = await translateQuery(neoSchema, query, {
            req,
        });

        expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
            "MATCH (this:\`Movie\`)
            WHERE this.title = $param0
            CALL {
                WITH this
                MATCH (this)<-[this0:ACTED_IN]-(this1:\`Actor\`)
                WHERE ((this0.screenTime > $param1 AND this0.screenTime < $param2) AND (this1.firstName = $param3 AND this1.lastName = $param4))
                WITH { screenTime: this0.screenTime, node: { firstName: this1.firstName, lastName: this1.lastName } } AS edge
                WITH collect(edge) AS edges
                WITH edges, size(edges) AS totalCount
                RETURN { edges: edges, totalCount: totalCount } AS var2
            }
            RETURN this { .title, actorsConnection: var2 } AS this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"param0\\": \\"Forrest Gump\\",
                \\"param1\\": {
                    \\"low\\": 30,
                    \\"high\\": 0
                },
                \\"param2\\": {
                    \\"low\\": 90,
                    \\"high\\": 0
                },
                \\"param3\\": \\"Tom\\",
                \\"param4\\": \\"Hanks\\"
            }"
        `);
    });

    test("Composite NOT", async () => {
        const query = gql`
            query {
                movies(where: { title: "Forrest Gump" }) {
                    title
                    actorsConnection(
                        where: {
                            node: { NOT: { firstName: "Tom", lastName: "Hanks" } }
                            edge: { NOT: { screenTime_GT: 30, screenTime_LT: 90 } }
                        }
                    ) {
                        edges {
                            screenTime
                            node {
                                firstName
                                lastName
                            }
                        }
                    }
                }
            }
        `;

        const req = createJwtRequest("secret", {});
        const result = await translateQuery(neoSchema, query, {
            req,
        });

        expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
            "MATCH (this:\`Movie\`)
            WHERE this.title = $param0
            CALL {
                WITH this
                MATCH (this)<-[this0:ACTED_IN]-(this1:\`Actor\`)
                WHERE (NOT (this0.screenTime < $param1 AND this0.screenTime > $param2) AND NOT (this1.firstName = $param3 AND this1.lastName = $param4))
                WITH { screenTime: this0.screenTime, node: { firstName: this1.firstName, lastName: this1.lastName } } AS edge
                WITH collect(edge) AS edges
                WITH edges, size(edges) AS totalCount
                RETURN { edges: edges, totalCount: totalCount } AS var2
            }
            RETURN this { .title, actorsConnection: var2 } AS this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"param0\\": \\"Forrest Gump\\",
                \\"param1\\": {
                    \\"low\\": 90,
                    \\"high\\": 0
                },
                \\"param2\\": {
                    \\"low\\": 30,
                    \\"high\\": 0
                },
                \\"param3\\": \\"Tom\\",
                \\"param4\\": \\"Hanks\\"
            }"
        `);
    });
});
