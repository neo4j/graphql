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
import { formatCypher, formatParams, translateQuery } from "../../utils/tck-test-utils";

describe("Relationship Properties Connect Cypher", () => {
    let typeDefs: string;
    let neoSchema: Neo4jGraphQL;

    beforeAll(() => {
        typeDefs = /* GraphQL */ `
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

        neoSchema = new Neo4jGraphQL({
            typeDefs,
        });
    });

    test("Create movie while connecting a relationship that has properties", async () => {
        const query = /* GraphQL */ `
            mutation {
                createMovies(input: [{ title: "Forrest Gump", actors: { connect: [{ edge: { screenTime: 60 } }] } }]) {
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

        const result = await translateQuery(neoSchema, query);

        expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
            "CYPHER 5
            CALL {
                CREATE (this0:Movie)
                SET
                    this0.title = $param0
                WITH *
                CALL (this0) {
                    MATCH (this1:Actor)
                    CREATE (this0)<-[this2:ACTED_IN]-(this1)
                    SET
                        this2.screenTime = $param1
                }
                RETURN this0 AS this
            }
            WITH this
            CALL (this) {
                CALL (this) {
                    MATCH (this)<-[this3:ACTED_IN]-(this4:Actor)
                    WITH collect({ node: this4, relationship: this3 }) AS edges
                    CALL (edges) {
                        UNWIND edges AS edge
                        WITH edge.node AS this4, edge.relationship AS this3
                        RETURN collect({ properties: { screenTime: this3.screenTime, __resolveType: \\"ActedIn\\" }, node: { name: this4.name, __resolveType: \\"Actor\\" } }) AS var5
                    }
                    RETURN { edges: var5 } AS var6
                }
                RETURN this { .title, actorsConnection: var6 } AS var7
            }
            RETURN collect(var7) AS data"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"param0\\": \\"Forrest Gump\\",
                \\"param1\\": {
                    \\"low\\": 60,
                    \\"high\\": 0
                }
            }"
        `);
    });

    test("Create movie while connecting a relationship that has properties(with where on node)", async () => {
        const query = /* GraphQL */ `
            mutation {
                createMovies(
                    input: [
                        {
                            title: "Forrest Gump"
                            actors: {
                                connect: [{ where: { node: { name: { eq: "Tom Hanks" } } }, edge: { screenTime: 60 } }]
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

        const result = await translateQuery(neoSchema, query);

        expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
            "CYPHER 5
            CALL {
                CREATE (this0:Movie)
                SET
                    this0.title = $param0
                WITH *
                CALL (this0) {
                    MATCH (this1:Actor)
                    WHERE this1.name = $param1
                    CREATE (this0)<-[this2:ACTED_IN]-(this1)
                    SET
                        this2.screenTime = $param2
                }
                RETURN this0 AS this
            }
            WITH this
            CALL (this) {
                CALL (this) {
                    MATCH (this)<-[this3:ACTED_IN]-(this4:Actor)
                    WITH collect({ node: this4, relationship: this3 }) AS edges
                    CALL (edges) {
                        UNWIND edges AS edge
                        WITH edge.node AS this4, edge.relationship AS this3
                        RETURN collect({ properties: { screenTime: this3.screenTime, __resolveType: \\"ActedIn\\" }, node: { name: this4.name, __resolveType: \\"Actor\\" } }) AS var5
                    }
                    RETURN { edges: var5 } AS var6
                }
                RETURN this { .title, actorsConnection: var6 } AS var7
            }
            RETURN collect(var7) AS data"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"param0\\": \\"Forrest Gump\\",
                \\"param1\\": \\"Tom Hanks\\",
                \\"param2\\": {
                    \\"low\\": 60,
                    \\"high\\": 0
                }
            }"
        `);
    });

    test("Update a movie while connecting a relationship that has properties(top level-connect)", async () => {
        const query = /* GraphQL */ `
            mutation {
                updateMovies(
                    where: { title: { eq: "Forrest Gump" } }
                    update: { actors: { connect: { edge: { screenTime: 60 } } } }
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

        const result = await translateQuery(neoSchema, query);

        expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
            "CYPHER 5
            MATCH (this:Movie)
            WITH *
            WHERE this.title = $param0
            WITH *
            CALL (*) {
                CALL (this) {
                    MATCH (this0:Actor)
                    CREATE (this)<-[this1:ACTED_IN]-(this0)
                    SET
                        this1.screenTime = $param1
                }
            }
            WITH this
            CALL (this) {
                MATCH (this)<-[this2:ACTED_IN]-(this3:Actor)
                WITH collect({ node: this3, relationship: this2 }) AS edges
                CALL (edges) {
                    UNWIND edges AS edge
                    WITH edge.node AS this3, edge.relationship AS this2
                    RETURN collect({ properties: { screenTime: this2.screenTime, __resolveType: \\"ActedIn\\" }, node: { name: this3.name, __resolveType: \\"Actor\\" } }) AS var4
                }
                RETURN { edges: var4 } AS var5
            }
            RETURN this { .title, actorsConnection: var5 } AS this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"param0\\": \\"Forrest Gump\\",
                \\"param1\\": {
                    \\"low\\": 60,
                    \\"high\\": 0
                }
            }"
        `);
    });

    test("Update a movie while connecting a relationship that has properties(top level-connect)(with where on node)", async () => {
        const query = /* GraphQL */ `
            mutation {
                updateMovies(
                    where: { title: { eq: "Forrest Gump" } }
                    update: {
                        actors: {
                            connect: { where: { node: { name: { eq: "Tom Hanks" } } }, edge: { screenTime: 60 } }
                        }
                    }
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

        const result = await translateQuery(neoSchema, query);

        expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
            "CYPHER 5
            MATCH (this:Movie)
            WITH *
            WHERE this.title = $param0
            WITH *
            CALL (*) {
                CALL (this) {
                    MATCH (this0:Actor)
                    WHERE this0.name = $param1
                    CREATE (this)<-[this1:ACTED_IN]-(this0)
                    SET
                        this1.screenTime = $param2
                }
            }
            WITH this
            CALL (this) {
                MATCH (this)<-[this2:ACTED_IN]-(this3:Actor)
                WITH collect({ node: this3, relationship: this2 }) AS edges
                CALL (edges) {
                    UNWIND edges AS edge
                    WITH edge.node AS this3, edge.relationship AS this2
                    RETURN collect({ properties: { screenTime: this2.screenTime, __resolveType: \\"ActedIn\\" }, node: { name: this3.name, __resolveType: \\"Actor\\" } }) AS var4
                }
                RETURN { edges: var4 } AS var5
            }
            RETURN this { .title, actorsConnection: var5 } AS this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"param0\\": \\"Forrest Gump\\",
                \\"param1\\": \\"Tom Hanks\\",
                \\"param2\\": {
                    \\"low\\": 60,
                    \\"high\\": 0
                }
            }"
        `);
    });
});
