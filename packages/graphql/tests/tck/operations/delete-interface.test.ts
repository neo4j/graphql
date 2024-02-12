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

import type { DocumentNode } from "graphql";
import { gql } from "graphql-tag";
import { Neo4jGraphQL } from "../../../src";
import { formatCypher, formatParams, translateQuery } from "../utils/tck-test-utils";

describe("Cypher Delete - interface", () => {
    let typeDefs: DocumentNode;
    let neoSchema: Neo4jGraphQL;

    beforeAll(() => {
        typeDefs = gql`
            type Episode {
                runtime: Int!
                series: Series! @relationship(type: "HAS_EPISODE", direction: IN)
            }

            interface Production {
                title: String!
                actors: [Actor!]! @declareRelationship
            }

            interface Worker {
                name: String
            }

            type ScreenWriter implements Worker {
                name: String
            }

            type StuntPerformer implements Worker {
                name: String!
                workedOn: [Production!]! @relationship(type: "WORKED_ON", direction: OUT)
            }

            type Movie implements Production {
                title: String!
                runtime: Int!
                actors: [Actor!]! @relationship(type: "ACTED_IN", direction: IN, properties: "ActedIn")
                workers: [Worker!]! @relationship(type: "WORKED_ON", direction: IN)
            }

            type Series implements Production {
                title: String!
                episodes: [Episode!]! @relationship(type: "HAS_EPISODE", direction: OUT)
                actors: [Actor!]! @relationship(type: "ACTED_IN", direction: IN, properties: "ActedIn")
            }

            type Actor {
                name: String!
                actedIn: [Production!]! @relationship(type: "ACTED_IN", direction: OUT, properties: "ActedIn")
            }

            type ActedIn @relationshipProperties {
                screenTime: Int!
            }
        `;

        neoSchema = new Neo4jGraphQL({
            typeDefs,
        });
    });

    test("Simple Delete", async () => {
        const query = gql`
            mutation {
                deleteActors(where: { name: "Keanu" }) {
                    nodesDeleted
                }
            }
        `;

        const result = await translateQuery(neoSchema, query);

        expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
            "MATCH (this:Actor)
            WHERE this.name = $param0
            DETACH DELETE this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"param0\\": \\"Keanu\\"
            }"
        `);
    });

    test("Single Nested Delete", async () => {
        const query = gql`
            mutation {
                deleteActors(where: { name: "Keanu" }, delete: { actedIn: { where: { node: { title: "Matrix" } } } }) {
                    nodesDeleted
                }
            }
        `;

        const result = await translateQuery(neoSchema, query);

        expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
            "MATCH (this:Actor)
            WHERE this.name = $param0
            WITH *
            CALL {
                WITH *
                OPTIONAL MATCH (this)-[this0:ACTED_IN]->(this1:Movie)
                WHERE this1.title = $param1
                WITH this0, collect(DISTINCT this1) AS var2
                CALL {
                    WITH var2
                    UNWIND var2 AS var3
                    DETACH DELETE var3
                }
            }
            CALL {
                WITH *
                OPTIONAL MATCH (this)-[this4:ACTED_IN]->(this5:Series)
                WHERE this5.title = $param2
                WITH this4, collect(DISTINCT this5) AS var6
                CALL {
                    WITH var6
                    UNWIND var6 AS var7
                    DETACH DELETE var7
                }
            }
            WITH *
            DETACH DELETE this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"param0\\": \\"Keanu\\",
                \\"param1\\": \\"Matrix\\",
                \\"param2\\": \\"Matrix\\"
            }"
        `);
    });

    test("Single Nested Delete, + typename filter", async () => {
        const query = gql`
            mutation {
                deleteActors(
                    where: { name: "Keanu" }
                    delete: { actedIn: { where: { node: { typename_IN: [Movie], title: "Matrix" } } } }
                ) {
                    nodesDeleted
                }
            }
        `;

        const result = await translateQuery(neoSchema, query);

        expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
            "MATCH (this:Actor)
            WHERE this.name = $param0
            WITH *
            CALL {
                WITH *
                OPTIONAL MATCH (this)-[this0:ACTED_IN]->(this1:Movie)
                WHERE (this1.title = $param1 AND this1:Movie)
                WITH this0, collect(DISTINCT this1) AS var2
                CALL {
                    WITH var2
                    UNWIND var2 AS var3
                    DETACH DELETE var3
                }
            }
            CALL {
                WITH *
                OPTIONAL MATCH (this)-[this4:ACTED_IN]->(this5:Series)
                WHERE (this5.title = $param2 AND this5:Movie)
                WITH this4, collect(DISTINCT this5) AS var6
                CALL {
                    WITH var6
                    UNWIND var6 AS var7
                    DETACH DELETE var7
                }
            }
            WITH *
            DETACH DELETE this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"param0\\": \\"Keanu\\",
                \\"param1\\": \\"Matrix\\",
                \\"param2\\": \\"Matrix\\"
            }"
        `);
    });

    test("Single Nested Delete, deleting multiple", async () => {
        const query = gql`
            mutation {
                deleteActors(
                    where: { name: "Keanu" }
                    delete: {
                        actedIn: { where: { node: { OR: [{ title: "Matrix" }, { title: "Matrix Reloaded" }] } } }
                    }
                ) {
                    nodesDeleted
                }
            }
        `;

        const result = await translateQuery(neoSchema, query);

        expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
            "MATCH (this:Actor)
            WHERE this.name = $param0
            WITH *
            CALL {
                WITH *
                OPTIONAL MATCH (this)-[this0:ACTED_IN]->(this1:Movie)
                WHERE (this1.title = $param1 OR this1.title = $param2)
                WITH this0, collect(DISTINCT this1) AS var2
                CALL {
                    WITH var2
                    UNWIND var2 AS var3
                    DETACH DELETE var3
                }
            }
            CALL {
                WITH *
                OPTIONAL MATCH (this)-[this4:ACTED_IN]->(this5:Series)
                WHERE (this5.title = $param3 OR this5.title = $param4)
                WITH this4, collect(DISTINCT this5) AS var6
                CALL {
                    WITH var6
                    UNWIND var6 AS var7
                    DETACH DELETE var7
                }
            }
            WITH *
            DETACH DELETE this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"param0\\": \\"Keanu\\",
                \\"param1\\": \\"Matrix\\",
                \\"param2\\": \\"Matrix Reloaded\\",
                \\"param3\\": \\"Matrix\\",
                \\"param4\\": \\"Matrix Reloaded\\"
            }"
        `);
    });

    test("Double Nested Delete", async () => {
        const query = gql`
            mutation {
                deleteActors(
                    where: { name: "Keanu" }
                    delete: {
                        actedIn: {
                            where: { node: { title: "Matrix" } }
                            delete: { actors: { where: { node: { name: "Gloria Foster" } } } }
                        }
                    }
                ) {
                    nodesDeleted
                }
            }
        `;

        const result = await translateQuery(neoSchema, query);

        expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
            "MATCH (this:Actor)
            WHERE this.name = $param0
            WITH *
            CALL {
                WITH *
                OPTIONAL MATCH (this)-[this0:ACTED_IN]->(this1:Movie)
                WHERE this1.title = $param1
                WITH *
                CALL {
                    WITH *
                    OPTIONAL MATCH (this1)<-[this2:ACTED_IN]-(this3:Actor)
                    WHERE this3.name = $param2
                    WITH this2, collect(DISTINCT this3) AS var4
                    CALL {
                        WITH var4
                        UNWIND var4 AS var5
                        DETACH DELETE var5
                    }
                }
                WITH this0, collect(DISTINCT this1) AS var6
                CALL {
                    WITH var6
                    UNWIND var6 AS var7
                    DETACH DELETE var7
                }
            }
            CALL {
                WITH *
                OPTIONAL MATCH (this)-[this8:ACTED_IN]->(this9:Series)
                WHERE this9.title = $param3
                WITH *
                CALL {
                    WITH *
                    OPTIONAL MATCH (this9)<-[this10:ACTED_IN]-(this11:Actor)
                    WHERE this11.name = $param4
                    WITH this10, collect(DISTINCT this11) AS var12
                    CALL {
                        WITH var12
                        UNWIND var12 AS var13
                        DETACH DELETE var13
                    }
                }
                WITH this8, collect(DISTINCT this9) AS var14
                CALL {
                    WITH var14
                    UNWIND var14 AS var15
                    DETACH DELETE var15
                }
            }
            WITH *
            DETACH DELETE this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"param0\\": \\"Keanu\\",
                \\"param1\\": \\"Matrix\\",
                \\"param2\\": \\"Gloria Foster\\",
                \\"param3\\": \\"Matrix\\",
                \\"param4\\": \\"Gloria Foster\\"
            }"
        `);
    });
});
