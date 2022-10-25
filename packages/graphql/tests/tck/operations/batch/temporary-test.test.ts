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

describe("Helper for unwind-create (REMOVE IT)", () => {
    let typeDefs: DocumentNode;
    let neoSchema: Neo4jGraphQL;

    beforeAll(() => {
        typeDefs = gql`
            type Actor {
                id: ID! @id
                name: String
                website: Website @relationship(type: "HAS_WEBSITE", direction: OUT)
                movies: [Movie!]! @relationship(type: "ACTED_IN", direction: OUT, properties: "ActedIn")
            }

            type Movie {
                id: ID
                website: Website @relationship(type: "HAS_WEBSITE", direction: OUT)
                actors: [Actor!]! @relationship(type: "ACTED_IN", direction: IN, properties: "ActedIn")
            }

            type Website {
                address: String
            }

            interface ActedIn @relationshipProperties {
                year: Int
            }
        `;

        neoSchema = new Neo4jGraphQL({
            typeDefs,
            config: { enableRegex: true },
        });
    });

    test.only("simple batch", async () => {
        const query = gql`
            mutation {
                createMovies(input: [{ id: "1" }, { id: "2" }]) {
                    movies {
                        id
                    }
                }
            }
        `;

        const req = createJwtRequest("secret", {});

        const result = await translateQuery(neoSchema, query, {
            req,
        });

        expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
            "UNWIND [ { id: $create_param0 }, { id: $create_param1 } ] AS create_var1
            CREATE (create_this0:\`Movie\`)
            SET
                create_this0.id = create_var1.id
            WITH create_this0
            CALL {
            	WITH create_this0
            	MATCH (create_this0)-[create_this0_website_Website_unique:HAS_WEBSITE]->(:Website)
            	WITH count(create_this0_website_Website_unique) as c
            	CALL apoc.util.validate(NOT (c <= 1), '@neo4j/graphql/RELATIONSHIP-REQUIREDMovie.website must be less than or equal to one', [0])
            	RETURN c AS create_this0_website_Website_unique_ignored
            }
            RETURN collect(create_this0 { .id }) AS data"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"create_param0\\": \\"1\\",
                \\"create_param1\\": \\"2\\",
                \\"resolvedCallbacks\\": {}
            }"
        `);
    });

    test("Nested batch", async () => {
        const query = gql`
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

        const req = createJwtRequest("secret", {});
        const result = await translateQuery(neoSchema, query, {
            req,
        });

        expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
            "UNWIND [ { id: $create_param0, actors: { create: [ { node: { name: $create_param1 }, edge: { year: $create_param2 } } ] } }, { id: $create_param3, actors: { create: [ { node: { name: $create_param4 }, edge: { year: $create_param5 } } ] } } ] AS create_var2
            CREATE (create_this1:\`Movie\`)
            SET
                create_this1.id = create_var2.id
            WITH create_this1, create_var2
            CALL {
                WITH create_this1, create_var2
                UNWIND create_var2.actors.create AS create_var3
                WITH create_var3.node AS create_var4, create_var3.edge AS create_var5, create_this1
                CREATE (create_this6:\`Actor\`)
                SET
                    create_this6.name = create_var4.name,
                    create_this6.id = randomUUID()
                MERGE (create_this6)-[create_this7:ACTED_IN]->(create_this1)
                WITH create_this6
                CALL {
                	WITH create_this6
                	MATCH (create_this6)-[create_this6_website_Website_unique:HAS_WEBSITE]->(:Website)
                	WITH count(create_this6_website_Website_unique) as c
                	CALL apoc.util.validate(NOT (c <= 1), '@neo4j/graphql/RELATIONSHIP-REQUIREDActor.website must be less than or equal to one', [0])
                	RETURN c AS create_this6_website_Website_unique_ignored
                }
                RETURN collect(NULL)
            }
            WITH create_this1
            CALL {
            	WITH create_this1
            	MATCH (create_this1)-[create_this1_website_Website_unique:HAS_WEBSITE]->(:Website)
            	WITH count(create_this1_website_Website_unique) as c
            	CALL apoc.util.validate(NOT (c <= 1), '@neo4j/graphql/RELATIONSHIP-REQUIREDMovie.website must be less than or equal to one', [0])
            	RETURN c AS create_this1_website_Website_unique_ignored
            }
            CALL {
                WITH create_this1
                MATCH (create_this1_actors:\`Actor\`)-[create_this0:ACTED_IN]->(create_this1)
                WITH create_this1_actors { .name } AS create_this1_actors
                RETURN collect(create_this1_actors) AS create_this1_actors
            }
            RETURN collect(create_this1 { .id, actors: create_this1_actors }) AS data"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"create_param0\\": \\"1\\",
                \\"create_param1\\": \\"actor 1\\",
                \\"create_param2\\": {
                    \\"low\\": 2022,
                    \\"high\\": 0
                },
                \\"create_param3\\": \\"2\\",
                \\"create_param4\\": \\"actor 1\\",
                \\"create_param5\\": {
                    \\"low\\": 2022,
                    \\"high\\": 0
                },
                \\"resolvedCallbacks\\": {}
            }"
        `);
    });

    test("Connect batch", async () => {
        const query = gql`
            mutation {
                createMovies(
                    input: [
                        { id: "1", actors: { connect: { where: { node: { id: "3" } } } } }
                        { id: "2", actors: { connect: { where: { node: { name: "Keanu" } } } } }
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

        const req = createJwtRequest("secret", {});
        const result = await translateQuery(neoSchema, query, {
            req,
        });

        expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
            "UNWIND [ { index: 1, id: $create_param0, actors: { connect: [ { where: $create_param1 } ] } }, { index: 2, id: $create_param2, actors: { connect: [ { where: $create_param3 } ] } } ] AS create_var2
            CREATE (create_this1:\`Movie\`)
            SET
                create_this1.id = create_var2.id
            WITH create_this1
            CALL {
            	WITH create_this1
            	OPTIONAL MATCH (create_var30_node:Actor)
            	WHERE (
                    (create_var30_node.id = $create_var30_node_param0 AND index = $create_var30_node_param1) 
                    OR 
                    (create_var30_node.name = $create_var30_node_param2 AND create_var30_node.index = $create_var30_node_param3)
                )
            	FOREACH(_ IN CASE WHEN create_this1 IS NULL THEN [] ELSE [1] END |
            		FOREACH(_ IN CASE WHEN create_var30_node IS NULL THEN [] ELSE [1] END |
            			MERGE (create_this1)<-[create_var30_relationship:ACTED_IN]-(create_var30_node)
            		)
            	)
            	RETURN count(*) AS connect_create_var3_Actor
            }
            WITH create_this1
            CALL {
            	WITH create_this1
            	MATCH (create_this1)-[create_this1_website_Website_unique:HAS_WEBSITE]->(:Website)
            	WITH count(create_this1_website_Website_unique) as c
            	CALL apoc.util.validate(NOT (c <= 1), '@neo4j/graphql/RELATIONSHIP-REQUIREDMovie.website must be less than or equal to one', [0])
            	RETURN c AS create_this1_website_Website_unique_ignored
            }
            CALL {
                WITH create_this1
                MATCH (create_this1_actors:\`Actor\`)-[create_this0:ACTED_IN]->(create_this1)
                WITH create_this1_actors { .name } AS create_this1_actors
                RETURN collect(create_this1_actors) AS create_this1_actors
            }
            RETURN collect(create_this1 { .id, actors: create_this1_actors }) AS data"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"create_param0\\": \\"1\\",
                \\"create_param1\\": {
                    \\"node\\": {
                        \\"id\\": \\"3\\"
                    }
                },
                \\"create_param2\\": \\"2\\",
                \\"create_param3\\": {
                    \\"node\\": {
                        \\"name\\": \\"Keanu\\"
                    }
                },
                \\"create_var30_node_param0\\": \\"3\\",
                \\"create_var30_node_param1\\": 0,
                \\"create_var30_node_param2\\": \\"Keanu\\",
                \\"create_var30_node_param3\\": 1,
                \\"resolvedCallbacks\\": {}
            }"
        `);
    });

    test("heterogeneous batch", async () => {
        const query = gql`
            mutation {
                createMovies(
                    input: [
                        { id: "1", actors: { create: [{ node: { name: "actor 1" }, edge: { year: 2022 } }] } }
                        { id: "2", actors: { create: [{ node: { name: "actor 2" }, edge: { year: 1999 } }] } }
                        { id: "3", website: { create: { node: { address: "mywebsite.com" } } } }
                        { id: "4", actors: { connect: { where: { node: { id: "2" } } } } }
                        {
                            id: "5"
                            actors: {
                                connectOrCreate: {
                                    where: { node: { id: "2" } }
                                    onCreate: { node: { name: "actor 2" } }
                                }
                            }
                        }
                    ]
                ) {
                    movies {
                        id
                        website {
                            address
                        }
                        actors {
                            name
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
            "UNWIND [ { id: $create_param0, actors: { create: [ { node: { name: $create_param1 }, edge: { year: $create_param2 } } ] } }, { id: $create_param3, actors: { create: [ { node: { name: $create_param4 }, edge: { year: $create_param5 } } ] } }, { id: $create_param6, website: { create: { node: { address: $create_param7 } } } }, { id: $create_param8, actors: { connect: [ { where: $create_param9 } ] } }, { id: $create_param10, actors: { connectOrCreate: [ { where: $create_param11, onCreate: $create_param12 } ] } } ] AS create_var3
            CREATE (create_this2:\`Movie\`)
            SET
                create_this2.id = create_var3.id
            WITH create_this2, create_var3
            CALL {
                WITH create_this2, create_var3
                UNWIND create_var3.actors.create AS create_var4
                WITH create_var4.node AS create_var5, create_var4.edge AS create_var6, create_this2
                CREATE (create_this7:\`Actor\`)
                SET
                    create_this7.name = create_var5.name,
                    create_this7.id = randomUUID()
                MERGE (create_this7)-[create_this8:ACTED_IN]->(create_this2)
                WITH create_this7
                CALL {
                	WITH create_this7
                	MATCH (create_this7)-[create_this7_website_Website_unique:HAS_WEBSITE]->(:Website)
                	WITH count(create_this7_website_Website_unique) as c
                	CALL apoc.util.validate(NOT (c <= 1), '@neo4j/graphql/RELATIONSHIP-REQUIREDActor.website must be less than or equal to one', [0])
                	RETURN c AS create_this7_website_Website_unique_ignored
                }
                RETURN collect(NULL)
            }
            WITH create_this2, create_var3
            CALL {
                WITH create_this2, create_var3
                UNWIND create_var3.website.create AS create_var9
                WITH create_var9.node AS create_var10, create_var9.edge AS create_var11, create_this2
                CREATE (create_this12:\`Website\`)
                SET
                    create_this12.address = create_var10.address
                MERGE (create_this12)-[create_this13:HAS_WEBSITE]->(create_this2)
                RETURN collect(NULL)
            }
            WITH create_this2
            CALL {
            	WITH create_this2
            	MATCH (create_this2)-[create_this2_website_Website_unique:HAS_WEBSITE]->(:Website)
            	WITH count(create_this2_website_Website_unique) as c
            	CALL apoc.util.validate(NOT (c <= 1), '@neo4j/graphql/RELATIONSHIP-REQUIREDMovie.website must be less than or equal to one', [0])
            	RETURN c AS create_this2_website_Website_unique_ignored
            }
            CALL {
                WITH create_this2
                MATCH (create_this2)-[create_this0:HAS_WEBSITE]->(create_this2_website:\`Website\`)
                WITH create_this2_website { .address } AS create_this2_website
                RETURN head(collect(create_this2_website)) AS create_this2_website
            }
            CALL {
                WITH create_this2
                MATCH (create_this2_actors:\`Actor\`)-[create_this1:ACTED_IN]->(create_this2)
                WITH create_this2_actors { .name } AS create_this2_actors
                RETURN collect(create_this2_actors) AS create_this2_actors
            }
            RETURN collect(create_this2 { .id, website: create_this2_website, actors: create_this2_actors }) AS data"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"create_param0\\": \\"1\\",
                \\"create_param1\\": \\"actor 1\\",
                \\"create_param2\\": {
                    \\"low\\": 2022,
                    \\"high\\": 0
                },
                \\"create_param3\\": \\"2\\",
                \\"create_param4\\": \\"actor 2\\",
                \\"create_param5\\": {
                    \\"low\\": 1999,
                    \\"high\\": 0
                },
                \\"create_param6\\": \\"3\\",
                \\"create_param7\\": \\"mywebsite.com\\",
                \\"create_param8\\": \\"4\\",
                \\"create_param9\\": {
                    \\"node\\": {
                        \\"id\\": \\"2\\"
                    }
                },
                \\"create_param10\\": \\"5\\",
                \\"create_param11\\": {
                    \\"node\\": {
                        \\"id\\": \\"2\\"
                    }
                },
                \\"create_param12\\": {
                    \\"node\\": {
                        \\"name\\": \\"actor 2\\"
                    }
                },
                \\"resolvedCallbacks\\": {}
            }"
        `);
    });
});
