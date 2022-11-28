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
import { Neo4jGraphQL } from "../../../src";
import { createJwtRequest } from "../../utils/create-jwt-request";
import { formatCypher, translateQuery, formatParams } from "../utils/tck-test-utils";

describe("tck/rfs/003", () => {
    describe("one-to-one", () => {
        describe("create", () => {
            test("should add validation when creating node with a required relationship", async () => {
                const typeDefs = gql`
                    type Director {
                        id: ID!
                    }

                    type Movie {
                        id: ID!
                        director: Director! @relationship(type: "DIRECTED", direction: IN)
                    }
                `;

                const neoSchema = new Neo4jGraphQL({ typeDefs });

                const movieId = "movieId-1";

                const mutation = gql`
                    mutation {
                        createMovies(input: [{ id: "${movieId}" }]) {
                            info {
                                nodesCreated
                            }
                        }
                    }
                `;

                const result = await translateQuery(neoSchema, mutation, {
                    req: createJwtRequest("secret", {}),
                });

                expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
                    "UNWIND $create_param0 AS create_var1
                    CALL {
                        WITH create_var1
                        CREATE (create_this0:\`Movie\`)
                        SET
                            create_this0.id = create_var1.id
                        WITH create_this0
                        CALL {
                        	WITH create_this0
                        	MATCH (create_this0)<-[create_this0_director_Director_unique:DIRECTED]-(:Director)
                        	WITH count(create_this0_director_Director_unique) as c
                        	CALL apoc.util.validate(NOT (c = 1), '@neo4j/graphql/RELATIONSHIP-REQUIREDMovie.director required', [0])
                        	RETURN c AS create_this0_director_Director_unique_ignored
                        }
                        RETURN create_this0
                    }
                    RETURN 'Query cannot conclude with CALL'"
                `);

                expect(formatParams(result.params)).toMatchInlineSnapshot(`
                    "{
                        \\"create_param0\\": [
                            {
                                \\"id\\": \\"movieId-1\\"
                            }
                        ],
                        \\"resolvedCallbacks\\": {}
                    }"
                `);
            });

            test("should add length validation when creating a node with a non required relationship", async () => {
                const typeDefs = gql`
                    type Director {
                        id: ID!
                    }

                    type Movie {
                        id: ID!
                        director: Director @relationship(type: "DIRECTED", direction: IN)
                    }
                `;

                const neoSchema = new Neo4jGraphQL({ typeDefs });

                const movieId = "movieId-1";

                const mutation = gql`
                    mutation {
                        createMovies(input: [{ id: "${movieId}" }]) {
                            info {
                                nodesCreated
                            }
                        }
                    }
                `;

                const result = await translateQuery(neoSchema, mutation, {
                    req: createJwtRequest("secret", {}),
                });

                expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
                    "UNWIND $create_param0 AS create_var1
                    CALL {
                        WITH create_var1
                        CREATE (create_this0:\`Movie\`)
                        SET
                            create_this0.id = create_var1.id
                        WITH create_this0
                        CALL {
                        	WITH create_this0
                        	MATCH (create_this0)<-[create_this0_director_Director_unique:DIRECTED]-(:Director)
                        	WITH count(create_this0_director_Director_unique) as c
                        	CALL apoc.util.validate(NOT (c <= 1), '@neo4j/graphql/RELATIONSHIP-REQUIREDMovie.director must be less than or equal to one', [0])
                        	RETURN c AS create_this0_director_Director_unique_ignored
                        }
                        RETURN create_this0
                    }
                    RETURN 'Query cannot conclude with CALL'"
                `);

                expect(formatParams(result.params)).toMatchInlineSnapshot(`
                    "{
                        \\"create_param0\\": [
                            {
                                \\"id\\": \\"movieId-1\\"
                            }
                        ],
                        \\"resolvedCallbacks\\": {}
                    }"
                `);
            });

            describe("nested mutations", () => {
                test("should add validation when creating node with required relationship", async () => {
                    const typeDefs = gql`
                        type Address {
                            street: String!
                        }

                        type Director {
                            id: ID!
                            address: Address! @relationship(type: "HAS_ADDRESS", direction: OUT)
                        }

                        type Movie {
                            id: ID!
                            director: Director! @relationship(type: "DIRECTED", direction: IN)
                        }
                    `;

                    const neoSchema = new Neo4jGraphQL({ typeDefs });

                    const movieId = "movieId-2";
                    const directorId = "directorId-2";

                    const mutation = gql`
                        mutation {
                            createMovies(input: [{ id: "${movieId}", director: { create: { node: { id: "${directorId}" } } } }]) {
                                info {
                                    nodesCreated
                                }
                            }
                        }
                    `;

                    const result = await translateQuery(neoSchema, mutation, {
                        req: createJwtRequest("secret", {}),
                    });

                    expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
                        "UNWIND $create_param0 AS create_var1
                        CALL {
                            WITH create_var1
                            CREATE (create_this0:\`Movie\`)
                            SET
                                create_this0.id = create_var1.id
                            WITH create_this0, create_var1
                            CALL {
                                WITH create_this0, create_var1
                                UNWIND create_var1.director.create AS create_var2
                                WITH create_var2.node AS create_var3, create_var2.edge AS create_var4, create_this0
                                CREATE (create_this5:\`Director\`)
                                SET
                                    create_this5.id = create_var3.id
                                MERGE (create_this5)-[create_this6:DIRECTED]->(create_this0)
                                WITH create_this5
                                CALL {
                                	WITH create_this5
                                	MATCH (create_this5)-[create_this5_address_Address_unique:HAS_ADDRESS]->(:Address)
                                	WITH count(create_this5_address_Address_unique) as c
                                	CALL apoc.util.validate(NOT (c = 1), '@neo4j/graphql/RELATIONSHIP-REQUIREDDirector.address required', [0])
                                	RETURN c AS create_this5_address_Address_unique_ignored
                                }
                                RETURN collect(NULL) AS create_var7
                            }
                            WITH create_this0
                            CALL {
                            	WITH create_this0
                            	MATCH (create_this0)<-[create_this0_director_Director_unique:DIRECTED]-(:Director)
                            	WITH count(create_this0_director_Director_unique) as c
                            	CALL apoc.util.validate(NOT (c = 1), '@neo4j/graphql/RELATIONSHIP-REQUIREDMovie.director required', [0])
                            	RETURN c AS create_this0_director_Director_unique_ignored
                            }
                            RETURN create_this0
                        }
                        RETURN 'Query cannot conclude with CALL'"
                    `);

                    expect(formatParams(result.params)).toMatchInlineSnapshot(`
                        "{
                            \\"create_param0\\": [
                                {
                                    \\"id\\": \\"movieId-2\\",
                                    \\"director\\": {
                                        \\"create\\": {
                                            \\"node\\": {
                                                \\"id\\": \\"directorId-2\\"
                                            }
                                        }
                                    }
                                }
                            ],
                            \\"resolvedCallbacks\\": {}
                        }"
                    `);
                });

                test("should add length validation when creating a node with a non required relationship", async () => {
                    const typeDefs = gql`
                        type Address {
                            street: String!
                        }

                        type Director {
                            id: ID!
                            address: Address @relationship(type: "HAS_ADDRESS", direction: OUT)
                        }

                        type Movie {
                            id: ID!
                            director: Director @relationship(type: "DIRECTED", direction: IN)
                        }
                    `;

                    const neoSchema = new Neo4jGraphQL({ typeDefs });

                    const movieId = "movieId-2";
                    const directorId = "directorId-2";

                    const mutation = gql`
                        mutation {
                            createMovies(input: [{ id: "${movieId}", director: { create: { node: { id: "${directorId}" } } } }]) {
                                info {
                                    nodesCreated
                                }
                            }
                        }
                    `;

                    const result = await translateQuery(neoSchema, mutation, {
                        req: createJwtRequest("secret", {}),
                    });

                    expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
                        "UNWIND $create_param0 AS create_var1
                        CALL {
                            WITH create_var1
                            CREATE (create_this0:\`Movie\`)
                            SET
                                create_this0.id = create_var1.id
                            WITH create_this0, create_var1
                            CALL {
                                WITH create_this0, create_var1
                                UNWIND create_var1.director.create AS create_var2
                                WITH create_var2.node AS create_var3, create_var2.edge AS create_var4, create_this0
                                CREATE (create_this5:\`Director\`)
                                SET
                                    create_this5.id = create_var3.id
                                MERGE (create_this5)-[create_this6:DIRECTED]->(create_this0)
                                WITH create_this5
                                CALL {
                                	WITH create_this5
                                	MATCH (create_this5)-[create_this5_address_Address_unique:HAS_ADDRESS]->(:Address)
                                	WITH count(create_this5_address_Address_unique) as c
                                	CALL apoc.util.validate(NOT (c <= 1), '@neo4j/graphql/RELATIONSHIP-REQUIREDDirector.address must be less than or equal to one', [0])
                                	RETURN c AS create_this5_address_Address_unique_ignored
                                }
                                RETURN collect(NULL) AS create_var7
                            }
                            WITH create_this0
                            CALL {
                            	WITH create_this0
                            	MATCH (create_this0)<-[create_this0_director_Director_unique:DIRECTED]-(:Director)
                            	WITH count(create_this0_director_Director_unique) as c
                            	CALL apoc.util.validate(NOT (c <= 1), '@neo4j/graphql/RELATIONSHIP-REQUIREDMovie.director must be less than or equal to one', [0])
                            	RETURN c AS create_this0_director_Director_unique_ignored
                            }
                            RETURN create_this0
                        }
                        RETURN 'Query cannot conclude with CALL'"
                    `);

                    expect(formatParams(result.params)).toMatchInlineSnapshot(`
                        "{
                            \\"create_param0\\": [
                                {
                                    \\"id\\": \\"movieId-2\\",
                                    \\"director\\": {
                                        \\"create\\": {
                                            \\"node\\": {
                                                \\"id\\": \\"directorId-2\\"
                                            }
                                        }
                                    }
                                }
                            ],
                            \\"resolvedCallbacks\\": {}
                        }"
                    `);
                });
            });

            describe("update", () => {
                test("should add validation when updating a node with a required relationship", async () => {
                    const typeDefs = gql`
                        type Director {
                            id: ID!
                        }

                        type Movie {
                            id: ID!
                            director: Director! @relationship(type: "DIRECTED", direction: IN)
                        }
                    `;

                    const neoSchema = new Neo4jGraphQL({ typeDefs });

                    const movieId = "movieId-3";

                    const mutation = gql`
                        mutation {
                            updateMovies(where: { id: "${movieId}" }, update: { id: "${movieId}" }) {
                                info {
                                    nodesCreated
                                }
                            }
                        }
                    `;

                    const result = await translateQuery(neoSchema, mutation, {
                        req: createJwtRequest("secret", {}),
                    });

                    expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
                        "MATCH (this:\`Movie\`)
                        WHERE this.id = $param0
                        SET this.id = $this_update_id
                        WITH this
                        CALL {
                        	WITH this
                        	MATCH (this)<-[this_director_Director_unique:DIRECTED]-(:Director)
                        	WITH count(this_director_Director_unique) as c
                        	CALL apoc.util.validate(NOT (c = 1), '@neo4j/graphql/RELATIONSHIP-REQUIREDMovie.director required', [0])
                        	RETURN c AS this_director_Director_unique_ignored
                        }
                        RETURN 'Query cannot conclude with CALL'"
                    `);

                    expect(formatParams(result.params)).toMatchInlineSnapshot(`
                        "{
                            \\"param0\\": \\"movieId-3\\",
                            \\"this_update_id\\": \\"movieId-3\\",
                            \\"resolvedCallbacks\\": {}
                        }"
                    `);
                });

                test("should add length validation when updating a node with a non required relationship", async () => {
                    const typeDefs = gql`
                        type Director {
                            id: ID!
                        }

                        type Movie {
                            id: ID!
                            director: Director @relationship(type: "DIRECTED", direction: IN)
                        }
                    `;

                    const neoSchema = new Neo4jGraphQL({ typeDefs });

                    const movieId = "movieId-3";

                    const mutation = gql`
                        mutation {
                            updateMovies(where: { id: "${movieId}" }, update: { id: "${movieId}" }) {
                                info {
                                    nodesCreated
                                }
                            }
                        }
                    `;

                    const result = await translateQuery(neoSchema, mutation, {
                        req: createJwtRequest("secret", {}),
                    });

                    expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
                        "MATCH (this:\`Movie\`)
                        WHERE this.id = $param0
                        SET this.id = $this_update_id
                        WITH this
                        CALL {
                        	WITH this
                        	MATCH (this)<-[this_director_Director_unique:DIRECTED]-(:Director)
                        	WITH count(this_director_Director_unique) as c
                        	CALL apoc.util.validate(NOT (c <= 1), '@neo4j/graphql/RELATIONSHIP-REQUIREDMovie.director must be less than or equal to one', [0])
                        	RETURN c AS this_director_Director_unique_ignored
                        }
                        RETURN 'Query cannot conclude with CALL'"
                    `);

                    expect(formatParams(result.params)).toMatchInlineSnapshot(`
                        "{
                            \\"param0\\": \\"movieId-3\\",
                            \\"this_update_id\\": \\"movieId-3\\",
                            \\"resolvedCallbacks\\": {}
                        }"
                    `);
                });

                describe("nested mutations", () => {
                    test("should add validation when updating a nested node with a required relationship", async () => {
                        const typeDefs = gql`
                            type Address {
                                street: String!
                            }

                            type Director {
                                id: ID!
                                address: Address! @relationship(type: "HAS_ADDRESS", direction: OUT)
                            }

                            type Movie {
                                id: ID!
                                director: Director! @relationship(type: "DIRECTED", direction: IN)
                            }
                        `;

                        const neoSchema = new Neo4jGraphQL({ typeDefs });

                        const movieId = "movieId-4";
                        const directorId = "directorId-3";

                        const mutation = gql`
                            mutation {
                                updateMovies(
                                  where: { id: "${movieId}" }
                                  update: { director: { update: { node: { id: "${directorId}" } } } }
                                ) {
                                  info {
                                    nodesCreated
                                  }
                                }
                            }
                        `;

                        const result = await translateQuery(neoSchema, mutation, {
                            req: createJwtRequest("secret", {}),
                        });

                        expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
                            "MATCH (this:\`Movie\`)
                            WHERE this.id = $param0
                            WITH this
                            OPTIONAL MATCH (this)<-[this_directed0_relationship:DIRECTED]-(this_director0:Director)
                            CALL apoc.do.when(this_director0 IS NOT NULL, \\"
                            SET this_director0.id = $this_update_director0_id
                            WITH this, this_director0
                            CALL {
                            	WITH this_director0
                            	MATCH (this_director0)-[this_director0_address_Address_unique:HAS_ADDRESS]->(:Address)
                            	WITH count(this_director0_address_Address_unique) as c
                            	CALL apoc.util.validate(NOT (c = 1), '@neo4j/graphql/RELATIONSHIP-REQUIREDDirector.address required', [0])
                            	RETURN c AS this_director0_address_Address_unique_ignored
                            }
                            RETURN count(*) AS _
                            \\", \\"\\", {this:this, updateMovies: $updateMovies, this_director0:this_director0, auth:$auth,this_update_director0_id:$this_update_director0_id})
                            YIELD value AS _
                            WITH this
                            CALL {
                            	WITH this
                            	MATCH (this)<-[this_director_Director_unique:DIRECTED]-(:Director)
                            	WITH count(this_director_Director_unique) as c
                            	CALL apoc.util.validate(NOT (c = 1), '@neo4j/graphql/RELATIONSHIP-REQUIREDMovie.director required', [0])
                            	RETURN c AS this_director_Director_unique_ignored
                            }
                            RETURN 'Query cannot conclude with CALL'"
                        `);

                        expect(formatParams(result.params)).toMatchInlineSnapshot(`
                            "{
                                \\"param0\\": \\"movieId-4\\",
                                \\"this_update_director0_id\\": \\"directorId-3\\",
                                \\"auth\\": {
                                    \\"isAuthenticated\\": false,
                                    \\"roles\\": []
                                },
                                \\"updateMovies\\": {
                                    \\"args\\": {
                                        \\"update\\": {
                                            \\"director\\": {
                                                \\"update\\": {
                                                    \\"node\\": {
                                                        \\"id\\": \\"directorId-3\\"
                                                    }
                                                }
                                            }
                                        }
                                    }
                                },
                                \\"resolvedCallbacks\\": {}
                            }"
                        `);
                    });

                    test("should add length validation when updating a nested node with a non required relationship", async () => {
                        const typeDefs = gql`
                            type Address {
                                street: String!
                            }

                            type Director {
                                id: ID!
                                address: Address @relationship(type: "HAS_ADDRESS", direction: OUT)
                            }

                            type Movie {
                                id: ID!
                                director: Director @relationship(type: "DIRECTED", direction: IN)
                            }
                        `;

                        const neoSchema = new Neo4jGraphQL({ typeDefs });

                        const movieId = "movieId-4";
                        const directorId = "directorId-3";

                        const mutation = gql`
                            mutation {
                                updateMovies(
                                  where: { id: "${movieId}" }
                                  update: { director: { update: { node: { id: "${directorId}" } } } }
                                ) {
                                  info {
                                    nodesCreated
                                  }
                                }
                            }
                        `;

                        const result = await translateQuery(neoSchema, mutation, {
                            req: createJwtRequest("secret", {}),
                        });

                        expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
                            "MATCH (this:\`Movie\`)
                            WHERE this.id = $param0
                            WITH this
                            OPTIONAL MATCH (this)<-[this_directed0_relationship:DIRECTED]-(this_director0:Director)
                            CALL apoc.do.when(this_director0 IS NOT NULL, \\"
                            SET this_director0.id = $this_update_director0_id
                            WITH this, this_director0
                            CALL {
                            	WITH this_director0
                            	MATCH (this_director0)-[this_director0_address_Address_unique:HAS_ADDRESS]->(:Address)
                            	WITH count(this_director0_address_Address_unique) as c
                            	CALL apoc.util.validate(NOT (c <= 1), '@neo4j/graphql/RELATIONSHIP-REQUIREDDirector.address must be less than or equal to one', [0])
                            	RETURN c AS this_director0_address_Address_unique_ignored
                            }
                            RETURN count(*) AS _
                            \\", \\"\\", {this:this, updateMovies: $updateMovies, this_director0:this_director0, auth:$auth,this_update_director0_id:$this_update_director0_id})
                            YIELD value AS _
                            WITH this
                            CALL {
                            	WITH this
                            	MATCH (this)<-[this_director_Director_unique:DIRECTED]-(:Director)
                            	WITH count(this_director_Director_unique) as c
                            	CALL apoc.util.validate(NOT (c <= 1), '@neo4j/graphql/RELATIONSHIP-REQUIREDMovie.director must be less than or equal to one', [0])
                            	RETURN c AS this_director_Director_unique_ignored
                            }
                            RETURN 'Query cannot conclude with CALL'"
                        `);

                        expect(formatParams(result.params)).toMatchInlineSnapshot(`
                            "{
                                \\"param0\\": \\"movieId-4\\",
                                \\"this_update_director0_id\\": \\"directorId-3\\",
                                \\"auth\\": {
                                    \\"isAuthenticated\\": false,
                                    \\"roles\\": []
                                },
                                \\"updateMovies\\": {
                                    \\"args\\": {
                                        \\"update\\": {
                                            \\"director\\": {
                                                \\"update\\": {
                                                    \\"node\\": {
                                                        \\"id\\": \\"directorId-3\\"
                                                    }
                                                }
                                            }
                                        }
                                    }
                                },
                                \\"resolvedCallbacks\\": {}
                            }"
                        `);
                    });

                    test("should add validation when creating a node with a required relationship through a nested mutation", async () => {
                        const typeDefs = gql`
                            type Address {
                                street: String!
                            }

                            type Director {
                                id: ID!
                                address: Address! @relationship(type: "HAS_ADDRESS", direction: OUT)
                            }

                            type Movie {
                                id: ID!
                                director: Director! @relationship(type: "DIRECTED", direction: IN)
                            }
                        `;

                        const neoSchema = new Neo4jGraphQL({ typeDefs });

                        const movieId = "movieId-4";
                        const directorId = "directorId-3";

                        const mutation = gql`
                        mutation {
                            updateMovies(
                              where: { id: "${movieId}" }
                              update: { director: { create: { node: { id: "${directorId}" } } } }
                            ) {
                              info {
                                nodesCreated
                              }
                            }
                        }
                    `;

                        const result = await translateQuery(neoSchema, mutation, {
                            req: createJwtRequest("secret", {}),
                        });

                        expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
                            "MATCH (this:\`Movie\`)
                            WHERE this.id = $param0
                            WITH this
                            CREATE (this_director0_create0_node:Director)
                            SET this_director0_create0_node.id = $this_director0_create0_node_id
                            MERGE (this)<-[:DIRECTED]-(this_director0_create0_node)
                            WITH this, this_director0_create0_node
                            CALL {
                            	WITH this_director0_create0_node
                            	MATCH (this_director0_create0_node)-[this_director0_create0_node_address_Address_unique:HAS_ADDRESS]->(:Address)
                            	WITH count(this_director0_create0_node_address_Address_unique) as c
                            	CALL apoc.util.validate(NOT (c = 1), '@neo4j/graphql/RELATIONSHIP-REQUIREDDirector.address required', [0])
                            	RETURN c AS this_director0_create0_node_address_Address_unique_ignored
                            }
                            WITH this
                            CALL {
                            	WITH this
                            	MATCH (this)<-[this_director_Director_unique:DIRECTED]-(:Director)
                            	WITH count(this_director_Director_unique) as c
                            	CALL apoc.util.validate(NOT (c = 1), '@neo4j/graphql/RELATIONSHIP-REQUIREDMovie.director required', [0])
                            	RETURN c AS this_director_Director_unique_ignored
                            }
                            RETURN 'Query cannot conclude with CALL'"
                        `);

                        expect(formatParams(result.params)).toMatchInlineSnapshot(`
                            "{
                                \\"param0\\": \\"movieId-4\\",
                                \\"this_director0_create0_node_id\\": \\"directorId-3\\",
                                \\"resolvedCallbacks\\": {}
                            }"
                        `);
                    });
                });
            });

            describe("delete", () => {
                describe("nested mutations", () => {
                    test("should add validation when deleting a required relationship", async () => {
                        const typeDefs = gql`
                            type Address {
                                id: ID!
                            }

                            type Director {
                                id: ID!
                                address: Address! @relationship(type: "HAS_ADDRESS", direction: OUT)
                            }

                            type CoDirector {
                                id: ID!
                            }

                            type Movie {
                                id: ID!
                                director: Director! @relationship(type: "DIRECTED", direction: IN)
                                coDirector: CoDirector @relationship(type: "CO_DIRECTED", direction: IN)
                            }
                        `;

                        const neoSchema = new Neo4jGraphQL({ typeDefs });

                        const movieId = "movieId-4";
                        const directorId = "directorId-3";

                        const mutation = gql`
                            mutation {
                                updateMovies(
                                    where: { id: "${movieId}" },
                                    delete: {
                                        director: {
                                            where: { node: { id: "${directorId}" } },
                                            delete: { address: { where: { node: { id: "some-address" } } } }
                                        }
                                    }
                                ) {
                                    info {
                                        nodesCreated
                                    }
                                }
                            }
                        `;

                        const result = await translateQuery(neoSchema, mutation, {
                            req: createJwtRequest("secret", {}),
                        });

                        expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
                            "MATCH (this:\`Movie\`)
                            WHERE this.id = $param0
                            WITH this
                            OPTIONAL MATCH (this)<-[this_delete_director0_relationship:DIRECTED]-(this_delete_director0:Director)
                            WHERE this_delete_director0.id = $updateMovies_args_delete_director_where_Directorparam0
                            WITH this, this_delete_director0
                            OPTIONAL MATCH (this_delete_director0)-[this_delete_director0_address0_relationship:HAS_ADDRESS]->(this_delete_director0_address0:Address)
                            WHERE this_delete_director0_address0.id = $updateMovies_args_delete_director_delete_address_where_Addressparam0
                            WITH this, this_delete_director0, collect(DISTINCT this_delete_director0_address0) AS this_delete_director0_address0_to_delete
                            CALL {
                            	WITH this_delete_director0_address0_to_delete
                            	UNWIND this_delete_director0_address0_to_delete AS x
                            	DETACH DELETE x
                            	RETURN count(*) AS _
                            }
                            WITH this, collect(DISTINCT this_delete_director0) AS this_delete_director0_to_delete
                            CALL {
                            	WITH this_delete_director0_to_delete
                            	UNWIND this_delete_director0_to_delete AS x
                            	DETACH DELETE x
                            	RETURN count(*) AS _
                            }
                            WITH *
                            WITH *
                            CALL {
                            	WITH this
                            	MATCH (this)<-[this_director_Director_unique:DIRECTED]-(:Director)
                            	WITH count(this_director_Director_unique) as c
                            	CALL apoc.util.validate(NOT (c = 1), '@neo4j/graphql/RELATIONSHIP-REQUIREDMovie.director required', [0])
                            	RETURN c AS this_director_Director_unique_ignored
                            }
                            CALL {
                            	WITH this
                            	MATCH (this)<-[this_coDirector_CoDirector_unique:CO_DIRECTED]-(:CoDirector)
                            	WITH count(this_coDirector_CoDirector_unique) as c
                            	CALL apoc.util.validate(NOT (c <= 1), '@neo4j/graphql/RELATIONSHIP-REQUIREDMovie.coDirector must be less than or equal to one', [0])
                            	RETURN c AS this_coDirector_CoDirector_unique_ignored
                            }
                            RETURN 'Query cannot conclude with CALL'"
                        `);

                        expect(formatParams(result.params)).toMatchInlineSnapshot(`
                            "{
                                \\"param0\\": \\"movieId-4\\",
                                \\"updateMovies_args_delete_director_where_Directorparam0\\": \\"directorId-3\\",
                                \\"updateMovies_args_delete_director_delete_address_where_Addressparam0\\": \\"some-address\\",
                                \\"updateMovies\\": {
                                    \\"args\\": {
                                        \\"delete\\": {
                                            \\"director\\": {
                                                \\"where\\": {
                                                    \\"node\\": {
                                                        \\"id\\": \\"directorId-3\\"
                                                    }
                                                },
                                                \\"delete\\": {
                                                    \\"address\\": {
                                                        \\"where\\": {
                                                            \\"node\\": {
                                                                \\"id\\": \\"some-address\\"
                                                            }
                                                        }
                                                    }
                                                }
                                            }
                                        }
                                    }
                                },
                                \\"resolvedCallbacks\\": {}
                            }"
                        `);
                    });

                    test("should add length validation when deleting a node with a non required relationship", async () => {
                        const typeDefs = gql`
                            type Address {
                                id: ID!
                            }

                            type Director {
                                id: ID!
                                address: Address @relationship(type: "HAS_ADDRESS", direction: OUT)
                            }

                            type CoDirector {
                                id: ID!
                            }

                            type Movie {
                                id: ID!
                                director: Director @relationship(type: "DIRECTED", direction: IN)
                                coDirector: CoDirector @relationship(type: "CO_DIRECTED", direction: IN)
                            }
                        `;

                        const neoSchema = new Neo4jGraphQL({ typeDefs });

                        const movieId = "movieId-4";
                        const directorId = "directorId-3";

                        const mutation = gql`
                            mutation {
                                updateMovies(
                                    where: { id: "${movieId}" },
                                    delete: {
                                        director: {
                                            where: { node: { id: "${directorId}" } },
                                            delete: { address: { where: { node: { id: "some-address" } } } }
                                        }
                                    }
                                ) {
                                    info {
                                        nodesCreated
                                    }
                                }
                            }
                        `;

                        const result = await translateQuery(neoSchema, mutation, {
                            req: createJwtRequest("secret", {}),
                        });

                        expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
                            "MATCH (this:\`Movie\`)
                            WHERE this.id = $param0
                            WITH this
                            OPTIONAL MATCH (this)<-[this_delete_director0_relationship:DIRECTED]-(this_delete_director0:Director)
                            WHERE this_delete_director0.id = $updateMovies_args_delete_director_where_Directorparam0
                            WITH this, this_delete_director0
                            OPTIONAL MATCH (this_delete_director0)-[this_delete_director0_address0_relationship:HAS_ADDRESS]->(this_delete_director0_address0:Address)
                            WHERE this_delete_director0_address0.id = $updateMovies_args_delete_director_delete_address_where_Addressparam0
                            WITH this, this_delete_director0, collect(DISTINCT this_delete_director0_address0) AS this_delete_director0_address0_to_delete
                            CALL {
                            	WITH this_delete_director0_address0_to_delete
                            	UNWIND this_delete_director0_address0_to_delete AS x
                            	DETACH DELETE x
                            	RETURN count(*) AS _
                            }
                            WITH this, collect(DISTINCT this_delete_director0) AS this_delete_director0_to_delete
                            CALL {
                            	WITH this_delete_director0_to_delete
                            	UNWIND this_delete_director0_to_delete AS x
                            	DETACH DELETE x
                            	RETURN count(*) AS _
                            }
                            WITH *
                            WITH *
                            CALL {
                            	WITH this
                            	MATCH (this)<-[this_director_Director_unique:DIRECTED]-(:Director)
                            	WITH count(this_director_Director_unique) as c
                            	CALL apoc.util.validate(NOT (c <= 1), '@neo4j/graphql/RELATIONSHIP-REQUIREDMovie.director must be less than or equal to one', [0])
                            	RETURN c AS this_director_Director_unique_ignored
                            }
                            CALL {
                            	WITH this
                            	MATCH (this)<-[this_coDirector_CoDirector_unique:CO_DIRECTED]-(:CoDirector)
                            	WITH count(this_coDirector_CoDirector_unique) as c
                            	CALL apoc.util.validate(NOT (c <= 1), '@neo4j/graphql/RELATIONSHIP-REQUIREDMovie.coDirector must be less than or equal to one', [0])
                            	RETURN c AS this_coDirector_CoDirector_unique_ignored
                            }
                            RETURN 'Query cannot conclude with CALL'"
                        `);

                        expect(formatParams(result.params)).toMatchInlineSnapshot(`
                            "{
                                \\"param0\\": \\"movieId-4\\",
                                \\"updateMovies_args_delete_director_where_Directorparam0\\": \\"directorId-3\\",
                                \\"updateMovies_args_delete_director_delete_address_where_Addressparam0\\": \\"some-address\\",
                                \\"updateMovies\\": {
                                    \\"args\\": {
                                        \\"delete\\": {
                                            \\"director\\": {
                                                \\"where\\": {
                                                    \\"node\\": {
                                                        \\"id\\": \\"directorId-3\\"
                                                    }
                                                },
                                                \\"delete\\": {
                                                    \\"address\\": {
                                                        \\"where\\": {
                                                            \\"node\\": {
                                                                \\"id\\": \\"some-address\\"
                                                            }
                                                        }
                                                    }
                                                }
                                            }
                                        }
                                    }
                                },
                                \\"resolvedCallbacks\\": {}
                            }"
                        `);
                    });
                });
            });

            describe("connect", () => {
                test("should add validation when connecting to a required relationship", async () => {
                    const typeDefs = gql`
                        type Director {
                            id: ID!
                        }

                        type Movie {
                            id: ID!
                            director: Director! @relationship(type: "DIRECTED", direction: IN)
                        }
                    `;

                    const neoSchema = new Neo4jGraphQL({ typeDefs });

                    const movieId = "movieId-4";
                    const directorId = "directorId-4";

                    const mutation = gql`
                        mutation {
                            createMovies(input: [{ id: "${movieId}", director: { connect: { where: { node: { id: "${directorId}" } } } } }]) {
                                info {
                                    nodesCreated
                                }
                            }
                        }
                    `;

                    const result = await translateQuery(neoSchema, mutation, {
                        req: createJwtRequest("secret", {}),
                    });

                    expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
                        "CALL {
                        CREATE (this0:Movie)
                        SET this0.id = $this0_id
                        WITH this0
                        CALL {
                        	WITH this0
                        	OPTIONAL MATCH (this0_director_connect0_node:Director)
                        	WHERE this0_director_connect0_node.id = $this0_director_connect0_node_param0
                        	CALL {
                        		WITH *
                        		WITH collect(this0_director_connect0_node) as connectedNodes, collect(this0) as parentNodes
                        		CALL {
                        			WITH connectedNodes, parentNodes
                        			UNWIND parentNodes as this0
                        			UNWIND connectedNodes as this0_director_connect0_node
                        			MERGE (this0)<-[:DIRECTED]-(this0_director_connect0_node)
                        			RETURN count(*) AS _
                        		}
                        		RETURN count(*) AS _
                        	}
                        WITH this0, this0_director_connect0_node
                        	RETURN count(*) AS connect_this0_director_connect_Director
                        }
                        WITH this0
                        CALL {
                        	WITH this0
                        	MATCH (this0)<-[this0_director_Director_unique:DIRECTED]-(:Director)
                        	WITH count(this0_director_Director_unique) as c
                        	CALL apoc.util.validate(NOT (c = 1), '@neo4j/graphql/RELATIONSHIP-REQUIREDMovie.director required', [0])
                        	RETURN c AS this0_director_Director_unique_ignored
                        }
                        RETURN this0
                        }
                        RETURN 'Query cannot conclude with CALL'"
                    `);

                    expect(formatParams(result.params)).toMatchInlineSnapshot(`
                        "{
                            \\"this0_id\\": \\"movieId-4\\",
                            \\"this0_director_connect0_node_param0\\": \\"directorId-4\\",
                            \\"resolvedCallbacks\\": {}
                        }"
                    `);
                });

                test("should add length validation when connecting to a non required relationship", async () => {
                    const typeDefs = gql`
                        type Director {
                            id: ID!
                        }

                        type Movie {
                            id: ID!
                            director: Director @relationship(type: "DIRECTED", direction: IN)
                        }
                    `;

                    const neoSchema = new Neo4jGraphQL({ typeDefs });

                    const movieId = "movieId-4";
                    const directorId = "directorId-4";

                    const mutation = gql`
                        mutation {
                            createMovies(input: [{ id: "${movieId}", director: { connect: { where: { node: { id: "${directorId}" } } } } }]) {
                                info {
                                    nodesCreated
                                }
                            }
                        }
                    `;

                    const result = await translateQuery(neoSchema, mutation, {
                        req: createJwtRequest("secret", {}),
                    });

                    expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
                        "CALL {
                        CREATE (this0:Movie)
                        SET this0.id = $this0_id
                        WITH this0
                        CALL {
                        	WITH this0
                        	OPTIONAL MATCH (this0_director_connect0_node:Director)
                        	WHERE this0_director_connect0_node.id = $this0_director_connect0_node_param0
                        	CALL {
                        		WITH *
                        		WITH collect(this0_director_connect0_node) as connectedNodes, collect(this0) as parentNodes
                        		CALL {
                        			WITH connectedNodes, parentNodes
                        			UNWIND parentNodes as this0
                        			UNWIND connectedNodes as this0_director_connect0_node
                        			MERGE (this0)<-[:DIRECTED]-(this0_director_connect0_node)
                        			RETURN count(*) AS _
                        		}
                        		RETURN count(*) AS _
                        	}
                        WITH this0, this0_director_connect0_node
                        	RETURN count(*) AS connect_this0_director_connect_Director
                        }
                        WITH this0
                        CALL {
                        	WITH this0
                        	MATCH (this0)<-[this0_director_Director_unique:DIRECTED]-(:Director)
                        	WITH count(this0_director_Director_unique) as c
                        	CALL apoc.util.validate(NOT (c <= 1), '@neo4j/graphql/RELATIONSHIP-REQUIREDMovie.director must be less than or equal to one', [0])
                        	RETURN c AS this0_director_Director_unique_ignored
                        }
                        RETURN this0
                        }
                        RETURN 'Query cannot conclude with CALL'"
                    `);

                    expect(formatParams(result.params)).toMatchInlineSnapshot(`
                        "{
                            \\"this0_id\\": \\"movieId-4\\",
                            \\"this0_director_connect0_node_param0\\": \\"directorId-4\\",
                            \\"resolvedCallbacks\\": {}
                        }"
                    `);
                });

                describe("nested mutations", () => {
                    test("should add validation when connecting to a required relationship", async () => {
                        const typeDefs = gql`
                            type Address {
                                street: String!
                            }

                            type Director {
                                id: ID!
                                address: Address! @relationship(type: "HAS_ADDRESS", direction: OUT)
                            }

                            type Movie {
                                id: ID!
                                director: Director! @relationship(type: "DIRECTED", direction: IN)
                            }
                        `;

                        const neoSchema = new Neo4jGraphQL({ typeDefs });

                        const movieId = "movieId-4";
                        const directorId = "directorId-4";

                        const mutation = gql`
                            mutation {
                                createMovies(
                                  input: [
                                    {
                                      id: "${movieId}"
                                      director: {
                                        connect: {
                                          where: { node: { id: "${directorId}" } }
                                          connect: { address: { where: { node: { street: "some-street" } } } }
                                        }
                                      }
                                    }
                                  ]
                                ) {
                                  info {
                                    nodesCreated
                                  }
                                }
                            }
                        `;

                        const result = await translateQuery(neoSchema, mutation, {
                            req: createJwtRequest("secret", {}),
                        });

                        expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
                            "CALL {
                            CREATE (this0:Movie)
                            SET this0.id = $this0_id
                            WITH this0
                            CALL {
                            	WITH this0
                            	OPTIONAL MATCH (this0_director_connect0_node:Director)
                            	WHERE this0_director_connect0_node.id = $this0_director_connect0_node_param0
                            	CALL {
                            		WITH *
                            		WITH collect(this0_director_connect0_node) as connectedNodes, collect(this0) as parentNodes
                            		CALL {
                            			WITH connectedNodes, parentNodes
                            			UNWIND parentNodes as this0
                            			UNWIND connectedNodes as this0_director_connect0_node
                            			MERGE (this0)<-[:DIRECTED]-(this0_director_connect0_node)
                            			RETURN count(*) AS _
                            		}
                            		RETURN count(*) AS _
                            	}
                            WITH this0, this0_director_connect0_node
                            CALL {
                            	WITH this0, this0_director_connect0_node
                            	OPTIONAL MATCH (this0_director_connect0_node_address0_node:Address)
                            	WHERE this0_director_connect0_node_address0_node.street = $this0_director_connect0_node_address0_node_param0
                            	CALL {
                            		WITH *
                            		WITH this0, collect(this0_director_connect0_node_address0_node) as connectedNodes, collect(this0_director_connect0_node) as parentNodes
                            		CALL {
                            			WITH connectedNodes, parentNodes
                            			UNWIND parentNodes as this0_director_connect0_node
                            			UNWIND connectedNodes as this0_director_connect0_node_address0_node
                            			MERGE (this0_director_connect0_node)-[:HAS_ADDRESS]->(this0_director_connect0_node_address0_node)
                            			RETURN count(*) AS _
                            		}
                            		RETURN count(*) AS _
                            	}
                            	WITH this0, this0_director_connect0_node, this0_director_connect0_node_address0_node
                            CALL {
                            	WITH this0_director_connect0_node
                            	MATCH (this0_director_connect0_node)-[this0_director_connect0_node_address_Address_unique:HAS_ADDRESS]->(:Address)
                            	WITH count(this0_director_connect0_node_address_Address_unique) as c
                            	CALL apoc.util.validate(NOT (c = 1), '@neo4j/graphql/RELATIONSHIP-REQUIREDDirector.address required', [0])
                            	RETURN c AS this0_director_connect0_node_address_Address_unique_ignored
                            }
                            WITH this0, this0_director_connect0_node, this0_director_connect0_node_address0_node
                            	RETURN count(*) AS connect_this0_director_connect0_node_address_Address
                            }
                            	RETURN count(*) AS connect_this0_director_connect_Director
                            }
                            WITH this0
                            CALL {
                            	WITH this0
                            	MATCH (this0)<-[this0_director_Director_unique:DIRECTED]-(:Director)
                            	WITH count(this0_director_Director_unique) as c
                            	CALL apoc.util.validate(NOT (c = 1), '@neo4j/graphql/RELATIONSHIP-REQUIREDMovie.director required', [0])
                            	RETURN c AS this0_director_Director_unique_ignored
                            }
                            RETURN this0
                            }
                            RETURN 'Query cannot conclude with CALL'"
                        `);

                        expect(formatParams(result.params)).toMatchInlineSnapshot(`
                            "{
                                \\"this0_id\\": \\"movieId-4\\",
                                \\"this0_director_connect0_node_param0\\": \\"directorId-4\\",
                                \\"this0_director_connect0_node_address0_node_param0\\": \\"some-street\\",
                                \\"resolvedCallbacks\\": {}
                            }"
                        `);
                    });
                });
            });

            describe("disconnect", () => {
                test("should add validation when disconnecting from a required relationship", async () => {
                    const typeDefs = gql`
                        type Director {
                            id: ID!
                        }

                        type Movie {
                            id: ID!
                            director: Director! @relationship(type: "DIRECTED", direction: IN)
                        }
                    `;

                    const neoSchema = new Neo4jGraphQL({ typeDefs });

                    const movieId = "movieId-5";
                    const directorId = "directorId-5";

                    const mutation = gql`
                        mutation {
                            updateMovies(where: { id: "${movieId}" }, disconnect: { director: { where: { node: {  id: "${directorId}" } } } }) {
                                info {
                                    nodesCreated
                                }
                            }
                        }
                    `;

                    const result = await translateQuery(neoSchema, mutation, {
                        req: createJwtRequest("secret", {}),
                    });

                    expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
                        "MATCH (this:\`Movie\`)
                        WHERE this.id = $param0
                        WITH this
                        CALL {
                        WITH this
                        OPTIONAL MATCH (this)<-[this_disconnect_director0_rel:DIRECTED]-(this_disconnect_director0:Director)
                        WHERE this_disconnect_director0.id = $updateMovies_args_disconnect_director_where_Directorparam0
                        CALL {
                        	WITH this_disconnect_director0, this_disconnect_director0_rel, this
                        	WITH collect(this_disconnect_director0) as this_disconnect_director0, this_disconnect_director0_rel, this
                        	UNWIND this_disconnect_director0 as x
                        	DELETE this_disconnect_director0_rel
                        	RETURN count(*) AS _
                        }
                        RETURN count(*) AS disconnect_this_disconnect_director_Director
                        }
                        WITH *
                        WITH *
                        CALL {
                        	WITH this
                        	MATCH (this)<-[this_director_Director_unique:DIRECTED]-(:Director)
                        	WITH count(this_director_Director_unique) as c
                        	CALL apoc.util.validate(NOT (c = 1), '@neo4j/graphql/RELATIONSHIP-REQUIREDMovie.director required', [0])
                        	RETURN c AS this_director_Director_unique_ignored
                        }
                        RETURN 'Query cannot conclude with CALL'"
                    `);

                    expect(formatParams(result.params)).toMatchInlineSnapshot(`
                        "{
                            \\"param0\\": \\"movieId-5\\",
                            \\"updateMovies_args_disconnect_director_where_Directorparam0\\": \\"directorId-5\\",
                            \\"updateMovies\\": {
                                \\"args\\": {
                                    \\"disconnect\\": {
                                        \\"director\\": {
                                            \\"where\\": {
                                                \\"node\\": {
                                                    \\"id\\": \\"directorId-5\\"
                                                }
                                            }
                                        }
                                    }
                                }
                            },
                            \\"resolvedCallbacks\\": {}
                        }"
                    `);
                });
            });

            describe("reconnect", () => {
                test("should add validation after disconnecting and connecting with a required relationship", async () => {
                    const typeDefs = gql`
                        type Director {
                            id: ID!
                        }

                        type Movie {
                            id: ID!
                            director: Director! @relationship(type: "DIRECTED", direction: IN)
                        }
                    `;

                    const neoSchema = new Neo4jGraphQL({ typeDefs });

                    const movieId = "movieId-6";
                    const directorId1 = "directorId-6";
                    const directorId2 = "directorId2-6";

                    const mutation = gql`
                        mutation {
                            updateMovies(
                                where: { id: "${movieId}" },
                                disconnect: {
                                    director: { where: { node: { id: "${directorId1}" } } }
                                }
                                connect: {
                                    director: { where: { node: { id: "${directorId2}" } } }
                                }
                            ) {
                                movies {
                                    id
                                    director {
                                        id
                                    }
                                }
                            }
                        }
                    `;

                    const result = await translateQuery(neoSchema, mutation, {
                        req: createJwtRequest("secret", {}),
                    });

                    expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
                        "MATCH (this:\`Movie\`)
                        WHERE this.id = $param0
                        WITH this
                        CALL {
                        	WITH this
                        	OPTIONAL MATCH (this_connect_director0_node:Director)
                        	WHERE this_connect_director0_node.id = $this_connect_director0_node_param0
                        	CALL {
                        		WITH *
                        		WITH collect(this_connect_director0_node) as connectedNodes, collect(this) as parentNodes
                        		CALL {
                        			WITH connectedNodes, parentNodes
                        			UNWIND parentNodes as this
                        			UNWIND connectedNodes as this_connect_director0_node
                        			MERGE (this)<-[:DIRECTED]-(this_connect_director0_node)
                        			RETURN count(*) AS _
                        		}
                        		RETURN count(*) AS _
                        	}
                        WITH this, this_connect_director0_node
                        	RETURN count(*) AS connect_this_connect_director_Director
                        }
                        WITH this
                        CALL {
                        WITH this
                        OPTIONAL MATCH (this)<-[this_disconnect_director0_rel:DIRECTED]-(this_disconnect_director0:Director)
                        WHERE this_disconnect_director0.id = $updateMovies_args_disconnect_director_where_Directorparam0
                        CALL {
                        	WITH this_disconnect_director0, this_disconnect_director0_rel, this
                        	WITH collect(this_disconnect_director0) as this_disconnect_director0, this_disconnect_director0_rel, this
                        	UNWIND this_disconnect_director0 as x
                        	DELETE this_disconnect_director0_rel
                        	RETURN count(*) AS _
                        }
                        RETURN count(*) AS disconnect_this_disconnect_director_Director
                        }
                        WITH *
                        CALL {
                            WITH this
                            MATCH (this_director:\`Director\`)-[update_this0:DIRECTED]->(this)
                            WITH this_director { .id } AS this_director
                            RETURN head(collect(this_director)) AS this_director
                        }
                        WITH *
                        CALL {
                        	WITH this
                        	MATCH (this)<-[this_director_Director_unique:DIRECTED]-(:Director)
                        	WITH count(this_director_Director_unique) as c
                        	CALL apoc.util.validate(NOT (c = 1), '@neo4j/graphql/RELATIONSHIP-REQUIREDMovie.director required', [0])
                        	RETURN c AS this_director_Director_unique_ignored
                        }
                        RETURN collect(DISTINCT this { .id, director: this_director }) AS data"
                    `);

                    expect(formatParams(result.params)).toMatchInlineSnapshot(`
                        "{
                            \\"param0\\": \\"movieId-6\\",
                            \\"updateMovies_args_disconnect_director_where_Directorparam0\\": \\"directorId-6\\",
                            \\"this_connect_director0_node_param0\\": \\"directorId2-6\\",
                            \\"updateMovies\\": {
                                \\"args\\": {
                                    \\"disconnect\\": {
                                        \\"director\\": {
                                            \\"where\\": {
                                                \\"node\\": {
                                                    \\"id\\": \\"directorId-6\\"
                                                }
                                            }
                                        }
                                    }
                                }
                            },
                            \\"resolvedCallbacks\\": {}
                        }"
                    `);
                });

                test("should add validation after disconnecting and connecting with a non required relationship", async () => {
                    const typeDefs = gql`
                        type Director {
                            id: ID!
                        }

                        type Movie {
                            id: ID!
                            director: Director @relationship(type: "DIRECTED", direction: IN)
                        }
                    `;

                    const neoSchema = new Neo4jGraphQL({ typeDefs });

                    const movieId = "movieId-6";
                    const directorId1 = "directorId-6";
                    const directorId2 = "directorId2-6";

                    const mutation = gql`
                        mutation {
                            updateMovies(
                                where: { id: "${movieId}" },
                                disconnect: {
                                    director: { where: { node: { id: "${directorId1}" } } }
                                }
                                connect: {
                                    director: { where: { node: { id: "${directorId2}" } } }
                                }
                            ) {
                                movies {
                                    id
                                    director {
                                        id
                                    }
                                }
                            }
                        }
                    `;

                    const result = await translateQuery(neoSchema, mutation, {
                        req: createJwtRequest("secret", {}),
                    });

                    expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
                        "MATCH (this:\`Movie\`)
                        WHERE this.id = $param0
                        WITH this
                        CALL {
                        	WITH this
                        	OPTIONAL MATCH (this_connect_director0_node:Director)
                        	WHERE this_connect_director0_node.id = $this_connect_director0_node_param0
                        	CALL {
                        		WITH *
                        		WITH collect(this_connect_director0_node) as connectedNodes, collect(this) as parentNodes
                        		CALL {
                        			WITH connectedNodes, parentNodes
                        			UNWIND parentNodes as this
                        			UNWIND connectedNodes as this_connect_director0_node
                        			MERGE (this)<-[:DIRECTED]-(this_connect_director0_node)
                        			RETURN count(*) AS _
                        		}
                        		RETURN count(*) AS _
                        	}
                        WITH this, this_connect_director0_node
                        	RETURN count(*) AS connect_this_connect_director_Director
                        }
                        WITH this
                        CALL {
                        WITH this
                        OPTIONAL MATCH (this)<-[this_disconnect_director0_rel:DIRECTED]-(this_disconnect_director0:Director)
                        WHERE this_disconnect_director0.id = $updateMovies_args_disconnect_director_where_Directorparam0
                        CALL {
                        	WITH this_disconnect_director0, this_disconnect_director0_rel, this
                        	WITH collect(this_disconnect_director0) as this_disconnect_director0, this_disconnect_director0_rel, this
                        	UNWIND this_disconnect_director0 as x
                        	DELETE this_disconnect_director0_rel
                        	RETURN count(*) AS _
                        }
                        RETURN count(*) AS disconnect_this_disconnect_director_Director
                        }
                        WITH *
                        CALL {
                            WITH this
                            MATCH (this_director:\`Director\`)-[update_this0:DIRECTED]->(this)
                            WITH this_director { .id } AS this_director
                            RETURN head(collect(this_director)) AS this_director
                        }
                        WITH *
                        CALL {
                        	WITH this
                        	MATCH (this)<-[this_director_Director_unique:DIRECTED]-(:Director)
                        	WITH count(this_director_Director_unique) as c
                        	CALL apoc.util.validate(NOT (c <= 1), '@neo4j/graphql/RELATIONSHIP-REQUIREDMovie.director must be less than or equal to one', [0])
                        	RETURN c AS this_director_Director_unique_ignored
                        }
                        RETURN collect(DISTINCT this { .id, director: this_director }) AS data"
                    `);

                    expect(formatParams(result.params)).toMatchInlineSnapshot(`
                        "{
                            \\"param0\\": \\"movieId-6\\",
                            \\"updateMovies_args_disconnect_director_where_Directorparam0\\": \\"directorId-6\\",
                            \\"this_connect_director0_node_param0\\": \\"directorId2-6\\",
                            \\"updateMovies\\": {
                                \\"args\\": {
                                    \\"disconnect\\": {
                                        \\"director\\": {
                                            \\"where\\": {
                                                \\"node\\": {
                                                    \\"id\\": \\"directorId-6\\"
                                                }
                                            }
                                        }
                                    }
                                }
                            },
                            \\"resolvedCallbacks\\": {}
                        }"
                    `);
                });
            });
        });
    });
});
