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

import { Driver, Session } from "neo4j-driver";
import { graphql } from "graphql";
import { generate } from "randomstring";
import { gql } from "apollo-server";
import neo4j from "./neo4j";
import { Neo4jGraphQL } from "../../src/classes";

describe("sort", () => {
    let driver: Driver;

    beforeAll(async () => {
        driver = await neo4j();
    });

    afterAll(async () => {
        await driver.close();
    });

    describe("primitive fields", () => {
        test("should sort a list of nodes", async () => {
            await Promise.all(
                ["ASC", "DESC"].map(async (type) => {
                    const session = driver.session();

                    const typeDefs = `
                        type Movie {
                            id: ID
                            number: Int
                        }
                    `;

                    const neoSchema = new Neo4jGraphQL({ typeDefs });

                    const movieIds = [
                        generate({
                            charset: "alphabetic",
                        }),
                        generate({
                            charset: "alphabetic",
                        }),
                        generate({
                            charset: "alphabetic",
                        }),
                    ].map((x) => `"${x}"`);

                    const query = `
                        query {
                            movies(
                                where: { id_IN: [${movieIds.join(",")}] },
                                options: { sort: [{ number: ${type} }] }
                            ) {
                               number
                            }
                        }
                    `;

                    try {
                        await session.run(`
                            CREATE (:Movie {id: ${movieIds[0]}, number: 1})
                            CREATE (:Movie {id: ${movieIds[1]}, number: 2})
                            CREATE (:Movie {id: ${movieIds[2]}, number: 3})
                        `);

                        const gqlResult = await graphql({
                            schema: neoSchema.schema,
                            source: query,
                            contextValue: { driver, driverConfig: { bookmarks: session.lastBookmark() } },
                        });

                        expect(gqlResult.errors).toBeUndefined();

                        const { movies } = gqlResult.data as any;

                        /* eslint-disable jest/no-conditional-expect */
                        if (type === "ASC") {
                            expect(movies[0].number).toEqual(1);
                            expect(movies[1].number).toEqual(2);
                            expect(movies[2].number).toEqual(3);
                        }

                        if (type === "DESC") {
                            expect(movies[0].number).toEqual(3);
                            expect(movies[1].number).toEqual(2);
                            expect(movies[2].number).toEqual(1);
                        }
                        /* eslint-enable jest/no-conditional-expect */
                    } finally {
                        await session.close();
                    }
                })
            );
        });

        test("should sort nested relationships", async () => {
            await Promise.all(
                ["ASC", "DESC"].map(async (type) => {
                    const session = driver.session();

                    const typeDefs = `
                        type Movie {
                            id: ID
                            genres: [Genre] @relationship(type: "HAS_GENRE", direction: OUT)
                        }
    
                        type Genre {
                            id: ID
                        }
                    `;

                    const neoSchema = new Neo4jGraphQL({ typeDefs });

                    const movieId = generate({
                        charset: "alphabetic",
                    });

                    const query = `
                        query {
                            movies(where: { id: "${movieId}" }) {
                                genres(options: { sort: [{ id: ${type} }] }) {
                                    id
                                }
                            }
                        }
                    `;

                    try {
                        await session.run(`
                            CREATE (m:Movie {id: "${movieId}"})
                            CREATE (g1:Genre {id: "1"})
                            CREATE (g2:Genre {id: "2"})
                            MERGE (m)-[:HAS_GENRE]->(g1)
                            MERGE (m)-[:HAS_GENRE]->(g2)
                        `);

                        const gqlResult = await graphql({
                            schema: neoSchema.schema,
                            source: query,
                            contextValue: { driver, driverConfig: { bookmarks: session.lastBookmark() } },
                        });

                        expect(gqlResult.errors).toBeUndefined();

                        const { genres } = (gqlResult.data as any).movies[0];

                        /* eslint-disable jest/no-conditional-expect */
                        if (type === "ASC") {
                            expect(genres[0].id).toEqual("1");
                            expect(genres[1].id).toEqual("2");
                        }

                        if (type === "DESC") {
                            expect(genres[0].id).toEqual("2");
                            expect(genres[1].id).toEqual("1");
                        }
                        /* eslint-enable jest/no-conditional-expect */
                    } finally {
                        await session.close();
                    }
                })
            );
        });
    });

    describe("cypher fields", () => {
        let session: Session;

        const typeDefs = gql`
            type Movie {
                title: String!
                actors: [Actor!]! @relationship(type: "ACTED_IN", direction: IN, properties: "ActedIn")
            }
            type Actor {
                name: String!
                movies: [Movie!]! @relationship(type: "ACTED_IN", direction: OUT, properties: "ActedIn")
                totalScreenTime: Int!
                    @cypher(
                        statement: """
                        MATCH (this)-[r:ACTED_IN]->(:Movie)
                        RETURN sum(r.screenTime)
                        """
                    )
            }
            interface ActedIn {
                screenTime: Int!
            }
        `;

        const { schema } = new Neo4jGraphQL({ typeDefs });

        const title1 = generate({
            charset: "alphabetic",
        });
        const title2 = generate({
            charset: "alphabetic",
        });
        const name1 = generate({
            charset: "alphabetic",
        });
        const name2 = generate({
            charset: "alphabetic",
        });

        beforeAll(async () => {
            session = driver.session();
            await session.run(
                `
                        CREATE (m1:Movie {title: $title1})
                        CREATE (m2:Movie {title: $title2})
                        CREATE (a1:Actor {name: $name1})
                        CREATE (a2:Actor {name: $name2})
                        MERGE (a1)-[:ACTED_IN {screenTime: 1}]->(m1)<-[:ACTED_IN {screenTime: 1}]-(a2)
                        MERGE (a1)-[:ACTED_IN {screenTime: 1}]->(m2)
                    `,
                {
                    title1,
                    title2,
                    name1,
                    name2,
                }
            );
        });

        afterAll(async () => {
            await session.close();
        });

        test("should sort on top level", async () => {
            await Promise.all(
                ["ASC", "DESC"].map(async (type) => {
                    const query = gql`
                        query($actorNames: [String!]!, $direction: SortDirection!) {
                            actors(
                                where: { name_IN: $actorNames }
                                options: { sort: [{ totalScreenTime: $direction }] }
                            ) {
                                name
                                totalScreenTime
                            }
                        }
                    `;

                    const graphqlResult = await graphql({
                        schema,
                        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                        source: query.loc!.source,
                        contextValue: { driver, driverConfig: { bookmarks: session.lastBookmark() } },
                        variableValues: { actorNames: [name1, name2], direction: type },
                    });

                    expect(graphqlResult.errors).toBeUndefined();

                    const graphqlActors = graphqlResult.data?.actors;

                    expect(graphqlActors).toHaveLength(2);

                    /* eslint-disable jest/no-conditional-expect */
                    if (type === "ASC") {
                        expect(graphqlActors[0].name).toEqual(name2);
                        expect(graphqlActors[0].totalScreenTime).toEqual(1);
                        expect(graphqlActors[1].name).toEqual(name1);
                        expect(graphqlActors[1].totalScreenTime).toEqual(2);
                    }

                    if (type === "DESC") {
                        expect(graphqlActors[0].name).toEqual(name1);
                        expect(graphqlActors[0].totalScreenTime).toEqual(2);
                        expect(graphqlActors[1].name).toEqual(name2);
                        expect(graphqlActors[1].totalScreenTime).toEqual(1);
                    }
                    /* eslint-enable jest/no-conditional-expect */
                })
            );
        });

        test("should sort on nested level", async () => {
            await Promise.all(
                ["ASC", "DESC"].map(async (type) => {
                    const query = gql`
                        query($title: String!, $actorNames: [String!]!, $direction: SortDirection!) {
                            movies(where: { title: $title }) {
                                title
                                actors(
                                    where: { name_IN: $actorNames }
                                    options: { sort: [{ totalScreenTime: $direction }] }
                                ) {
                                    name
                                    totalScreenTime
                                }
                            }
                        }
                    `;

                    const graphqlResult = await graphql({
                        schema,
                        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                        source: query.loc!.source,
                        contextValue: { driver, driverConfig: { bookmarks: session.lastBookmark() } },
                        variableValues: { title: title1, actorNames: [name1, name2], direction: type },
                    });

                    expect(graphqlResult.errors).toBeUndefined();

                    const graphqlMovies = graphqlResult.data?.movies;

                    expect(graphqlMovies).toHaveLength(1);
                    expect(graphqlMovies[0].title).toBe(title1);

                    const graphqlActors = graphqlResult.data?.movies[0].actors;

                    expect(graphqlActors).toHaveLength(2);

                    /* eslint-disable jest/no-conditional-expect */
                    if (type === "ASC") {
                        expect(graphqlActors[0].name).toEqual(name2);
                        expect(graphqlActors[0].totalScreenTime).toEqual(1);
                        expect(graphqlActors[1].name).toEqual(name1);
                        expect(graphqlActors[1].totalScreenTime).toEqual(2);
                    }

                    if (type === "DESC") {
                        expect(graphqlActors[0].name).toEqual(name1);
                        expect(graphqlActors[0].totalScreenTime).toEqual(2);
                        expect(graphqlActors[1].name).toEqual(name2);
                        expect(graphqlActors[1].totalScreenTime).toEqual(1);
                    }
                    /* eslint-enable jest/no-conditional-expect */
                })
            );
        });
    });
});
