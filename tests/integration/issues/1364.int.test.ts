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

import type { UniqueType } from "../../utils/graphql-types";
import { TestHelper } from "../../utils/tests-helper";

describe("https://github.com/neo4j/graphql/issues/1364", () => {
    let testActor: UniqueType;
    let testMovie: UniqueType;
    let testGenre: UniqueType;

    const testHelper = new TestHelper();

    beforeAll(async () => {
        testActor = testHelper.createUniqueType("Actor");
        testMovie = testHelper.createUniqueType("Movie");
        testGenre = testHelper.createUniqueType("Genre");

        const typeDefs = `
            type ${testActor.name} {
                name: String
            }

            type ${testMovie.name} {
                title: String
                actors: [${testActor.name}!]! @relationship(type: "ACTED_IN", direction: IN)
                genres: [${testGenre.name}!]! @relationship(type: "HAS_GENRE", direction: OUT)
                totalGenres: Int!
                    @cypher(
                        statement: """
                        MATCH (this)-[:HAS_GENRE]->(genre:${testGenre.name})
                        RETURN count(DISTINCT genre) as c
                        """,
                        columnName: "c"
                    )
                totalActors: Int!
                    @cypher(
                        statement: """
                        MATCH (this)<-[:ACTED_IN]-(actor:${testActor.name})
                        RETURN count(DISTINCT actor) as c
                        """,
                        columnName: "c"
                    )
            }

            type ${testGenre.name} {
                name: String
            }
        `;

        await testHelper.executeCypher(`
            CREATE (m1:${testMovie} { title: "A Movie" })-[:HAS_GENRE]->(:${testGenre} { name: "Genre 1" })
            CREATE (m1)-[:HAS_GENRE]->(:${testGenre} { name: "Genre 2" })
            CREATE (m2:${testMovie} { title: "B Movie" })-[:HAS_GENRE]->(:${testGenre} { name: "Genre 3" })
            CREATE (m3:${testMovie} { title: "C Movie" })
        `);

        await testHelper.initNeo4jGraphQL({ typeDefs });
    });

    afterAll(async () => {
        await testHelper.close();
    });

    test("Should project cypher fields after applying the sort when sorting on a non-cypher field on a root connection", async () => {
        const query = `
            {
                ${testMovie.plural}Connection(sort: [{ title: ASC }]) {
                    edges {
                        node {
                            title
                            totalGenres
                        }
                    }
                }
            }
        `;

        const queryResult = await testHelper.executeGraphQL(query);
        expect(queryResult.errors).toBeUndefined();

        expect(queryResult.data as any).toEqual({
            [`${testMovie.plural}Connection`]: {
                edges: [
                    {
                        node: {
                            title: "A Movie",
                            totalGenres: 2,
                        },
                    },
                    {
                        node: {
                            title: "B Movie",
                            totalGenres: 1,
                        },
                    },
                    {
                        node: {
                            title: "C Movie",
                            totalGenres: 0,
                        },
                    },
                ],
            },
        });
    });

    test("Should project cypher fields before the sort when sorting on a cypher field on a root connection", async () => {
        const query = `
            {
                ${testMovie.plural}Connection(sort: [{ totalGenres: ASC }]) {
                    edges {
                        node {
                            title
                            totalGenres
                        }
                    }
                }
            }
        `;

        const queryResult = await testHelper.executeGraphQL(query);
        expect(queryResult.errors).toBeUndefined();

        expect(queryResult.data as any).toEqual({
            [`${testMovie.plural}Connection`]: {
                edges: [
                    {
                        node: {
                            title: "C Movie",
                            totalGenres: 0,
                        },
                    },
                    {
                        node: {
                            title: "B Movie",
                            totalGenres: 1,
                        },
                    },
                    {
                        node: {
                            title: "A Movie",
                            totalGenres: 2,
                        },
                    },
                ],
            },
        });
    });

    test("Should sort properly on a root connection when multiple cypher fields are queried but only sorted on one", async () => {
        const query = `
            {
                ${testMovie.plural}Connection(sort: [{ totalGenres: ASC }]) {
                    edges {
                        node {
                            title
                            totalGenres
                            totalActors
                        }
                    }
                }
            }
        `;

        const queryResult = await testHelper.executeGraphQL(query);
        expect(queryResult.errors).toBeUndefined();

        expect(queryResult.data as any).toEqual({
            [`${testMovie.plural}Connection`]: {
                edges: [
                    {
                        node: {
                            title: "C Movie",
                            totalGenres: 0,
                            totalActors: 0,
                        },
                    },
                    {
                        node: {
                            title: "B Movie",
                            totalGenres: 1,
                            totalActors: 0,
                        },
                    },
                    {
                        node: {
                            title: "A Movie",
                            totalGenres: 2,
                            totalActors: 0,
                        },
                    },
                ],
            },
        });
    });

    test("Should project cypher fields after applying the sort when sorting on a  2 cypher fields on a root connection", async () => {
        const query = `
            {
                ${testMovie.plural}Connection(sort: [{ totalActors: DESC }, { totalGenres: DESC }]) {
                    edges {
                        node {
                            title
                            totalGenres
                        }
                    }
                }
            }
        `;

        const queryResult = await testHelper.executeGraphQL(query);
        expect(queryResult.errors).toBeUndefined();

        expect(queryResult.data as any).toEqual({
            [`${testMovie.plural}Connection`]: {
                edges: [
                    {
                        node: {
                            title: "A Movie",
                            totalGenres: 2,
                        },
                    },
                    {
                        node: {
                            title: "B Movie",
                            totalGenres: 1,
                        },
                    },
                    {
                        node: {
                            title: "C Movie",
                            totalGenres: 0,
                        },
                    },
                ],
            },
        });
    });
});
