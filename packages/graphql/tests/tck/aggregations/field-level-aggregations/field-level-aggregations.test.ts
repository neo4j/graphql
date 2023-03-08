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

import { gql } from "apollo-server";
import type { DocumentNode } from "graphql";
import { Neo4jGraphQL } from "../../../../src";
import { createJwtRequest } from "../../../utils/create-jwt-request";
import { formatCypher, translateQuery, formatParams } from "../../utils/tck-test-utils";

describe("Field Level Aggregations", () => {
    let typeDefs: DocumentNode;
    let neoSchema: Neo4jGraphQL;

    beforeAll(() => {
        typeDefs = gql`
            type Movie {
                title: String
                actors: [Actor!]! @relationship(type: "ACTED_IN", direction: IN)
                released: DateTime
            }

            type Actor {
                name: String
                age: Int
                movies: [Movie!]! @relationship(type: "ACTED_IN", direction: OUT)
            }
        `;

        neoSchema = new Neo4jGraphQL({
            typeDefs,
            config: { enableRegex: true },
        });
    });

    test("Count Aggregation", async () => {
        const query = gql`
            query {
                movies {
                    title
                    actorsAggregate {
                        count
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
                MATCH (this)<-[this0:ACTED_IN]-(this1:\`Actor\`)
                RETURN count(this1) AS var2
            }
            RETURN this { .title, actorsAggregate: { count: var2 } } AS this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`"{}"`);
    });

    test("Node Aggregations and Count", async () => {
        const query = gql`
            query {
                movies {
                    actorsAggregate {
                        count
                        node {
                            name {
                                longest
                                shortest
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
                MATCH (this)<-[this0:ACTED_IN]-(this1:\`Actor\`)
                RETURN count(this1) AS var2
            }
            CALL {
                WITH this
                MATCH (this)<-[this0:ACTED_IN]-(this1:\`Actor\`)
                WITH this1
                ORDER BY size(this1.name) DESC
                WITH collect(this1.name) AS list
                RETURN { longest: head(list), shortest: last(list) } AS var3
            }
            RETURN this { actorsAggregate: { count: var2, node: { name: var3 } } } AS this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`"{}"`);
    });

    test("Node Aggregations - Number", async () => {
        const query = gql`
            query {
                movies {
                    actorsAggregate {
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
        `;

        const req = createJwtRequest("secret", {});
        const result = await translateQuery(neoSchema, query, {
            req,
        });

        expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
            "MATCH (this:\`Movie\`)
            CALL {
                WITH this
                MATCH (this)<-[this1:ACTED_IN]-(this0:\`Actor\`)
                RETURN { min: min(this0.age), max: max(this0.age), average: avg(this0.age), sum: sum(this0.age) }  AS var2
            }
            RETURN this { actorsAggregate: { node: { age: var2 } } } AS this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`"{}"`);
    });

    test("Node Aggregations - String", async () => {
        const query = gql`
            query {
                movies {
                    title
                    actorsAggregate {
                        node {
                            name {
                                longest
                                shortest
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
                MATCH (this)<-[this1:ACTED_IN]-(this0:\`Actor\`)
                WITH this0
                ORDER BY size(this0.name) DESC
                WITH collect(this0.name) AS list
                RETURN { longest: head(list), shortest: last(list) } AS var2
            }
            RETURN this { .title, actorsAggregate: { node: { name: var2 } } } AS this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`"{}"`);
    });

    test("Node Aggregations - DateTime", async () => {
        const query = gql`
            query {
                actors {
                    moviesAggregate {
                        node {
                            released {
                                min
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
            "MATCH (this:\`Actor\`)
            CALL {
                WITH this
                MATCH (this)-[this1:ACTED_IN]->(this0:\`Movie\`)
                RETURN { min: apoc.date.convertFormat(toString(min(this0.released)), \\"iso_zoned_date_time\\", \\"iso_offset_date_time\\"), max: apoc.date.convertFormat(toString(max(this0.released)), \\"iso_zoned_date_time\\", \\"iso_offset_date_time\\") } AS var2
            }
            RETURN this { moviesAggregate: { node: { released: var2 } } } AS this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`"{}"`);
    });
});
