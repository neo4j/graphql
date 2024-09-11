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
import { createBearerToken } from "../../../utils/create-bearer-token";
import { formatCypher, formatParams, translateQuery } from "../../utils/tck-test-utils";

describe("cypher directive filtering", () => {
    test("Int cypher field AND String title field", async () => {
        const typeDefs = `
            type Movie {
                title: String
                special_count: Int
                    @cypher(
                        statement: """
                        MATCH (m:Movie)
                        RETURN count(m) as c
                        """
                        columnName: "c"
                    )
            }
        `;

        const query = `
            query {
                movies(where: { special_count_GTE: 1, title: "CustomType One" }) {
                    special_count
                }
            }
        `;

        const neoSchema: Neo4jGraphQL = new Neo4jGraphQL({
            typeDefs,
        });

        const result = await translateQuery(neoSchema, query);

        expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
            "MATCH (this:Movie)
            CALL {
                WITH this
                CALL {
                    WITH this
                    WITH this AS this
                    MATCH (m:Movie)
                    RETURN count(m) as c
                }
                WITH c AS this0
                RETURN this0 AS var1
            }
            WITH *
            WHERE (this.title = $param0 AND var1 >= $param1)
            CALL {
                WITH this
                CALL {
                    WITH this
                    WITH this AS this
                    MATCH (m:Movie)
                    RETURN count(m) as c
                }
                WITH c AS this2
                RETURN this2 AS var3
            }
            RETURN this { special_count: var3 } AS this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"param0\\": \\"CustomType One\\",
                \\"param1\\": {
                    \\"low\\": 1,
                    \\"high\\": 0
                }
            }"
        `);
    });

    test("unmatched Int cypher field AND String title field", async () => {
        const typeDefs = `
            type Movie {
                title: String
                special_count: Int
                    @cypher(
                        statement: """
                        MATCH (m:Movie)
                        RETURN count(m) as c
                        """
                        columnName: "c"
                    )
            }
        `;

        const query = `
            query {
                movies(where: { special_count_GTE: 1, title: "CustomType Unknown" }) {
                    special_count
                }
            }
        `;

        const neoSchema: Neo4jGraphQL = new Neo4jGraphQL({
            typeDefs,
        });

        const result = await translateQuery(neoSchema, query);

        expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
            "MATCH (this:Movie)
            CALL {
                WITH this
                CALL {
                    WITH this
                    WITH this AS this
                    MATCH (m:Movie)
                    RETURN count(m) as c
                }
                WITH c AS this0
                RETURN this0 AS var1
            }
            WITH *
            WHERE (this.title = $param0 AND var1 >= $param1)
            CALL {
                WITH this
                CALL {
                    WITH this
                    WITH this AS this
                    MATCH (m:Movie)
                    RETURN count(m) as c
                }
                WITH c AS this2
                RETURN this2 AS var3
            }
            RETURN this { special_count: var3 } AS this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"param0\\": \\"CustomType Unknown\\",
                \\"param1\\": {
                    \\"low\\": 1,
                    \\"high\\": 0
                }
            }"
        `);
    });

    test("Int cypher field, selecting String title field", async () => {
        const typeDefs = `
            type Movie {
                title: String
                special_count: Int
                    @cypher(
                        statement: """
                        MATCH (m:Movie)
                        RETURN count(m) as c
                        """
                        columnName: "c"
                    )
            }
        `;

        const query = `
            query {
                movies(where: { special_count_GTE: 1 }) {
                    title
                }
            }
        `;

        const neoSchema: Neo4jGraphQL = new Neo4jGraphQL({
            typeDefs,
        });

        const result = await translateQuery(neoSchema, query);

        expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
            "MATCH (this:Movie)
            CALL {
                WITH this
                CALL {
                    WITH this
                    WITH this AS this
                    MATCH (m:Movie)
                    RETURN count(m) as c
                }
                WITH c AS this0
                RETURN this0 AS var1
            }
            WITH *
            WHERE var1 >= $param0
            RETURN this { .title } AS this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"param0\\": {
                    \\"low\\": 1,
                    \\"high\\": 0
                }
            }"
        `);
    });

    test("Point cypher field", async () => {
        const typeDefs = `
            type Movie {
                title: String
                special_location: Point
                    @cypher(
                        statement: """
                        RETURN point({ longitude: 1.0, latitude: 1.0 }) AS l
                        """
                        columnName: "l"
                    )
            }
        `;

        const query = `
            query {
                movies(
                    where: {
                        special_location_DISTANCE: {
                            point: { latitude: 1, longitude: 1 }
                            distance: 0
                        }
                    }
                ) {
                    title
                    special_location {
                        latitude
                        longitude
                    }
                }
            }
        `;

        const neoSchema: Neo4jGraphQL = new Neo4jGraphQL({
            typeDefs,
        });

        const result = await translateQuery(neoSchema, query);

        expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
            "MATCH (this:Movie)
            CALL {
                WITH this
                CALL {
                    WITH this
                    WITH this AS this
                    RETURN point({ longitude: 1.0, latitude: 1.0 }) AS l
                }
                WITH l AS this0
                RETURN this0 AS var1
            }
            WITH *
            WHERE point.distance(var1, point($param0.point)) = $param0.distance
            CALL {
                WITH this
                CALL {
                    WITH this
                    WITH this AS this
                    RETURN point({ longitude: 1.0, latitude: 1.0 }) AS l
                }
                WITH l AS this2
                RETURN this2 AS var3
            }
            RETURN this { .title, special_location: var3 } AS this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"param0\\": {
                    \\"point\\": {
                        \\"longitude\\": 1,
                        \\"latitude\\": 1
                    },
                    \\"distance\\": 0
                }
            }"
        `);
    });

    test("CartesianPoint cypher field", async () => {
        const typeDefs = `
            type Movie {
                title: String
                special_location: CartesianPoint
                    @cypher(
                        statement: """
                        RETURN point({ x: 1.0, y: 1.0, z: 1.0 }) AS l
                        """
                        columnName: "l"
                    )
            }
        `;

        const query = `
            query {
                movies(
                    where: {
                        special_location_DISTANCE: {
                            point: { x: 1, y: 1, z: 2 }
                            distance: 1
                        }
                    }
                ) {
                    title
                    special_location {
                        x
                        y
                        z
                    }
                }
            }
        `;

        const neoSchema: Neo4jGraphQL = new Neo4jGraphQL({
            typeDefs,
        });

        const result = await translateQuery(neoSchema, query);

        expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
            "MATCH (this:Movie)
            CALL {
                WITH this
                CALL {
                    WITH this
                    WITH this AS this
                    RETURN point({ x: 1.0, y: 1.0, z: 1.0 }) AS l
                }
                WITH l AS this0
                RETURN this0 AS var1
            }
            WITH *
            WHERE point.distance(var1, point($param0.point)) = $param0.distance
            CALL {
                WITH this
                CALL {
                    WITH this
                    WITH this AS this
                    RETURN point({ x: 1.0, y: 1.0, z: 1.0 }) AS l
                }
                WITH l AS this2
                RETURN this2 AS var3
            }
            RETURN this { .title, special_location: var3 } AS this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"param0\\": {
                    \\"point\\": {
                        \\"x\\": 1,
                        \\"y\\": 1,
                        \\"z\\": 2
                    },
                    \\"distance\\": 1
                }
            }"
        `);
    });

    test("DateTime cypher field", async () => {
        const typeDefs = `
            type Movie {
                title: String
                special_time: DateTime
                    @cypher(
                        statement: """
                        RETURN datetime("2024-09-03T15:30:00Z") AS t
                        """
                        columnName: "t"
                    )
            }
        `;

        const query = `
            query {
                movies(
                    where: {
                        special_time_GT: "2024-09-02T00:00:00Z"
                    }
                ) {
                    special_time
                    title
                }
            }
        `;

        const neoSchema: Neo4jGraphQL = new Neo4jGraphQL({
            typeDefs,
        });

        const result = await translateQuery(neoSchema, query);

        expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
            "MATCH (this:Movie)
            CALL {
                WITH this
                CALL {
                    WITH this
                    WITH this AS this
                    RETURN datetime(\\"2024-09-03T15:30:00Z\\") AS t
                }
                WITH t AS this0
                RETURN this0 AS var1
            }
            WITH *
            WHERE var1 > $param0
            CALL {
                WITH this
                CALL {
                    WITH this
                    WITH this AS this
                    RETURN datetime(\\"2024-09-03T15:30:00Z\\") AS t
                }
                WITH t AS this2
                RETURN this2 AS var3
            }
            RETURN this { .title, special_time: var3 } AS this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"param0\\": {
                    \\"year\\": 2024,
                    \\"month\\": 9,
                    \\"day\\": 2,
                    \\"hour\\": 0,
                    \\"minute\\": 0,
                    \\"second\\": 0,
                    \\"nanosecond\\": 0,
                    \\"timeZoneOffsetSeconds\\": 0
                }
            }"
        `);
    });

    test("With relationship filter (non-Cypher field)", async () => {
        const typeDefs = `
            type Movie {
                title: String
                custom_field: String
                    @cypher(
                        statement: """
                        RETURN "hello world!" AS s
                        """
                        columnName: "s"
                    )
                actors: [Actor!]! @relationship(type: "ACTED_IN", direction: IN)
            }

            type Actor {
                name: String
                movies: [Movie!]! @relationship(type: "ACTED_IN", direction: OUT)
            }
        `;

        const query = `
            query {
                movies(
                    where: {
                        custom_field: "hello world!"
                        actors_SOME: {
                            name: "Keanu Reeves"
                        } 
                    }
                ) {
                    custom_field
                    title
                    actors {
                        name
                    }
                }
            }
        `;

        const neoSchema: Neo4jGraphQL = new Neo4jGraphQL({
            typeDefs,
        });

        const result = await translateQuery(neoSchema, query);

        expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
            "MATCH (this:Movie)
            CALL {
                WITH this
                CALL {
                    WITH this
                    WITH this AS this
                    RETURN \\"hello world!\\" AS s
                }
                WITH s AS this0
                RETURN this0 AS var1
            }
            WITH *
            WHERE (var1 = $param0 AND EXISTS {
                MATCH (this)<-[:ACTED_IN]-(this2:Actor)
                WHERE this2.name = $param1
            })
            CALL {
                WITH this
                CALL {
                    WITH this
                    WITH this AS this
                    RETURN \\"hello world!\\" AS s
                }
                WITH s AS this3
                RETURN this3 AS var4
            }
            CALL {
                WITH this
                MATCH (this)<-[this5:ACTED_IN]-(this6:Actor)
                WITH this6 { .name } AS this6
                RETURN collect(this6) AS var7
            }
            RETURN this { .title, custom_field: var4, actors: var7 } AS this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"param0\\": \\"hello world!\\",
                \\"param1\\": \\"Keanu Reeves\\"
            }"
        `);
    });

    test("In a nested filter", async () => {
        const typeDefs = `
            type Movie {
                title: String
                custom_field: String
                    @cypher(
                        statement: """
                        RETURN "hello world!" AS s
                        """
                        columnName: "s"
                    )
                actors: [Actor!]! @relationship(type: "ACTED_IN", direction: IN)
            }

            type Actor {
                name: String
                movies: [Movie!]! @relationship(type: "ACTED_IN", direction: OUT)
            }
        `;

        const query = `
            query {
                actors {
                    name
                    movies(where: { custom_field: "hello world!"}) {
                        title
                    }
                }
            }
        `;

        const neoSchema: Neo4jGraphQL = new Neo4jGraphQL({
            typeDefs,
        });

        const result = await translateQuery(neoSchema, query);

        expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
            "MATCH (this:Actor)
            CALL {
                WITH this
                MATCH (this)-[this0:ACTED_IN]->(this1:Movie)
                CALL {
                    WITH this1
                    CALL {
                        WITH this1
                        WITH this1 AS this
                        RETURN \\"hello world!\\" AS s
                    }
                    WITH s AS this2
                    RETURN this2 AS var3
                }
                WITH *
                WHERE var3 = $param0
                WITH this1 { .title } AS this1
                RETURN collect(this1) AS var4
            }
            RETURN this { .name, movies: var4 } AS this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"param0\\": \\"hello world!\\"
            }"
        `);
    });

    test("With a nested filter", async () => {
        const typeDefs = `
            type Movie {
                title: String
                custom_field: String
                    @cypher(
                        statement: """
                        RETURN "hello world!" AS s
                        """
                        columnName: "s"
                    )
                actors: [Actor!]! @relationship(type: "ACTED_IN", direction: IN)
            }

            type Actor {
                name: String
                movies: [Movie!]! @relationship(type: "ACTED_IN", direction: OUT)
            }
        `;

        const query = `
            query {
                movies(where: { custom_field: "hello world!" }) {
                    title
                    actors(where: { name: "Keanu Reeves" }) {
                        name
                    }
                }
            }
        `;

        const neoSchema: Neo4jGraphQL = new Neo4jGraphQL({
            typeDefs,
        });

        const result = await translateQuery(neoSchema, query);

        expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
            "MATCH (this:Movie)
            CALL {
                WITH this
                CALL {
                    WITH this
                    WITH this AS this
                    RETURN \\"hello world!\\" AS s
                }
                WITH s AS this0
                RETURN this0 AS var1
            }
            WITH *
            WHERE var1 = $param0
            CALL {
                WITH this
                MATCH (this)<-[this2:ACTED_IN]-(this3:Actor)
                WHERE this3.name = $param1
                WITH this3 { .name } AS this3
                RETURN collect(this3) AS var4
            }
            RETURN this { .title, actors: var4 } AS this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"param0\\": \\"hello world!\\",
                \\"param1\\": \\"Keanu Reeves\\"
            }"
        `);
    });

    test("With authorization (custom Cypher field)", async () => {
        const typeDefs = `
            type Movie {
                title: String
                custom_field: String
                    @cypher(
                        statement: """
                        RETURN "hello world!" AS s
                        """
                        columnName: "s"
                    )
                    @authorization(filter: [{ where: { node: { title: "$jwt.title" } } }])
                actors: [Actor!]! @relationship(type: "ACTED_IN", direction: IN)
            }

            type Actor {
                name: String
                movies: [Movie!]! @relationship(type: "ACTED_IN", direction: OUT)
            }
        `;

        const token = createBearerToken("secret", { title: "The Matrix" });

        const query = `
            query {
                movies(where: { custom_field: "hello world!" }) {
                    title
                    custom_field
                    actors {
                        name
                    }
                }
            }
        `;

        const neoSchema: Neo4jGraphQL = new Neo4jGraphQL({
            typeDefs,
            features: {
                authorization: {
                    key: "secret",
                },
            },
        });

        const result = await translateQuery(neoSchema, query, { token });

        expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
            "MATCH (this:Movie)
            CALL {
                WITH this
                CALL {
                    WITH this
                    WITH this AS this
                    RETURN \\"hello world!\\" AS s
                }
                WITH s AS this0
                RETURN this0 AS var1
            }
            WITH *
            WHERE (var1 = $param0 AND ($isAuthenticated = true AND ($jwt.title IS NOT NULL AND this.title = $jwt.title)))
            CALL {
                WITH this
                CALL {
                    WITH this
                    WITH this AS this
                    RETURN \\"hello world!\\" AS s
                }
                WITH s AS this2
                RETURN this2 AS var3
            }
            CALL {
                WITH this
                MATCH (this)<-[this4:ACTED_IN]-(this5:Actor)
                WITH this5 { .name } AS this5
                RETURN collect(this5) AS var6
            }
            RETURN this { .title, custom_field: var3, actors: var6 } AS this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"param0\\": \\"hello world!\\",
                \\"isAuthenticated\\": true,
                \\"jwt\\": {
                    \\"roles\\": [],
                    \\"title\\": \\"The Matrix\\"
                }
            }"
        `);
    });

    test("With authorization (not custom Cypher field)", async () => {
        const typeDefs = `
            type Movie {
                title: String @authorization(filter: [{ where: { node: { title: "$jwt.title" } } }])
                custom_field: String
                    @cypher(
                        statement: """
                        RETURN "hello world!" AS s
                        """
                        columnName: "s"
                    )
                actors: [Actor!]! @relationship(type: "ACTED_IN", direction: IN)
            }

            type Actor {
                name: String
                movies: [Movie!]! @relationship(type: "ACTED_IN", direction: OUT)
            }
        `;

        const token = createBearerToken("secret", { title: "The Matrix" });

        const query = `
            query {
                movies(where: { custom_field: "hello world!" }) {
                    title
                    actors {
                        name
                    }
                }
            }
        `;

        const neoSchema: Neo4jGraphQL = new Neo4jGraphQL({
            typeDefs,
            features: {
                authorization: {
                    key: "secret",
                },
            },
        });

        const result = await translateQuery(neoSchema, query, { token });

        expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
            "MATCH (this:Movie)
            CALL {
                WITH this
                CALL {
                    WITH this
                    WITH this AS this
                    RETURN \\"hello world!\\" AS s
                }
                WITH s AS this0
                RETURN this0 AS var1
            }
            WITH *
            WHERE (var1 = $param0 AND ($isAuthenticated = true AND ($jwt.title IS NOT NULL AND this.title = $jwt.title)))
            CALL {
                WITH this
                MATCH (this)<-[this2:ACTED_IN]-(this3:Actor)
                WITH this3 { .name } AS this3
                RETURN collect(this3) AS var4
            }
            RETURN this { .title, actors: var4 } AS this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"param0\\": \\"hello world!\\",
                \\"isAuthenticated\\": true,
                \\"jwt\\": {
                    \\"roles\\": [],
                    \\"title\\": \\"The Matrix\\"
                }
            }"
        `);
    });

    test("With sorting", async () => {
        const typeDefs = `
            type Movie {
                title: String
                custom_field: String
                    @cypher(
                        statement: """
                        RETURN "hello world!" AS s
                        """
                        columnName: "s"
                    )
                actors: [Actor!]! @relationship(type: "ACTED_IN", direction: IN)
            }

            type Actor {
                name: String
                movies: [Movie!]! @relationship(type: "ACTED_IN", direction: OUT)
            }
        `;

        const query = `
            query {
                movies(
                    where: { custom_field: "hello world!" }
                    options: { sort: [{ title: DESC }] }
                ) {
                    title
                    actors {
                        name
                    }
                }
            }
        `;

        const neoSchema: Neo4jGraphQL = new Neo4jGraphQL({
            typeDefs,
        });

        const result = await translateQuery(neoSchema, query);

        expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
            "MATCH (this:Movie)
            CALL {
                WITH this
                CALL {
                    WITH this
                    WITH this AS this
                    RETURN \\"hello world!\\" AS s
                }
                WITH s AS this0
                RETURN this0 AS var1
            }
            WITH *
            WHERE var1 = $param0
            WITH *
            ORDER BY this.title DESC
            CALL {
                WITH this
                MATCH (this)<-[this2:ACTED_IN]-(this3:Actor)
                WITH this3 { .name } AS this3
                RETURN collect(this3) AS var4
            }
            RETURN this { .title, actors: var4 } AS this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"param0\\": \\"hello world!\\"
            }"
        `);
    });

    test("Connect filter", async () => {
        const typeDefs = `
            type Movie {
                title: String
                actors: [Actor!]! @relationship(type: "ACTED_IN", direction: IN)
            }

            type Actor {
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

        const query = `
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
                                                name: "Keanu Reeves",
                                                custom_field: "hello world!"
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
            			MERGE (this0)<-[:ACTED_IN]-(this0_actors_connect0_node)
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

    test("With two cypher fields", async () => {
        const typeDefs = `
            type Movie {
                title: String
                custom_field: String
                    @cypher(
                        statement: """
                        RETURN "hello world!" AS s
                        """
                        columnName: "s"
                    )
                another_custom_field: Int
                    @cypher(
                        statement: """
                        RETURN 100 AS i
                        """
                        columnName: "i"
                    )
                actors: [Actor!]! @relationship(type: "ACTED_IN", direction: IN)
            }

            type Actor {
                name: String
                another_custom_field: String
                    @cypher(
                        statement: """
                        RETURN "goodbye!" AS s
                        """
                        columnName: "s"
                    )
                movies: [Movie!]! @relationship(type: "ACTED_IN", direction: OUT)
            }
        `;

        const query = `
            query {
                movies(where: { custom_field: "hello world!", another_custom_field_GT: 50 }) {
                    title
                    actors {
                        name
                    }
                }
            }
        `;

        const neoSchema: Neo4jGraphQL = new Neo4jGraphQL({
            typeDefs,
        });

        const result = await translateQuery(neoSchema, query);

        expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
            "MATCH (this:Movie)
            CALL {
                WITH this
                CALL {
                    WITH this
                    WITH this AS this
                    RETURN \\"hello world!\\" AS s
                }
                WITH s AS this0
                RETURN this0 AS var1
            }
            CALL {
                WITH this
                CALL {
                    WITH this
                    WITH this AS this
                    RETURN 100 AS i
                }
                WITH i AS this2
                RETURN this2 AS var3
            }
            WITH *
            WHERE (var1 = $param0 AND var3 > $param1)
            CALL {
                WITH this
                MATCH (this)<-[this4:ACTED_IN]-(this5:Actor)
                WITH this5 { .name } AS this5
                RETURN collect(this5) AS var6
            }
            RETURN this { .title, actors: var6 } AS this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"param0\\": \\"hello world!\\",
                \\"param1\\": {
                    \\"low\\": 50,
                    \\"high\\": 0
                }
            }"
        `);
    });

    test("With two cypher fields, one nested", async () => {
        const typeDefs = `
            type Movie {
                title: String
                custom_field: String
                    @cypher(
                        statement: """
                        RETURN "hello world!" AS s
                        """
                        columnName: "s"
                    )
                actors: [Actor!]! @relationship(type: "ACTED_IN", direction: IN)
            }

            type Actor {
                name: String
                another_custom_field: String
                    @cypher(
                        statement: """
                        RETURN "goodbye!" AS s
                        """
                        columnName: "s"
                    )
                movies: [Movie!]! @relationship(type: "ACTED_IN", direction: OUT)
            }
        `;

        const query = `
            query {
                movies(where: { custom_field: "hello world!" }) {
                    title
                    actors(where: { another_custom_field: "goodbye!" name: "Keanu Reeves" }) {
                        name
                    }
                }
            }
        `;

        const neoSchema: Neo4jGraphQL = new Neo4jGraphQL({
            typeDefs,
        });

        const result = await translateQuery(neoSchema, query);

        expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
            "MATCH (this:Movie)
            CALL {
                WITH this
                CALL {
                    WITH this
                    WITH this AS this
                    RETURN \\"hello world!\\" AS s
                }
                WITH s AS this0
                RETURN this0 AS var1
            }
            WITH *
            WHERE var1 = $param0
            CALL {
                WITH this
                MATCH (this)<-[this2:ACTED_IN]-(this3:Actor)
                CALL {
                    WITH this3
                    CALL {
                        WITH this3
                        WITH this3 AS this
                        RETURN \\"goodbye!\\" AS s
                    }
                    WITH s AS this4
                    RETURN this4 AS var5
                }
                WITH *
                WHERE (this3.name = $param1 AND var5 = $param2)
                WITH this3 { .name } AS this3
                RETURN collect(this3) AS var6
            }
            RETURN this { .title, actors: var6 } AS this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"param0\\": \\"hello world!\\",
                \\"param1\\": \\"Keanu Reeves\\",
                \\"param2\\": \\"goodbye!\\"
            }"
        `);
    });
});
