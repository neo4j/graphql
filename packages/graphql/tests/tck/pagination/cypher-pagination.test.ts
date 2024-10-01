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

describe("Cypher Sort tests", () => {
    let typeDefs: string;
    let neoSchema: Neo4jGraphQL;

    beforeAll(() => {
        typeDefs = /* GraphQL */ `
            type Movie @node {
                id: ID!
                title: String!
                runtime: Int!
                actors: [Actor!]! @relationship(type: "ACTED_IN", direction: IN)
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
                movies: [Movie!]! @relationship(type: "ACTED_IN", direction: OUT)
                totalScreenTime: Int!
                    @cypher(
                        statement: """
                        MATCH (this)-[r:ACTED_IN]->(:Movie)
                        RETURN sum(r.screenTime) as sum
                        """
                        columnName: "sum"
                    )
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
                movies(sort: [{ totalGenres: DESC }]) {
                    title
                }
            }
        `;

        const result = await translateQuery(neoSchema, query);

        expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
            "MATCH (this:Movie)
            CALL {
                WITH this
                CALL {
                    WITH this
                    WITH this AS this
                    MATCH (this)-[:HAS_GENRE]->(genre:Genre)
                    RETURN count(DISTINCT genre) as result
                }
                WITH result AS this0
                RETURN this0 AS var1
            }
            WITH *
            ORDER BY var1 DESC
            RETURN this { .title, totalGenres: var1 } AS this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`"{}"`);
    });

    test("should sort on cypher fields when present in the selection", async () => {
        const query = /* GraphQL */ `
            {
                movies(sort: [{ totalGenres: DESC }]) {
                    totalGenres
                }
            }
        `;

        const result = await translateQuery(neoSchema, query);

        expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
            "MATCH (this:Movie)
            CALL {
                WITH this
                CALL {
                    WITH this
                    WITH this AS this
                    MATCH (this)-[:HAS_GENRE]->(genre:Genre)
                    RETURN count(DISTINCT genre) as result
                }
                WITH result AS this0
                RETURN this0 AS var1
            }
            WITH *
            ORDER BY var1 DESC
            RETURN this { totalGenres: var1 } AS this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`"{}"`);
    });

    test("should sort on cypher fields using multiple criteria", async () => {
        const query = /* GraphQL */ `
            {
                movies(sort: [{ numberOfActors: DESC }, { totalGenres: ASC }]) {
                    numberOfActors
                    totalGenres
                }
            }
        `;

        const result = await translateQuery(neoSchema, query);

        expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
            "MATCH (this:Movie)
            CALL {
                WITH this
                CALL {
                    WITH this
                    WITH this AS this
                    MATCH (actor:Actor)-[:ACTED_IN]->(this) RETURN count(actor) as count
                }
                WITH count AS this0
                RETURN this0 AS var1
            }
            CALL {
                WITH this
                CALL {
                    WITH this
                    WITH this AS this
                    MATCH (this)-[:HAS_GENRE]->(genre:Genre)
                    RETURN count(DISTINCT genre) as result
                }
                WITH result AS this2
                RETURN this2 AS var3
            }
            WITH *
            ORDER BY var1 DESC, var3 ASC
            RETURN this { numberOfActors: var1, totalGenres: var3 } AS this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`"{}"`);
    });

    test("sort with offset limit & with other variables", async () => {
        const query = /* GraphQL */ `
            query {
                movies(
                    sort: [{ numberOfActors: DESC }, { title: ASC }]
                    offset: 10
                    limit: 10
                    where: { title_EQ: "The Matrix" }
                ) {
                    id
                    title
                }
            }
        `;

        const result = await translateQuery(neoSchema, query);

        expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
            "MATCH (this:Movie)
            WHERE this.title = $param0
            CALL {
                WITH this
                CALL {
                    WITH this
                    WITH this AS this
                    MATCH (actor:Actor)-[:ACTED_IN]->(this) RETURN count(actor) as count
                }
                WITH count AS this0
                RETURN this0 AS var1
            }
            WITH *
            ORDER BY var1 DESC, this.title ASC
            SKIP $param1
            LIMIT $param2
            RETURN this { .id, .title, numberOfActors: var1 } AS this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"param0\\": \\"The Matrix\\",
                \\"param1\\": {
                    \\"low\\": 10,
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
                movies {
                    genres(sort: [{ totalMovies: ASC }]) {
                        name
                    }
                }
            }
        `;

        const result = await translateQuery(neoSchema, query);

        expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
            "MATCH (this:Movie)
            CALL {
                WITH this
                MATCH (this)-[this0:HAS_GENRE]->(this1:Genre)
                CALL {
                    WITH this1
                    CALL {
                        WITH this1
                        WITH this1 AS this
                        MATCH (this)<-[:HAS_GENRE]-(movie:Movie)
                        RETURN count(DISTINCT movie) as result
                    }
                    WITH result AS this2
                    RETURN this2 AS var3
                }
                WITH this1 { .name, totalMovies: var3 } AS this1
                ORDER BY var3 ASC
                RETURN collect(this1) AS var4
            }
            RETURN this { genres: var4 } AS this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`"{}"`);
    });
});
