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

import { Driver } from "neo4j-driver";
import { generate } from "randomstring";
import gql from "graphql-tag";
import neo4j from "./neo4j";
import { OGM, Model } from "../../src";

describe("OGM", () => {
    let driver: Driver;

    beforeAll(async () => {
        driver = await neo4j();
    });

    afterAll(async () => {
        await driver.close();
    });

    test("should specify the database via OGM construction", async () => {
        const session = driver.session();

        const typeDefs = `
            type Movie {
                id: ID!
            }
        `;

        const ogm = new OGM({ typeDefs, driver, config: { driverConfig: { database: "another-random-db" } } });

        await expect(ogm.model("Movie")?.find()).rejects.toThrow();

        await session.close();
    });

    test("should filter the document and remove directives such as auth", async () => {
        const session = driver.session();

        const typeDefs = `
            type Movie @auth(rules: [{ isAuthenticated: true }]){
                id: ID
            }
        `;

        const ogm = new OGM({ typeDefs, driver });

        const id = generate({
            charset: "alphabetic",
        });

        try {
            await ogm.checkNeo4jCompat();

            await session.run(`
                CREATE (:Movie {id: "${id}"})
            `);

            const Movie = ogm.model("Movie");

            const movies = await Movie?.find({ where: { id } });

            // should return without error due to the fact auth should be removed
            expect(movies).toEqual([{ id }]);
        } finally {
            await session.close();
        }
    });

    describe("find", () => {
        test("find a single node", async () => {
            const session = driver.session();

            const typeDefs = `
                type Movie {
                    id: ID
                }
            `;

            const ogm = new OGM({ typeDefs, driver });

            const id = generate({
                charset: "alphabetic",
            });

            try {
                await ogm.checkNeo4jCompat();

                await session.run(`
                    CREATE (:Movie {id: "${id}"})
                `);

                const Movie = ogm.model("Movie");

                const movies = await Movie?.find({ where: { id } });

                expect(movies).toEqual([{ id }]);
            } finally {
                await session.close();
            }
        });

        test("should find and limit", async () => {
            const session = driver.session();

            const typeDefs = `
                type Movie {
                    id: ID
                }
            `;

            const ogm = new OGM({ typeDefs, driver });

            const id = generate({
                charset: "alphabetic",
            });

            try {
                await session.run(`
                    CREATE (:Movie {id: "${id}"})
                    CREATE (:Movie {id: "${id}"})
                    CREATE (:Movie {id: "${id}"})
                    CREATE (:Movie {id: "${id}"})
                    CREATE (:Movie {id: "${id}"})
                `);

                const Movie = ogm.model("Movie");

                const movies = await Movie?.find({ where: { id }, options: { limit: 2 } });

                expect(movies).toEqual([{ id }, { id }]);
            } finally {
                await session.close();
            }
        });

        test("should find and populate relationship using custom selectionSet", async () => {
            const session = driver.session();

            const typeDefs = `
                type Genre {
                    id: ID
                }

                type Movie {
                    id: ID
                    genres: [Genre] @relationship(type: "HAS_GENRE", direction: OUT)
                }
            `;

            const selectionSet = `
                {
                    id
                    genres {
                        id
                    }
                }
            `;

            const ogm = new OGM({ typeDefs, driver });

            const id = generate({
                charset: "alphabetic",
            });

            try {
                await session.run(`
                    CREATE (m:Movie {id: "${id}"})
                    CREATE (g:Genre {id: "${id}"})
                    MERGE (m)-[:HAS_GENRE]->(g)
                `);

                const Movie = ogm.model("Movie");

                const movies = await Movie?.find({ where: { id }, selectionSet });

                expect(movies).toEqual([{ id, genres: [{ id }] }]);
            } finally {
                await session.close();
            }
        });
    });

    describe("create", () => {
        test("should create a single node", async () => {
            const session = driver.session();

            const typeDefs = gql`
                type Movie {
                    id: ID
                }
            `;

            const ogm = new OGM({ typeDefs, driver });

            const id = generate({
                charset: "alphabetic",
            });

            try {
                const Movie = ogm.model("Movie");

                const { movies } = await Movie?.create({ input: [{ id }] });

                expect(movies).toEqual([{ id }]);

                const reFind = await session.run(
                    `
                        MATCH (m:Movie {id: $id})
                        RETURN m
                    `,
                    { id }
                );

                expect((reFind.records[0].toObject() as any).m.properties).toMatchObject({ id });
            } finally {
                await session.close();
            }
        });

        test("should create 2 nodes", async () => {
            const session = driver.session();

            const typeDefs = `
                type Movie {
                    id: ID!
                }
            `;

            const ogm = new OGM({ typeDefs, driver });

            const id1 = generate({
                charset: "alphabetic",
            });
            const id2 = generate({
                charset: "alphabetic",
            });

            try {
                const Movie = ogm.model("Movie");

                const { movies } = await Movie?.create({ input: [{ id: id1 }, { id: id2 }] });

                expect(movies).toEqual([{ id: id1 }, { id: id2 }]);
            } finally {
                await session.close();
            }
        });

        test("should create a pringles product", async () => {
            const session = driver.session();

            const typeDefs = gql`
                type Product {
                    id: ID!
                    name: String!
                    sizes: [Size] @relationship(type: "HAS_SIZE", direction: OUT)
                    colors: [Color] @relationship(type: "HAS_COLOR", direction: OUT)
                    photos: [Photo] @relationship(type: "HAS_PHOTO", direction: OUT)
                }

                type Size {
                    id: ID!
                    name: String!
                }

                type Color {
                    id: ID!
                    name: String!
                    photos: [Photo] @relationship(type: "OF_COLOR", direction: IN)
                }

                type Photo {
                    id: ID!
                    description: String!
                    url: String!
                    color: Color @relationship(type: "OF_COLOR", direction: OUT)
                }
            `;

            const ogm = new OGM({ typeDefs, driver });

            const product = {
                id: generate({
                    charset: "alphabetic",
                }),
                name: "Pringles",
            };

            const sizes = [
                {
                    id: generate({
                        charset: "alphabetic",
                    }),
                    name: "Small",
                },
                {
                    id: generate({
                        charset: "alphabetic",
                    }),
                    name: "Large",
                },
            ];

            const colors = [
                {
                    id: generate({
                        charset: "alphabetic",
                    }),
                    name: "Red",
                },
                {
                    id: generate({
                        charset: "alphabetic",
                    }),
                    name: "Green",
                },
            ];

            const photos = [
                {
                    id: generate({
                        charset: "alphabetic",
                    }),
                    description: "Outdoor photo",
                    url: "outdoor.png",
                },
                {
                    id: generate({
                        charset: "alphabetic",
                    }),
                    description: "Green photo",
                    url: "g.png",
                },
                {
                    id: generate({
                        charset: "alphabetic",
                    }),
                    description: "Red photo",
                    url: "r.png",
                },
            ];

            const Product = ogm.model("Product");

            const { products } = await Product?.create({
                input: [
                    {
                        ...product,
                        sizes: { create: sizes },
                        colors: { create: colors },
                        photos: {
                            create: [
                                photos[0],
                                {
                                    ...photos[1],
                                    color: { connect: { where: { id: colors[0].id } } },
                                },
                                {
                                    ...photos[2],
                                    color: { connect: { where: { id: colors[1].id } } },
                                },
                            ],
                        },
                    },
                ],
            });
            const [createdProduct] = products;

            expect(createdProduct.id).toEqual(product.id);

            const cypher = `
                MATCH (product:Product {id: $id})
                CALL {
                    MATCH (:Product {id: $id})-[:HAS_SIZE]->(size:Size)
                    WITH collect(size.id) AS sizeIds
                    RETURN sizeIds
                }
                CALL {
                    MATCH (:Product {id: $id})-[:HAS_COLOR]->(color:Color)
                    WITH collect(color.id) AS colorIds
                    RETURN colorIds
                }
                CALL {
                    MATCH (:Product {id: $id})-[:HAS_PHOTO]->(photo:Photo)-[:OF_COLOR]->(photoColor)
                    WITH collect(photo.id) AS photoIds, collect(photoColor.id) as photoColorIds
                    RETURN photoIds, photoColorIds
                }
                RETURN product {.id, .name, sizes: sizeIds, colors: colorIds, photos: {ids: photoIds, colors: photoColorIds} } as product
            `;

            const neo4jResult = await session.run(cypher, { id: product.id });
            const neo4jProduct = (neo4jResult.records[0].toObject() as any).product;

            expect(neo4jProduct.id).toMatch(product.id);
            expect(neo4jProduct.name).toMatch(product.name);
            neo4jProduct.sizes.forEach((size) => {
                expect(sizes.map((x) => x.id).includes(size)).toBeTruthy();
            });
            neo4jProduct.colors.forEach((color) => {
                expect(colors.map((x) => x.id).includes(color)).toBeTruthy();
            });
            neo4jProduct.photos.ids.forEach((photo) => {
                expect(photos.map((x) => x.id).includes(photo)).toBeTruthy();
            });
            neo4jProduct.photos.colors.forEach((photoColor) => {
                expect(colors.map((x) => x.id).includes(photoColor)).toBeTruthy();
            });
        });
    });

    describe("update", () => {
        test("should update a single node", async () => {
            const session = driver.session();

            const typeDefs = `
                type Movie {
                    id: ID!
                    name: String
                }
            `;

            const ogm = new OGM({ typeDefs, driver });

            const id = generate({
                charset: "alphabetic",
            });

            const initialName = generate({
                charset: "alphabetic",
            });

            const updatedName = generate({
                charset: "alphabetic",
            });

            try {
                await session.run(
                    `
                    CREATE (:Movie {id: $id, name: $initialName})
                `,
                    {
                        id,
                        initialName,
                    }
                );

                const Movie = ogm.model("Movie");

                const { movies } = await Movie?.update({ where: { id }, update: { name: updatedName } });

                expect(movies).toEqual([{ id, name: updatedName }]);
            } finally {
                await session.close();
            }
        });

        test("should update 2 nodes", async () => {
            const session = driver.session();

            const typeDefs = `
                type Movie {
                    id: ID!
                    name: String
                }
            `;

            const ogm = new OGM({ typeDefs, driver });

            const id1 = generate({
                charset: "alphabetic",
            });

            const id2 = generate({
                charset: "alphabetic",
            });

            const initialName = generate({
                charset: "alphabetic",
            });

            const updatedName = generate({
                charset: "alphabetic",
            });

            try {
                await session.run(
                    `
                    CREATE (:Movie {id: $id1, name: $initialName})
                    CREATE (:Movie {id: $id2, name: $initialName})
                `,
                    {
                        id1,
                        id2,
                        initialName,
                    }
                );

                const Movie = ogm.model("Movie");

                const { movies } = await Movie?.update({ where: { id_IN: [id1, id2] }, update: { name: updatedName } });

                const movie1 = movies.find((x) => x.id === id1);
                expect(movie1.name).toEqual(updatedName);

                const movie2 = movies.find((x) => x.id === id2);
                expect(movie2.name).toEqual(updatedName);
            } finally {
                await session.close();
            }
        });

        test("should connect to a single node", async () => {
            const session = driver.session();

            const typeDefs = gql`
                type Actor {
                    id: ID
                    movies: [Movie] @relationship(type: "ACTED_IN", direction: OUT)
                }

                type Movie {
                    id: ID
                    actors: [Actor]! @relationship(type: "ACTED_IN", direction: IN)
                }
            `;

            const ogm = new OGM({ typeDefs, driver });

            const movieId = generate({
                charset: "alphabetic",
            });

            const actorId = generate({
                charset: "alphabetic",
            });

            try {
                await session.run(
                    `
                    CREATE (:Movie {id: $movieId})
                    CREATE (:Actor {id: $actorId})
                `,
                    {
                        movieId,
                        actorId,
                    }
                );

                const Movie = ogm.model("Movie");

                const { movies } = await Movie?.update({
                    where: { id: movieId },
                    connect: { actors: [{ where: { id: actorId } }] },
                    selectionSet: `
                    {
                        movies {
                            id
                            actors {
                                id
                            }
                        }
                    }
                `,
                });

                expect(movies).toEqual([{ id: movieId, actors: [{ id: actorId }] }]);
            } finally {
                await session.close();
            }
        });

        test("should connect and create a single node", async () => {
            const session = driver.session();

            const typeDefs = `
                type Actor {
                    id: ID
                    movies: [Movie] @relationship(type: "ACTED_IN", direction: OUT)
                }

                type Movie {
                    id: ID
                    actors: [Actor]! @relationship(type: "ACTED_IN", direction: IN)
                }
            `;

            const ogm = new OGM({ typeDefs, driver });

            const movieId = generate({
                charset: "alphabetic",
            });

            const actorId = generate({
                charset: "alphabetic",
            });

            try {
                await session.run(
                    `
                    CREATE (:Movie {id: $movieId})
                `,
                    {
                        movieId,
                    }
                );

                const Movie = ogm.model("Movie");

                const { movies } = await Movie?.update({
                    where: { id: movieId },
                    create: { actors: [{ id: actorId }] },
                    selectionSet: `
                        {
                            movies {
                                id
                                actors {
                                    id
                                }
                            }
                        }
                    `,
                });

                expect(movies).toEqual([{ id: movieId, actors: [{ id: actorId }] }]);
            } finally {
                await session.close();
            }
        });

        test("should disconnect from single node", async () => {
            const session = driver.session();

            const typeDefs = `
                type Actor {
                    id: ID
                    movies: [Movie] @relationship(type: "ACTED_IN", direction: OUT)
                }

                type Movie {
                    id: ID
                    actors: [Actor]! @relationship(type: "ACTED_IN", direction: IN)
                }
            `;

            const ogm = new OGM({ typeDefs, driver });

            const movieId = generate({
                charset: "alphabetic",
            });

            const actorId = generate({
                charset: "alphabetic",
            });

            try {
                await session.run(
                    `
                    CREATE (m:Movie {id: $movieId})
                    CREATE (a:Actor {id: $actorId})
                    MERGE (m)<-[:ACTED_IN]-(a)
                `,
                    {
                        movieId,
                        actorId,
                    }
                );

                const Movie = ogm.model("Movie");

                const { movies } = await Movie?.update({
                    where: { id: movieId },
                    disconnect: { actors: [{ where: { id: actorId } }] },
                    selectionSet: `
                        {
                            movies {
                                id
                                actors {
                                    id
                                }
                            }
                        }
                    `,
                });

                expect(movies).toEqual([{ id: movieId, actors: [] }]);
            } finally {
                await session.close();
            }
        });
    });

    describe("delete", () => {
        test("should delete a single node", async () => {
            const session = driver.session();

            const typeDefs = gql`
                type Movie {
                    id: ID
                    name: String
                }
            `;

            const ogm = new OGM({ typeDefs, driver });

            const id = generate({
                charset: "alphabetic",
            });

            try {
                await session.run(`
                    CREATE (:Movie {id: "${id}"})
                `);

                const Movie = ogm.model("Movie");

                const result = await Movie?.delete({ where: { id } });

                expect(result).toEqual({ nodesDeleted: 1, relationshipsDeleted: 0 });
            } finally {
                await session.close();
            }
        });

        test("should delete movie and nested genre", async () => {
            const session = driver.session();

            const typeDefs = gql`
                type Movie {
                    id: ID
                    genres: [Genre] @relationship(type: "IN_GENRE", direction: OUT)
                }

                type Genre {
                    id: ID
                }
            `;

            const ogm = new OGM({ typeDefs, driver });

            const movieId = generate({
                charset: "alphabetic",
            });
            const genreId = generate({
                charset: "alphabetic",
            });

            try {
                await session.run(`
                    CREATE (:Movie {id: "${movieId}"})-[:IN_GENRE]->(:Genre {id: "${genreId}"})
                `);

                const Movie = ogm.model("Movie");

                const result = await Movie?.delete({
                    where: { id: movieId },
                    delete: { genres: { where: { id: genreId } } },
                });

                expect(result).toEqual({ nodesDeleted: 2, relationshipsDeleted: 1 });
            } finally {
                await session.close();
            }
        });
    });

    describe("private", () => {
        test("should allow the use of private fields in the OGM", async () => {
            const session = driver.session();

            const typeDefs = gql`
                type User {
                    id: ID
                    password: String @private
                }
            `;

            const ogm = new OGM({ typeDefs, driver });
            const User = (ogm.model("User") as unknown) as Model;

            const id = generate({
                charset: "alphabetic",
            });
            const password = generate({
                charset: "alphabetic",
            });

            try {
                const { users } = await User.create<{ users: any[] }>({ input: [{ id, password }] });

                const [user] = users;

                expect(user).toMatchObject({ id, password });
            } finally {
                await session.close();
            }
        });
    });
});
