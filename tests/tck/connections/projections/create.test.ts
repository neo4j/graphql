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

import { Neo4jGraphQL } from "../../../../src";
import { formatCypher, formatParams, translateQuery } from "../../utils/tck-test-utils";

describe("Cypher -> Connections -> Projections -> Create", () => {
    let typeDefs: string;
    let neoSchema: Neo4jGraphQL;

    beforeAll(() => {
        typeDefs = /* GraphQL */ `
            type Movie {
                title: String!
                actors: [Actor!]! @relationship(type: "ACTED_IN", properties: "ActedIn", direction: IN)
            }

            type Actor {
                name: String!
                movies: [Movie!]! @relationship(type: "ACTED_IN", properties: "ActedIn", direction: OUT)
            }

            type ActedIn @relationshipProperties {
                screenTime: Int!
            }
        `;

        neoSchema = new Neo4jGraphQL({
            typeDefs,
        });
    });

    test("Connection can be selected following the creation of a single node", async () => {
        const query = /* GraphQL */ `
            mutation {
                createMovies(input: [{ title: "Forrest Gump" }]) {
                    movies {
                        title
                        actorsConnection {
                            edges {
                                properties {
                                    screenTime
                                }
                                node {
                                    name
                                }
                            }
                        }
                    }
                }
            }
        `;

        const result = await translateQuery(neoSchema, query);

        expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
            "UNWIND $create_param0 AS create_var0
            CALL {
                WITH create_var0
                CREATE (create_this1:Movie)
                SET
                    create_this1.title = create_var0.title
                RETURN create_this1
            }
            CALL {
                WITH create_this1
                MATCH (create_this1)<-[create_this2:ACTED_IN]-(create_this3:Actor)
                WITH collect({ node: create_this3, relationship: create_this2 }) AS edges
                WITH edges, size(edges) AS totalCount
                CALL {
                    WITH edges
                    UNWIND edges AS edge
                    WITH edge.node AS create_this3, edge.relationship AS create_this2
                    RETURN collect({ properties: { screenTime: create_this2.screenTime, __resolveType: \\"ActedIn\\" }, node: { name: create_this3.name, __resolveType: \\"Actor\\" } }) AS create_var4
                }
                RETURN { edges: create_var4, totalCount: totalCount } AS create_var5
            }
            RETURN collect(create_this1 { .title, actorsConnection: create_var5 }) AS data"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"create_param0\\": [
                    {
                        \\"title\\": \\"Forrest Gump\\"
                    }
                ]
            }"
        `);
    });

    test("Connection can be selected following the creation of a multiple nodes", async () => {
        const query = /* GraphQL */ `
            mutation {
                createMovies(input: [{ title: "Forrest Gump" }, { title: "Toy Story" }]) {
                    movies {
                        title
                        actorsConnection {
                            edges {
                                properties {
                                    screenTime
                                }
                                node {
                                    name
                                }
                            }
                        }
                    }
                }
            }
        `;

        const result = await translateQuery(neoSchema, query);

        expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
            "UNWIND $create_param0 AS create_var0
            CALL {
                WITH create_var0
                CREATE (create_this1:Movie)
                SET
                    create_this1.title = create_var0.title
                RETURN create_this1
            }
            CALL {
                WITH create_this1
                MATCH (create_this1)<-[create_this2:ACTED_IN]-(create_this3:Actor)
                WITH collect({ node: create_this3, relationship: create_this2 }) AS edges
                WITH edges, size(edges) AS totalCount
                CALL {
                    WITH edges
                    UNWIND edges AS edge
                    WITH edge.node AS create_this3, edge.relationship AS create_this2
                    RETURN collect({ properties: { screenTime: create_this2.screenTime, __resolveType: \\"ActedIn\\" }, node: { name: create_this3.name, __resolveType: \\"Actor\\" } }) AS create_var4
                }
                RETURN { edges: create_var4, totalCount: totalCount } AS create_var5
            }
            RETURN collect(create_this1 { .title, actorsConnection: create_var5 }) AS data"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"create_param0\\": [
                    {
                        \\"title\\": \\"Forrest Gump\\"
                    },
                    {
                        \\"title\\": \\"Toy Story\\"
                    }
                ]
            }"
        `);
    });

    test("Connection can be selected and filtered following the creation of a multiple nodes", async () => {
        const query = /* GraphQL */ `
            mutation {
                createMovies(input: [{ title: "Forrest Gump" }, { title: "Toy Story" }]) {
                    movies {
                        title
                        actorsConnection(where: { node: { name: "Tom Hanks" } }) {
                            edges {
                                properties {
                                    screenTime
                                }
                                node {
                                    name
                                }
                            }
                        }
                    }
                }
            }
        `;

        const result = await translateQuery(neoSchema, query);

        expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
            "UNWIND $create_param0 AS create_var0
            CALL {
                WITH create_var0
                CREATE (create_this1:Movie)
                SET
                    create_this1.title = create_var0.title
                RETURN create_this1
            }
            CALL {
                WITH create_this1
                MATCH (create_this1)<-[create_this2:ACTED_IN]-(create_this3:Actor)
                WHERE create_this3.name = $create_param1
                WITH collect({ node: create_this3, relationship: create_this2 }) AS edges
                WITH edges, size(edges) AS totalCount
                CALL {
                    WITH edges
                    UNWIND edges AS edge
                    WITH edge.node AS create_this3, edge.relationship AS create_this2
                    RETURN collect({ properties: { screenTime: create_this2.screenTime, __resolveType: \\"ActedIn\\" }, node: { name: create_this3.name, __resolveType: \\"Actor\\" } }) AS create_var4
                }
                RETURN { edges: create_var4, totalCount: totalCount } AS create_var5
            }
            RETURN collect(create_this1 { .title, actorsConnection: create_var5 }) AS data"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"create_param0\\": [
                    {
                        \\"title\\": \\"Forrest Gump\\"
                    },
                    {
                        \\"title\\": \\"Toy Story\\"
                    }
                ],
                \\"create_param1\\": \\"Tom Hanks\\"
            }"
        `);
    });
});
