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

import { Neo4jGraphQL } from "../../../../../src";
import { formatCypher, formatParams, translateQuery } from "../../../../tck/utils/tck-test-utils";

describe("Alias directive", () => {
    let typeDefs: string;
    let neoSchema: Neo4jGraphQL;

    beforeAll(() => {
        typeDefs = /* GraphQL */ `
            type Director @node {
                name: String
                nameAgain: String @alias(property: "name")
                movies: [Movie!]! @relationship(direction: OUT, type: "DIRECTED", properties: "Directed")
            }

            type Directed @relationshipProperties {
                year: Int!
                movieYear: Int @alias(property: "year")
            }

            type Movie @node {
                title: String
                titleAgain: String @alias(property: "title")
                directors: [Director!]! @relationship(direction: IN, type: "DIRECTED", properties: "Directed")
            }
        `;

        neoSchema = new Neo4jGraphQL({
            typeDefs,
        });
    });

    test("Query node with alias", async () => {
        const query = /* GraphQL */ `
            query {
                movies {
                    connection {
                        edges {
                            node {
                                title
                                titleAgain
                            }
                        }
                    }
                }
            }
        `;

        const result = await translateQuery(neoSchema, query, { v6Api: true });

        // NOTE: Order of these subqueries have been reversed after refactor
        expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
            "MATCH (this0:Movie)
            WITH collect({ node: this0 }) AS edges
            WITH edges, size(edges) AS totalCount
            CALL {
                WITH edges
                UNWIND edges AS edge
                WITH edge.node AS this0
                RETURN collect({ node: { title: this0.title, titleAgain: this0.title, __resolveType: \\"Movie\\" } }) AS var1
            }
            RETURN { connection: { edges: var1, totalCount: totalCount } } AS this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`"{}"`);
    });

    test("Query node and relationship with alias", async () => {
        const query = /* GraphQL */ `
            query {
                movies {
                    connection {
                        edges {
                            node {
                                title
                                titleAgain
                                directors {
                                    connection {
                                        edges {
                                            node {
                                                name
                                                nameAgain
                                            }
                                            properties {
                                                year
                                                movieYear
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

        const result = await translateQuery(neoSchema, query, { v6Api: true });

        // NOTE: Order of these subqueries have been reversed after refactor
        expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
            "MATCH (this0:Movie)
            WITH collect({ node: this0 }) AS edges
            WITH edges, size(edges) AS totalCount
            CALL {
                WITH edges
                UNWIND edges AS edge
                WITH edge.node AS this0
                CALL {
                    WITH this0
                    MATCH (this0)<-[this1:DIRECTED]-(directors:Director)
                    WITH collect({ node: directors, relationship: this1 }) AS edges
                    WITH edges, size(edges) AS totalCount
                    CALL {
                        WITH edges
                        UNWIND edges AS edge
                        WITH edge.node AS directors, edge.relationship AS this1
                        RETURN collect({ properties: { year: this1.year, movieYear: this1.year }, node: { name: directors.name, nameAgain: directors.name, __resolveType: \\"Director\\" } }) AS var2
                    }
                    RETURN { connection: { edges: var2, totalCount: totalCount } } AS var3
                }
                RETURN collect({ node: { title: this0.title, titleAgain: this0.title, directors: var3, __resolveType: \\"Movie\\" } }) AS var4
            }
            RETURN { connection: { edges: var4, totalCount: totalCount } } AS this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`"{}"`);
    });
});
