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

describe("Cypher Delete", () => {
    let typeDefs: string;
    let neoSchema: Neo4jGraphQL;

    beforeAll(() => {
        typeDefs = /* GraphQL */ `
            type Actor @node {
                name: String
                movies: [Movie!]! @relationship(type: "ACTED_IN", direction: OUT)
            }

            type Movie @node {
                id: ID
                title: String
                actors: [Actor!]! @relationship(type: "ACTED_IN", direction: IN)
            }
        `;

        neoSchema = new Neo4jGraphQL({
            typeDefs,
        });
    });

    test("Simple Delete", async () => {
        const query = /* GraphQL */ `
            mutation {
                deleteMovies(where: { id: "123" }) {
                    nodesDeleted
                }
            }
        `;

        const result = await translateQuery(neoSchema, query);

        expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
            "MATCH (this:Movie)
            WHERE this.id = $param0
            DETACH DELETE this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"param0\\": \\"123\\"
            }"
        `);
    });

    test("Single Nested Delete", async () => {
        const query = /* GraphQL */ `
            mutation {
                deleteMovies(where: { id: 123 }, delete: { actors: { where: { node: { name: "Actor to delete" } } } }) {
                    nodesDeleted
                }
            }
        `;

        const result = await translateQuery(neoSchema, query);

        expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
            "MATCH (this:Movie)
            WHERE this.id = $param0
            WITH *
            CALL {
                WITH *
                OPTIONAL MATCH (this)<-[this0:ACTED_IN]-(this1:Actor)
                WHERE this1.name = $param1
                WITH this0, collect(DISTINCT this1) AS var2
                CALL {
                    WITH var2
                    UNWIND var2 AS var3
                    DETACH DELETE var3
                }
            }
            WITH *
            DETACH DELETE this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"param0\\": \\"123\\",
                \\"param1\\": \\"Actor to delete\\"
            }"
        `);
    });

    test("Single Nested Delete deleting multiple", async () => {
        const query = /* GraphQL */ `
            mutation {
                deleteMovies(
                    where: { id: 123 }
                    delete: {
                        actors: [
                            { where: { node: { name: "Actor to delete" } } }
                            { where: { node: { name: "Another actor to delete" } } }
                        ]
                    }
                ) {
                    nodesDeleted
                }
            }
        `;

        const result = await translateQuery(neoSchema, query);

        expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
            "MATCH (this:Movie)
            WHERE this.id = $param0
            WITH *
            CALL {
                WITH *
                OPTIONAL MATCH (this)<-[this0:ACTED_IN]-(this1:Actor)
                WHERE this1.name = $param1
                WITH this0, collect(DISTINCT this1) AS var2
                CALL {
                    WITH var2
                    UNWIND var2 AS var3
                    DETACH DELETE var3
                }
            }
            CALL {
                WITH *
                OPTIONAL MATCH (this)<-[this4:ACTED_IN]-(this5:Actor)
                WHERE this5.name = $param2
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
                \\"param0\\": \\"123\\",
                \\"param1\\": \\"Actor to delete\\",
                \\"param2\\": \\"Another actor to delete\\"
            }"
        `);
    });

    test("Double Nested Delete", async () => {
        const query = /* GraphQL */ `
            mutation {
                deleteMovies(
                    where: { id: 123 }
                    delete: {
                        actors: {
                            where: { node: { name: "Actor to delete" } }
                            delete: { movies: { where: { node: { id: 321 } } } }
                        }
                    }
                ) {
                    nodesDeleted
                }
            }
        `;

        const result = await translateQuery(neoSchema, query);

        expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
            "MATCH (this:Movie)
            WHERE this.id = $param0
            WITH *
            CALL {
                WITH *
                OPTIONAL MATCH (this)<-[this0:ACTED_IN]-(this1:Actor)
                WHERE this1.name = $param1
                WITH *
                CALL {
                    WITH *
                    OPTIONAL MATCH (this1)-[this2:ACTED_IN]->(this3:Movie)
                    WHERE this3.id = $param2
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
            WITH *
            DETACH DELETE this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"param0\\": \\"123\\",
                \\"param1\\": \\"Actor to delete\\",
                \\"param2\\": \\"321\\"
            }"
        `);
    });

    test("Triple Nested Delete", async () => {
        const query = /* GraphQL */ `
            mutation {
                deleteMovies(
                    where: { id: 123 }
                    delete: {
                        actors: {
                            where: { node: { name: "Actor to delete" } }
                            delete: {
                                movies: {
                                    where: { node: { id: 321 } }
                                    delete: { actors: { where: { node: { name: "Another actor to delete" } } } }
                                }
                            }
                        }
                    }
                ) {
                    nodesDeleted
                }
            }
        `;

        const result = await translateQuery(neoSchema, query);

        expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
            "MATCH (this:Movie)
            WHERE this.id = $param0
            WITH *
            CALL {
                WITH *
                OPTIONAL MATCH (this)<-[this0:ACTED_IN]-(this1:Actor)
                WHERE this1.name = $param1
                WITH *
                CALL {
                    WITH *
                    OPTIONAL MATCH (this1)-[this2:ACTED_IN]->(this3:Movie)
                    WHERE this3.id = $param2
                    WITH *
                    CALL {
                        WITH *
                        OPTIONAL MATCH (this3)<-[this4:ACTED_IN]-(this5:Actor)
                        WHERE this5.name = $param3
                        WITH this4, collect(DISTINCT this5) AS var6
                        CALL {
                            WITH var6
                            UNWIND var6 AS var7
                            DETACH DELETE var7
                        }
                    }
                    WITH this2, collect(DISTINCT this3) AS var8
                    CALL {
                        WITH var8
                        UNWIND var8 AS var9
                        DETACH DELETE var9
                    }
                }
                WITH this0, collect(DISTINCT this1) AS var10
                CALL {
                    WITH var10
                    UNWIND var10 AS var11
                    DETACH DELETE var11
                }
            }
            WITH *
            DETACH DELETE this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"param0\\": \\"123\\",
                \\"param1\\": \\"Actor to delete\\",
                \\"param2\\": \\"321\\",
                \\"param3\\": \\"Another actor to delete\\"
            }"
        `);
    });
});
