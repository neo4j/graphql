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

describe("Nested Filters with all", () => {
    let typeDefs: string;
    let neoSchema: Neo4jGraphQL;

    beforeAll(() => {
        typeDefs = /* GraphQL */ `
            type Movie @node {
                title: String
                actors: [Actor!]! @relationship(type: "ACTED_IN", direction: IN, properties: "ActedIn")
            }
            type Actor @node {
                name: String
                movies: [Movie!]! @relationship(type: "ACTED_IN", direction: OUT, properties: "ActedIn")
            }
            type ActedIn @relationshipProperties {
                year: Int
            }
        `;

        neoSchema = new Neo4jGraphQL({
            typeDefs,
        });
    });

    test("query nested relationship with all filter", async () => {
        const query = /* GraphQL */ `
            query {
                movies(
                    where: { edges: { node: { actors: { edges: { all: { node: { name: { equals: "Keanu" } } } } } } } }
                ) {
                    connection {
                        edges {
                            node {
                                title
                            }
                        }
                    }
                }
            }
        `;

        const result = await translateQuery(neoSchema, query, { v6Api: true });

        expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
            "MATCH (this0:Movie)
            WHERE (EXISTS {
                MATCH (this0)<-[this1:ACTED_IN]-(this2:Actor)
                WHERE this2.name = $param0
            } AND NOT (EXISTS {
                MATCH (this0)<-[this1:ACTED_IN]-(this2:Actor)
                WHERE NOT (this2.name = $param0)
            }))
            WITH collect({ node: this0 }) AS edges
            WITH edges, size(edges) AS totalCount
            CALL {
                WITH edges
                UNWIND edges AS edge
                WITH edge.node AS this0
                RETURN collect({ node: { title: this0.title, __resolveType: \\"Movie\\" } }) AS var3
            }
            RETURN { connection: { edges: var3, totalCount: totalCount } } AS this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"param0\\": \\"Keanu\\"
            }"
        `);
    });

    test("query nested relationship properties with all filter", async () => {
        const query = /* GraphQL */ `
            query {
                movies(
                    where: {
                        edges: { node: { actors: { edges: { all: { properties: { year: { equals: 1999 } } } } } } }
                    }
                ) {
                    connection {
                        edges {
                            node {
                                title
                            }
                        }
                    }
                }
            }
        `;

        const result = await translateQuery(neoSchema, query, { v6Api: true });

        expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
            "MATCH (this0:Movie)
            WHERE (EXISTS {
                MATCH (this0)<-[this1:ACTED_IN]-(this2:Actor)
                WHERE this1.year = $param0
            } AND NOT (EXISTS {
                MATCH (this0)<-[this1:ACTED_IN]-(this2:Actor)
                WHERE NOT (this1.year = $param0)
            }))
            WITH collect({ node: this0 }) AS edges
            WITH edges, size(edges) AS totalCount
            CALL {
                WITH edges
                UNWIND edges AS edge
                WITH edge.node AS this0
                RETURN collect({ node: { title: this0.title, __resolveType: \\"Movie\\" } }) AS var3
            }
            RETURN { connection: { edges: var3, totalCount: totalCount } } AS this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"param0\\": {
                    \\"low\\": 1999,
                    \\"high\\": 0
                }
            }"
        `);
    });

    test("query nested relationship with all filter and OR operator", async () => {
        const query = /* GraphQL */ `
            query {
                movies(
                    where: {
                        edges: {
                            node: {
                                actors: {
                                    edges: {
                                        all: {
                                            OR: [
                                                { node: { name: { equals: "Keanu" } } }
                                                { node: { name: { endsWith: "eeves" } } }
                                            ]
                                        }
                                    }
                                }
                            }
                        }
                    }
                ) {
                    connection {
                        edges {
                            node {
                                title
                            }
                        }
                    }
                }
            }
        `;

        const result = await translateQuery(neoSchema, query, { v6Api: true });

        expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
            "MATCH (this0:Movie)
            WHERE (EXISTS {
                MATCH (this0)<-[this1:ACTED_IN]-(this2:Actor)
                WHERE (this2.name = $param0 OR this2.name ENDS WITH $param1)
            } AND NOT (EXISTS {
                MATCH (this0)<-[this1:ACTED_IN]-(this2:Actor)
                WHERE NOT (this2.name = $param0 OR this2.name ENDS WITH $param1)
            }))
            WITH collect({ node: this0 }) AS edges
            WITH edges, size(edges) AS totalCount
            CALL {
                WITH edges
                UNWIND edges AS edge
                WITH edge.node AS this0
                RETURN collect({ node: { title: this0.title, __resolveType: \\"Movie\\" } }) AS var3
            }
            RETURN { connection: { edges: var3, totalCount: totalCount } } AS this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"param0\\": \\"Keanu\\",
                \\"param1\\": \\"eeves\\"
            }"
        `);
    });
});
