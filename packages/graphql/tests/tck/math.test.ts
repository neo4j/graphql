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

import { Neo4jGraphQL } from "../../src";
import { formatCypher, formatParams, translateQuery } from "./utils/tck-test-utils";

describe("Math operators", () => {
    let typeDefs: string;
    let neoSchema: Neo4jGraphQL;

    beforeAll(() => {
        typeDefs = /* GraphQL */ `
            interface Wife {
                marriageLength: Int
            }

            type Star implements Wife @node {
                marriageLength: Int
                marriedWith: [Actor!]! @relationship(type: "MARRIED_WITH", direction: IN)
            }

            type Movie @node {
                id: ID! @id
                title: String!
                viewers: Int
                revenue: Float
                actors: [Actor!]! @relationship(type: "ACTED_IN", properties: "ActedIn", direction: IN)
            }

            type Actor @node {
                id: ID!
                name: String!
                actedIn: [Movie!]! @relationship(type: "ACTED_IN", properties: "ActedIn", direction: OUT)
                marriedWith: [Wife!]! @relationship(type: "MARRIED_WITH", direction: OUT)
            }

            type ActedIn @relationshipProperties {
                pay: Float
            }
        `;

        neoSchema = new Neo4jGraphQL({
            typeDefs,
        });
    });

    test("Simple Int increment", async () => {
        const query = /* GraphQL */ `
            mutation {
                updateMovies(update: { viewers_INCREMENT: 3 }) {
                    movies {
                        id
                        viewers
                    }
                }
            }
        `;
        const result = await translateQuery(neoSchema, query);

        expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
            "CYPHER 5
            MATCH (this:Movie)
            WITH *
            SET
                this.viewers = (this.viewers + $param0)
            WITH *
            CALL (*) {
                CALL apoc.util.validate(this.viewers IS NULL, \\"Cannot %s %s to Nan\\", [\\"increment\\", $param0])
                CALL apoc.util.validate((this.viewers + $param0) > ((2 ^ 31) - 1), \\"Overflow: Value returned from operator %s is larger than %s bit\\", [\\"increment\\", 32])
            }
            WITH this
            RETURN this { .id, .viewers } AS this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"param0\\": {
                    \\"low\\": 3,
                    \\"high\\": 0
                }
            }"
        `);
    });

    test("Simple Float multiply", async () => {
        const query = /* GraphQL */ `
            mutation {
                updateMovies(update: { revenue_MULTIPLY: 3 }) {
                    movies {
                        id
                        revenue
                    }
                }
            }
        `;
        const result = await translateQuery(neoSchema, query);

        expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
            "CYPHER 5
            MATCH (this:Movie)
            WITH *
            SET
                this.revenue = (this.revenue * $param0)
            WITH *
            CALL (*) {
                CALL apoc.util.validate(this.revenue IS NULL, \\"Cannot %s %s to Nan\\", [\\"multiply\\", $param0])
                CALL apoc.util.validate((this.revenue * $param0) > ((2 ^ 63) - 1), \\"Overflow: Value returned from operator %s is larger than %s bit\\", [\\"multiply\\", 64])
            }
            WITH this
            RETURN this { .id, .revenue } AS this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"param0\\": 3
            }"
        `);
    });

    test("Nested Int increment", async () => {
        const query = /* GraphQL */ `
            mutation {
                updateActors(update: { actedIn: [{ update: { node: { viewers_INCREMENT: 10 } } }] }) {
                    actors {
                        name
                        actedIn {
                            viewers
                        }
                    }
                }
            }
        `;
        const result = await translateQuery(neoSchema, query);

        expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
            "CYPHER 5
            MATCH (this:Actor)
            WITH *
            WITH *
            CALL (*) {
                MATCH (this)-[this0:ACTED_IN]->(this1:Movie)
                WITH *
                SET
                    this1.viewers = (this1.viewers + $param0)
                WITH *
                CALL (*) {
                    CALL apoc.util.validate(this1.viewers IS NULL, \\"Cannot %s %s to Nan\\", [\\"increment\\", $param0])
                    CALL apoc.util.validate((this1.viewers + $param0) > ((2 ^ 31) - 1), \\"Overflow: Value returned from operator %s is larger than %s bit\\", [\\"increment\\", 32])
                }
            }
            WITH this
            CALL (this) {
                MATCH (this)-[this2:ACTED_IN]->(this3:Movie)
                WITH DISTINCT this3
                WITH this3 { .viewers } AS this3
                RETURN collect(this3) AS var4
            }
            RETURN this { .name, actedIn: var4 } AS this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"param0\\": {
                    \\"low\\": 10,
                    \\"high\\": 0
                }
            }"
        `);
    });

    test("Increment on relationship property", async () => {
        const query = /* GraphQL */ `
            mutation Mutation {
                updateActors(update: { actedIn: [{ update: { edge: { pay_ADD: 100 } } }] }) {
                    actors {
                        name
                        actedIn {
                            title
                        }
                        actedInConnection {
                            edges {
                                properties {
                                    pay
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
            WITH *
            WITH *
            CALL (*) {
                MATCH (this)-[this0:ACTED_IN]->(this1:Movie)
                WITH *
                SET
                    this0.pay = (this0.pay + $param0)
                WITH *
                CALL (*) {
                    CALL apoc.util.validate(this0.pay IS NULL, \\"Cannot %s %s to Nan\\", [\\"add\\", $param0])
                    CALL apoc.util.validate((this0.pay + $param0) > ((2 ^ 63) - 1), \\"Overflow: Value returned from operator %s is larger than %s bit\\", [\\"add\\", 64])
                }
            }
            WITH this
            CALL (this) {
                MATCH (this)-[this2:ACTED_IN]->(this3:Movie)
                WITH DISTINCT this3
                WITH this3 { .title } AS this3
                RETURN collect(this3) AS var4
            }
            CALL (this) {
                MATCH (this)-[this5:ACTED_IN]->(this6:Movie)
                WITH collect({ node: this6, relationship: this5 }) AS edges
                CALL (edges) {
                    UNWIND edges AS edge
                    WITH edge.node AS this6, edge.relationship AS this5
                    RETURN collect({ properties: { pay: this5.pay, __resolveType: \\"ActedIn\\" }, node: { __id: id(this6), __resolveType: \\"Movie\\" } }) AS var7
                }
                RETURN { edges: var7 } AS var8
            }
            RETURN this { .name, actedIn: var4, actedInConnection: var8 } AS this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"param0\\": 100
            }"
        `);
    });

    test("Increment on interface property", async () => {
        const query = /* GraphQL */ `
            mutation {
                updateActors(update: { marriedWith: { update: { node: { marriageLength_INCREMENT: 1 } } } }) {
                    actors {
                        name
                        marriedWith {
                            marriageLength
                        }
                    }
                }
            }
        `;
        const result = await translateQuery(neoSchema, query);

        expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
            "CYPHER 5
            MATCH (this:Actor)
            WITH *
            WITH *
            CALL (*) {
                MATCH (this)-[this0:MARRIED_WITH]->(this1:Star)
                WITH *
                SET
                    this1.marriageLength = (this1.marriageLength + $param0)
                WITH *
                CALL (*) {
                    CALL apoc.util.validate(this1.marriageLength IS NULL, \\"Cannot %s %s to Nan\\", [\\"increment\\", $param0])
                    CALL apoc.util.validate((this1.marriageLength + $param0) > ((2 ^ 31) - 1), \\"Overflow: Value returned from operator %s is larger than %s bit\\", [\\"increment\\", 32])
                }
            }
            WITH this
            CALL (this) {
                CALL (*) {
                    WITH *
                    MATCH (this)-[this2:MARRIED_WITH]->(this3:Star)
                    WITH this3 { .marriageLength, __resolveType: \\"Star\\", __id: id(this3) } AS var4
                    RETURN var4
                }
                WITH var4
                RETURN collect(var4) AS var4
            }
            RETURN this { .name, marriedWith: var4 } AS this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"param0\\": {
                    \\"low\\": 1,
                    \\"high\\": 0
                }
            }"
        `);
    });
});
