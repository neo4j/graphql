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

describe("Cypher Create", () => {
    let typeDefs: string;
    let neoSchema: Neo4jGraphQL;

    beforeAll(() => {
        typeDefs = /* GraphQL */ `
            type Actor @node {
                name: String
                movies: [Movie!]! @relationship(type: "ACTED_IN", direction: OUT)
            }

            type Movie @node {
                id: ID
                actors: [Actor!]! @relationship(type: "ACTED_IN", direction: IN)
            }
        `;

        neoSchema = new Neo4jGraphQL({
            typeDefs,
        });
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
            "CYPHER 5
            UNWIND $create_param0 AS create_var0
            CALL (create_var0) {
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

    test("Simple Multi Create", async () => {
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
            "CYPHER 5
            UNWIND $create_param0 AS create_var0
            CALL (create_var0) {
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

    test("Two Level Nested create", async () => {
        const query = /* GraphQL */ `
            mutation {
                createMovies(
                    input: [
                        { id: 1, actors: { create: [{ node: { name: "actor 1" } }] } }
                        { id: 2, actors: { create: [{ node: { name: "actor 2" } }] } }
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
                    create_this1.id = create_var0.id
                WITH create_this1, create_var0
                CALL (create_this1, create_var0) {
                    UNWIND create_var0.actors.create AS create_var2
                    CREATE (create_this3:Actor)
                    SET
                        create_this3.name = create_var2.node.name
                    MERGE (create_this1)<-[create_this4:ACTED_IN]-(create_this3)
                    RETURN collect(NULL) AS create_var5
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
                                    \\"node\\": {
                                        \\"name\\": \\"actor 2\\"
                                    }
                                }
                            ]
                        }
                    }
                ]
            }"
        `);
    });

    test("Three Level Nested create", async () => {
        const query = /* GraphQL */ `
            mutation {
                createMovies(
                    input: [
                        {
                            id: "1"
                            actors: {
                                create: [{ node: { name: "actor 1", movies: { create: [{ node: { id: "10" } }] } } }]
                            }
                        }
                        {
                            id: "2"
                            actors: {
                                create: [{ node: { name: "actor 2", movies: { create: [{ node: { id: "20" } }] } } }]
                            }
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
            "CYPHER 5
            UNWIND $create_param0 AS create_var0
            CALL (create_var0) {
                CREATE (create_this1:Movie)
                SET
                    create_this1.id = create_var0.id
                WITH create_this1, create_var0
                CALL (create_this1, create_var0) {
                    UNWIND create_var0.actors.create AS create_var2
                    CREATE (create_this3:Actor)
                    SET
                        create_this3.name = create_var2.node.name
                    MERGE (create_this1)<-[create_this4:ACTED_IN]-(create_this3)
                    WITH create_this3, create_var2
                    CALL (create_this3, create_var2) {
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
                                        \\"name\\": \\"actor 1\\",
                                        \\"movies\\": {
                                            \\"create\\": [
                                                {
                                                    \\"node\\": {
                                                        \\"id\\": \\"10\\"
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
                                        \\"name\\": \\"actor 2\\",
                                        \\"movies\\": {
                                            \\"create\\": [
                                                {
                                                    \\"node\\": {
                                                        \\"id\\": \\"20\\"
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

    test("Simple create and connect", async () => {
        const query = /* GraphQL */ `
            mutation {
                createMovies(input: [{ id: 1, actors: { connect: [{ where: { node: { name: { eq: "Dan" } } } }] } }]) {
                    movies {
                        id
                    }
                }
            }
        `;

        const result = await translateQuery(neoSchema, query);

        expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
            "CYPHER 5
            CALL {
                CREATE (this0:Movie)
                SET
                    this0.id = $param0
                WITH *
                CALL (this0) {
                    MATCH (this1:Actor)
                    WHERE this1.name = $param1
                    CREATE (this0)<-[this2:ACTED_IN]-(this1)
                }
                RETURN this0 AS this
            }
            WITH this
            CALL (this) {
                RETURN this { .id } AS var3
            }
            RETURN collect(var3) AS data"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"param0\\": \\"1\\",
                \\"param1\\": \\"Dan\\"
            }"
        `);
    });

    test("Simple create and connect with multiple inputs", async () => {
        const query = /* GraphQL */ `
            mutation {
                createMovies(
                    input: [{ id: 1, actors: { connect: [{ where: { node: { name: { eq: "Dan" } } } }] } }, { id: 2 }]
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
            CALL {
                CREATE (this0:Movie)
                SET
                    this0.id = $param0
                WITH *
                CALL (this0) {
                    MATCH (this1:Actor)
                    WHERE this1.name = $param1
                    CREATE (this0)<-[this2:ACTED_IN]-(this1)
                }
                RETURN this0 AS this
                UNION
                CREATE (this3:Movie)
                SET
                    this3.id = $param2
                RETURN this3 AS this
            }
            WITH this
            CALL (this) {
                RETURN this { .id } AS var4
            }
            RETURN collect(var4) AS data"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"param0\\": \\"1\\",
                \\"param1\\": \\"Dan\\",
                \\"param2\\": \\"2\\"
            }"
        `);
    });

    test("create with nested create and connect", async () => {
        const query = /* GraphQL */ `
            mutation {
                createMovies(
                    input: [
                        {
                            id: 1
                            actors: {
                                connect: [{ where: { node: { name: { eq: "Dan" } } } }]
                                create: [{ node: { name: "Not Dan" } }]
                            }
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
            "CYPHER 5
            CALL {
                CREATE (this0:Movie)
                SET
                    this0.id = $param0
                WITH *
                CREATE (this1:Actor)
                MERGE (this0)<-[this2:ACTED_IN]-(this1)
                SET
                    this1.name = $param1
                WITH *
                CALL (this0) {
                    MATCH (this3:Actor)
                    WHERE this3.name = $param2
                    CREATE (this0)<-[this4:ACTED_IN]-(this3)
                }
                RETURN this0 AS this
            }
            WITH this
            CALL (this) {
                RETURN this { .id } AS var5
            }
            RETURN collect(var5) AS data"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"param0\\": \\"1\\",
                \\"param1\\": \\"Not Dan\\",
                \\"param2\\": \\"Dan\\"
            }"
        `);
    });

    test("Simple create -> relationship field -> connection(where)", async () => {
        const query = /* GraphQL */ `
            mutation {
                createActors(input: { name: "Dan", movies: { connect: { where: { node: { id: { eq: 1 } } } } } }) {
                    actors {
                        name
                        movies {
                            actorsConnection(where: { node: { name: { eq: "Dan" } } }) {
                                totalCount
                                edges {
                                    node {
                                        name
                                    }
                                }
                            }
                        }
                    }
                }
            }
        `;

        const result = await translateQuery(neoSchema, query);

        expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
            "CYPHER 5
            CALL {
                CREATE (this0:Actor)
                SET
                    this0.name = $param0
                WITH *
                CALL (this0) {
                    MATCH (this1:Movie)
                    WHERE this1.id = $param1
                    CREATE (this0)-[this2:ACTED_IN]->(this1)
                }
                RETURN this0 AS this
            }
            WITH this
            CALL (this) {
                CALL (this) {
                    MATCH (this)-[this3:ACTED_IN]->(this4:Movie)
                    WITH DISTINCT this4
                    CALL (this4) {
                        MATCH (this4)<-[this5:ACTED_IN]-(this6:Actor)
                        WHERE this6.name = $param2
                        WITH collect({ node: this6, relationship: this5 }) AS edges, count(this6) AS totalCount
                        CALL (edges) {
                            UNWIND edges AS edge
                            WITH edge.node AS this6, edge.relationship AS this5
                            RETURN collect({ node: { name: this6.name, __resolveType: \\"Actor\\" } }) AS var7
                        }
                        RETURN { edges: var7, totalCount: totalCount } AS var8
                    }
                    WITH this4 { actorsConnection: var8 } AS this4
                    RETURN collect(this4) AS var9
                }
                RETURN this { .name, movies: var9 } AS var10
            }
            RETURN collect(var10) AS data"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"param0\\": \\"Dan\\",
                \\"param1\\": \\"1\\",
                \\"param2\\": \\"Dan\\"
            }"
        `);
    });
});
