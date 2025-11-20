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
import { formatCypher, formatParams, translateQuery } from "../utils/tck-test-utils";

describe("Cypher Update", () => {
    let typeDefs: string;
    let neoSchema: Neo4jGraphQL;

    beforeAll(() => {
        typeDefs = /* GraphQL */ `
            type Actor @node {
                name: String
                movies: [Movie!]! @relationship(type: "ACTED_IN", properties: "ActedIn", direction: OUT)
            }

            type Movie @node {
                id: ID
                title: String
                actors: [Actor!]! @relationship(type: "ACTED_IN", properties: "ActedIn", direction: IN)
            }

            type ActedIn @relationshipProperties {
                screenTime: Int
            }
        `;

        neoSchema = new Neo4jGraphQL({
            typeDefs,
        });
    });

    test("Simple Update", async () => {
        const query = /* GraphQL */ `
            mutation {
                updateMovies(where: { id: { eq: "1" } }, update: { id_SET: "2" }) {
                    movies {
                        id
                    }
                }
            }
        `;

        const result = await translateQuery(neoSchema, query);

        expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
            "CYPHER 5
            MATCH (this:Movie)
            WITH *
            WHERE this.id = $param0
            SET
                this.id = $param1
            WITH this
            RETURN this { .id } AS this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"param0\\": \\"1\\",
                \\"param1\\": \\"2\\"
            }"
        `);
    });

    test("Single Nested Update", async () => {
        const query = /* GraphQL */ `
            mutation {
                updateMovies(
                    where: { id: { eq: "1" } }
                    update: {
                        actors: [
                            {
                                # where: { node: { name: { eq: "old name" } } }
                                update: {
                                    where: { node: { name: { eq: "old name" } } }
                                    node: { name_SET: "new name" }
                                }
                            }
                        ]
                    }
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
            MATCH (this:Movie)
            WITH *
            WHERE this.id = $param0
            WITH *
            CALL (*) {
                MATCH (this)<-[this0:ACTED_IN]-(this1:Actor)
                WITH *
                WHERE this1.name = $param1
                SET
                    this1.name = $param2
            }
            WITH this
            RETURN this { .id } AS this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"param0\\": \\"1\\",
                \\"param1\\": \\"old name\\",
                \\"param2\\": \\"new name\\"
            }"
        `);
    });

    test("Double Nested Update", async () => {
        const query = /* GraphQL */ `
            mutation {
                updateMovies(
                    where: { id: { eq: "1" } }
                    update: {
                        actors: [
                            {
                                update: {
                                    where: { node: { name: { eq: "old actor name" } } }
                                    node: {
                                        name_SET: "new actor name"
                                        movies: [
                                            {
                                                update: {
                                                    where: { node: { id: { eq: "old movie title" } } }
                                                    node: { title_SET: "new movie title" }
                                                }
                                            }
                                        ]
                                    }
                                }
                            }
                        ]
                    }
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
            MATCH (this:Movie)
            WITH *
            WHERE this.id = $param0
            WITH *
            CALL (*) {
                MATCH (this)<-[this0:ACTED_IN]-(this1:Actor)
                WITH *
                WHERE this1.name = $param1
                SET
                    this1.name = $param2
                WITH *
                CALL (*) {
                    MATCH (this1)-[this2:ACTED_IN]->(this3:Movie)
                    WITH *
                    WHERE this3.id = $param3
                    SET
                        this3.title = $param4
                }
            }
            WITH this
            RETURN this { .id } AS this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"param0\\": \\"1\\",
                \\"param1\\": \\"old actor name\\",
                \\"param2\\": \\"new actor name\\",
                \\"param3\\": \\"old movie title\\",
                \\"param4\\": \\"new movie title\\"
            }"
        `);
    });

    test("Simple Update as Connect", async () => {
        const query = /* GraphQL */ `
            mutation {
                updateMovies(
                    where: { id: { eq: "1" } }
                    update: { actors: { connect: [{ where: { node: { name: { eq: "Daniel" } } } }] } }
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
            MATCH (this:Movie)
            WITH *
            WHERE this.id = $param0
            WITH *
            CALL (*) {
                CALL (this) {
                    MATCH (this0:Actor)
                    WHERE this0.name = $param1
                    CREATE (this)<-[this1:ACTED_IN]-(this0)
                }
            }
            WITH this
            RETURN this { .id } AS this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"param0\\": \\"1\\",
                \\"param1\\": \\"Daniel\\"
            }"
        `);
    });

    test("Update as multiple Connect", async () => {
        const query = /* GraphQL */ `
            mutation {
                updateMovies(
                    where: { id: { eq: "1" } }
                    update: {
                        actors: {
                            connect: [
                                { where: { node: { name: { eq: "Daniel" } } } }
                                { where: { node: { name: { eq: "Darrell" } } } }
                            ]
                        }
                    }
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
            MATCH (this:Movie)
            WITH *
            WHERE this.id = $param0
            WITH *
            CALL (*) {
                CALL (this) {
                    MATCH (this0:Actor)
                    WHERE this0.name = $param1
                    CREATE (this)<-[this1:ACTED_IN]-(this0)
                }
            }
            WITH *
            CALL (*) {
                CALL (this) {
                    MATCH (this2:Actor)
                    WHERE this2.name = $param2
                    CREATE (this)<-[this3:ACTED_IN]-(this2)
                }
            }
            WITH this
            RETURN this { .id } AS this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"param0\\": \\"1\\",
                \\"param1\\": \\"Daniel\\",
                \\"param2\\": \\"Darrell\\"
            }"
        `);
    });

    test("Simple Update as Disconnect", async () => {
        const query = /* GraphQL */ `
            mutation {
                updateMovies(
                    where: { id: { eq: "1" } }
                    update: { actors: { disconnect: [{ where: { node: { name: { eq: "Daniel" } } } }] } }
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
            MATCH (this:Movie)
            WITH *
            WHERE this.id = $param0
            WITH *
            CALL (*) {
                CALL (this) {
                    OPTIONAL MATCH (this)<-[this0:ACTED_IN]-(this1:Actor)
                    WHERE this1.name = $param1
                    WITH *
                    DELETE this0
                }
            }
            WITH this
            RETURN this { .id } AS this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"param0\\": \\"1\\",
                \\"param1\\": \\"Daniel\\"
            }"
        `);
    });

    test("Update as multiple Disconnect", async () => {
        const query = /* GraphQL */ `
            mutation {
                updateMovies(
                    where: { id: { eq: "1" } }
                    update: {
                        actors: {
                            disconnect: [
                                { where: { node: { name: { eq: "Daniel" } } } }
                                { where: { node: { name: { eq: "Darrell" } } } }
                            ]
                        }
                    }
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
            MATCH (this:Movie)
            WITH *
            WHERE this.id = $param0
            WITH *
            CALL (*) {
                CALL (this) {
                    OPTIONAL MATCH (this)<-[this0:ACTED_IN]-(this1:Actor)
                    WHERE this1.name = $param1
                    WITH *
                    DELETE this0
                }
            }
            WITH *
            CALL (*) {
                CALL (this) {
                    OPTIONAL MATCH (this)<-[this2:ACTED_IN]-(this3:Actor)
                    WHERE this3.name = $param2
                    WITH *
                    DELETE this2
                }
            }
            WITH this
            RETURN this { .id } AS this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"param0\\": \\"1\\",
                \\"param1\\": \\"Daniel\\",
                \\"param2\\": \\"Darrell\\"
            }"
        `);
    });

    test("Update an Actor while creating and connecting to a new Movie (via field level)", async () => {
        const query = /* GraphQL */ `
            mutation {
                updateActors(
                    where: { name: { eq: "Dan" } }
                    update: { movies: { create: [{ node: { id: "dan_movie_id", title: "The Story of Beer" } }] } }
                ) {
                    actors {
                        name
                        movies {
                            id
                            title
                        }
                    }
                }
            }
        `;

        const result = await translateQuery(neoSchema, query);

        expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
            "CYPHER 5
            MATCH (this:Actor)
            WITH *
            WHERE this.name = $param0
            WITH *
            CALL (*) {
                CREATE (this0:Movie)
                MERGE (this)-[this1:ACTED_IN]->(this0)
                SET
                    this0.id = $param1,
                    this0.title = $param2
            }
            WITH this
            CALL (this) {
                MATCH (this)-[this2:ACTED_IN]->(this3:Movie)
                WITH DISTINCT this3
                WITH this3 { .id, .title } AS this3
                RETURN collect(this3) AS var4
            }
            RETURN this { .name, movies: var4 } AS this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"param0\\": \\"Dan\\",
                \\"param1\\": \\"dan_movie_id\\",
                \\"param2\\": \\"The Story of Beer\\"
            }"
        `);
    });

    test("Update an Actor while creating and connecting to a new Movie (via top level)", async () => {
        const query = /* GraphQL */ `
            mutation {
                updateActors(
                    where: { name: { eq: "Dan" } }
                    update: { movies: { create: [{ node: { id: "dan_movie_id", title: "The Story of Beer" } }] } }
                ) {
                    actors {
                        name
                        movies {
                            id
                            title
                        }
                    }
                }
            }
        `;

        const result = await translateQuery(neoSchema, query);

        expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
            "CYPHER 5
            MATCH (this:Actor)
            WITH *
            WHERE this.name = $param0
            WITH *
            CALL (*) {
                CREATE (this0:Movie)
                MERGE (this)-[this1:ACTED_IN]->(this0)
                SET
                    this0.id = $param1,
                    this0.title = $param2
            }
            WITH this
            CALL (this) {
                MATCH (this)-[this2:ACTED_IN]->(this3:Movie)
                WITH DISTINCT this3
                WITH this3 { .id, .title } AS this3
                RETURN collect(this3) AS var4
            }
            RETURN this { .name, movies: var4 } AS this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"param0\\": \\"Dan\\",
                \\"param1\\": \\"dan_movie_id\\",
                \\"param2\\": \\"The Story of Beer\\"
            }"
        `);
    });

    test("Update an Actor while creating and connecting to multiple new Movies (via top level)", async () => {
        const query = /* GraphQL */ `
            mutation {
                updateActors(
                    where: { name: { eq: "Dan" } }
                    update: {
                        movies: {
                            create: [
                                { node: { id: "dan_movie_id", title: "The Story of Beer" } }
                                { node: { id: "dan_movie2_id", title: "Forrest Gump" } }
                            ]
                        }
                    }
                ) {
                    actors {
                        name
                        movies {
                            id
                            title
                        }
                    }
                }
            }
        `;

        const result = await translateQuery(neoSchema, query);

        expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
            "CYPHER 5
            MATCH (this:Actor)
            WITH *
            WHERE this.name = $param0
            WITH *
            CALL (*) {
                CREATE (this0:Movie)
                MERGE (this)-[this1:ACTED_IN]->(this0)
                SET
                    this0.id = $param1,
                    this0.title = $param2
            }
            WITH *
            CALL (*) {
                CREATE (this2:Movie)
                MERGE (this)-[this3:ACTED_IN]->(this2)
                SET
                    this2.id = $param3,
                    this2.title = $param4
            }
            WITH this
            CALL (this) {
                MATCH (this)-[this4:ACTED_IN]->(this5:Movie)
                WITH DISTINCT this5
                WITH this5 { .id, .title } AS this5
                RETURN collect(this5) AS var6
            }
            RETURN this { .name, movies: var6 } AS this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"param0\\": \\"Dan\\",
                \\"param1\\": \\"dan_movie_id\\",
                \\"param2\\": \\"The Story of Beer\\",
                \\"param3\\": \\"dan_movie2_id\\",
                \\"param4\\": \\"Forrest Gump\\"
            }"
        `);
    });

    test("Delete related node as update", async () => {
        const query = /* GraphQL */ `
            mutation {
                updateMovies(
                    where: { id: { eq: "1" } }
                    update: {
                        actors: {
                            delete: {
                                where: { node: { name: { eq: "Actor to delete" } }, edge: { screenTime: { eq: 60 } } }
                            }
                        }
                    }
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
            MATCH (this:Movie)
            WITH *
            WHERE this.id = $param0
            WITH *
            CALL (*) {
                OPTIONAL MATCH (this)<-[this0:ACTED_IN]-(this1:Actor)
                WHERE (this1.name = $param1 AND this0.screenTime = $param2)
                WITH this0, collect(DISTINCT this1) AS var2
                CALL (var2) {
                    UNWIND var2 AS var3
                    DETACH DELETE var3
                }
            }
            WITH this
            RETURN this { .id } AS this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"param0\\": \\"1\\",
                \\"param1\\": \\"Actor to delete\\",
                \\"param2\\": {
                    \\"low\\": 60,
                    \\"high\\": 0
                }
            }"
        `);
    });

    test("Delete and update nested operations under same mutation", async () => {
        const query = /* GraphQL */ `
            mutation {
                updateMovies(
                    where: { id: { eq: "1" } }
                    update: {
                        actors: {
                            update: {
                                where: { node: { name: { eq: "Actor to update" } } }
                                node: { name_SET: "Updated name" }
                            }
                            delete: { where: { node: { name: { eq: "Actor to delete" } } } }
                        }
                    }
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
            MATCH (this:Movie)
            WITH *
            WHERE this.id = $param0
            WITH *
            CALL (*) {
                MATCH (this)<-[this0:ACTED_IN]-(this1:Actor)
                WITH *
                WHERE this1.name = $param1
                SET
                    this1.name = $param2
            }
            WITH *
            CALL (*) {
                OPTIONAL MATCH (this)<-[this2:ACTED_IN]-(this3:Actor)
                WHERE this3.name = $param3
                WITH this2, collect(DISTINCT this3) AS var4
                CALL (var4) {
                    UNWIND var4 AS var5
                    DETACH DELETE var5
                }
            }
            WITH this
            RETURN this { .id } AS this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"param0\\": \\"1\\",
                \\"param1\\": \\"Actor to update\\",
                \\"param2\\": \\"Updated name\\",
                \\"param3\\": \\"Actor to delete\\"
            }"
        `);
    });

    test("Nested delete under a nested update", async () => {
        const query = /* GraphQL */ `
            mutation {
                updateMovies(
                    where: { id: { eq: "1" } }
                    update: { actors: { delete: { where: { node: { name: { eq: "Actor to delete" } } } } } }
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
            MATCH (this:Movie)
            WITH *
            WHERE this.id = $param0
            WITH *
            CALL (*) {
                OPTIONAL MATCH (this)<-[this0:ACTED_IN]-(this1:Actor)
                WHERE this1.name = $param1
                WITH this0, collect(DISTINCT this1) AS var2
                CALL (var2) {
                    UNWIND var2 AS var3
                    DETACH DELETE var3
                }
            }
            WITH this
            RETURN this { .id } AS this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"param0\\": \\"1\\",
                \\"param1\\": \\"Actor to delete\\"
            }"
        `);
    });

    test("Double nested delete under a nested update", async () => {
        const query = /* GraphQL */ `
            mutation {
                updateMovies(
                    where: { id: { eq: "1" } }
                    update: {
                        actors: {
                            delete: {
                                where: { node: { name: { eq: "Actor to delete" } } }
                                delete: { movies: { where: { node: { id: { eq: "2" } } } } }
                            }
                        }
                    }
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
            MATCH (this:Movie)
            WITH *
            WHERE this.id = $param0
            WITH *
            CALL (*) {
                OPTIONAL MATCH (this)<-[this0:ACTED_IN]-(this1:Actor)
                WHERE this1.name = $param1
                WITH *
                CALL (*) {
                    OPTIONAL MATCH (this1)-[this2:ACTED_IN]->(this3:Movie)
                    WHERE this3.id = $param2
                    WITH this2, collect(DISTINCT this3) AS var4
                    CALL (var4) {
                        UNWIND var4 AS var5
                        DETACH DELETE var5
                    }
                }
                WITH this0, collect(DISTINCT this1) AS var6
                CALL (var6) {
                    UNWIND var6 AS var7
                    DETACH DELETE var7
                }
            }
            WITH this
            RETURN this { .id } AS this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"param0\\": \\"1\\",
                \\"param1\\": \\"Actor to delete\\",
                \\"param2\\": \\"2\\"
            }"
        `);
    });
});
