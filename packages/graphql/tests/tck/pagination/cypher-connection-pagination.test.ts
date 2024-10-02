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

describe("Cypher Connection pagination", () => {
    let typeDefs: string;
    let neoSchema: Neo4jGraphQL;

    beforeAll(() => {
        typeDefs = /* GraphQL */ `
            type Movie @node {
                id: ID!
                title: String!
                runtime: Int!
                actors: [Actor!]! @relationship(type: "ACTED_IN", direction: IN, properties: "ActedIn")
                genres: [Genre!]! @relationship(type: "HAS_GENRE", direction: OUT)
                numberOfActors: Int!
                    @cypher(
                        statement: "MATCH (actor:Actor)-[:ACTED_IN]->(this) RETURN count(actor) as count"
                        columnName: "count"
                    )
                totalGenres: Int!
                    @cypher(
                        statement: """
                        MATCH (this)-[:HAS_GENRE]->(genre:Genre)
                        RETURN count(DISTINCT genre) as result
                        """
                        columnName: "result"
                    )
            }

            type Genre @node {
                id: ID
                name: String
                totalMovies: Int!
                    @cypher(
                        statement: """
                        MATCH (this)<-[:HAS_GENRE]-(movie:Movie)
                        RETURN count(DISTINCT movie) as result
                        """
                        columnName: "result"
                    )
            }

            type Series @node {
                id: ID!
                title: String!
                episodes: Int!
            }
            type Actor @node {
                id: ID!
                name: String!
                movies: [Movie!]! @relationship(type: "ACTED_IN", direction: OUT, properties: "ActedIn")
                totalScreenTime: Int!
                    @cypher(
                        statement: """
                        MATCH (this)-[r:ACTED_IN]->(:Movie)
                        RETURN sum(r.screenTime) as sum
                        """
                        columnName: "sum"
                    )
            }
            type ActedIn @relationshipProperties {
                screenTime: Int!
                year: Int!
            }
        `;

        neoSchema = new Neo4jGraphQL({
            typeDefs,
            features: {
                excludeDeprecatedFields: {
                    deprecatedOptionsArgument: true,
                },
            },
        });
    });

    test("should sort on cypher field", async () => {
        const query = /* GraphQL */ `
            {
                moviesConnection(sort: [{ totalGenres: DESC }]) {
                    edges {
                        node {
                            title
                        }
                    }
                }
            }
        `;

        const result = await translateQuery(neoSchema, query);

        expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
            "MATCH (this0:Movie)
            WITH collect({ node: this0 }) AS edges
            WITH edges, size(edges) AS totalCount
            CALL {
                WITH edges
                UNWIND edges AS edge
                WITH edge.node AS this0
                CALL {
                    WITH this0
                    CALL {
                        WITH this0
                        WITH this0 AS this
                        MATCH (this)-[:HAS_GENRE]->(genre:Genre)
                        RETURN count(DISTINCT genre) as result
                    }
                    WITH result AS this1
                    RETURN this1 AS var2
                }
                WITH *
                ORDER BY var2 DESC
                RETURN collect({ node: { title: this0.title, __resolveType: \\"Movie\\" } }) AS var3
            }
            RETURN { edges: var3, totalCount: totalCount } AS this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`"{}"`);
    });

    test("should sort on cypher fields when present in the selection", async () => {
        const query = /* GraphQL */ `
            {
                moviesConnection(sort: [{ totalGenres: DESC }]) {
                    edges {
                        node {
                            totalGenres
                        }
                    }
                }
            }
        `;

        const result = await translateQuery(neoSchema, query);

        expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
            "MATCH (this0:Movie)
            WITH collect({ node: this0 }) AS edges
            WITH edges, size(edges) AS totalCount
            CALL {
                WITH edges
                UNWIND edges AS edge
                WITH edge.node AS this0
                CALL {
                    WITH this0
                    CALL {
                        WITH this0
                        WITH this0 AS this
                        MATCH (this)-[:HAS_GENRE]->(genre:Genre)
                        RETURN count(DISTINCT genre) as result
                    }
                    WITH result AS this1
                    RETURN this1 AS var2
                }
                WITH *
                ORDER BY var2 DESC
                RETURN collect({ node: { totalGenres: var2, __resolveType: \\"Movie\\" } }) AS var3
            }
            RETURN { edges: var3, totalCount: totalCount } AS this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`"{}"`);
    });

    test("should sort on cypher fields using multiple criteria", async () => {
        const query = /* GraphQL */ `
            {
                moviesConnection(sort: [{ numberOfActors: DESC }, { totalGenres: ASC }]) {
                    edges {
                        node {
                            numberOfActors
                            totalGenres
                        }
                    }
                }
            }
        `;

        const result = await translateQuery(neoSchema, query);

        expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
            "MATCH (this0:Movie)
            WITH collect({ node: this0 }) AS edges
            WITH edges, size(edges) AS totalCount
            CALL {
                WITH edges
                UNWIND edges AS edge
                WITH edge.node AS this0
                CALL {
                    WITH this0
                    CALL {
                        WITH this0
                        WITH this0 AS this
                        MATCH (actor:Actor)-[:ACTED_IN]->(this) RETURN count(actor) as count
                    }
                    WITH count AS this1
                    RETURN this1 AS var2
                }
                CALL {
                    WITH this0
                    CALL {
                        WITH this0
                        WITH this0 AS this
                        MATCH (this)-[:HAS_GENRE]->(genre:Genre)
                        RETURN count(DISTINCT genre) as result
                    }
                    WITH result AS this3
                    RETURN this3 AS var4
                }
                WITH *
                ORDER BY var2 DESC, var4 ASC
                RETURN collect({ node: { numberOfActors: var2, totalGenres: var4, __resolveType: \\"Movie\\" } }) AS var5
            }
            RETURN { edges: var5, totalCount: totalCount } AS this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`"{}"`);
    });

    test("sort with offset limit & with other variables", async () => {
        const query = /* GraphQL */ `
            query {
                moviesConnection(
                    sort: [{ numberOfActors: DESC }, { title: ASC }]
                    first: 10
                    after: "some-cursor"
                    where: { title_EQ: "The Matrix" }
                ) {
                    edges {
                        cursor
                        node {
                            id
                            title
                        }
                    }
                }
            }
        `;

        const result = await translateQuery(neoSchema, query);

        expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
            "MATCH (this0:Movie)
            WHERE this0.title = $param0
            WITH collect({ node: this0 }) AS edges
            WITH edges, size(edges) AS totalCount
            CALL {
                WITH edges
                UNWIND edges AS edge
                WITH edge.node AS this0
                CALL {
                    WITH this0
                    CALL {
                        WITH this0
                        WITH this0 AS this
                        MATCH (actor:Actor)-[:ACTED_IN]->(this) RETURN count(actor) as count
                    }
                    WITH count AS this1
                    RETURN this1 AS var2
                }
                WITH *
                ORDER BY var2 DESC, this0.title ASC
                SKIP $param1
                LIMIT $param2
                RETURN collect({ node: { id: this0.id, title: this0.title, __resolveType: \\"Movie\\" } }) AS var3
            }
            RETURN { edges: var3, totalCount: totalCount } AS this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"param0\\": \\"The Matrix\\",
                \\"param1\\": {
                    \\"low\\": 0,
                    \\"high\\": 0
                },
                \\"param2\\": {
                    \\"low\\": 10,
                    \\"high\\": 0
                }
            }"
        `);
    });

    test("should sort nested fields on cypher field", async () => {
        const query = /* GraphQL */ `
            {
                moviesConnection {
                    edges {
                        node {
                            genresConnection(sort: [{ node: { totalMovies: ASC } }]) {
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
            "MATCH (this0:Movie)
            WITH collect({ node: this0 }) AS edges
            WITH edges, size(edges) AS totalCount
            CALL {
                WITH edges
                UNWIND edges AS edge
                WITH edge.node AS this0
                CALL {
                    WITH this0
                    MATCH (this0)-[this1:HAS_GENRE]->(this2:Genre)
                    WITH collect({ node: this2, relationship: this1 }) AS edges
                    WITH edges, size(edges) AS totalCount
                    CALL {
                        WITH edges
                        UNWIND edges AS edge
                        WITH edge.node AS this2, edge.relationship AS this1
                        CALL {
                            WITH this2
                            CALL {
                                WITH this2
                                WITH this2 AS this
                                MATCH (this)<-[:HAS_GENRE]-(movie:Movie)
                                RETURN count(DISTINCT movie) as result
                            }
                            WITH result AS this3
                            RETURN this3 AS var4
                        }
                        WITH *
                        ORDER BY var4 ASC
                        RETURN collect({ node: { name: this2.name, __resolveType: \\"Genre\\" } }) AS var5
                    }
                    RETURN { edges: var5, totalCount: totalCount } AS var6
                }
                RETURN collect({ node: { genresConnection: var6, __resolveType: \\"Movie\\" } }) AS var7
            }
            RETURN { edges: var7, totalCount: totalCount } AS this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`"{}"`);
    });

    test("should sort nested fields on cypher field with relationship properties", async () => {
        const query = /* GraphQL */ `
            {
                moviesConnection {
                    edges {
                        node {
                            actorsConnection(
                                sort: [{ edge: { screenTime: DESC } }, { node: { totalScreenTime: ASC } }]
                            ) {
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
            }
        `;

        const result = await translateQuery(neoSchema, query);

        expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
            "MATCH (this0:Movie)
            WITH collect({ node: this0 }) AS edges
            WITH edges, size(edges) AS totalCount
            CALL {
                WITH edges
                UNWIND edges AS edge
                WITH edge.node AS this0
                CALL {
                    WITH this0
                    MATCH (this0)<-[this1:ACTED_IN]-(this2:Actor)
                    WITH collect({ node: this2, relationship: this1 }) AS edges
                    WITH edges, size(edges) AS totalCount
                    CALL {
                        WITH edges
                        UNWIND edges AS edge
                        WITH edge.node AS this2, edge.relationship AS this1
                        CALL {
                            WITH this2
                            CALL {
                                WITH this2
                                WITH this2 AS this
                                MATCH (this)-[r:ACTED_IN]->(:Movie)
                                RETURN sum(r.screenTime) as sum
                            }
                            WITH sum AS this3
                            RETURN this3 AS var4
                        }
                        WITH *
                        ORDER BY this1.screenTime DESC, var4 ASC
                        RETURN collect({ properties: { screenTime: this1.screenTime, __resolveType: \\"ActedIn\\" }, node: { name: this2.name, __resolveType: \\"Actor\\" } }) AS var5
                    }
                    RETURN { edges: var5, totalCount: totalCount } AS var6
                }
                RETURN collect({ node: { actorsConnection: var6, __resolveType: \\"Movie\\" } }) AS var7
            }
            RETURN { edges: var7, totalCount: totalCount } AS this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`"{}"`);
    });
});
