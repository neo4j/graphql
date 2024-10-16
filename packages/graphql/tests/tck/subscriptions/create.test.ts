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
            "UNWIND $create_param0 AS create_var0
            CALL {
                WITH create_var0
                CREATE (create_this1:Movie)
                SET
                    create_this1.title = create_var0.title
                WITH create_this1, create_var0
                CALL {
                    WITH create_this1, create_var0
                    UNWIND create_var0.actors.create AS create_var2
                    CREATE (create_this3:Actor)
                    SET
                        create_this3.name = create_var2.node.name
                    MERGE (create_this1)<-[create_this4:ACTED_IN]-(create_this3)
                    SET
                        create_this4.screenTime = create_var2.edge.screenTime
                    RETURN collect(NULL) AS create_var5
                }
                RETURN create_this1
            }
            CALL {
                WITH create_this1
                MATCH (create_this1)<-[create_this6:ACTED_IN]-(create_this7:Actor)
                WITH collect({ node: create_this7, relationship: create_this6 }) AS edges
                WITH edges, size(edges) AS totalCount
                CALL {
                    WITH edges
                    UNWIND edges AS edge
                    WITH edge.node AS create_this7, edge.relationship AS create_this6
                    RETURN collect({ properties: { screenTime: create_this6.screenTime, __resolveType: \\"ActedIn\\" }, node: { name: create_this7.name, __resolveType: \\"Actor\\" } }) AS create_var8
                }
                RETURN { edges: create_var8, totalCount: totalCount } AS create_var9
            }
            RETURN collect(create_this1 { .title, actorsConnection: create_var9 }) AS data"
        `);
        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"create_param0\\": [
                    {
                        \\"title\\": \\"Forrest Gump\\",
                        \\"actors\\": {
                            \\"create\\": [
                                {
                                    \\"edge\\": {
                                        \\"screenTime\\": {
                                            \\"low\\": 60,
                                            \\"high\\": 0
                                        }
                                    },
                                    \\"node\\": {
                                        \\"name\\": \\"Tom Hanks\\"
                                    }
                                }
                            ]
                        }
                    }
                ]
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
            "UNWIND $create_param0 AS create_var0
            CALL {
                WITH create_var0
                CREATE (create_this1:Movie)
                SET
                    create_this1.title = create_var0.title
                WITH create_this1, create_var0
                CALL {
                    WITH create_this1, create_var0
                    UNWIND create_var0.actors.create AS create_var2
                    CREATE (create_this3:Actor)
                    SET
                        create_this3.name = create_var2.node.name
                    MERGE (create_this1)<-[create_this4:ACTED_IN]-(create_this3)
                    RETURN collect(NULL) AS create_var5
                }
                RETURN create_this1
            }
            CALL {
                WITH create_this1
                MATCH (create_this1)<-[create_this6:ACTED_IN]-(create_this7:Actor)
                WITH collect({ node: create_this7, relationship: create_this6 }) AS edges
                WITH edges, size(edges) AS totalCount
                CALL {
                    WITH edges
                    UNWIND edges AS edge
                    WITH edge.node AS create_this7, edge.relationship AS create_this6
                    RETURN collect({ node: { name: create_this7.name, __resolveType: \\"Actor\\" } }) AS create_var8
                }
                RETURN { edges: create_var8, totalCount: totalCount } AS create_var9
            }
            RETURN collect(create_this1 { .title, actorsConnection: create_var9 }) AS data"
        `);
        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"create_param0\\": [
                    {
                        \\"title\\": \\"Forrest Gump\\",
                        \\"actors\\": {
                            \\"create\\": [
                                {
                                    \\"node\\": {
                                        \\"name\\": \\"Tom Hanks\\"
                                    }
                                }
                            ]
                        }
                    }
                ]
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
            "UNWIND $create_param0 AS create_var0
            CALL {
                WITH create_var0
                CREATE (create_this1:Movie)
                SET
                    create_this1.title = create_var0.title
                WITH create_this1, create_var0
                CALL {
                    WITH create_this1, create_var0
                    UNWIND create_var0.actors.create AS create_var2
                    CREATE (create_this3:Actor)
                    SET
                        create_this3.name = create_var2.node.name
                    MERGE (create_this1)<-[create_this4:ACTED_IN]-(create_this3)
                    SET
                        create_this4.screenTime = create_var2.edge.screenTime
                    WITH create_this3, create_var2
                    CALL {
                        WITH create_this3, create_var2
                        UNWIND create_var2.node.movies.create AS create_var5
                        CREATE (create_this6:Movie)
                        SET
                            create_this6.title = create_var5.node.title
                        MERGE (create_this3)-[create_this7:ACTED_IN]->(create_this6)
                        SET
                            create_this7.screenTime = create_var5.edge.screenTime
                        RETURN collect(NULL) AS create_var8
                    }
                    RETURN collect(NULL) AS create_var9
                }
                RETURN create_this1
            }
            CALL {
                WITH create_this1
                MATCH (create_this1)<-[create_this10:ACTED_IN]-(create_this11:Actor)
                WITH collect({ node: create_this11, relationship: create_this10 }) AS edges
                WITH edges, size(edges) AS totalCount
                CALL {
                    WITH edges
                    UNWIND edges AS edge
                    WITH edge.node AS create_this11, edge.relationship AS create_this10
                    RETURN collect({ properties: { screenTime: create_this10.screenTime, __resolveType: \\"ActedIn\\" }, node: { name: create_this11.name, __resolveType: \\"Actor\\" } }) AS create_var12
                }
                RETURN { edges: create_var12, totalCount: totalCount } AS create_var13
            }
            RETURN collect(create_this1 { .title, actorsConnection: create_var13 }) AS data"
        `);
        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"create_param0\\": [
                    {
                        \\"title\\": \\"Forrest Gump\\",
                        \\"actors\\": {
                            \\"create\\": [
                                {
                                    \\"edge\\": {
                                        \\"screenTime\\": {
                                            \\"low\\": 60,
                                            \\"high\\": 0
                                        }
                                    },
                                    \\"node\\": {
                                        \\"name\\": \\"Tom Hanks\\",
                                        \\"movies\\": {
                                            \\"create\\": [
                                                {
                                                    \\"edge\\": {
                                                        \\"screenTime\\": {
                                                            \\"low\\": 1990,
                                                            \\"high\\": 0
                                                        }
                                                    },
                                                    \\"node\\": {
                                                        \\"title\\": \\"Funny movie\\"
                                                    }
                                                }
                                            ]
                                        }
                                    }
                                }
                            ]
                        }
                    }
                ]
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
            CREATE (this0:Movie)
            SET this0.title = $this0_title
            WITH *
            CREATE (this0_directors_Person0_node:Person)
            SET this0_directors_Person0_node.name = $this0_directors_Person0_node_name
            MERGE (this0)<-[this0_directors_Person0_relationship:DIRECTED]-(this0_directors_Person0_node)
            SET this0_directors_Person0_relationship.year = $this0_directors_Person0_relationship_year
            WITH *
            CREATE (this0_directors_Actor0_node:Actor)
            SET this0_directors_Actor0_node.name = $this0_directors_Actor0_node_name
            MERGE (this0)<-[this0_directors_Actor0_relationship:DIRECTED]-(this0_directors_Actor0_node)
            SET this0_directors_Actor0_relationship.year = $this0_directors_Actor0_relationship_year
            RETURN this0
            }
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
            RETURN [create_var5] AS data"
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
            CREATE (this0:Movie)
            SET this0.title = $this0_title
            WITH *
            CREATE (this0_directors_Person0_node:Person)
            SET this0_directors_Person0_node.name = $this0_directors_Person0_node_name
            MERGE (this0)<-[this0_directors_Person0_relationship:DIRECTED]-(this0_directors_Person0_node)
            SET this0_directors_Person0_relationship.year = $this0_directors_Person0_relationship_year
            WITH *
            CREATE (this0_directors_Actor0_node:Actor)
            SET this0_directors_Actor0_node.name = $this0_directors_Actor0_node_name
            WITH *
            CREATE (this0_directors_Actor0_node_movies0_node:Movie)
            SET this0_directors_Actor0_node_movies0_node.title = $this0_directors_Actor0_node_movies0_node_title
            MERGE (this0_directors_Actor0_node)-[this0_directors_Actor0_node_movies0_relationship:ACTED_IN]->(this0_directors_Actor0_node_movies0_node)
            SET this0_directors_Actor0_node_movies0_relationship.screenTime = $this0_directors_Actor0_node_movies0_relationship_screenTime
            MERGE (this0)<-[this0_directors_Actor0_relationship:DIRECTED]-(this0_directors_Actor0_node)
            SET this0_directors_Actor0_relationship.year = $this0_directors_Actor0_relationship_year
            RETURN this0
            }
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
            RETURN [create_var8] AS data"
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
            "UNWIND $create_param0 AS create_var0
            CALL {
                WITH create_var0
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
                    }
                ]
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
            "UNWIND $create_param0 AS create_var0
            CALL {
                WITH create_var0
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
            "UNWIND $create_param0 AS create_var0
            CALL {
                WITH create_var0
                CREATE (create_this1:Movie)
                SET
                    create_this1.id = create_var0.id
                WITH create_this1, create_var0
                CALL {
                    WITH create_this1, create_var0
                    UNWIND create_var0.actors.create AS create_var2
                    CREATE (create_this3:Actor)
                    SET
                        create_this3.name = create_var2.node.name
                    MERGE (create_this1)<-[create_this4:ACTED_IN]-(create_this3)
                    RETURN collect(NULL) AS create_var5
                }
                RETURN create_this1
            }
            CALL {
                WITH create_this1
                MATCH (create_this1)<-[create_this6:ACTED_IN]-(create_this7:Actor)
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
                                    \\"node\\": {
                                        \\"name\\": \\"Andrés\\"
                                    }
                                }
                            ]
                        }
                    }
                ]
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
            "UNWIND $create_param0 AS create_var0
            CALL {
                WITH create_var0
                CREATE (create_this1:Movie)
                SET
                    create_this1.id = create_var0.id
                WITH create_this1, create_var0
                CALL {
                    WITH create_this1, create_var0
                    UNWIND create_var0.actors.create AS create_var2
                    CREATE (create_this3:Actor)
                    SET
                        create_this3.name = create_var2.node.name
                    MERGE (create_this1)<-[create_this4:ACTED_IN]-(create_this3)
                    WITH create_this3, create_var2
                    CALL {
                        WITH create_this3, create_var2
                        UNWIND create_var2.node.movies.create AS create_var5
                        CREATE (create_this6:Movie)
                        SET
                            create_this6.id = create_var5.node.id
                        MERGE (create_this3)-[create_this7:ACTED_IN]->(create_this6)
                        RETURN collect(NULL) AS create_var8
                    }
                    RETURN collect(NULL) AS create_var9
                }
                RETURN create_this1
            }
            CALL {
                WITH create_this1
                MATCH (create_this1)<-[create_this10:ACTED_IN]-(create_this11:Actor)
                WITH create_this11 { .name } AS create_this11
                RETURN collect(create_this11) AS create_var12
            }
            RETURN collect(create_this1 { .id, actors: create_var12 }) AS data"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"create_param0\\": [
                    {
                        \\"id\\": \\"1\\",
                        \\"actors\\": {
                            \\"create\\": [
                                {
                                    \\"node\\": {
                                        \\"name\\": \\"Andrés\\",
                                        \\"movies\\": {
                                            \\"create\\": [
                                                {
                                                    \\"node\\": {
                                                        \\"id\\": \\"6\\"
                                                    }
                                                }
                                            ]
                                        }
                                    }
                                }
                            ]
                        }
                    }
                ]
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
            "UNWIND $create_param0 AS create_var0
            CALL {
                WITH create_var0
                CREATE (create_this1:Movie)
                SET
                    create_this1.id = create_var0.id
                WITH create_this1, create_var0
                CALL {
                    WITH create_this1, create_var0
                    UNWIND create_var0.actors.create AS create_var2
                    CREATE (create_this3:Actor)
                    SET
                        create_this3.name = create_var2.node.name
                    MERGE (create_this1)<-[create_this4:ACTED_IN]-(create_this3)
                    WITH create_this3, create_var2
                    CALL {
                        WITH create_this3, create_var2
                        UNWIND create_var2.node.movies.create AS create_var5
                        CREATE (create_this6:Movie)
                        SET
                            create_this6.id = create_var5.node.id
                        MERGE (create_this3)-[create_this7:ACTED_IN]->(create_this6)
                        WITH create_this6, create_var5
                        CALL {
                            WITH create_this6, create_var5
                            UNWIND create_var5.node.actors.create AS create_var8
                            CREATE (create_this9:Actor)
                            SET
                                create_this9.name = create_var8.node.name
                            MERGE (create_this6)<-[create_this10:ACTED_IN]-(create_this9)
                            RETURN collect(NULL) AS create_var11
                        }
                        RETURN collect(NULL) AS create_var12
                    }
                    RETURN collect(NULL) AS create_var13
                }
                RETURN create_this1
            }
            CALL {
                WITH create_this1
                MATCH (create_this1)<-[create_this14:ACTED_IN]-(create_this15:Actor)
                CALL {
                    WITH create_this15
                    MATCH (create_this15)-[create_this16:ACTED_IN]->(create_this17:Movie)
                    CALL {
                        WITH create_this17
                        MATCH (create_this17)<-[create_this18:ACTED_IN]-(create_this19:Actor)
                        WITH create_this19 { .name } AS create_this19
                        RETURN collect(create_this19) AS create_var20
                    }
                    WITH create_this17 { .id, actors: create_var20 } AS create_this17
                    RETURN collect(create_this17) AS create_var21
                }
                WITH create_this15 { .name, movies: create_var21 } AS create_this15
                RETURN collect(create_this15) AS create_var22
            }
            RETURN collect(create_this1 { .id, actors: create_var22 }) AS data"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"create_param0\\": [
                    {
                        \\"id\\": \\"1\\",
                        \\"actors\\": {
                            \\"create\\": [
                                {
                                    \\"node\\": {
                                        \\"name\\": \\"Andrés\\",
                                        \\"movies\\": {
                                            \\"create\\": [
                                                {
                                                    \\"node\\": {
                                                        \\"id\\": \\"6\\",
                                                        \\"actors\\": {
                                                            \\"create\\": [
                                                                {
                                                                    \\"node\\": {
                                                                        \\"name\\": \\"Thomas\\"
                                                                    }
                                                                }
                                                            ]
                                                        }
                                                    }
                                                }
                                            ]
                                        }
                                    }
                                }
                            ]
                        }
                    }
                ]
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
            "UNWIND $create_param0 AS create_var0
            CALL {
                WITH create_var0
                CREATE (create_this1:Movie)
                SET
                    create_this1.id = create_var0.id
                WITH create_this1, create_var0
                CALL {
                    WITH create_this1, create_var0
                    UNWIND create_var0.actors.create AS create_var2
                    CREATE (create_this3:Actor)
                    SET
                        create_this3.name = create_var2.node.name
                    MERGE (create_this1)<-[create_this4:ACTED_IN]-(create_this3)
                    WITH create_this3, create_var2
                    CALL {
                        WITH create_this3, create_var2
                        UNWIND create_var2.node.movies.create AS create_var5
                        CREATE (create_this6:Movie)
                        SET
                            create_this6.id = create_var5.node.id
                        MERGE (create_this3)-[create_this7:ACTED_IN]->(create_this6)
                        RETURN collect(NULL) AS create_var8
                    }
                    RETURN collect(NULL) AS create_var9
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
                                    \\"node\\": {
                                        \\"name\\": \\"Andrés\\",
                                        \\"movies\\": {
                                            \\"create\\": [
                                                {
                                                    \\"node\\": {
                                                        \\"id\\": \\"6\\"
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
                        \\"actors\\": {
                            \\"create\\": [
                                {
                                    \\"node\\": {
                                        \\"name\\": \\"Darrell\\",
                                        \\"movies\\": {
                                            \\"create\\": [
                                                {
                                                    \\"node\\": {
                                                        \\"id\\": \\"8\\"
                                                    }
                                                }
                                            ]
                                        }
                                    }
                                }
                            ]
                        }
                    }
                ]
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
            "UNWIND $create_param0 AS create_var0
            CALL {
                WITH create_var0
                CREATE (create_this1:Movie)
                SET
                    create_this1.id = create_var0.id
                RETURN create_this1
            }
            RETURN \\"Query cannot conclude with CALL\\""
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"create_param0\\": [
                    {
                        \\"id\\": \\"1\\"
                    }
                ]
            }"
        `);
    });
});
