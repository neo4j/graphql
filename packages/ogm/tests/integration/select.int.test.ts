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

import type { Driver } from "neo4j-driver";
import { generate } from "randomstring";
import neo4j from "./neo4j";
import { OGM } from "../../src";
import gql from "graphql-tag";

describe("select", () => {
    let driver: Driver;

    beforeAll(async () => {
        driver = await neo4j();
    });

    afterAll(async () => {
        await driver.close();
    });

    describe("validation - should throw when using select and selectionSet at the same time", () => {
        const typeDefs = gql`
            type Movie {
                id: ID!
                title: String!
            }
        `;

        test("find", async () => {
            const ogm = new OGM({ typeDefs, driver });
            await ogm.init();

            const Movie = ogm.model("Movie");

            await expect(Movie.find({ selectionSet: "{ id }", select: { id: true } })).rejects.toThrow(
                "Cannot use arguments 'select' and 'selectionSet' at the same time"
            );
        });

        test("create", async () => {
            const ogm = new OGM({ typeDefs, driver });
            await ogm.init();

            const Movie = ogm.model("Movie");

            await expect(Movie.create({ input: {}, selectionSet: "{ id }", select: { id: true } })).rejects.toThrow(
                "Cannot use arguments 'select' and 'selectionSet' at the same time"
            );
        });

        test("update", async () => {
            const ogm = new OGM({ typeDefs, driver });
            await ogm.init();

            const Movie = ogm.model("Movie");

            await expect(Movie.update({ update: {}, selectionSet: "{ id }", select: { id: true } })).rejects.toThrow(
                "Cannot use arguments 'select' and 'selectionSet' at the same time"
            );
        });
    });

    describe("basic usage - should select simple properties on a node", () => {
        const typeDefs = gql`
            type Movie {
                id: ID!
                title: String!
            }
        `;

        test("find", async () => {
            const session = driver.session();

            const id = generate({
                charset: "alphabetic",
            });

            const title = generate({
                charset: "alphabetic",
            });

            const ogm = new OGM({ typeDefs, driver });
            await ogm.init();
            const Movie = ogm.model("Movie");

            try {
                await session.run(`
                    CREATE (:Movie {id: "${id}", title: "${title}"})
                `);
            } finally {
                await session.close();
            }

            const moviesIdTitle = await Movie.find({
                where: {
                    id,
                },
                select: {
                    id: true,
                    title: true,
                },
            });

            expect(moviesIdTitle).toMatchObject([
                {
                    id,
                    title,
                },
            ]);

            const moviesId = await Movie.find({
                where: {
                    id,
                },
                select: {
                    id: true,
                },
            });

            expect(moviesId).toMatchObject([
                {
                    id,
                },
            ]);
        });

        test("create", async () => {
            const id = generate({
                charset: "alphabetic",
            });

            const title = generate({
                charset: "alphabetic",
            });

            const ogm = new OGM({ typeDefs, driver });
            await ogm.init();
            const Movie = ogm.model("Movie");

            const moviesTitle = await Movie.create({
                input: { id, title },
                select: {
                    title: true,
                },
            });

            expect(moviesTitle).toMatchObject({
                movies: [{ title }],
            });
        });

        test("update", async () => {
            const session = driver.session();
            const id = generate({
                charset: "alphabetic",
            });

            const title = generate({
                charset: "alphabetic",
            });

            const ogm = new OGM({ typeDefs, driver });
            await ogm.init();
            const Movie = ogm.model("Movie");

            try {
                await session.run(`
                    CREATE (:Movie {id: "${id}", title: "${title}"})
                `);
            } finally {
                await session.close();
            }

            const moviesTitle = await Movie.update({
                where: { id, title },
                update: { id, title: title + "new" },
                select: {
                    title: true,
                },
            });

            expect(moviesTitle).toMatchObject({
                movies: [{ title: title + "new" }],
            });
        });
    });

    describe("relationships", () => {
        const typeDefs = gql`
            type Movie {
                id: ID!
                title: String!
                genres: [Genre!]! @relationship(type: "IN_GENRE", direction: OUT)
            }

            type Genre {
                id: ID!
                name: String!
                movies: [Movie!]! @relationship(type: "IN_GENRE", direction: IN)
            }
        `;

        test("should select fields on a simple relationship", async () => {
            const session = driver.session();

            const movieId = generate({
                charset: "alphabetic",
            });

            const genreId = generate({
                charset: "alphabetic",
            });

            const movieTitle = generate({
                charset: "alphabetic",
            });

            const genreName = generate({
                charset: "alphabetic",
            });

            const ogm = new OGM({ typeDefs, driver });
            await ogm.init();
            const Movie = ogm.model("Movie");

            try {
                await session.run(`
                    CREATE (:Movie {id: "${movieId}", title: "${movieTitle}"})
                            -[:IN_GENRE]->(:Genre {id: "${genreId}", name: "${genreName}"})
                `);
            } finally {
                await session.close();
            }

            const moviesWithGenreIdName = await Movie.find({
                where: {
                    id: movieId,
                },
                select: {
                    id: true,
                    title: true,
                    genres: {
                        select: {
                            id: true,
                            name: true,
                        },
                    },
                },
            });

            expect(moviesWithGenreIdName).toMatchObject([
                {
                    id: movieId,
                    title: movieTitle,
                    genres: [{ id: genreId }],
                },
            ]);

            const moviesWithGenreId = await Movie.find({
                where: {
                    id: movieId,
                },
                select: {
                    id: true,
                    title: true,
                    genres: {
                        select: {
                            id: true,
                        },
                    },
                },
            });

            expect(moviesWithGenreId).toMatchObject([
                {
                    id: movieId,
                    title: movieTitle,
                    genres: [{ id: genreId }],
                },
            ]);
        });

        test("should select recursive fields on a simple relationship", async () => {
            const session = driver.session();

            const movieId = generate({
                charset: "alphabetic",
            });

            const genreId = generate({
                charset: "alphabetic",
            });

            const movieTitle = generate({
                charset: "alphabetic",
            });

            const genreName = generate({
                charset: "alphabetic",
            });

            const ogm = new OGM({ typeDefs, driver });
            await ogm.init();
            const Movie = ogm.model("Movie");

            try {
                await session.run(`
                    CREATE (:Movie {id: "${movieId}", title: "${movieTitle}"})
                            -[:IN_GENRE]->(:Genre {id: "${genreId}", name: "${genreName}"})
                `);
            } finally {
                await session.close();
            }

            const moviesWithGenreIdName = await Movie.find({
                where: {
                    id: movieId,
                },
                select: {
                    id: true,
                    title: true,
                    genres: {
                        select: {
                            id: true,
                            name: true,
                            movies: {
                                select: {
                                    id: true,
                                    title: true,
                                },
                            },
                        },
                    },
                },
            });

            expect(moviesWithGenreIdName).toMatchObject([
                {
                    id: movieId,
                    title: movieTitle,
                    genres: [{ id: genreId, movies: [{ id: movieId, title: movieTitle }] }],
                },
            ]);

            const moviesWithGenreId = await Movie.find({
                where: {
                    id: movieId,
                },
                select: {
                    id: true,
                    title: true,
                    genres: {
                        select: {
                            id: true,
                            movies: {
                                select: {
                                    id: true,
                                },
                            },
                        },
                    },
                },
            });

            expect(moviesWithGenreId).toMatchObject([
                {
                    id: movieId,
                    title: movieTitle,
                    genres: [{ id: genreId, movies: [{ id: movieId }] }],
                },
            ]);
        });

        test("should use where argument when selecting fields on a relationship", async () => {
            const session = driver.session();

            const movieId = generate({
                charset: "alphabetic",
            });

            const genreId1 = generate({
                charset: "alphabetic",
            });

            const genreId2 = generate({
                charset: "alphabetic",
            });

            const movieTitle = generate({
                charset: "alphabetic",
            });

            const genreName1 = generate({
                charset: "alphabetic",
            });

            const genreName2 = generate({
                charset: "alphabetic",
            });

            const ogm = new OGM({ typeDefs, driver });
            await ogm.init();
            const Movie = ogm.model("Movie");

            try {
                await session.run(`
                    CREATE (m:Movie {id: "${movieId}", title: "${movieTitle}"})
                    MERGE (m)-[:IN_GENRE]->(:Genre {id: "${genreId1}", name: "${genreName1}"})
                    MERGE (m)-[:IN_GENRE]->(:Genre {id: "${genreId2}", name: "${genreName2}"})
                `);
            } finally {
                await session.close();
            }

            const moviesWithGenreIdName = await Movie.find({
                where: {
                    id: movieId,
                },
                select: {
                    id: true,
                    title: true,
                    genres: {
                        where: {
                            name: genreName1,
                        },
                        select: {
                            id: true,
                            name: true,
                        },
                    },
                },
            });

            expect(moviesWithGenreIdName).toMatchObject([
                {
                    id: movieId,
                    title: movieTitle,
                    genres: [{ id: genreId1, name: genreName1 }],
                },
            ]);
        });

        test("should use options argument when selecting fields on a relationship", async () => {
            const session = driver.session();

            const movieId = generate({
                charset: "alphabetic",
            });

            const genreId1 = generate({
                charset: "alphabetic",
            });

            const genreId2 = generate({
                charset: "alphabetic",
            });

            const movieTitle = generate({
                charset: "alphabetic",
            });

            const genreName1 = generate({
                charset: "alphabetic",
            });

            const genreName2 = generate({
                charset: "alphabetic",
            });

            const ogm = new OGM({ typeDefs, driver });
            await ogm.init();
            const Movie = ogm.model("Movie");

            try {
                await session.run(`
                    CREATE (m:Movie {id: "${movieId}", title: "${movieTitle}"})
                    MERGE (m)-[:IN_GENRE]->(:Genre {id: "${genreId1}", name: "${genreName1}"})
                    MERGE (m)-[:IN_GENRE]->(:Genre {id: "${genreId2}", name: "${genreName2}"})
                `);
            } finally {
                await session.close();
            }

            const moviesWithGenreIdName = await Movie.find({
                where: {
                    id: movieId,
                },
                select: {
                    id: true,
                    title: true,
                    genres: {
                        options: {
                            limit: 1,
                        },
                        select: {
                            id: true,
                            name: true,
                        },
                    },
                },
            });

            expect(moviesWithGenreIdName[0].genres as any[]).toHaveLength(1);
        });
    });
});
