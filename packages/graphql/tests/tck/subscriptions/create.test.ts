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
import { TestCDCEngine } from "../../utils/builders/TestCDCEngine";
import { formatCypher, formatParams, translateQuery } from "../utils/tck-test-utils";

describe("Subscriptions metadata on create", () => {
    let typeDefs: string;
    let neoSchema: Neo4jGraphQL;

    beforeAll(() => {
        typeDefs = /* GraphQL */ `
            type Actor @node {
                name: String!
                movies: [Movie!]! @relationship(type: "ACTED_IN", direction: OUT)
            }

            type Movie @node {
                id: ID!
                actors: [Actor!]! @relationship(type: "ACTED_IN", direction: IN)
            }
        `;

        neoSchema = new Neo4jGraphQL({
            typeDefs,
            features: {
                subscriptions: new TestCDCEngine(),
            },
        });
    });

    test("Create with create relation: connect event", async () => {
        const typeDefs = /* GraphQL */ `
            type Movie @node {
                title: String!
                actors: [Actor!]! @relationship(type: "ACTED_IN", properties: "ActedIn", direction: IN)
            }

            type Actor @node {
                name: String!
                movies: [Movie!]! @relationship(type: "ACTED_IN", properties: "ActedIn", direction: OUT)
            }

            type ActedIn @relationshipProperties {
                screenTime: Int!
            }
        `;

        const query = /* GraphQL */ `
            mutation {
                createMovies(
                    input: [
                        {
                            title: "Forrest Gump"
                            actors: { create: [{ node: { name: "Tom Hanks" }, edge: { screenTime: 60 } }] }
                        }
                    ]
                ) {
                    movies {
                        title
                        actorsConnection {
                            edges {
                                properties {
                                    screenTime
                                }
                                node {
                                    name
                                }
                            }
                        }
                    }
                }
            }
        `;

        const result = await translateQuery(
            new Neo4jGraphQL({
                typeDefs,
                features: {
                    subscriptions: new TestCDCEngine(),
                },
            }),
            query
        );
        // TODO: make a test with rel type as union/ interface
        expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
            "CALL {
            WITH [] AS meta
            CREATE (this0:Movie)
            SET this0.title = $this0_title
            CREATE (this0_actors0_node:Actor)
            SET this0_actors0_node.name = $this0_actors0_node_name
            WITH *, meta + { event: \\"create\\", id: id(this0_actors0_node), properties: { old: null, new: this0_actors0_node { .* } }, timestamp: timestamp(), typename: \\"Actor\\" } AS meta
            MERGE (this0)<-[this0_actors0_relationship:ACTED_IN]-(this0_actors0_node)
            SET this0_actors0_relationship.screenTime = $this0_actors0_relationship_screenTime
            WITH *, meta + { event: \\"create_relationship\\", timestamp: timestamp(), id_from: id(this0_actors0_node), id_to: id(this0), id: id(this0_actors0_relationship), relationshipName: \\"ACTED_IN\\", fromTypename: \\"Actor\\", toTypename: \\"Movie\\", properties: { from: this0_actors0_node { .* }, to: this0 { .* }, relationship: this0_actors0_relationship { .* } } } AS meta
            WITH *, meta + { event: \\"create\\", id: id(this0), properties: { old: null, new: this0 { .* } }, timestamp: timestamp(), typename: \\"Movie\\" } AS meta
            RETURN this0, meta AS this0_meta
            }
            WITH this0, this0_meta AS meta
            CALL {
                WITH this0
                CALL {
                    WITH this0
                    MATCH (this0)<-[create_this0:ACTED_IN]-(create_this1:Actor)
                    WITH collect({ node: create_this1, relationship: create_this0 }) AS edges
                    WITH edges, size(edges) AS totalCount
                    CALL {
                        WITH edges
                        UNWIND edges AS edge
                        WITH edge.node AS create_this1, edge.relationship AS create_this0
                        RETURN collect({ properties: { screenTime: create_this0.screenTime, __resolveType: \\"ActedIn\\" }, node: { name: create_this1.name, __resolveType: \\"Actor\\" } }) AS create_var2
                    }
                    RETURN { edges: create_var2, totalCount: totalCount } AS create_var3
                }
                RETURN this0 { .title, actorsConnection: create_var3 } AS create_var4
            }
            RETURN [create_var4] AS data, meta"
        `);
        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"this0_title\\": \\"Forrest Gump\\",
                \\"this0_actors0_node_name\\": \\"Tom Hanks\\",
                \\"this0_actors0_relationship_screenTime\\": {
                    \\"low\\": 60,
                    \\"high\\": 0
                },
                \\"resolvedCallbacks\\": {}
            }"
        `);
    });

    test("Create with create relation without properties: connect event", async () => {
        const typeDefs = /* GraphQL */ `
            type Movie @node {
                title: String!
                actors: [Actor!]! @relationship(type: "ACTED_IN", direction: IN)
            }

            type Actor @node {
                name: String!
                movies: [Movie!]! @relationship(type: "ACTED_IN", direction: OUT)
            }
        `;

        const query = /* GraphQL */ `
            mutation {
                createMovies(
                    input: [{ title: "Forrest Gump", actors: { create: [{ node: { name: "Tom Hanks" } }] } }]
                ) {
                    movies {
                        title
                        actorsConnection {
                            edges {
                                node {
                                    name
                                }
                            }
                        }
                    }
                }
            }
        `;

        const result = await translateQuery(
            new Neo4jGraphQL({
                typeDefs,
                features: {
                    subscriptions: new TestCDCEngine(),
                },
            }),
            query
        );

        expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
            "CALL {
            WITH [] AS meta
            CREATE (this0:Movie)
            SET this0.title = $this0_title
            CREATE (this0_actors0_node:Actor)
            SET this0_actors0_node.name = $this0_actors0_node_name
            WITH *, meta + { event: \\"create\\", id: id(this0_actors0_node), properties: { old: null, new: this0_actors0_node { .* } }, timestamp: timestamp(), typename: \\"Actor\\" } AS meta
            MERGE (this0)<-[this0_actors0_relationship:ACTED_IN]-(this0_actors0_node)
            WITH *, meta + { event: \\"create_relationship\\", timestamp: timestamp(), id_from: id(this0_actors0_node), id_to: id(this0), id: id(this0_actors0_relationship), relationshipName: \\"ACTED_IN\\", fromTypename: \\"Actor\\", toTypename: \\"Movie\\", properties: { from: this0_actors0_node { .* }, to: this0 { .* }, relationship: this0_actors0_relationship { .* } } } AS meta
            WITH *, meta + { event: \\"create\\", id: id(this0), properties: { old: null, new: this0 { .* } }, timestamp: timestamp(), typename: \\"Movie\\" } AS meta
            RETURN this0, meta AS this0_meta
            }
            WITH this0, this0_meta AS meta
            CALL {
                WITH this0
                CALL {
                    WITH this0
                    MATCH (this0)<-[create_this0:ACTED_IN]-(create_this1:Actor)
                    WITH collect({ node: create_this1, relationship: create_this0 }) AS edges
                    WITH edges, size(edges) AS totalCount
                    CALL {
                        WITH edges
                        UNWIND edges AS edge
                        WITH edge.node AS create_this1, edge.relationship AS create_this0
                        RETURN collect({ node: { name: create_this1.name, __resolveType: \\"Actor\\" } }) AS create_var2
                    }
                    RETURN { edges: create_var2, totalCount: totalCount } AS create_var3
                }
                RETURN this0 { .title, actorsConnection: create_var3 } AS create_var4
            }
            RETURN [create_var4] AS data, meta"
        `);
        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"this0_title\\": \\"Forrest Gump\\",
                \\"this0_actors0_node_name\\": \\"Tom Hanks\\",
                \\"resolvedCallbacks\\": {}
            }"
        `);
    });

    test("Create with nested create relation: connect event", async () => {
        const typeDefs = /* GraphQL */ `
            type Movie @node {
                title: String!
                actors: [Actor!]! @relationship(type: "ACTED_IN", properties: "ActedIn", direction: IN)
            }

            type Actor @node {
                name: String!
                movies: [Movie!]! @relationship(type: "ACTED_IN", properties: "ActedIn", direction: OUT)
            }

            type ActedIn @relationshipProperties {
                screenTime: Int!
            }
        `;

        const query = /* GraphQL */ `
            mutation {
                createMovies(
                    input: [
                        {
                            title: "Forrest Gump"
                            actors: {
                                create: [
                                    {
                                        node: {
                                            name: "Tom Hanks"
                                            movies: {
                                                create: [{ node: { title: "Funny movie" }, edge: { screenTime: 1990 } }]
                                            }
                                        }
                                        edge: { screenTime: 60 }
                                    }
                                ]
                            }
                        }
                    ]
                ) {
                    movies {
                        title
                        actorsConnection {
                            edges {
                                properties {
                                    screenTime
                                }
                                node {
                                    name
                                }
                            }
                        }
                    }
                }
            }
        `;

        const result = await translateQuery(
            new Neo4jGraphQL({
                typeDefs,
                features: {
                    subscriptions: new TestCDCEngine(),
                },
            }),
            query
        );

        expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
            "CALL {
            WITH [] AS meta
            CREATE (this0:Movie)
            SET this0.title = $this0_title
            CREATE (this0_actors0_node:Actor)
            SET this0_actors0_node.name = $this0_actors0_node_name
            CREATE (this0_actors0_node_movies0_node:Movie)
            SET this0_actors0_node_movies0_node.title = $this0_actors0_node_movies0_node_title
            WITH *, meta + { event: \\"create\\", id: id(this0_actors0_node_movies0_node), properties: { old: null, new: this0_actors0_node_movies0_node { .* } }, timestamp: timestamp(), typename: \\"Movie\\" } AS meta
            MERGE (this0_actors0_node)-[this0_actors0_node_movies0_relationship:ACTED_IN]->(this0_actors0_node_movies0_node)
            SET this0_actors0_node_movies0_relationship.screenTime = $this0_actors0_node_movies0_relationship_screenTime
            WITH *, meta + { event: \\"create_relationship\\", timestamp: timestamp(), id_from: id(this0_actors0_node), id_to: id(this0_actors0_node_movies0_node), id: id(this0_actors0_node_movies0_relationship), relationshipName: \\"ACTED_IN\\", fromTypename: \\"Actor\\", toTypename: \\"Movie\\", properties: { from: this0_actors0_node { .* }, to: this0_actors0_node_movies0_node { .* }, relationship: this0_actors0_node_movies0_relationship { .* } } } AS meta
            WITH *, meta + { event: \\"create\\", id: id(this0_actors0_node), properties: { old: null, new: this0_actors0_node { .* } }, timestamp: timestamp(), typename: \\"Actor\\" } AS meta
            MERGE (this0)<-[this0_actors0_relationship:ACTED_IN]-(this0_actors0_node)
            SET this0_actors0_relationship.screenTime = $this0_actors0_relationship_screenTime
            WITH *, meta + { event: \\"create_relationship\\", timestamp: timestamp(), id_from: id(this0_actors0_node), id_to: id(this0), id: id(this0_actors0_relationship), relationshipName: \\"ACTED_IN\\", fromTypename: \\"Actor\\", toTypename: \\"Movie\\", properties: { from: this0_actors0_node { .* }, to: this0 { .* }, relationship: this0_actors0_relationship { .* } } } AS meta
            WITH *, meta + { event: \\"create\\", id: id(this0), properties: { old: null, new: this0 { .* } }, timestamp: timestamp(), typename: \\"Movie\\" } AS meta
            RETURN this0, meta AS this0_meta
            }
            WITH this0, this0_meta AS meta
            CALL {
                WITH this0
                CALL {
                    WITH this0
                    MATCH (this0)<-[create_this0:ACTED_IN]-(create_this1:Actor)
                    WITH collect({ node: create_this1, relationship: create_this0 }) AS edges
                    WITH edges, size(edges) AS totalCount
                    CALL {
                        WITH edges
                        UNWIND edges AS edge
                        WITH edge.node AS create_this1, edge.relationship AS create_this0
                        RETURN collect({ properties: { screenTime: create_this0.screenTime, __resolveType: \\"ActedIn\\" }, node: { name: create_this1.name, __resolveType: \\"Actor\\" } }) AS create_var2
                    }
                    RETURN { edges: create_var2, totalCount: totalCount } AS create_var3
                }
                RETURN this0 { .title, actorsConnection: create_var3 } AS create_var4
            }
            RETURN [create_var4] AS data, meta"
        `);
        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"this0_title\\": \\"Forrest Gump\\",
                \\"this0_actors0_node_name\\": \\"Tom Hanks\\",
                \\"this0_actors0_node_movies0_node_title\\": \\"Funny movie\\",
                \\"this0_actors0_node_movies0_relationship_screenTime\\": {
                    \\"low\\": 1990,
                    \\"high\\": 0
                },
                \\"this0_actors0_relationship_screenTime\\": {
                    \\"low\\": 60,
                    \\"high\\": 0
                },
                \\"resolvedCallbacks\\": {}
            }"
        `);
    });

    test("Create with create relation to union field: connect event", async () => {
        const typeDefs = /* GraphQL */ `
            type Movie @node {
                title: String!
                actors: [Actor!]! @relationship(type: "ACTED_IN", properties: "ActedIn", direction: IN)
                directors: [Director!]! @relationship(type: "DIRECTED", properties: "Directed", direction: IN)
            }

            type Actor @node {
                name: String!
                movies: [Movie!]! @relationship(type: "ACTED_IN", properties: "ActedIn", direction: OUT)
            }

            type ActedIn @relationshipProperties {
                screenTime: Int!
            }

            type Directed @relationshipProperties {
                year: Int!
            }

            type Person @node {
                name: String!
            }

            union Director = Person | Actor
        `;

        const query = /* GraphQL */ `
            mutation {
                createMovies(
                    input: [
                        {
                            title: "The Matrix"
                            directors: {
                                Actor: { create: [{ node: { name: "Keanu Reeves" }, edge: { year: 2420 } }] }
                                Person: { create: [{ node: { name: "Lilly Wachowski" }, edge: { year: 1999 } }] }
                            }
                        }
                    ]
                ) {
                    movies {
                        title
                        directors {
                            ... on Person {
                                name
                            }
                            ... on Actor {
                                name
                            }
                        }
                    }
                }
            }
        `;

        const result = await translateQuery(
            new Neo4jGraphQL({
                typeDefs,
                features: {
                    subscriptions: new TestCDCEngine(),
                },
            }),
            query
        );

        expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
            "CALL {
            WITH [] AS meta
            CREATE (this0:Movie)
            SET this0.title = $this0_title
            CREATE (this0_directors_Person0_node:Person)
            SET this0_directors_Person0_node.name = $this0_directors_Person0_node_name
            WITH *, meta + { event: \\"create\\", id: id(this0_directors_Person0_node), properties: { old: null, new: this0_directors_Person0_node { .* } }, timestamp: timestamp(), typename: \\"Person\\" } AS meta
            MERGE (this0)<-[this0_directors_Person0_relationship:DIRECTED]-(this0_directors_Person0_node)
            SET this0_directors_Person0_relationship.year = $this0_directors_Person0_relationship_year
            WITH *, meta + { event: \\"create_relationship\\", timestamp: timestamp(), id_from: id(this0_directors_Person0_node), id_to: id(this0), id: id(this0_directors_Person0_relationship), relationshipName: \\"DIRECTED\\", fromTypename: \\"Person\\", toTypename: \\"Movie\\", properties: { from: this0_directors_Person0_node { .* }, to: this0 { .* }, relationship: this0_directors_Person0_relationship { .* } } } AS meta
            CREATE (this0_directors_Actor0_node:Actor)
            SET this0_directors_Actor0_node.name = $this0_directors_Actor0_node_name
            WITH *, meta + { event: \\"create\\", id: id(this0_directors_Actor0_node), properties: { old: null, new: this0_directors_Actor0_node { .* } }, timestamp: timestamp(), typename: \\"Actor\\" } AS meta
            MERGE (this0)<-[this0_directors_Actor0_relationship:DIRECTED]-(this0_directors_Actor0_node)
            SET this0_directors_Actor0_relationship.year = $this0_directors_Actor0_relationship_year
            WITH *, meta + { event: \\"create_relationship\\", timestamp: timestamp(), id_from: id(this0_directors_Actor0_node), id_to: id(this0), id: id(this0_directors_Actor0_relationship), relationshipName: \\"DIRECTED\\", fromTypename: \\"Actor\\", toTypename: \\"Movie\\", properties: { from: this0_directors_Actor0_node { .* }, to: this0 { .* }, relationship: this0_directors_Actor0_relationship { .* } } } AS meta
            WITH *, meta + { event: \\"create\\", id: id(this0), properties: { old: null, new: this0 { .* } }, timestamp: timestamp(), typename: \\"Movie\\" } AS meta
            RETURN this0, meta AS this0_meta
            }
            WITH this0, this0_meta AS meta
            CALL {
                WITH this0
                CALL {
                    WITH this0
                    CALL {
                        WITH *
                        MATCH (this0)<-[create_this0:DIRECTED]-(create_this1:Person)
                        WITH create_this1 { .name, __resolveType: \\"Person\\", __id: id(create_this1) } AS create_this1
                        RETURN create_this1 AS create_var2
                        UNION
                        WITH *
                        MATCH (this0)<-[create_this3:DIRECTED]-(create_this4:Actor)
                        WITH create_this4 { .name, __resolveType: \\"Actor\\", __id: id(create_this4) } AS create_this4
                        RETURN create_this4 AS create_var2
                    }
                    WITH create_var2
                    RETURN collect(create_var2) AS create_var2
                }
                RETURN this0 { .title, directors: create_var2 } AS create_var5
            }
            RETURN [create_var5] AS data, meta"
        `);
        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"this0_title\\": \\"The Matrix\\",
                \\"this0_directors_Person0_node_name\\": \\"Lilly Wachowski\\",
                \\"this0_directors_Person0_relationship_year\\": {
                    \\"low\\": 1999,
                    \\"high\\": 0
                },
                \\"this0_directors_Actor0_node_name\\": \\"Keanu Reeves\\",
                \\"this0_directors_Actor0_relationship_year\\": {
                    \\"low\\": 2420,
                    \\"high\\": 0
                },
                \\"resolvedCallbacks\\": {}
            }"
        `);
    });

    test("Create with nested create relation to union field: connect event", async () => {
        const typeDefs = /* GraphQL */ `
            type Movie @node {
                title: String!
                actors: [Actor!]! @relationship(type: "ACTED_IN", properties: "ActedIn", direction: IN)
                directors: [Director!]! @relationship(type: "DIRECTED", properties: "Directed", direction: IN)
            }

            type Actor @node {
                name: String!
                movies: [Movie!]! @relationship(type: "ACTED_IN", properties: "ActedIn", direction: OUT)
            }

            type ActedIn @relationshipProperties {
                screenTime: Int!
            }

            type Directed @relationshipProperties {
                year: Int!
            }

            type Person @node {
                name: String!
            }

            union Director = Person | Actor
        `;

        const query = /* GraphQL */ `
            mutation {
                createMovies(
                    input: [
                        {
                            title: "The Matrix"
                            directors: {
                                Actor: {
                                    create: [
                                        {
                                            node: {
                                                name: "Keanu Reeves"
                                                movies: {
                                                    create: [
                                                        { node: { title: "Funny movie" }, edge: { screenTime: 190 } }
                                                    ]
                                                }
                                            }
                                            edge: { year: 2420 }
                                        }
                                    ]
                                }
                                Person: { create: [{ node: { name: "Lilly Wachowski" }, edge: { year: 1999 } }] }
                            }
                        }
                    ]
                ) {
                    movies {
                        title
                        directors {
                            ... on Person {
                                name
                            }
                            ... on Actor {
                                name
                                movies {
                                    title
                                }
                            }
                        }
                    }
                }
            }
        `;

        const result = await translateQuery(
            new Neo4jGraphQL({
                typeDefs,
                features: {
                    subscriptions: new TestCDCEngine(),
                },
            }),
            query
        );

        expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
            "CALL {
            WITH [] AS meta
            CREATE (this0:Movie)
            SET this0.title = $this0_title
            CREATE (this0_directors_Person0_node:Person)
            SET this0_directors_Person0_node.name = $this0_directors_Person0_node_name
            WITH *, meta + { event: \\"create\\", id: id(this0_directors_Person0_node), properties: { old: null, new: this0_directors_Person0_node { .* } }, timestamp: timestamp(), typename: \\"Person\\" } AS meta
            MERGE (this0)<-[this0_directors_Person0_relationship:DIRECTED]-(this0_directors_Person0_node)
            SET this0_directors_Person0_relationship.year = $this0_directors_Person0_relationship_year
            WITH *, meta + { event: \\"create_relationship\\", timestamp: timestamp(), id_from: id(this0_directors_Person0_node), id_to: id(this0), id: id(this0_directors_Person0_relationship), relationshipName: \\"DIRECTED\\", fromTypename: \\"Person\\", toTypename: \\"Movie\\", properties: { from: this0_directors_Person0_node { .* }, to: this0 { .* }, relationship: this0_directors_Person0_relationship { .* } } } AS meta
            CREATE (this0_directors_Actor0_node:Actor)
            SET this0_directors_Actor0_node.name = $this0_directors_Actor0_node_name
            CREATE (this0_directors_Actor0_node_movies0_node:Movie)
            SET this0_directors_Actor0_node_movies0_node.title = $this0_directors_Actor0_node_movies0_node_title
            WITH *, meta + { event: \\"create\\", id: id(this0_directors_Actor0_node_movies0_node), properties: { old: null, new: this0_directors_Actor0_node_movies0_node { .* } }, timestamp: timestamp(), typename: \\"Movie\\" } AS meta
            MERGE (this0_directors_Actor0_node)-[this0_directors_Actor0_node_movies0_relationship:ACTED_IN]->(this0_directors_Actor0_node_movies0_node)
            SET this0_directors_Actor0_node_movies0_relationship.screenTime = $this0_directors_Actor0_node_movies0_relationship_screenTime
            WITH *, meta + { event: \\"create_relationship\\", timestamp: timestamp(), id_from: id(this0_directors_Actor0_node), id_to: id(this0_directors_Actor0_node_movies0_node), id: id(this0_directors_Actor0_node_movies0_relationship), relationshipName: \\"ACTED_IN\\", fromTypename: \\"Actor\\", toTypename: \\"Movie\\", properties: { from: this0_directors_Actor0_node { .* }, to: this0_directors_Actor0_node_movies0_node { .* }, relationship: this0_directors_Actor0_node_movies0_relationship { .* } } } AS meta
            WITH *, meta + { event: \\"create\\", id: id(this0_directors_Actor0_node), properties: { old: null, new: this0_directors_Actor0_node { .* } }, timestamp: timestamp(), typename: \\"Actor\\" } AS meta
            MERGE (this0)<-[this0_directors_Actor0_relationship:DIRECTED]-(this0_directors_Actor0_node)
            SET this0_directors_Actor0_relationship.year = $this0_directors_Actor0_relationship_year
            WITH *, meta + { event: \\"create_relationship\\", timestamp: timestamp(), id_from: id(this0_directors_Actor0_node), id_to: id(this0), id: id(this0_directors_Actor0_relationship), relationshipName: \\"DIRECTED\\", fromTypename: \\"Actor\\", toTypename: \\"Movie\\", properties: { from: this0_directors_Actor0_node { .* }, to: this0 { .* }, relationship: this0_directors_Actor0_relationship { .* } } } AS meta
            WITH *, meta + { event: \\"create\\", id: id(this0), properties: { old: null, new: this0 { .* } }, timestamp: timestamp(), typename: \\"Movie\\" } AS meta
            RETURN this0, meta AS this0_meta
            }
            WITH this0, this0_meta AS meta
            CALL {
                WITH this0
                CALL {
                    WITH this0
                    CALL {
                        WITH *
                        MATCH (this0)<-[create_this0:DIRECTED]-(create_this1:Person)
                        WITH create_this1 { .name, __resolveType: \\"Person\\", __id: id(create_this1) } AS create_this1
                        RETURN create_this1 AS create_var2
                        UNION
                        WITH *
                        MATCH (this0)<-[create_this3:DIRECTED]-(create_this4:Actor)
                        CALL {
                            WITH create_this4
                            MATCH (create_this4)-[create_this5:ACTED_IN]->(create_this6:Movie)
                            WITH create_this6 { .title } AS create_this6
                            RETURN collect(create_this6) AS create_var7
                        }
                        WITH create_this4 { .name, movies: create_var7, __resolveType: \\"Actor\\", __id: id(create_this4) } AS create_this4
                        RETURN create_this4 AS create_var2
                    }
                    WITH create_var2
                    RETURN collect(create_var2) AS create_var2
                }
                RETURN this0 { .title, directors: create_var2 } AS create_var8
            }
            RETURN [create_var8] AS data, meta"
        `);
        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"this0_title\\": \\"The Matrix\\",
                \\"this0_directors_Person0_node_name\\": \\"Lilly Wachowski\\",
                \\"this0_directors_Person0_relationship_year\\": {
                    \\"low\\": 1999,
                    \\"high\\": 0
                },
                \\"this0_directors_Actor0_node_name\\": \\"Keanu Reeves\\",
                \\"this0_directors_Actor0_node_movies0_node_title\\": \\"Funny movie\\",
                \\"this0_directors_Actor0_node_movies0_relationship_screenTime\\": {
                    \\"low\\": 190,
                    \\"high\\": 0
                },
                \\"this0_directors_Actor0_relationship_year\\": {
                    \\"low\\": 2420,
                    \\"high\\": 0
                },
                \\"resolvedCallbacks\\": {}
            }"
        `);
    });

    test("Simple Create", async () => {
        const query = /* GraphQL */ `
            mutation {
                createMovies(input: [{ id: "1" }]) {
                    movies {
                        id
                    }
                }
            }
        `;

        const result = await translateQuery(neoSchema, query);

        expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
            "CALL {
            WITH [] AS meta
            CREATE (this0:Movie)
            SET this0.id = $this0_id
            WITH *, meta + { event: \\"create\\", id: id(this0), properties: { old: null, new: this0 { .* } }, timestamp: timestamp(), typename: \\"Movie\\" } AS meta
            RETURN this0, meta AS this0_meta
            }
            WITH this0, this0_meta AS meta
            CALL {
                WITH this0
                RETURN this0 { .id } AS create_var0
            }
            RETURN [create_var0] AS data, meta"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"this0_id\\": \\"1\\",
                \\"resolvedCallbacks\\": {}
            }"
        `);
    });

    test("Multi Create", async () => {
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
            "CALL {
            WITH [] AS meta
            CREATE (this0:Movie)
            SET this0.id = $this0_id
            WITH *, meta + { event: \\"create\\", id: id(this0), properties: { old: null, new: this0 { .* } }, timestamp: timestamp(), typename: \\"Movie\\" } AS meta
            RETURN this0, meta AS this0_meta
            }
            CALL {
            WITH [] AS meta
            CREATE (this1:Movie)
            SET this1.id = $this1_id
            WITH *, meta + { event: \\"create\\", id: id(this1), properties: { old: null, new: this1 { .* } }, timestamp: timestamp(), typename: \\"Movie\\" } AS meta
            RETURN this1, meta AS this1_meta
            }
            WITH this0, this1, this0_meta + this1_meta AS meta
            CALL {
                WITH this0
                RETURN this0 { .id } AS create_var0
            }
            CALL {
                WITH this1
                RETURN this1 { .id } AS create_var1
            }
            RETURN [create_var0, create_var1] AS data, meta"
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
        const query = /* GraphQL */ `
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

        const result = await translateQuery(neoSchema, query);

        expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
            "CALL {
            WITH [] AS meta
            CREATE (this0:Movie)
            SET this0.id = $this0_id
            CREATE (this0_actors0_node:Actor)
            SET this0_actors0_node.name = $this0_actors0_node_name
            WITH *, meta + { event: \\"create\\", id: id(this0_actors0_node), properties: { old: null, new: this0_actors0_node { .* } }, timestamp: timestamp(), typename: \\"Actor\\" } AS meta
            MERGE (this0)<-[this0_actors0_relationship:ACTED_IN]-(this0_actors0_node)
            WITH *, meta + { event: \\"create_relationship\\", timestamp: timestamp(), id_from: id(this0_actors0_node), id_to: id(this0), id: id(this0_actors0_relationship), relationshipName: \\"ACTED_IN\\", fromTypename: \\"Actor\\", toTypename: \\"Movie\\", properties: { from: this0_actors0_node { .* }, to: this0 { .* }, relationship: this0_actors0_relationship { .* } } } AS meta
            WITH *, meta + { event: \\"create\\", id: id(this0), properties: { old: null, new: this0 { .* } }, timestamp: timestamp(), typename: \\"Movie\\" } AS meta
            RETURN this0, meta AS this0_meta
            }
            WITH this0, this0_meta AS meta
            CALL {
                WITH this0
                CALL {
                    WITH this0
                    MATCH (this0)<-[create_this0:ACTED_IN]-(create_this1:Actor)
                    WITH create_this1 { .name } AS create_this1
                    RETURN collect(create_this1) AS create_var2
                }
                RETURN this0 { .id, actors: create_var2 } AS create_var3
            }
            RETURN [create_var3] AS data, meta"
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
        const query = /* GraphQL */ `
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

        const result = await translateQuery(neoSchema, query);

        expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
            "CALL {
            WITH [] AS meta
            CREATE (this0:Movie)
            SET this0.id = $this0_id
            CREATE (this0_actors0_node:Actor)
            SET this0_actors0_node.name = $this0_actors0_node_name
            CREATE (this0_actors0_node_movies0_node:Movie)
            SET this0_actors0_node_movies0_node.id = $this0_actors0_node_movies0_node_id
            WITH *, meta + { event: \\"create\\", id: id(this0_actors0_node_movies0_node), properties: { old: null, new: this0_actors0_node_movies0_node { .* } }, timestamp: timestamp(), typename: \\"Movie\\" } AS meta
            MERGE (this0_actors0_node)-[this0_actors0_node_movies0_relationship:ACTED_IN]->(this0_actors0_node_movies0_node)
            WITH *, meta + { event: \\"create_relationship\\", timestamp: timestamp(), id_from: id(this0_actors0_node), id_to: id(this0_actors0_node_movies0_node), id: id(this0_actors0_node_movies0_relationship), relationshipName: \\"ACTED_IN\\", fromTypename: \\"Actor\\", toTypename: \\"Movie\\", properties: { from: this0_actors0_node { .* }, to: this0_actors0_node_movies0_node { .* }, relationship: this0_actors0_node_movies0_relationship { .* } } } AS meta
            WITH *, meta + { event: \\"create\\", id: id(this0_actors0_node), properties: { old: null, new: this0_actors0_node { .* } }, timestamp: timestamp(), typename: \\"Actor\\" } AS meta
            MERGE (this0)<-[this0_actors0_relationship:ACTED_IN]-(this0_actors0_node)
            WITH *, meta + { event: \\"create_relationship\\", timestamp: timestamp(), id_from: id(this0_actors0_node), id_to: id(this0), id: id(this0_actors0_relationship), relationshipName: \\"ACTED_IN\\", fromTypename: \\"Actor\\", toTypename: \\"Movie\\", properties: { from: this0_actors0_node { .* }, to: this0 { .* }, relationship: this0_actors0_relationship { .* } } } AS meta
            WITH *, meta + { event: \\"create\\", id: id(this0), properties: { old: null, new: this0 { .* } }, timestamp: timestamp(), typename: \\"Movie\\" } AS meta
            RETURN this0, meta AS this0_meta
            }
            WITH this0, this0_meta AS meta
            CALL {
                WITH this0
                CALL {
                    WITH this0
                    MATCH (this0)<-[create_this0:ACTED_IN]-(create_this1:Actor)
                    WITH create_this1 { .name } AS create_this1
                    RETURN collect(create_this1) AS create_var2
                }
                RETURN this0 { .id, actors: create_var2 } AS create_var3
            }
            RETURN [create_var3] AS data, meta"
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
        const query = /* GraphQL */ `
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

        const result = await translateQuery(neoSchema, query);

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
            WITH *, meta + { event: \\"create\\", id: id(this0_actors0_node_movies0_node_actors0_node), properties: { old: null, new: this0_actors0_node_movies0_node_actors0_node { .* } }, timestamp: timestamp(), typename: \\"Actor\\" } AS meta
            MERGE (this0_actors0_node_movies0_node)<-[this0_actors0_node_movies0_node_actors0_relationship:ACTED_IN]-(this0_actors0_node_movies0_node_actors0_node)
            WITH *, meta + { event: \\"create_relationship\\", timestamp: timestamp(), id_from: id(this0_actors0_node_movies0_node_actors0_node), id_to: id(this0_actors0_node_movies0_node), id: id(this0_actors0_node_movies0_node_actors0_relationship), relationshipName: \\"ACTED_IN\\", fromTypename: \\"Actor\\", toTypename: \\"Movie\\", properties: { from: this0_actors0_node_movies0_node_actors0_node { .* }, to: this0_actors0_node_movies0_node { .* }, relationship: this0_actors0_node_movies0_node_actors0_relationship { .* } } } AS meta
            WITH *, meta + { event: \\"create\\", id: id(this0_actors0_node_movies0_node), properties: { old: null, new: this0_actors0_node_movies0_node { .* } }, timestamp: timestamp(), typename: \\"Movie\\" } AS meta
            MERGE (this0_actors0_node)-[this0_actors0_node_movies0_relationship:ACTED_IN]->(this0_actors0_node_movies0_node)
            WITH *, meta + { event: \\"create_relationship\\", timestamp: timestamp(), id_from: id(this0_actors0_node), id_to: id(this0_actors0_node_movies0_node), id: id(this0_actors0_node_movies0_relationship), relationshipName: \\"ACTED_IN\\", fromTypename: \\"Actor\\", toTypename: \\"Movie\\", properties: { from: this0_actors0_node { .* }, to: this0_actors0_node_movies0_node { .* }, relationship: this0_actors0_node_movies0_relationship { .* } } } AS meta
            WITH *, meta + { event: \\"create\\", id: id(this0_actors0_node), properties: { old: null, new: this0_actors0_node { .* } }, timestamp: timestamp(), typename: \\"Actor\\" } AS meta
            MERGE (this0)<-[this0_actors0_relationship:ACTED_IN]-(this0_actors0_node)
            WITH *, meta + { event: \\"create_relationship\\", timestamp: timestamp(), id_from: id(this0_actors0_node), id_to: id(this0), id: id(this0_actors0_relationship), relationshipName: \\"ACTED_IN\\", fromTypename: \\"Actor\\", toTypename: \\"Movie\\", properties: { from: this0_actors0_node { .* }, to: this0 { .* }, relationship: this0_actors0_relationship { .* } } } AS meta
            WITH *, meta + { event: \\"create\\", id: id(this0), properties: { old: null, new: this0 { .* } }, timestamp: timestamp(), typename: \\"Movie\\" } AS meta
            RETURN this0, meta AS this0_meta
            }
            WITH this0, this0_meta AS meta
            CALL {
                WITH this0
                CALL {
                    WITH this0
                    MATCH (this0)<-[create_this0:ACTED_IN]-(create_this1:Actor)
                    CALL {
                        WITH create_this1
                        MATCH (create_this1)-[create_this2:ACTED_IN]->(create_this3:Movie)
                        CALL {
                            WITH create_this3
                            MATCH (create_this3)<-[create_this4:ACTED_IN]-(create_this5:Actor)
                            WITH create_this5 { .name } AS create_this5
                            RETURN collect(create_this5) AS create_var6
                        }
                        WITH create_this3 { .id, actors: create_var6 } AS create_this3
                        RETURN collect(create_this3) AS create_var7
                    }
                    WITH create_this1 { .name, movies: create_var7 } AS create_this1
                    RETURN collect(create_this1) AS create_var8
                }
                RETURN this0 { .id, actors: create_var8 } AS create_var9
            }
            RETURN [create_var9] AS data, meta"
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
        const query = /* GraphQL */ `
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

        const result = await translateQuery(neoSchema, query);

        expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
            "CALL {
            WITH [] AS meta
            CREATE (this0:Movie)
            SET this0.id = $this0_id
            CREATE (this0_actors0_node:Actor)
            SET this0_actors0_node.name = $this0_actors0_node_name
            CREATE (this0_actors0_node_movies0_node:Movie)
            SET this0_actors0_node_movies0_node.id = $this0_actors0_node_movies0_node_id
            WITH *, meta + { event: \\"create\\", id: id(this0_actors0_node_movies0_node), properties: { old: null, new: this0_actors0_node_movies0_node { .* } }, timestamp: timestamp(), typename: \\"Movie\\" } AS meta
            MERGE (this0_actors0_node)-[this0_actors0_node_movies0_relationship:ACTED_IN]->(this0_actors0_node_movies0_node)
            WITH *, meta + { event: \\"create_relationship\\", timestamp: timestamp(), id_from: id(this0_actors0_node), id_to: id(this0_actors0_node_movies0_node), id: id(this0_actors0_node_movies0_relationship), relationshipName: \\"ACTED_IN\\", fromTypename: \\"Actor\\", toTypename: \\"Movie\\", properties: { from: this0_actors0_node { .* }, to: this0_actors0_node_movies0_node { .* }, relationship: this0_actors0_node_movies0_relationship { .* } } } AS meta
            WITH *, meta + { event: \\"create\\", id: id(this0_actors0_node), properties: { old: null, new: this0_actors0_node { .* } }, timestamp: timestamp(), typename: \\"Actor\\" } AS meta
            MERGE (this0)<-[this0_actors0_relationship:ACTED_IN]-(this0_actors0_node)
            WITH *, meta + { event: \\"create_relationship\\", timestamp: timestamp(), id_from: id(this0_actors0_node), id_to: id(this0), id: id(this0_actors0_relationship), relationshipName: \\"ACTED_IN\\", fromTypename: \\"Actor\\", toTypename: \\"Movie\\", properties: { from: this0_actors0_node { .* }, to: this0 { .* }, relationship: this0_actors0_relationship { .* } } } AS meta
            WITH *, meta + { event: \\"create\\", id: id(this0), properties: { old: null, new: this0 { .* } }, timestamp: timestamp(), typename: \\"Movie\\" } AS meta
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
            WITH *, meta + { event: \\"create\\", id: id(this1_actors0_node_movies0_node), properties: { old: null, new: this1_actors0_node_movies0_node { .* } }, timestamp: timestamp(), typename: \\"Movie\\" } AS meta
            MERGE (this1_actors0_node)-[this1_actors0_node_movies0_relationship:ACTED_IN]->(this1_actors0_node_movies0_node)
            WITH *, meta + { event: \\"create_relationship\\", timestamp: timestamp(), id_from: id(this1_actors0_node), id_to: id(this1_actors0_node_movies0_node), id: id(this1_actors0_node_movies0_relationship), relationshipName: \\"ACTED_IN\\", fromTypename: \\"Actor\\", toTypename: \\"Movie\\", properties: { from: this1_actors0_node { .* }, to: this1_actors0_node_movies0_node { .* }, relationship: this1_actors0_node_movies0_relationship { .* } } } AS meta
            WITH *, meta + { event: \\"create\\", id: id(this1_actors0_node), properties: { old: null, new: this1_actors0_node { .* } }, timestamp: timestamp(), typename: \\"Actor\\" } AS meta
            MERGE (this1)<-[this1_actors0_relationship:ACTED_IN]-(this1_actors0_node)
            WITH *, meta + { event: \\"create_relationship\\", timestamp: timestamp(), id_from: id(this1_actors0_node), id_to: id(this1), id: id(this1_actors0_relationship), relationshipName: \\"ACTED_IN\\", fromTypename: \\"Actor\\", toTypename: \\"Movie\\", properties: { from: this1_actors0_node { .* }, to: this1 { .* }, relationship: this1_actors0_relationship { .* } } } AS meta
            WITH *, meta + { event: \\"create\\", id: id(this1), properties: { old: null, new: this1 { .* } }, timestamp: timestamp(), typename: \\"Movie\\" } AS meta
            RETURN this1, meta AS this1_meta
            }
            WITH this0, this1, this0_meta + this1_meta AS meta
            CALL {
                WITH this0
                RETURN this0 { .id } AS create_var0
            }
            CALL {
                WITH this1
                RETURN this1 { .id } AS create_var1
            }
            RETURN [create_var0, create_var1] AS data, meta"
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
        const query = /* GraphQL */ `
            mutation {
                createMovies(input: [{ id: "1" }]) {
                    info {
                        nodesCreated
                    }
                }
            }
        `;

        const result = await translateQuery(neoSchema, query);

        expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
            "CALL {
            WITH [] AS meta
            CREATE (this0:Movie)
            SET this0.id = $this0_id
            WITH *, meta + { event: \\"create\\", id: id(this0), properties: { old: null, new: this0 { .* } }, timestamp: timestamp(), typename: \\"Movie\\" } AS meta
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
