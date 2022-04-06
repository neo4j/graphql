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
import { Neo4jGraphQL } from "../../../../src";
import { createJwtRequest } from "../../../utils/create-jwt-request";
import { formatCypher, translateQuery, formatParams } from "../../utils/tck-test-utils";

describe("integration/rfs/003", () => {
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
                    "CALL {
                    CREATE (this0:Movie)
                    SET this0.id = $this0_id
                    WITH this0
                    CALL {
                    	WITH this0
                    	MATCH (this0)<-[this0_director_Director_unique:DIRECTED]-(:Director)
                    	WITH count(this0_director_Director_unique) as c
                    	CALL apoc.util.validate(NOT(c = 1), '@neo4j/graphql/RELATIONSHIP-REQUIREDMovie.director required', [0])
                    	RETURN c AS this0_director_Director_unique_ignored
                    }
                    RETURN this0
                    }
                    RETURN 'Query cannot conclude with CALL'"
                `);

                expect(formatParams(result.params)).toMatchInlineSnapshot(`
                    "{
                        \\"this0_id\\": \\"movieId-1\\",
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
                    "CALL {
                    CREATE (this0:Movie)
                    SET this0.id = $this0_id
                    WITH this0
                    CALL {
                    	WITH this0
                    	MATCH (this0)<-[this0_director_Director_unique:DIRECTED]-(:Director)
                    	WITH count(this0_director_Director_unique) as c
                    	CALL apoc.util.validate(NOT(c <= 1), '@neo4j/graphql/RELATIONSHIP-REQUIREDMovie.director must be less than or equal to one', [0])
                    	RETURN c AS this0_director_Director_unique_ignored
                    }
                    RETURN this0
                    }
                    RETURN 'Query cannot conclude with CALL'"
                `);

                expect(formatParams(result.params)).toMatchInlineSnapshot(`
                    "{
                        \\"this0_id\\": \\"movieId-1\\",
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
                        "CALL {
                        CREATE (this0:Movie)
                        SET this0.id = $this0_id
                        WITH this0
                        CREATE (this0_director0_node:Director)
                        SET this0_director0_node.id = $this0_director0_node_id
                        MERGE (this0)<-[:DIRECTED]-(this0_director0_node)
                        WITH this0, this0_director0_node
                        CALL {
                        	WITH this0_director0_node
                        	MATCH (this0_director0_node)-[this0_director0_node_address_Address_unique:HAS_ADDRESS]->(:Address)
                        	WITH count(this0_director0_node_address_Address_unique) as c
                        	CALL apoc.util.validate(NOT(c = 1), '@neo4j/graphql/RELATIONSHIP-REQUIREDDirector.address required', [0])
                        	RETURN c AS this0_director0_node_address_Address_unique_ignored
                        }
                        WITH this0
                        CALL {
                        	WITH this0
                        	MATCH (this0)<-[this0_director_Director_unique:DIRECTED]-(:Director)
                        	WITH count(this0_director_Director_unique) as c
                        	CALL apoc.util.validate(NOT(c = 1), '@neo4j/graphql/RELATIONSHIP-REQUIREDMovie.director required', [0])
                        	RETURN c AS this0_director_Director_unique_ignored
                        }
                        RETURN this0
                        }
                        RETURN 'Query cannot conclude with CALL'"
                    `);

                    expect(formatParams(result.params)).toMatchInlineSnapshot(`
                        "{
                            \\"this0_id\\": \\"movieId-2\\",
                            \\"this0_director0_node_id\\": \\"directorId-2\\",
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
                        "CALL {
                        CREATE (this0:Movie)
                        SET this0.id = $this0_id
                        WITH this0
                        CREATE (this0_director0_node:Director)
                        SET this0_director0_node.id = $this0_director0_node_id
                        MERGE (this0)<-[:DIRECTED]-(this0_director0_node)
                        WITH this0, this0_director0_node
                        CALL {
                        	WITH this0_director0_node
                        	MATCH (this0_director0_node)-[this0_director0_node_address_Address_unique:HAS_ADDRESS]->(:Address)
                        	WITH count(this0_director0_node_address_Address_unique) as c
                        	CALL apoc.util.validate(NOT(c <= 1), '@neo4j/graphql/RELATIONSHIP-REQUIREDDirector.address must be less than or equal to one', [0])
                        	RETURN c AS this0_director0_node_address_Address_unique_ignored
                        }
                        WITH this0
                        CALL {
                        	WITH this0
                        	MATCH (this0)<-[this0_director_Director_unique:DIRECTED]-(:Director)
                        	WITH count(this0_director_Director_unique) as c
                        	CALL apoc.util.validate(NOT(c <= 1), '@neo4j/graphql/RELATIONSHIP-REQUIREDMovie.director must be less than or equal to one', [0])
                        	RETURN c AS this0_director_Director_unique_ignored
                        }
                        RETURN this0
                        }
                        RETURN 'Query cannot conclude with CALL'"
                    `);

                    expect(formatParams(result.params)).toMatchInlineSnapshot(`
                        "{
                            \\"this0_id\\": \\"movieId-2\\",
                            \\"this0_director0_node_id\\": \\"directorId-2\\",
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
                        "MATCH (this:Movie)
                        WHERE this.id = $this_id
                        SET this.id = $this_update_id
                        WITH this
                        CALL {
                        	WITH this
                        	MATCH (this)<-[this_director_Director_unique:DIRECTED]-(:Director)
                        	WITH count(this_director_Director_unique) as c
                        	CALL apoc.util.validate(NOT(c = 1), '@neo4j/graphql/RELATIONSHIP-REQUIREDMovie.director required', [0])
                        	RETURN c AS this_director_Director_unique_ignored
                        }
                        RETURN 'Query cannot conclude with CALL'"
                    `);

                    expect(formatParams(result.params)).toMatchInlineSnapshot(`
                        "{
                            \\"this_id\\": \\"movieId-3\\",
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
                        "MATCH (this:Movie)
                        WHERE this.id = $this_id
                        SET this.id = $this_update_id
                        WITH this
                        CALL {
                        	WITH this
                        	MATCH (this)<-[this_director_Director_unique:DIRECTED]-(:Director)
                        	WITH count(this_director_Director_unique) as c
                        	CALL apoc.util.validate(NOT(c <= 1), '@neo4j/graphql/RELATIONSHIP-REQUIREDMovie.director must be less than or equal to one', [0])
                        	RETURN c AS this_director_Director_unique_ignored
                        }
                        RETURN 'Query cannot conclude with CALL'"
                    `);

                    expect(formatParams(result.params)).toMatchInlineSnapshot(`
                        "{
                            \\"this_id\\": \\"movieId-3\\",
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
                            "MATCH (this:Movie)
                            WHERE this.id = $this_id
                            WITH this
                            OPTIONAL MATCH (this)<-[this_directed0_relationship:DIRECTED]-(this_director0:Director)
                            CALL apoc.do.when(this_director0 IS NOT NULL, \\"
                            SET this_director0.id = $this_update_director0_id
                            WITH this, this_director0
                            CALL {
                            	WITH this_director0
                            	MATCH (this_director0)-[this_director0_address_Address_unique:HAS_ADDRESS]->(:Address)
                            	WITH count(this_director0_address_Address_unique) as c
                            	CALL apoc.util.validate(NOT(c = 1), '@neo4j/graphql/RELATIONSHIP-REQUIREDDirector.address required', [0])
                            	RETURN c AS this_director0_address_Address_unique_ignored
                            }
                            RETURN count(*)
                            \\", \\"\\", {this:this, updateMovies: $updateMovies, this_director0:this_director0, auth:$auth,this_update_director0_id:$this_update_director0_id})
                            YIELD value AS _
                            WITH this
                            CALL {
                            	WITH this
                            	MATCH (this)<-[this_director_Director_unique:DIRECTED]-(:Director)
                            	WITH count(this_director_Director_unique) as c
                            	CALL apoc.util.validate(NOT(c = 1), '@neo4j/graphql/RELATIONSHIP-REQUIREDMovie.director required', [0])
                            	RETURN c AS this_director_Director_unique_ignored
                            }
                            RETURN 'Query cannot conclude with CALL'"
                        `);

                        expect(formatParams(result.params)).toMatchInlineSnapshot(`
                            "{
                                \\"this_id\\": \\"movieId-4\\",
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
                            "MATCH (this:Movie)
                            WHERE this.id = $this_id
                            WITH this
                            OPTIONAL MATCH (this)<-[this_directed0_relationship:DIRECTED]-(this_director0:Director)
                            CALL apoc.do.when(this_director0 IS NOT NULL, \\"
                            SET this_director0.id = $this_update_director0_id
                            WITH this, this_director0
                            CALL {
                            	WITH this_director0
                            	MATCH (this_director0)-[this_director0_address_Address_unique:HAS_ADDRESS]->(:Address)
                            	WITH count(this_director0_address_Address_unique) as c
                            	CALL apoc.util.validate(NOT(c <= 1), '@neo4j/graphql/RELATIONSHIP-REQUIREDDirector.address must be less than or equal to one', [0])
                            	RETURN c AS this_director0_address_Address_unique_ignored
                            }
                            RETURN count(*)
                            \\", \\"\\", {this:this, updateMovies: $updateMovies, this_director0:this_director0, auth:$auth,this_update_director0_id:$this_update_director0_id})
                            YIELD value AS _
                            WITH this
                            CALL {
                            	WITH this
                            	MATCH (this)<-[this_director_Director_unique:DIRECTED]-(:Director)
                            	WITH count(this_director_Director_unique) as c
                            	CALL apoc.util.validate(NOT(c <= 1), '@neo4j/graphql/RELATIONSHIP-REQUIREDMovie.director must be less than or equal to one', [0])
                            	RETURN c AS this_director_Director_unique_ignored
                            }
                            RETURN 'Query cannot conclude with CALL'"
                        `);

                        expect(formatParams(result.params)).toMatchInlineSnapshot(`
                            "{
                                \\"this_id\\": \\"movieId-4\\",
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
                            "MATCH (this:Movie)
                            WHERE this.id = $this_id
                            WITH this
                            CREATE (this_director0_create0_node:Director)
                            SET this_director0_create0_node.id = $this_director0_create0_node_id
                            MERGE (this)<-[:DIRECTED]-(this_director0_create0_node)
                            WITH this, this_director0_create0_node
                            CALL {
                            	WITH this_director0_create0_node
                            	MATCH (this_director0_create0_node)-[this_director0_create0_node_address_Address_unique:HAS_ADDRESS]->(:Address)
                            	WITH count(this_director0_create0_node_address_Address_unique) as c
                            	CALL apoc.util.validate(NOT(c = 1), '@neo4j/graphql/RELATIONSHIP-REQUIREDDirector.address required', [0])
                            	RETURN c AS this_director0_create0_node_address_Address_unique_ignored
                            }
                            WITH this
                            CALL {
                            	WITH this
                            	MATCH (this)<-[this_director_Director_unique:DIRECTED]-(:Director)
                            	WITH count(this_director_Director_unique) as c
                            	CALL apoc.util.validate(NOT(c = 1), '@neo4j/graphql/RELATIONSHIP-REQUIREDMovie.director required', [0])
                            	RETURN c AS this_director_Director_unique_ignored
                            }
                            RETURN 'Query cannot conclude with CALL'"
                        `);

                        expect(formatParams(result.params)).toMatchInlineSnapshot(`
                            "{
                                \\"this_id\\": \\"movieId-4\\",
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
                            "MATCH (this:Movie)
                            WHERE this.id = $this_id
                            WITH this
                            OPTIONAL MATCH (this)<-[this_delete_director0_relationship:DIRECTED]-(this_delete_director0:Director)
                            WHERE this_delete_director0.id = $updateMovies.args.delete.director.where.node.id
                            WITH this, this_delete_director0
                            OPTIONAL MATCH (this_delete_director0)-[this_delete_director0_address0_relationship:HAS_ADDRESS]->(this_delete_director0_address0:Address)
                            WHERE this_delete_director0_address0.id = $updateMovies.args.delete.director.delete.address.where.node.id
                            WITH this, this_delete_director0, collect(DISTINCT this_delete_director0_address0) as this_delete_director0_address0_to_delete
                            FOREACH(x IN this_delete_director0_address0_to_delete | DETACH DELETE x)
                            WITH this, collect(DISTINCT this_delete_director0) as this_delete_director0_to_delete
                            FOREACH(x IN this_delete_director0_to_delete | DETACH DELETE x)
                            WITH this
                            CALL {
                            	WITH this
                            	MATCH (this)<-[this_director_Director_unique:DIRECTED]-(:Director)
                            	WITH count(this_director_Director_unique) as c
                            	CALL apoc.util.validate(NOT(c = 1), '@neo4j/graphql/RELATIONSHIP-REQUIREDMovie.director required', [0])
                            	RETURN c AS this_director_Director_unique_ignored
                            }
                            CALL {
                            	WITH this
                            	MATCH (this)<-[this_coDirector_CoDirector_unique:CO_DIRECTED]-(:CoDirector)
                            	WITH count(this_coDirector_CoDirector_unique) as c
                            	CALL apoc.util.validate(NOT(c <= 1), '@neo4j/graphql/RELATIONSHIP-REQUIREDMovie.coDirector must be less than or equal to one', [0])
                            	RETURN c AS this_coDirector_CoDirector_unique_ignored
                            }
                            RETURN 'Query cannot conclude with CALL'"
                        `);

                        expect(formatParams(result.params)).toMatchInlineSnapshot(`
                            "{
                                \\"this_id\\": \\"movieId-4\\",
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
                            "MATCH (this:Movie)
                            WHERE this.id = $this_id
                            WITH this
                            OPTIONAL MATCH (this)<-[this_delete_director0_relationship:DIRECTED]-(this_delete_director0:Director)
                            WHERE this_delete_director0.id = $updateMovies.args.delete.director.where.node.id
                            WITH this, this_delete_director0
                            OPTIONAL MATCH (this_delete_director0)-[this_delete_director0_address0_relationship:HAS_ADDRESS]->(this_delete_director0_address0:Address)
                            WHERE this_delete_director0_address0.id = $updateMovies.args.delete.director.delete.address.where.node.id
                            WITH this, this_delete_director0, collect(DISTINCT this_delete_director0_address0) as this_delete_director0_address0_to_delete
                            FOREACH(x IN this_delete_director0_address0_to_delete | DETACH DELETE x)
                            WITH this, collect(DISTINCT this_delete_director0) as this_delete_director0_to_delete
                            FOREACH(x IN this_delete_director0_to_delete | DETACH DELETE x)
                            WITH this
                            CALL {
                            	WITH this
                            	MATCH (this)<-[this_director_Director_unique:DIRECTED]-(:Director)
                            	WITH count(this_director_Director_unique) as c
                            	CALL apoc.util.validate(NOT(c <= 1), '@neo4j/graphql/RELATIONSHIP-REQUIREDMovie.director must be less than or equal to one', [0])
                            	RETURN c AS this_director_Director_unique_ignored
                            }
                            CALL {
                            	WITH this
                            	MATCH (this)<-[this_coDirector_CoDirector_unique:CO_DIRECTED]-(:CoDirector)
                            	WITH count(this_coDirector_CoDirector_unique) as c
                            	CALL apoc.util.validate(NOT(c <= 1), '@neo4j/graphql/RELATIONSHIP-REQUIREDMovie.coDirector must be less than or equal to one', [0])
                            	RETURN c AS this_coDirector_CoDirector_unique_ignored
                            }
                            RETURN 'Query cannot conclude with CALL'"
                        `);

                        expect(formatParams(result.params)).toMatchInlineSnapshot(`
                            "{
                                \\"this_id\\": \\"movieId-4\\",
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
                        	WHERE this0_director_connect0_node.id = $this0_director_connect0_node_id
                        	FOREACH(_ IN CASE this0 WHEN NULL THEN [] ELSE [1] END |
                        		FOREACH(_ IN CASE this0_director_connect0_node WHEN NULL THEN [] ELSE [1] END |
                        			MERGE (this0)<-[:DIRECTED]-(this0_director_connect0_node)
                        		)
                        	)
                        	RETURN count(*)
                        }
                        WITH this0
                        CALL {
                        	WITH this0
                        	MATCH (this0)<-[this0_director_Director_unique:DIRECTED]-(:Director)
                        	WITH count(this0_director_Director_unique) as c
                        	CALL apoc.util.validate(NOT(c = 1), '@neo4j/graphql/RELATIONSHIP-REQUIREDMovie.director required', [0])
                        	RETURN c AS this0_director_Director_unique_ignored
                        }
                        RETURN this0
                        }
                        RETURN 'Query cannot conclude with CALL'"
                    `);

                    expect(formatParams(result.params)).toMatchInlineSnapshot(`
                        "{
                            \\"this0_id\\": \\"movieId-4\\",
                            \\"this0_director_connect0_node_id\\": \\"directorId-4\\",
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
                        	WHERE this0_director_connect0_node.id = $this0_director_connect0_node_id
                        	FOREACH(_ IN CASE this0 WHEN NULL THEN [] ELSE [1] END |
                        		FOREACH(_ IN CASE this0_director_connect0_node WHEN NULL THEN [] ELSE [1] END |
                        			MERGE (this0)<-[:DIRECTED]-(this0_director_connect0_node)
                        		)
                        	)
                        	RETURN count(*)
                        }
                        WITH this0
                        CALL {
                        	WITH this0
                        	MATCH (this0)<-[this0_director_Director_unique:DIRECTED]-(:Director)
                        	WITH count(this0_director_Director_unique) as c
                        	CALL apoc.util.validate(NOT(c <= 1), '@neo4j/graphql/RELATIONSHIP-REQUIREDMovie.director must be less than or equal to one', [0])
                        	RETURN c AS this0_director_Director_unique_ignored
                        }
                        RETURN this0
                        }
                        RETURN 'Query cannot conclude with CALL'"
                    `);

                    expect(formatParams(result.params)).toMatchInlineSnapshot(`
                        "{
                            \\"this0_id\\": \\"movieId-4\\",
                            \\"this0_director_connect0_node_id\\": \\"directorId-4\\",
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
                            	WHERE this0_director_connect0_node.id = $this0_director_connect0_node_id
                            	FOREACH(_ IN CASE this0 WHEN NULL THEN [] ELSE [1] END |
                            		FOREACH(_ IN CASE this0_director_connect0_node WHEN NULL THEN [] ELSE [1] END |
                            			MERGE (this0)<-[:DIRECTED]-(this0_director_connect0_node)
                            		)
                            	)
                            WITH this0, this0_director_connect0_node
                            CALL {
                            	WITH this0, this0_director_connect0_node
                            	OPTIONAL MATCH (this0_director_connect0_node_address0_node:Address)
                            	WHERE this0_director_connect0_node_address0_node.street = $this0_director_connect0_node_address0_node_street
                            	FOREACH(_ IN CASE this0_director_connect0_node WHEN NULL THEN [] ELSE [1] END |
                            		FOREACH(_ IN CASE this0_director_connect0_node_address0_node WHEN NULL THEN [] ELSE [1] END |
                            			MERGE (this0_director_connect0_node)-[:HAS_ADDRESS]->(this0_director_connect0_node_address0_node)
                            		)
                            	)
                            	WITH this0, this0_director_connect0_node, this0_director_connect0_node_address0_node
                            CALL {
                            	WITH this0_director_connect0_node
                            	MATCH (this0_director_connect0_node)-[this0_director_connect0_node_address_Address_unique:HAS_ADDRESS]->(:Address)
                            	WITH count(this0_director_connect0_node_address_Address_unique) as c
                            	CALL apoc.util.validate(NOT(c = 1), '@neo4j/graphql/RELATIONSHIP-REQUIREDDirector.address required', [0])
                            	RETURN c AS this0_director_connect0_node_address_Address_unique_ignored
                            }
                            	RETURN count(*)
                            }
                            	RETURN count(*)
                            }
                            WITH this0
                            CALL {
                            	WITH this0
                            	MATCH (this0)<-[this0_director_Director_unique:DIRECTED]-(:Director)
                            	WITH count(this0_director_Director_unique) as c
                            	CALL apoc.util.validate(NOT(c = 1), '@neo4j/graphql/RELATIONSHIP-REQUIREDMovie.director required', [0])
                            	RETURN c AS this0_director_Director_unique_ignored
                            }
                            RETURN this0
                            }
                            RETURN 'Query cannot conclude with CALL'"
                        `);

                        expect(formatParams(result.params)).toMatchInlineSnapshot(`
                            "{
                                \\"this0_id\\": \\"movieId-4\\",
                                \\"this0_director_connect0_node_id\\": \\"directorId-4\\",
                                \\"this0_director_connect0_node_address0_node_street\\": \\"some-street\\",
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
                        "MATCH (this:Movie)
                        WHERE this.id = $this_id
                        WITH this
                        CALL {
                        WITH this
                        OPTIONAL MATCH (this)<-[this_disconnect_director0_rel:DIRECTED]-(this_disconnect_director0:Director)
                        WHERE this_disconnect_director0.id = $updateMovies.args.disconnect.director.where.node.id
                        FOREACH(_ IN CASE this_disconnect_director0 WHEN NULL THEN [] ELSE [1] END |
                        DELETE this_disconnect_director0_rel
                        )
                        RETURN count(*)
                        }
                        WITH this
                        CALL {
                        	WITH this
                        	MATCH (this)<-[this_director_Director_unique:DIRECTED]-(:Director)
                        	WITH count(this_director_Director_unique) as c
                        	CALL apoc.util.validate(NOT(c = 1), '@neo4j/graphql/RELATIONSHIP-REQUIREDMovie.director required', [0])
                        	RETURN c AS this_director_Director_unique_ignored
                        }
                        RETURN 'Query cannot conclude with CALL'"
                    `);

                    expect(formatParams(result.params)).toMatchInlineSnapshot(`
                        "{
                            \\"this_id\\": \\"movieId-5\\",
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
                        "MATCH (this:Movie)
                        WHERE this.id = $this_id
                        WITH this
                        CALL {
                        	WITH this
                        	OPTIONAL MATCH (this_connect_director0_node:Director)
                        	WHERE this_connect_director0_node.id = $this_connect_director0_node_id
                        	FOREACH(_ IN CASE this WHEN NULL THEN [] ELSE [1] END |
                        		FOREACH(_ IN CASE this_connect_director0_node WHEN NULL THEN [] ELSE [1] END |
                        			MERGE (this)<-[:DIRECTED]-(this_connect_director0_node)
                        		)
                        	)
                        	RETURN count(*)
                        }
                        WITH this
                        CALL {
                        WITH this
                        OPTIONAL MATCH (this)<-[this_disconnect_director0_rel:DIRECTED]-(this_disconnect_director0:Director)
                        WHERE this_disconnect_director0.id = $updateMovies.args.disconnect.director.where.node.id
                        FOREACH(_ IN CASE this_disconnect_director0 WHEN NULL THEN [] ELSE [1] END |
                        DELETE this_disconnect_director0_rel
                        )
                        RETURN count(*)
                        }
                        WITH this
                        CALL {
                        	WITH this
                        	MATCH (this)<-[this_director_Director_unique:DIRECTED]-(:Director)
                        	WITH count(this_director_Director_unique) as c
                        	CALL apoc.util.validate(NOT(c = 1), '@neo4j/graphql/RELATIONSHIP-REQUIREDMovie.director required', [0])
                        	RETURN c AS this_director_Director_unique_ignored
                        }
                        RETURN collect(DISTINCT this { .id, director: head([ (this)<-[:DIRECTED]-(this_director:Director)   | this_director { .id } ]) }) AS data"
                    `);

                    expect(formatParams(result.params)).toMatchInlineSnapshot(`
                        "{
                            \\"this_id\\": \\"movieId-6\\",
                            \\"this_connect_director0_node_id\\": \\"directorId2-6\\",
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
                        "MATCH (this:Movie)
                        WHERE this.id = $this_id
                        WITH this
                        CALL {
                        	WITH this
                        	OPTIONAL MATCH (this_connect_director0_node:Director)
                        	WHERE this_connect_director0_node.id = $this_connect_director0_node_id
                        	FOREACH(_ IN CASE this WHEN NULL THEN [] ELSE [1] END |
                        		FOREACH(_ IN CASE this_connect_director0_node WHEN NULL THEN [] ELSE [1] END |
                        			MERGE (this)<-[:DIRECTED]-(this_connect_director0_node)
                        		)
                        	)
                        	RETURN count(*)
                        }
                        WITH this
                        CALL {
                        WITH this
                        OPTIONAL MATCH (this)<-[this_disconnect_director0_rel:DIRECTED]-(this_disconnect_director0:Director)
                        WHERE this_disconnect_director0.id = $updateMovies.args.disconnect.director.where.node.id
                        FOREACH(_ IN CASE this_disconnect_director0 WHEN NULL THEN [] ELSE [1] END |
                        DELETE this_disconnect_director0_rel
                        )
                        RETURN count(*)
                        }
                        WITH this
                        CALL {
                        	WITH this
                        	MATCH (this)<-[this_director_Director_unique:DIRECTED]-(:Director)
                        	WITH count(this_director_Director_unique) as c
                        	CALL apoc.util.validate(NOT(c <= 1), '@neo4j/graphql/RELATIONSHIP-REQUIREDMovie.director must be less than or equal to one', [0])
                        	RETURN c AS this_director_Director_unique_ignored
                        }
                        RETURN collect(DISTINCT this { .id, director: head([ (this)<-[:DIRECTED]-(this_director:Director)   | this_director { .id } ]) }) AS data"
                    `);

                    expect(formatParams(result.params)).toMatchInlineSnapshot(`
                        "{
                            \\"this_id\\": \\"movieId-6\\",
                            \\"this_connect_director0_node_id\\": \\"directorId2-6\\",
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
