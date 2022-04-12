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
import { TestSubscriptionsPlugin } from "../../../utils/TestSubscriptionPlugin";
import { Neo4jGraphQL } from "../../../../src";
import { createJwtRequest } from "../../../utils/create-jwt-request";
import { formatCypher, translateQuery, formatParams } from "../../utils/tck-test-utils";

describe("Subscriptions metadata on create", () => {
    let typeDefs: DocumentNode;
    let neoSchema: Neo4jGraphQL;
    let plugin: TestSubscriptionsPlugin;

    beforeAll(() => {
        plugin = new TestSubscriptionsPlugin();
        typeDefs = gql`
            type Actor {
                name: String!
                movies: [Movie!]! @relationship(type: "ACTED_IN", direction: OUT)
            }

            type Movie {
                id: ID!
                actors: [Actor!]! @relationship(type: "ACTED_IN", direction: IN)
            }
        `;

        neoSchema = new Neo4jGraphQL({
            typeDefs,
            config: { enableRegex: true },
            plugins: {
                subscriptions: plugin,
            } as any,
        });
    });

    test("Simple Create", async () => {
        const query = gql`
            mutation {
                createMovies(input: [{ id: "1" }]) {
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
            "CALL {
            WITH [] AS meta
            CREATE (this0:Movie)
            SET this0.id = $this0_id
            WITH meta + { event: \\"create\\", id: id(this0), properties: { old: null, new: this0 { .* } }, timestamp: timestamp(), typename: \\"Movie\\" } AS meta, this0
            RETURN this0, meta AS this0_meta
            }
            WITH this0, this0_meta AS meta
            RETURN [
            this0 { .id }] AS data, meta"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"this0_id\\": \\"1\\",
                \\"resolvedCallbacks\\": {}
            }"
        `);
    });

    test("Multi Create", async () => {
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
            "CALL {
            WITH [] AS meta
            CREATE (this0:Movie)
            SET this0.id = $this0_id
            WITH meta + { event: \\"create\\", id: id(this0), properties: { old: null, new: this0 { .* } }, timestamp: timestamp(), typename: \\"Movie\\" } AS meta, this0
            RETURN this0, meta AS this0_meta
            }
            CALL {
            WITH [] AS meta
            CREATE (this1:Movie)
            SET this1.id = $this1_id
            WITH meta + { event: \\"create\\", id: id(this1), properties: { old: null, new: this1 { .* } }, timestamp: timestamp(), typename: \\"Movie\\" } AS meta, this1
            RETURN this1, meta AS this1_meta
            }
            WITH this0, this1, this0_meta + this1_meta AS meta
            RETURN [
            this0 { .id },
            this1 { .id }] AS data, meta"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"this0_id\\": \\"1\\",
                \\"this1_id\\": \\"2\\",
                \\"resolvedCallbacks\\": {}
            }"
        `);
    });

    test("Nested Create", async () => {
        const query = gql`
            mutation {
                createMovies(input: [{ id: "1", actors: { create: { node: { name: "Andrés" } } } }]) {
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
            "CALL {
            WITH [] AS meta
            CREATE (this0:Movie)
            SET this0.id = $this0_id
            CREATE (this0_actors0_node:Actor)
            SET this0_actors0_node.name = $this0_actors0_node_name
            WITH meta + { event: \\"create\\", id: id(this0_actors0_node), properties: { old: null, new: this0_actors0_node { .* } }, timestamp: timestamp(), typename: \\"Actor\\" } AS meta, this0, this0_actors0_node
            MERGE (this0)<-[:ACTED_IN]-(this0_actors0_node)
            WITH meta + { event: \\"create\\", id: id(this0), properties: { old: null, new: this0 { .* } }, timestamp: timestamp(), typename: \\"Movie\\" } AS meta, this0
            RETURN this0, meta AS this0_meta
            }
            WITH this0, this0_meta AS meta
            RETURN [
            this0 { .id, actors: [ (this0)<-[:ACTED_IN]-(this0_actors:Actor)   | this0_actors { .name } ] }] AS data, meta"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"this0_id\\": \\"1\\",
                \\"this0_actors0_node_name\\": \\"Andrés\\",
                \\"resolvedCallbacks\\": {}
            }"
        `);
    });

    test("Triple nested Create", async () => {
        const query = gql`
            mutation {
                createMovies(
                    input: [
                        {
                            id: "1"
                            actors: { create: { node: { name: "Andrés", movies: { create: { node: { id: 6 } } } } } }
                        }
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
            "CALL {
            WITH [] AS meta
            CREATE (this0:Movie)
            SET this0.id = $this0_id
            CREATE (this0_actors0_node:Actor)
            SET this0_actors0_node.name = $this0_actors0_node_name
            CREATE (this0_actors0_node_movies0_node:Movie)
            SET this0_actors0_node_movies0_node.id = $this0_actors0_node_movies0_node_id
            WITH meta + { event: \\"create\\", id: id(this0_actors0_node_movies0_node), properties: { old: null, new: this0_actors0_node_movies0_node { .* } }, timestamp: timestamp(), typename: \\"Movie\\" } AS meta, this0, this0_actors0_node, this0_actors0_node_movies0_node
            MERGE (this0_actors0_node)-[:ACTED_IN]->(this0_actors0_node_movies0_node)
            WITH meta + { event: \\"create\\", id: id(this0_actors0_node), properties: { old: null, new: this0_actors0_node { .* } }, timestamp: timestamp(), typename: \\"Actor\\" } AS meta, this0, this0_actors0_node
            MERGE (this0)<-[:ACTED_IN]-(this0_actors0_node)
            WITH meta + { event: \\"create\\", id: id(this0), properties: { old: null, new: this0 { .* } }, timestamp: timestamp(), typename: \\"Movie\\" } AS meta, this0
            RETURN this0, meta AS this0_meta
            }
            WITH this0, this0_meta AS meta
            RETURN [
            this0 { .id, actors: [ (this0)<-[:ACTED_IN]-(this0_actors:Actor)   | this0_actors { .name } ] }] AS data, meta"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"this0_id\\": \\"1\\",
                \\"this0_actors0_node_name\\": \\"Andrés\\",
                \\"this0_actors0_node_movies0_node_id\\": \\"6\\",
                \\"resolvedCallbacks\\": {}
            }"
        `);
    });

    test("Quadruple nested Create", async () => {
        const query = gql`
            mutation {
                createMovies(
                    input: [
                        {
                            id: "1"
                            actors: {
                                create: {
                                    node: {
                                        name: "Andrés"
                                        movies: {
                                            create: {
                                                node: { id: 6, actors: { create: { node: { name: "Thomas" } } } }
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    ]
                ) {
                    movies {
                        id
                        actors {
                            name
                            movies {
                                id
                                actors {
                                    name
                                }
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
            "CALL {
            WITH [] AS meta
            CREATE (this0:Movie)
            SET this0.id = $this0_id
            CREATE (this0_actors0_node:Actor)
            SET this0_actors0_node.name = $this0_actors0_node_name
            CREATE (this0_actors0_node_movies0_node:Movie)
            SET this0_actors0_node_movies0_node.id = $this0_actors0_node_movies0_node_id
            CREATE (this0_actors0_node_movies0_node_actors0_node:Actor)
            SET this0_actors0_node_movies0_node_actors0_node.name = $this0_actors0_node_movies0_node_actors0_node_name
            WITH meta + { event: \\"create\\", id: id(this0_actors0_node_movies0_node_actors0_node), properties: { old: null, new: this0_actors0_node_movies0_node_actors0_node { .* } }, timestamp: timestamp(), typename: \\"Actor\\" } AS meta, this0, this0_actors0_node, this0_actors0_node_movies0_node, this0_actors0_node_movies0_node_actors0_node
            MERGE (this0_actors0_node_movies0_node)<-[:ACTED_IN]-(this0_actors0_node_movies0_node_actors0_node)
            WITH meta + { event: \\"create\\", id: id(this0_actors0_node_movies0_node), properties: { old: null, new: this0_actors0_node_movies0_node { .* } }, timestamp: timestamp(), typename: \\"Movie\\" } AS meta, this0, this0_actors0_node, this0_actors0_node_movies0_node
            MERGE (this0_actors0_node)-[:ACTED_IN]->(this0_actors0_node_movies0_node)
            WITH meta + { event: \\"create\\", id: id(this0_actors0_node), properties: { old: null, new: this0_actors0_node { .* } }, timestamp: timestamp(), typename: \\"Actor\\" } AS meta, this0, this0_actors0_node
            MERGE (this0)<-[:ACTED_IN]-(this0_actors0_node)
            WITH meta + { event: \\"create\\", id: id(this0), properties: { old: null, new: this0 { .* } }, timestamp: timestamp(), typename: \\"Movie\\" } AS meta, this0
            RETURN this0, meta AS this0_meta
            }
            WITH this0, this0_meta AS meta
            RETURN [
            this0 { .id, actors: [ (this0)<-[:ACTED_IN]-(this0_actors:Actor)   | this0_actors { .name, movies: [ (this0_actors)-[:ACTED_IN]->(this0_actors_movies:Movie)   | this0_actors_movies { .id, actors: [ (this0_actors_movies)<-[:ACTED_IN]-(this0_actors_movies_actors:Actor)   | this0_actors_movies_actors { .name } ] } ] } ] }] AS data, meta"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"this0_id\\": \\"1\\",
                \\"this0_actors0_node_name\\": \\"Andrés\\",
                \\"this0_actors0_node_movies0_node_id\\": \\"6\\",
                \\"this0_actors0_node_movies0_node_actors0_node_name\\": \\"Thomas\\",
                \\"resolvedCallbacks\\": {}
            }"
        `);
    });

    test("Multi Create with nested", async () => {
        const query = gql`
            mutation {
                createMovies(
                    input: [
                        {
                            id: "1"
                            actors: { create: { node: { name: "Andrés", movies: { create: { node: { id: 6 } } } } } }
                        }
                        {
                            id: "2"
                            actors: { create: { node: { name: "Darrell", movies: { create: { node: { id: 8 } } } } } }
                        }
                    ]
                ) {
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
            "CALL {
            WITH [] AS meta
            CREATE (this0:Movie)
            SET this0.id = $this0_id
            CREATE (this0_actors0_node:Actor)
            SET this0_actors0_node.name = $this0_actors0_node_name
            CREATE (this0_actors0_node_movies0_node:Movie)
            SET this0_actors0_node_movies0_node.id = $this0_actors0_node_movies0_node_id
            WITH meta + { event: \\"create\\", id: id(this0_actors0_node_movies0_node), properties: { old: null, new: this0_actors0_node_movies0_node { .* } }, timestamp: timestamp(), typename: \\"Movie\\" } AS meta, this0, this0_actors0_node, this0_actors0_node_movies0_node
            MERGE (this0_actors0_node)-[:ACTED_IN]->(this0_actors0_node_movies0_node)
            WITH meta + { event: \\"create\\", id: id(this0_actors0_node), properties: { old: null, new: this0_actors0_node { .* } }, timestamp: timestamp(), typename: \\"Actor\\" } AS meta, this0, this0_actors0_node
            MERGE (this0)<-[:ACTED_IN]-(this0_actors0_node)
            WITH meta + { event: \\"create\\", id: id(this0), properties: { old: null, new: this0 { .* } }, timestamp: timestamp(), typename: \\"Movie\\" } AS meta, this0
            RETURN this0, meta AS this0_meta
            }
            CALL {
            WITH [] AS meta
            CREATE (this1:Movie)
            SET this1.id = $this1_id
            CREATE (this1_actors0_node:Actor)
            SET this1_actors0_node.name = $this1_actors0_node_name
            CREATE (this1_actors0_node_movies0_node:Movie)
            SET this1_actors0_node_movies0_node.id = $this1_actors0_node_movies0_node_id
            WITH meta + { event: \\"create\\", id: id(this1_actors0_node_movies0_node), properties: { old: null, new: this1_actors0_node_movies0_node { .* } }, timestamp: timestamp(), typename: \\"Movie\\" } AS meta, this1, this1_actors0_node, this1_actors0_node_movies0_node
            MERGE (this1_actors0_node)-[:ACTED_IN]->(this1_actors0_node_movies0_node)
            WITH meta + { event: \\"create\\", id: id(this1_actors0_node), properties: { old: null, new: this1_actors0_node { .* } }, timestamp: timestamp(), typename: \\"Actor\\" } AS meta, this1, this1_actors0_node
            MERGE (this1)<-[:ACTED_IN]-(this1_actors0_node)
            WITH meta + { event: \\"create\\", id: id(this1), properties: { old: null, new: this1 { .* } }, timestamp: timestamp(), typename: \\"Movie\\" } AS meta, this1
            RETURN this1, meta AS this1_meta
            }
            WITH this0, this1, this0_meta + this1_meta AS meta
            RETURN [
            this0 { .id },
            this1 { .id }] AS data, meta"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"this0_id\\": \\"1\\",
                \\"this0_actors0_node_name\\": \\"Andrés\\",
                \\"this0_actors0_node_movies0_node_id\\": \\"6\\",
                \\"this1_id\\": \\"2\\",
                \\"this1_actors0_node_name\\": \\"Darrell\\",
                \\"this1_actors0_node_movies0_node_id\\": \\"8\\",
                \\"resolvedCallbacks\\": {}
            }"
        `);
    });

    test("Simple create without returned data", async () => {
        const query = gql`
            mutation {
                createMovies(input: [{ id: "1" }]) {
                    info {
                        nodesCreated
                    }
                }
            }
        `;

        const req = createJwtRequest("secret", {});
        const result = await translateQuery(neoSchema, query, {
            req,
        });

        expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
            "CALL {
            WITH [] AS meta
            CREATE (this0:Movie)
            SET this0.id = $this0_id
            WITH meta + { event: \\"create\\", id: id(this0), properties: { old: null, new: this0 { .* } }, timestamp: timestamp(), typename: \\"Movie\\" } AS meta, this0
            RETURN this0, meta AS this0_meta
            }
            WITH this0, this0_meta AS meta
            RETURN meta"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"this0_id\\": \\"1\\",
                \\"resolvedCallbacks\\": {}
            }"
        `);
    });
});
