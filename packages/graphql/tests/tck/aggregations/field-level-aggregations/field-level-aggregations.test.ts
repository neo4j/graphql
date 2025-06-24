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

describe("Field Level Aggregations", () => {
    let typeDefs: string;
    let neoSchema: Neo4jGraphQL;

    beforeAll(() => {
        typeDefs = /* GraphQL */ `
            type Movie @node {
                title: String
                actors: [Actor!]! @relationship(type: "ACTED_IN", direction: IN)
                released: DateTime
            }

            type Actor @node {
                name: String
                age: Int
                movies: [Movie!]! @relationship(type: "ACTED_IN", direction: OUT)
            }
        `;

        neoSchema = new Neo4jGraphQL({
            typeDefs,
        });
    });

    test("Count Aggregation", async () => {
        const query = /* GraphQL */ `
            query {
                movies {
                    title
                    actorsConnection {
                        aggregate {
                            count {
                                nodes
                                edges
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
            CALL (this) {
                CALL (this) {
                    MATCH (this)<-[this0:ACTED_IN]-(this1:Actor)
                    RETURN { nodes: count(DISTINCT this1), edges: count(DISTINCT this0) } AS var2
                }
                RETURN { aggregate: { count: var2 } } AS var3
            }
            RETURN this { .title, actorsConnection: var3 } AS this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`"{}"`);
    });

    test("Node Aggregations and Count", async () => {
        const query = /* GraphQL */ `
            query {
                movies {
                    actorsConnection {
                        aggregate {
                            count {
                                nodes
                            }
                            node {
                                name {
                                    longest
                                    shortest
                                }
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
            CALL (this) {
                CALL (this) {
                    MATCH (this)<-[this0:ACTED_IN]-(this1:Actor)
                    RETURN { nodes: count(DISTINCT this1) } AS var2
                }
                CALL (this) {
                    MATCH (this)<-[this3:ACTED_IN]-(this4:Actor)
                    WITH DISTINCT this4
                    ORDER BY size(this4.name) DESC
                    WITH collect(this4.name) AS list
                    RETURN { longest: head(list), shortest: last(list) } AS var5
                }
                RETURN { aggregate: { count: var2, node: { name: var5 } } } AS var6
            }
            RETURN this { actorsConnection: var6 } AS this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`"{}"`);
    });

    test("Node Aggregations - Number", async () => {
        const query = /* GraphQL */ `
            query {
                movies {
                    actorsConnection {
                        aggregate {
                            node {
                                age {
                                    min
                                    max
                                    average
                                    sum
                                }
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
            CALL (this) {
                CALL (this) {
                    MATCH (this)<-[this0:ACTED_IN]-(this1:Actor)
                    WITH DISTINCT this1
                    RETURN { min: min(this1.age), max: max(this1.age), average: avg(this1.age), sum: sum(this1.age) } AS var2
                }
                RETURN { aggregate: { node: { age: var2 } } } AS var3
            }
            RETURN this { actorsConnection: var3 } AS this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`"{}"`);
    });

    test("Node Aggregations - String", async () => {
        const query = /* GraphQL */ `
            query {
                movies {
                    title
                    actorsConnection {
                        aggregate {
                            node {
                                name {
                                    longest
                                    shortest
                                }
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
            CALL (this) {
                CALL (this) {
                    MATCH (this)<-[this0:ACTED_IN]-(this1:Actor)
                    WITH DISTINCT this1
                    ORDER BY size(this1.name) DESC
                    WITH collect(this1.name) AS list
                    RETURN { longest: head(list), shortest: last(list) } AS var2
                }
                RETURN { aggregate: { node: { name: var2 } } } AS var3
            }
            RETURN this { .title, actorsConnection: var3 } AS this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`"{}"`);
    });

    test("Node Aggregations - DateTime", async () => {
        const query = /* GraphQL */ `
            query {
                actors {
                    moviesConnection {
                        aggregate {
                            node {
                                released {
                                    min
                                }
                            }
                        }
                    }
                }
            }
        `;

        const result = await translateQuery(neoSchema, query);

        expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
            "CYPHER 5
            MATCH (this:Actor)
            CALL (this) {
                CALL (this) {
                    MATCH (this)-[this0:ACTED_IN]->(this1:Movie)
                    WITH DISTINCT this1
                    RETURN { min: apoc.date.convertFormat(toString(min(this1.released)), \\"iso_zoned_date_time\\", \\"iso_offset_date_time\\") } AS var2
                }
                RETURN { aggregate: { node: { released: var2 } } } AS var3
            }
            RETURN this { moviesConnection: var3 } AS this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`"{}"`);
    });

    test("Node Aggregations - Multiple node fields", async () => {
        const query = /* GraphQL */ `
            query {
                movies {
                    actorsConnection {
                        aggregate {
                            node {
                                name {
                                    longest
                                    shortest
                                }
                                age {
                                    min
                                    max
                                    average
                                    sum
                                }
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
            CALL (this) {
                CALL (this) {
                    MATCH (this)<-[this0:ACTED_IN]-(this1:Actor)
                    WITH DISTINCT this1
                    ORDER BY size(this1.name) DESC
                    WITH collect(this1.name) AS list
                    RETURN { longest: head(list), shortest: last(list) } AS var2
                }
                CALL (this) {
                    MATCH (this)<-[this3:ACTED_IN]-(this4:Actor)
                    WITH DISTINCT this4
                    RETURN { min: min(this4.age), max: max(this4.age), average: avg(this4.age), sum: sum(this4.age) } AS var5
                }
                RETURN { aggregate: { node: { name: var2, age: var5 } } } AS var6
            }
            RETURN this { actorsConnection: var6 } AS this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`"{}"`);
    });
});
