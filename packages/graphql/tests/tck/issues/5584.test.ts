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
import { formatCypher, formatParams, translateQuery } from "../utils/tck-test-utils";

describe("https://github.com/neo4j/graphql/issues/5584", () => {
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

    test("should support 2 aliased edges", async () => {
        const query = /* GraphQL */ `
            query {
                movies(where: { title: "The Matrix" }) {
                    title1: title
                    actorsConnection1: actorsConnection(where: { node: { name: "Keanu Reeves" } }) {
                        edges1: edges {
                            node1: node {
                                nameA1: name
                            }
                        }
                        edges2: edges {
                            node1: node {
                                nameA2: name
                            }
                        }
                    }
                }
            }
        `;

        const result = await translateQuery(neoSchema, query);

        expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
            "MATCH (this:Movie)
            WHERE this.title = $param0
            CALL {
                WITH this
                MATCH (this)<-[this0:ACTED_IN]-(this1:Actor)
                WHERE this1.name = $param1
                WITH collect({ node: this1, relationship: this0 }) AS edges
                WITH edges, size(edges) AS totalCount
                CALL {
                    WITH edges
                    UNWIND edges AS edge
                    WITH edge.node AS this1, edge.relationship AS this0
                    RETURN collect({ node: { nameA1: this1.name, nameA2: this1.name, __resolveType: \\"Actor\\" } }) AS var2
                }
                RETURN { edges: var2, totalCount: totalCount } AS var3
            }
            RETURN this { title1: this.title, actorsConnection1: var3 } AS this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"param0\\": \\"The Matrix\\",
                \\"param1\\": \\"Keanu Reeves\\"
            }"
        `);
    });

    test("should support alias at every level of a query", async () => {
        const query = /* GraphQL */ `
            query {
                movies(where: { title: "The Matrix" }) {
                    title1: title
                    actorsConnection1: actorsConnection(where: { node: { name: "Keanu Reeves" } }) {
                        edges1: edges {
                            node1: node {
                                nameA1: name
                                A1: moviesConnection(where: { node: { title: "Foo" } }) {
                                    edges2: edges {
                                        node2: node {
                                            title2: title
                                            a: actors {
                                                name2: name
                                            }
                                        }
                                    }
                                }
                            }
                        }
                        edges2: edges {
                            node1: node {
                                nameA2: name
                                A2: moviesConnection(where: { node: { title: "The Matrix" } }) {
                                    edges2: edges {
                                        node2: node {
                                            title2: title
                                            a: actors {
                                                name2: name
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            }
        `;

        const result = await translateQuery(neoSchema, query);

        expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
            "MATCH (this:Movie)
            WHERE this.title = $param0
            CALL {
                WITH this
                MATCH (this)<-[this0:ACTED_IN]-(this1:Actor)
                WHERE this1.name = $param1
                WITH collect({ node: this1, relationship: this0 }) AS edges
                WITH edges, size(edges) AS totalCount
                CALL {
                    WITH edges
                    UNWIND edges AS edge
                    WITH edge.node AS this1, edge.relationship AS this0
                    CALL {
                        WITH this1
                        MATCH (this1)-[this2:ACTED_IN]->(this3:Movie)
                        WHERE this3.title = $param2
                        WITH collect({ node: this3, relationship: this2 }) AS edges
                        WITH edges, size(edges) AS totalCount
                        CALL {
                            WITH edges
                            UNWIND edges AS edge
                            WITH edge.node AS this3, edge.relationship AS this2
                            CALL {
                                WITH this3
                                MATCH (this3)<-[this4:ACTED_IN]-(this5:Actor)
                                WITH this5 { name2: this5.name } AS this5
                                RETURN collect(this5) AS var6
                            }
                            RETURN collect({ node: { title2: this3.title, a: var6, __resolveType: \\"Movie\\" } }) AS var7
                        }
                        RETURN { edges: var7, totalCount: totalCount } AS var8
                    }
                    CALL {
                        WITH this1
                        MATCH (this1)-[this9:ACTED_IN]->(this10:Movie)
                        WHERE this10.title = $param3
                        WITH collect({ node: this10, relationship: this9 }) AS edges
                        WITH edges, size(edges) AS totalCount
                        CALL {
                            WITH edges
                            UNWIND edges AS edge
                            WITH edge.node AS this10, edge.relationship AS this9
                            CALL {
                                WITH this10
                                MATCH (this10)<-[this11:ACTED_IN]-(this12:Actor)
                                WITH this12 { name2: this12.name } AS this12
                                RETURN collect(this12) AS var13
                            }
                            RETURN collect({ node: { title2: this10.title, a: var13, __resolveType: \\"Movie\\" } }) AS var14
                        }
                        RETURN { edges: var14, totalCount: totalCount } AS var15
                    }
                    RETURN collect({ node: { nameA1: this1.name, A1: var8, nameA2: this1.name, A2: var15, __resolveType: \\"Actor\\" } }) AS var16
                }
                RETURN { edges: var16, totalCount: totalCount } AS var17
            }
            RETURN this { title1: this.title, actorsConnection1: var17 } AS this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"param0\\": \\"The Matrix\\",
                \\"param1\\": \\"Keanu Reeves\\",
                \\"param2\\": \\"Foo\\",
                \\"param3\\": \\"The Matrix\\"
            }"
        `);
    });
});
