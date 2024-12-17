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

import { Neo4jGraphQL } from "../../../../../src";
import { formatCypher, formatParams, translateQuery } from "../../../utils/tck-test-utils";

describe("cypher directive filtering", () => {
    test("Connect filter", async () => {
        const typeDefs = /* GraphQL */ `
            type Movie @node {
                title: String
                actors: [Actor!]! @relationship(type: "ACTED_IN", direction: IN)
            }

            type Actor @node {
                name: String
                custom_field: String
                    @cypher(
                        statement: """
                        RETURN "hello world!" AS s
                        """
                        columnName: "s"
                    )
                movies: [Movie!]! @relationship(type: "ACTED_IN", direction: OUT)
            }
        `;

        const query = /* GraphQL */ `
            mutation {
                createMovies(
                    input: [
                        {
                            title: "The Matrix Reloaded"
                            actors: {
                                connect: [
                                    {
                                        where: {
                                            node: {
                                                name_EQ: "Keanu Reeves",
                                                custom_field_EQ: "hello world!"
                                            }
                                        }
                                    }
                                ]
                                create: [
                                    {
                                        node: {
                                            name: "Jada Pinkett Smith"
                                        }
                                    }
                                ]
                            }
                        }
                    ]
                ) {
                    movies {
                        title
                        actors {
                            name
                        }
                    }
                }
            }
        `;

        const neoSchema: Neo4jGraphQL = new Neo4jGraphQL({
            typeDefs,
        });

        const result = await translateQuery(neoSchema, query);

        expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
            "CALL {
            CREATE (this0:Movie)
            SET this0.title = $this0_title
            WITH *
            CREATE (this0_actors0_node:Actor)
            SET this0_actors0_node.name = $this0_actors0_node_name
            MERGE (this0)<-[:ACTED_IN]-(this0_actors0_node)
            WITH *
            CALL {
            	WITH this0
            	OPTIONAL MATCH (this0_actors_connect0_node:Actor)
            CALL {
                WITH this0_actors_connect0_node
                CALL {
                    WITH this0_actors_connect0_node
                    WITH this0_actors_connect0_node AS this
                    RETURN \\"hello world!\\" AS s
                }
                WITH s AS this0_actors_connect0_node_this0
                RETURN this0_actors_connect0_node_this0 AS this0_actors_connect0_node_var1
            }
            WITH *, CASE (this0_actors_connect0_node.name = $this0_actors_connect0_node_param0 AND this0_actors_connect0_node_var1 = $this0_actors_connect0_node_param1)
                WHEN true THEN [this0_actors_connect0_node]
                ELSE [NULL]
            END AS aggregateWhereFiltervar0
            WITH *, aggregateWhereFiltervar0[0] AS this0_actors_connect0_node
            	CALL {
            		WITH *
            		WITH collect(this0_actors_connect0_node) as connectedNodes, collect(this0) as parentNodes
            		CALL {
            			WITH connectedNodes, parentNodes
            			UNWIND parentNodes as this0
            			UNWIND connectedNodes as this0_actors_connect0_node
            			CREATE (this0)<-[:ACTED_IN]-(this0_actors_connect0_node)
            		}
            	}
            WITH this0, this0_actors_connect0_node
            	RETURN count(*) AS connect_this0_actors_connect_Actor0
            }
            RETURN this0
            }
            CALL {
                WITH this0
                CALL {
                    WITH this0
                    MATCH (this0)<-[create_this0:ACTED_IN]-(create_this1:Actor)
                    WITH create_this1 { .name } AS create_this1
                    RETURN collect(create_this1) AS create_var2
                }
                RETURN this0 { .title, actors: create_var2 } AS create_var3
            }
            RETURN [create_var3] AS data"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"this0_title\\": \\"The Matrix Reloaded\\",
                \\"this0_actors0_node_name\\": \\"Jada Pinkett Smith\\",
                \\"this0_actors_connect0_node_param0\\": \\"Keanu Reeves\\",
                \\"this0_actors_connect0_node_param1\\": \\"hello world!\\",
                \\"resolvedCallbacks\\": {}
            }"
        `);
    });
});
