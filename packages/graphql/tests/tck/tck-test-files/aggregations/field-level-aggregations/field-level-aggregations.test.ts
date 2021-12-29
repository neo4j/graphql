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
import { DocumentNode } from "graphql";
import { Neo4jGraphQL } from "../../../../../src";
import { createJwtRequest } from "../../../../utils/create-jwt-request";
import { formatCypher, translateQuery, formatParams } from "../../../utils/tck-test-utils";

describe("Field Level Aggregations", () => {
    const secret = "secret";
    let typeDefs: DocumentNode;
    let neoSchema: Neo4jGraphQL;

    beforeAll(() => {
        typeDefs = gql`
            type Movie {
                title: String
                actors: [Actor] @relationship(type: "ACTED_IN", direction: IN)
                released: DateTime
            }

            type Actor {
                name: String
                age: Int
                movies: [Movie] @relationship(type: "ACTED_IN", direction: OUT)
            }
        `;

        neoSchema = new Neo4jGraphQL({
            typeDefs,
            config: { enableRegex: true, jwt: { secret } },
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
            "MATCH (this:Movie)
            RETURN this { .title, actorsAggregate: { count: head(apoc.cypher.runFirstColumn(\\"MATCH (this)<-[r:ACTED_IN]-(n:Actor)      RETURN COUNT(n)\\", { this: this })) } } AS this"
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
            "MATCH (this:Movie)
            RETURN this { actorsAggregate: { count: head(apoc.cypher.runFirstColumn(\\"MATCH (this)<-[r:ACTED_IN]-(n:Actor)      RETURN COUNT(n)\\", { this: this })), node: { name: head(apoc.cypher.runFirstColumn(\\"MATCH (this)<-[r:ACTED_IN]-(n:Actor)
                    WITH n as n
                    ORDER BY size(n.name) DESC
                    WITH collect(n.name) as list
                    RETURN {longest: head(list), shortest: last(list)}\\", { this: this })) } } } AS this"
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
            "MATCH (this:Movie)
            RETURN this { actorsAggregate: { node: { age: head(apoc.cypher.runFirstColumn(\\"MATCH (this)<-[r:ACTED_IN]-(n:Actor)
                    RETURN {min: min(n.age), max: max(n.age), average: avg(n.age), sum: sum(n.age)}\\", { this: this })) } } } AS this"
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
            "MATCH (this:Movie)
            RETURN this { .title, actorsAggregate: { node: { name: head(apoc.cypher.runFirstColumn(\\"MATCH (this)<-[r:ACTED_IN]-(n:Actor)
                    WITH n as n
                    ORDER BY size(n.name) DESC
                    WITH collect(n.name) as list
                    RETURN {longest: head(list), shortest: last(list)}\\", { this: this })) } } } AS this"
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
            "MATCH (this:Actor)
            RETURN this { moviesAggregate: { node: { released: head(apoc.cypher.runFirstColumn(\\"MATCH (this)-[r:ACTED_IN]->(n:Movie)
                    RETURN { min: apoc.date.convertFormat(toString(min(n.released)), \\\\\\"iso_zoned_date_time\\\\\\", \\\\\\"iso_offset_date_time\\\\\\"), max: apoc.date.convertFormat(toString(max(n.released)), \\\\\\"iso_zoned_date_time\\\\\\", \\\\\\"iso_offset_date_time\\\\\\") }\\", { this: this })) } } } AS this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`"{}"`);
    });
});
