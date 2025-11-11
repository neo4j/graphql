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

describe("Batch Create, Scalar types", () => {
    let typeDefs: string;
    let neoSchema: Neo4jGraphQL;

    beforeAll(() => {
        typeDefs = /* GraphQL */ `
            type Actor @node {
                id: ID! @id
                name: String
                born: Date
                createdAt: DateTime @timestamp(operations: [CREATE])
                website: [Website!]! @relationship(type: "HAS_WEBSITE", direction: OUT)
                movies: [Movie!]! @relationship(type: "ACTED_IN", direction: OUT, properties: "ActedIn")
            }

            type Movie @node {
                id: ID
                runningTime: Duration
                location: Point
                createdAt: DateTime @timestamp(operations: [CREATE])
                website: [Website!]! @relationship(type: "HAS_WEBSITE", direction: OUT)
                actors: [Actor!]! @relationship(type: "ACTED_IN", direction: IN, properties: "ActedIn")
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
                createMovies(
                    input: [
                        { id: "1", runningTime: "P14DT16H12M", location: { longitude: 3.0, latitude: 3.0 } }
                        { id: "2" }
                    ]
                ) {
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
                    create_this1.createdAt = datetime(),
                    create_this1.id = create_var0.id,
                    create_this1.runningTime = create_var0.runningTime,
                    create_this1.location = point(create_var0.location)
                RETURN create_this1
            }
            RETURN collect(create_this1 { .id }) AS data"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"create_param0\\": [
                    {
                        \\"id\\": \\"1\\",
                        \\"runningTime\\": {
                            \\"months\\": 0,
                            \\"days\\": 14,
                            \\"seconds\\": 58320,
                            \\"nanoseconds\\": 0
                        },
                        \\"location\\": {
                            \\"longitude\\": 3,
                            \\"latitude\\": 3
                        }
                    },
                    {
                        \\"id\\": \\"2\\"
                    }
                ]
            }"
        `);
    });

    test("1 to 1 cardinality", async () => {
        const query = /* GraphQL */ `
            mutation {
                createMovies(
                    input: [
                        {
                            id: "1"
                            actors: {
                                create: [
                                    {
                                        node: {
                                            name: "actor 1"
                                            website: { create: { node: { address: "Actor1.com" } } }
                                        }
                                        edge: { year: 2022 }
                                    }
                                ]
                            }
                        }
                        { id: "2", website: { create: { node: { address: "The Matrix2.com" } } } }
                    ]
                ) {
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
                    create_this1.createdAt = datetime(),
                    create_this1.id = create_var0.id
                WITH create_this1, create_var0
                CALL (create_this1, create_var0) {
                    UNWIND create_var0.actors.create AS create_var2
                    CREATE (create_this3:Actor)
                    SET
                        create_this3.id = randomUUID(),
                        create_this3.createdAt = datetime(),
                        create_this3.name = create_var2.node.name
                    MERGE (create_this1)<-[create_this4:ACTED_IN]-(create_this3)
                    SET
                        create_this4.year = create_var2.edge.year
                    WITH create_this3, create_var2
                    CALL (create_this3, create_var2) {
                        UNWIND create_var2.node.website.create AS create_var5
                        CREATE (create_this6:Website)
                        SET
                            create_this6.address = create_var5.node.address
                        MERGE (create_this3)-[create_this7:HAS_WEBSITE]->(create_this6)
                        RETURN collect(NULL) AS create_var8
                    }
                    RETURN collect(NULL) AS create_var9
                }
                WITH create_this1, create_var0
                CALL (create_this1, create_var0) {
                    UNWIND create_var0.website.create AS create_var10
                    CREATE (create_this11:Website)
                    SET
                        create_this11.address = create_var10.node.address
                    MERGE (create_this1)-[create_this12:HAS_WEBSITE]->(create_this11)
                    RETURN collect(NULL) AS create_var13
                }
                RETURN create_this1
            }
            RETURN collect(create_this1 { .id }) AS data"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"create_param0\\": [
                    {
                        \\"id\\": \\"1\\",
                        \\"actors\\": {
                            \\"create\\": [
                                {
                                    \\"edge\\": {
                                        \\"year\\": {
                                            \\"low\\": 2022,
                                            \\"high\\": 0
                                        }
                                    },
                                    \\"node\\": {
                                        \\"name\\": \\"actor 1\\",
                                        \\"website\\": {
                                            \\"create\\": [
                                                {
                                                    \\"node\\": {
                                                        \\"address\\": \\"Actor1.com\\"
                                                    }
                                                }
                                            ]
                                        }
                                    }
                                }
                            ]
                        }
                    },
                    {
                        \\"id\\": \\"2\\",
                        \\"website\\": {
                            \\"create\\": [
                                {
                                    \\"node\\": {
                                        \\"address\\": \\"The Matrix2.com\\"
                                    }
                                }
                            ]
                        }
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
                        { id: "1", actors: { create: [{ node: { name: "actor 1" }, edge: { year: 2022 } }] } }
                        { id: "2", actors: { create: [{ node: { name: "actor 1" }, edge: { year: 2022 } }] } }
                    ]
                ) {
                    movies {
                        id
                        actors {
                            name
                        }
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
                    create_this1.createdAt = datetime(),
                    create_this1.id = create_var0.id
                WITH create_this1, create_var0
                CALL (create_this1, create_var0) {
                    UNWIND create_var0.actors.create AS create_var2
                    CREATE (create_this3:Actor)
                    SET
                        create_this3.id = randomUUID(),
                        create_this3.createdAt = datetime(),
                        create_this3.name = create_var2.node.name
                    MERGE (create_this1)<-[create_this4:ACTED_IN]-(create_this3)
                    SET
                        create_this4.year = create_var2.edge.year
                    RETURN collect(NULL) AS create_var5
                }
                RETURN create_this1
            }
            CALL (create_this1) {
                MATCH (create_this1)<-[create_this6:ACTED_IN]-(create_this7:Actor)
                WITH DISTINCT create_this7
                WITH create_this7 { .name } AS create_this7
                RETURN collect(create_this7) AS create_var8
            }
            RETURN collect(create_this1 { .id, actors: create_var8 }) AS data"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"create_param0\\": [
                    {
                        \\"id\\": \\"1\\",
                        \\"actors\\": {
                            \\"create\\": [
                                {
                                    \\"edge\\": {
                                        \\"year\\": {
                                            \\"low\\": 2022,
                                            \\"high\\": 0
                                        }
                                    },
                                    \\"node\\": {
                                        \\"name\\": \\"actor 1\\"
                                    }
                                }
                            ]
                        }
                    },
                    {
                        \\"id\\": \\"2\\",
                        \\"actors\\": {
                            \\"create\\": [
                                {
                                    \\"edge\\": {
                                        \\"year\\": {
                                            \\"low\\": 2022,
                                            \\"high\\": 0
                                        }
                                    },
                                    \\"node\\": {
                                        \\"name\\": \\"actor 1\\"
                                    }
                                }
                            ]
                        }
                    }
                ]
            }"
        `);
    });
});
