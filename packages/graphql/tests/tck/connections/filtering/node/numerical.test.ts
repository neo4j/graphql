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
import { gql } from "apollo-server";
import type { DocumentNode } from "graphql";
import { Neo4jGraphQL } from "../../../../../src";
import { createJwtRequest } from "../../../../utils/create-jwt-request";
import { formatCypher, translateQuery, formatParams } from "../../../utils/tck-test-utils";

describe("Cypher -> Connections -> Filtering -> Node -> Numerical", () => {
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
                name: String!
                age: Int!
                movies: [Movie!]! @relationship(type: "ACTED_IN", properties: "ActedIn", direction: OUT)
            }

            interface ActedIn @relationshipProperties {
                screenTime: Int!
            }
        `;

        neoSchema = new Neo4jGraphQL({
            typeDefs,
            config: { enableRegex: true },
            plugins: {
                auth: new Neo4jGraphQLAuthJWTPlugin({
                    secret,
                }),
            },
        });
    });

    test("LT", async () => {
        const query = gql`
            query {
                movies {
                    title
                    actorsConnection(where: { node: { age_LT: 60 } }) {
                        edges {
                            screenTime
                            node {
                                name
                                age
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
            CALL {
                WITH this
                MATCH (this)<-[this_connection_actorsConnectionthis0:ACTED_IN]-(this_Actor:\`Actor\`)
                WHERE this_Actor.age < $this_connection_actorsConnectionparam0
                WITH { screenTime: this_connection_actorsConnectionthis0.screenTime, node: { name: this_Actor.name, age: this_Actor.age } } AS edge
                WITH collect(edge) AS edges
                WITH edges, size(edges) AS totalCount
                RETURN { edges: edges, totalCount: totalCount } AS this_actorsConnection
            }
            RETURN this { .title, actorsConnection: this_actorsConnection } AS this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"this_connection_actorsConnectionparam0\\": {
                    \\"low\\": 60,
                    \\"high\\": 0
                }
            }"
        `);
    });

    test("LTE", async () => {
        const query = gql`
            query {
                movies {
                    title
                    actorsConnection(where: { node: { age_LTE: 60 } }) {
                        edges {
                            screenTime
                            node {
                                name
                                age
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
            CALL {
                WITH this
                MATCH (this)<-[this_connection_actorsConnectionthis0:ACTED_IN]-(this_Actor:\`Actor\`)
                WHERE this_Actor.age <= $this_connection_actorsConnectionparam0
                WITH { screenTime: this_connection_actorsConnectionthis0.screenTime, node: { name: this_Actor.name, age: this_Actor.age } } AS edge
                WITH collect(edge) AS edges
                WITH edges, size(edges) AS totalCount
                RETURN { edges: edges, totalCount: totalCount } AS this_actorsConnection
            }
            RETURN this { .title, actorsConnection: this_actorsConnection } AS this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"this_connection_actorsConnectionparam0\\": {
                    \\"low\\": 60,
                    \\"high\\": 0
                }
            }"
        `);
    });

    test("GT", async () => {
        const query = gql`
            query {
                movies {
                    title
                    actorsConnection(where: { node: { age_GT: 60 } }) {
                        edges {
                            screenTime
                            node {
                                name
                                age
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
            CALL {
                WITH this
                MATCH (this)<-[this_connection_actorsConnectionthis0:ACTED_IN]-(this_Actor:\`Actor\`)
                WHERE this_Actor.age > $this_connection_actorsConnectionparam0
                WITH { screenTime: this_connection_actorsConnectionthis0.screenTime, node: { name: this_Actor.name, age: this_Actor.age } } AS edge
                WITH collect(edge) AS edges
                WITH edges, size(edges) AS totalCount
                RETURN { edges: edges, totalCount: totalCount } AS this_actorsConnection
            }
            RETURN this { .title, actorsConnection: this_actorsConnection } AS this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"this_connection_actorsConnectionparam0\\": {
                    \\"low\\": 60,
                    \\"high\\": 0
                }
            }"
        `);
    });

    test("GTE", async () => {
        const query = gql`
            query {
                movies {
                    title
                    actorsConnection(where: { node: { age_GTE: 60 } }) {
                        edges {
                            screenTime
                            node {
                                name
                                age
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
            CALL {
                WITH this
                MATCH (this)<-[this_connection_actorsConnectionthis0:ACTED_IN]-(this_Actor:\`Actor\`)
                WHERE this_Actor.age >= $this_connection_actorsConnectionparam0
                WITH { screenTime: this_connection_actorsConnectionthis0.screenTime, node: { name: this_Actor.name, age: this_Actor.age } } AS edge
                WITH collect(edge) AS edges
                WITH edges, size(edges) AS totalCount
                RETURN { edges: edges, totalCount: totalCount } AS this_actorsConnection
            }
            RETURN this { .title, actorsConnection: this_actorsConnection } AS this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"this_connection_actorsConnectionparam0\\": {
                    \\"low\\": 60,
                    \\"high\\": 0
                }
            }"
        `);
    });
});
