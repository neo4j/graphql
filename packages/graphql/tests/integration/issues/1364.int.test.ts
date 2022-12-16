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

import type { GraphQLSchema } from "graphql";
import { graphql } from "graphql";
import type { Driver, Session } from "neo4j-driver";
import Neo4j from "../neo4j";
import { Neo4jGraphQL } from "../../../src";
import { generateUniqueType } from "../../utils/graphql-types";

describe("https://github.com/neo4j/graphql/issues/1364", () => {
    const testActor = generateUniqueType("Actor");
    const testMovie = generateUniqueType("Movie");
    const testGenre = generateUniqueType("Genre");

    let schema: GraphQLSchema;
    let driver: Driver;
    let neo4j: Neo4j;
    let session: Session;

    async function graphqlQuery(query: string) {
        return graphql({
            schema,
            source: query,
            contextValue: neo4j.getContextValuesWithBookmarks(session.lastBookmark()),
        });
    }

    beforeAll(async () => {
        neo4j = new Neo4j();
        driver = await neo4j.getDriver();

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
                        RETURN count(DISTINCT genre)
                        """
                    )
                totalActors: Int!
                    @cypher(
                        statement: """
                        MATCH (this)<-[:ACTED_IN]-(actor:${testActor.name})
                        RETURN count(DISTINCT actor)
                        """
                    )
            }

            type ${testGenre.name} {
                name: String
            }
        `;

        session = await neo4j.getSession();

        await session.run(`
            CREATE (m1:${testMovie} { title: "A Movie" })-[:HAS_GENRE]->(:${testGenre} { name: "Genre 1" })
            CREATE (m1)-[:HAS_GENRE]->(:${testGenre} { name: "Genre 2" })
            CREATE (m2:${testMovie} { title: "B Movie" })-[:HAS_GENRE]->(:${testGenre} { name: "Genre 3" })
            CREATE (m3:${testMovie} { title: "C Movie" })
        `);

        const neoGraphql = new Neo4jGraphQL({ typeDefs, driver });
        schema = await neoGraphql.getSchema();
    });

    afterAll(async () => {
        await driver.close();
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

        const queryResult = await graphqlQuery(query);
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

        const queryResult = await graphqlQuery(query);
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

        const queryResult = await graphqlQuery(query);
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
                ${testMovie.plural}Connection(sort: [{ totalActors: DESC }, { totalGenres: DESC }, ]) {
                    edges {
                        node {
                            title
                            totalGenres
                        }
                    }
                }
            }
        `;

        const queryResult = await graphqlQuery(query);
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
