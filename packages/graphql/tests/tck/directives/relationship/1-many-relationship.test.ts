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

describe("1-to-many relationships on object types", () => {
    let typeDefs: string;
    let neoSchema: Neo4jGraphQL;

    beforeAll(() => {
        typeDefs = /* GraphQL */ `
            type Movie @node {
                title: String!
                director: Person! @relationship(type: "DIRECTED", direction: IN, properties: "Directed")
            }

            type Person @node {
                name: String!
                directed: [Movie!]! @relationship(type: "DIRECTED", direction: OUT, properties: "Directed")
            }

            type Directed @relationshipProperties {
                year: Int
            }
        `;

        neoSchema = new Neo4jGraphQL({
            typeDefs,
        });
    });

    test("returns all relationships", async () => {
        const query = `
            query {
               people {
                    directed {
                        title
                    }
                }
            }
        `;

        const result = await translateQuery(neoSchema, query);

        expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
            "CYPHER 5
            MATCH (this:Person)
            CALL (this) {
                MATCH (this)-[this0:DIRECTED]->(this1:Movie)
                WITH DISTINCT this1
                WITH this1 { .title } AS this1
                RETURN collect(this1) AS var2
            }
            RETURN this { directed: var2 } AS this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`"{}"`);
    });

    test("nested filter", async () => {
        const query = `
            query {
               movies(where: { director: { name: { eq: "Keanu" } } }) {
                    director {
                        name
                    }
                }
            }
        `;

        const result = await translateQuery(neoSchema, query);

        expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
            "CYPHER 5
            MATCH (this:Movie)
            WHERE EXISTS {
                MATCH (this)<-[:DIRECTED]-(this0:Person)
                WHERE this0.name = $param0
            }
            CALL (this) {
                MATCH (this)<-[this1:DIRECTED]-(this2:Person)
                WITH DISTINCT this2
                WITH this2 { .name } AS this2
                RETURN head(collect(this2)) AS var3
            }
            RETURN this { director: var3 } AS this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"param0\\": \\"Keanu\\"
            }"
        `);
    });

    test("double nested filter", async () => {
        const query = `
            query {
               people(where: { directed: { some: { director: { name: { eq: "Keanu" } } } } }) {
                    directed {
                        title
                        director {
                            name
                        }
                    }
                }
            }
        `;

        const result = await translateQuery(neoSchema, query);

        expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
            "CYPHER 5
            MATCH (this:Person)
            WHERE EXISTS {
                MATCH (this)-[:DIRECTED]->(this0:Movie)
                WHERE EXISTS {
                    MATCH (this0)<-[:DIRECTED]-(this1:Person)
                    WHERE this1.name = $param0
                }
            }
            CALL (this) {
                MATCH (this)-[this2:DIRECTED]->(this3:Movie)
                WITH DISTINCT this3
                CALL (this3) {
                    MATCH (this3)<-[this4:DIRECTED]-(this5:Person)
                    WITH DISTINCT this5
                    WITH this5 { .name } AS this5
                    RETURN head(collect(this5)) AS var6
                }
                WITH this3 { .title, director: var6 } AS this3
                RETURN collect(this3) AS var7
            }
            RETURN this { directed: var7 } AS this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"param0\\": \\"Keanu\\"
            }"
        `);
    });

    test("nested filter with edge properties", async () => {
        const query = `
            query {
               movies(where: { directorConnection: { edge: { year: { eq: 1999 } } } }) {
                    directorConnection {
                        edges {
                            node {
                                name
                            }
                            properties {
                                year
                            }
                        }
                    }
                }
            }
        `;

        const result = await translateQuery(neoSchema, query);

        expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
            "CYPHER 5
            MATCH (this:Movie)
            WHERE EXISTS {
                MATCH (this)<-[this0:DIRECTED]-(this1:Person)
                WHERE this0.year = $param0
            }
            CALL (this) {
                MATCH (this)<-[this2:DIRECTED]-(this3:Person)
                WITH collect({ node: this3, relationship: this2 }) AS edges
                CALL (edges) {
                    UNWIND edges AS edge
                    WITH edge.node AS this3, edge.relationship AS this2
                    RETURN collect({ properties: { year: this2.year, __resolveType: \\"Directed\\" }, node: { name: this3.name, __resolveType: \\"Person\\" } }) AS var4
                }
                RETURN { edges: var4 } AS var5
            }
            RETURN this { directorConnection: var5 } AS this"
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

    test("double nested filter with edge properties", async () => {
        const query = `
            query {
               people(where: { directedConnection: { some: { node: { directorConnection: { OR: [{ edge: { year: { gt: 2000 } } }, { node: { name: { startsWith: "K" } } }] } } } } }) {
                    directedConnection {
                        edges {
                            node {
                                title
                                directorConnection {
                                    edges {
                                        node {
                                            name
                                        }
                                    }
                                }
                            }
                            properties {
                                year
                            }
                        }
                    }
                }
            }
        `;

        const result = await translateQuery(neoSchema, query);

        expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
            "CYPHER 5
            MATCH (this:Person)
            WHERE EXISTS {
                MATCH (this)-[this0:DIRECTED]->(this1:Movie)
                WHERE EXISTS {
                    MATCH (this1)<-[this2:DIRECTED]-(this3:Person)
                    WHERE (this2.year > $param0 OR this3.name STARTS WITH $param1)
                }
            }
            CALL (this) {
                MATCH (this)-[this4:DIRECTED]->(this5:Movie)
                WITH collect({ node: this5, relationship: this4 }) AS edges
                CALL (edges) {
                    UNWIND edges AS edge
                    WITH edge.node AS this5, edge.relationship AS this4
                    CALL (this5) {
                        MATCH (this5)<-[this6:DIRECTED]-(this7:Person)
                        WITH collect({ node: this7, relationship: this6 }) AS edges
                        CALL (edges) {
                            UNWIND edges AS edge
                            WITH edge.node AS this7, edge.relationship AS this6
                            RETURN collect({ node: { name: this7.name, __resolveType: \\"Person\\" } }) AS var8
                        }
                        RETURN { edges: var8 } AS var9
                    }
                    RETURN collect({ properties: { year: this4.year, __resolveType: \\"Directed\\" }, node: { title: this5.title, directorConnection: var9, __resolveType: \\"Movie\\" } }) AS var10
                }
                RETURN { edges: var10 } AS var11
            }
            RETURN this { directedConnection: var11 } AS this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"param0\\": {
                    \\"low\\": 2000,
                    \\"high\\": 0
                },
                \\"param1\\": \\"K\\"
            }"
        `);
    });
});
