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

describe("Batch Create, Interface", () => {
    let typeDefs: string;
    let neoSchema: Neo4jGraphQL;

    beforeAll(() => {
        typeDefs = /* GraphQL */ `
            interface Person {
                id: ID!
                name: String
            }

            type Actor implements Person @node {
                id: ID!
                name: String
                website: [Website!]! @relationship(type: "HAS_WEBSITE", direction: OUT)
                movies: [Movie!]! @relationship(type: "EMPLOYED", direction: OUT, properties: "ActedIn")
            }

            type Modeler implements Person @node {
                id: ID!
                name: String
                website: [Website!]! @relationship(type: "HAS_WEBSITE", direction: OUT)
                movies: [Movie!]! @relationship(type: "EMPLOYED", direction: OUT, properties: "ActedIn")
            }

            type Movie @node {
                id: ID
                website: [Website!]! @relationship(type: "HAS_WEBSITE", direction: OUT)
                workers: [Person!]! @relationship(type: "EMPLOYED", direction: IN, properties: "ActedIn")
            }

            type Website @node {
                address: String
            }

            type ActedIn @relationshipProperties {
                year: Int
            }
        `;

        neoSchema = new Neo4jGraphQL({
            typeDefs,
        });
    });

    test("no nested batch", async () => {
        const query = /* GraphQL */ `
            mutation {
                createMovies(input: [{ id: "1" }, { id: "2" }]) {
                    movies {
                        id
                    }
                }
            }
        `;

        const result = await translateQuery(neoSchema, query);

        expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
            "CYPHER 5
            UNWIND $create_param0 AS create_var0
            CALL (create_var0) {
                CREATE (create_this1:Movie)
                SET
                    create_this1.id = create_var0.id
                RETURN create_this1
            }
            RETURN collect(create_this1 { .id }) AS data"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"create_param0\\": [
                    {
                        \\"id\\": \\"1\\"
                    },
                    {
                        \\"id\\": \\"2\\"
                    }
                ]
            }"
        `);
    });

    test("nested batch", async () => {
        const query = /* GraphQL */ `
            mutation {
                createMovies(
                    input: [
                        {
                            id: "1"
                            workers: {
                                create: [{ node: { Actor: { id: "1", name: "actor 1" } }, edge: { year: 2022 } }]
                            }
                        }
                        {
                            id: "2"
                            workers: {
                                create: [{ node: { Modeler: { id: "2", name: "modeler 1" } }, edge: { year: 2022 } }]
                            }
                        }
                    ]
                ) {
                    movies {
                        id
                        workers {
                            name
                        }
                    }
                }
            }
        `;

        const result = await translateQuery(neoSchema, query);

        expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
            "CYPHER 5
            CALL {
                CREATE (this0:Movie)
                SET
                    this0.id = $param0
                WITH *
                CREATE (this1:Actor)
                MERGE (this0)<-[this2:EMPLOYED]-(this1)
                SET
                    this1.id = $param1,
                    this1.name = $param2,
                    this2.year = $param3
                RETURN this0 AS this
                UNION
                CREATE (this3:Movie)
                SET
                    this3.id = $param4
                WITH *
                CREATE (this4:Modeler)
                MERGE (this3)<-[this5:EMPLOYED]-(this4)
                SET
                    this4.id = $param5,
                    this4.name = $param6,
                    this5.year = $param7
                RETURN this3 AS this
            }
            WITH this
            CALL (this) {
                CALL (this) {
                    CALL (*) {
                        WITH *
                        MATCH (this)<-[this6:EMPLOYED]-(this7:Actor)
                        WITH this7 { .name, __resolveType: \\"Actor\\", __id: id(this7) } AS var8
                        RETURN var8
                        UNION
                        WITH *
                        MATCH (this)<-[this9:EMPLOYED]-(this10:Modeler)
                        WITH this10 { .name, __resolveType: \\"Modeler\\", __id: id(this10) } AS var8
                        RETURN var8
                    }
                    WITH var8
                    RETURN collect(var8) AS var8
                }
                RETURN this { .id, workers: var8 } AS var11
            }
            RETURN collect(var11) AS data"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"param0\\": \\"1\\",
                \\"param1\\": \\"1\\",
                \\"param2\\": \\"actor 1\\",
                \\"param3\\": {
                    \\"low\\": 2022,
                    \\"high\\": 0
                },
                \\"param4\\": \\"2\\",
                \\"param5\\": \\"2\\",
                \\"param6\\": \\"modeler 1\\",
                \\"param7\\": {
                    \\"low\\": 2022,
                    \\"high\\": 0
                }
            }"
        `);
    });

    test("heterogeneous batch", async () => {
        const query = /* GraphQL */ `
            mutation {
                createMovies(
                    input: [
                        {
                            id: "1"
                            workers: {
                                create: [{ node: { Actor: { id: "1", name: "actor 1" } }, edge: { year: 2022 } }]
                            }
                        }
                        {
                            id: "2"
                            workers: {
                                create: [{ node: { Actor: { id: "2", name: "actor 2" } }, edge: { year: 2022 } }]
                            }
                        }
                        { id: "3", website: { create: { node: { address: "mywebsite.com" } } } }
                        { id: "4", workers: { connect: { where: { node: { id: { eq: "2" } } } } } }
                    ]
                ) {
                    movies {
                        id
                        website {
                            address
                        }
                        workers {
                            name
                        }
                    }
                }
            }
        `;

        const result = await translateQuery(neoSchema, query);

        expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
            "CYPHER 5
            CALL {
                CREATE (this0:Movie)
                SET
                    this0.id = $param0
                WITH *
                CREATE (this1:Actor)
                MERGE (this0)<-[this2:EMPLOYED]-(this1)
                SET
                    this1.id = $param1,
                    this1.name = $param2,
                    this2.year = $param3
                RETURN this0 AS this
                UNION
                CREATE (this3:Movie)
                SET
                    this3.id = $param4
                WITH *
                CREATE (this4:Actor)
                MERGE (this3)<-[this5:EMPLOYED]-(this4)
                SET
                    this4.id = $param5,
                    this4.name = $param6,
                    this5.year = $param7
                RETURN this3 AS this
                UNION
                CREATE (this6:Movie)
                SET
                    this6.id = $param8
                WITH *
                CREATE (this7:Website)
                MERGE (this6)-[this8:HAS_WEBSITE]->(this7)
                SET
                    this7.address = $param9
                RETURN this6 AS this
                UNION
                CREATE (this9:Movie)
                SET
                    this9.id = $param10
                WITH *
                CALL (this9) {
                    MATCH (this10:Actor)
                    WHERE this10.id = $param11
                    CREATE (this9)<-[this11:EMPLOYED]-(this10)
                }
                WITH *
                CALL (this9) {
                    MATCH (this12:Modeler)
                    WHERE this12.id = $param12
                    CREATE (this9)<-[this13:EMPLOYED]-(this12)
                }
                RETURN this9 AS this
            }
            WITH this
            CALL (this) {
                CALL (this) {
                    MATCH (this)-[this14:HAS_WEBSITE]->(this15:Website)
                    WITH DISTINCT this15
                    WITH this15 { .address } AS this15
                    RETURN collect(this15) AS var16
                }
                CALL (this) {
                    CALL (*) {
                        WITH *
                        MATCH (this)<-[this17:EMPLOYED]-(this18:Actor)
                        WITH this18 { .name, __resolveType: \\"Actor\\", __id: id(this18) } AS var19
                        RETURN var19
                        UNION
                        WITH *
                        MATCH (this)<-[this20:EMPLOYED]-(this21:Modeler)
                        WITH this21 { .name, __resolveType: \\"Modeler\\", __id: id(this21) } AS var19
                        RETURN var19
                    }
                    WITH var19
                    RETURN collect(var19) AS var19
                }
                RETURN this { .id, website: var16, workers: var19 } AS var22
            }
            RETURN collect(var22) AS data"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"param0\\": \\"1\\",
                \\"param1\\": \\"1\\",
                \\"param2\\": \\"actor 1\\",
                \\"param3\\": {
                    \\"low\\": 2022,
                    \\"high\\": 0
                },
                \\"param4\\": \\"2\\",
                \\"param5\\": \\"2\\",
                \\"param6\\": \\"actor 2\\",
                \\"param7\\": {
                    \\"low\\": 2022,
                    \\"high\\": 0
                },
                \\"param8\\": \\"3\\",
                \\"param9\\": \\"mywebsite.com\\",
                \\"param10\\": \\"4\\",
                \\"param11\\": \\"2\\",
                \\"param12\\": \\"2\\"
            }"
        `);
    });
});
