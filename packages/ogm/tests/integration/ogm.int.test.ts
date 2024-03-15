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

import { type Driver } from "neo4j-driver";
import { generate } from "randomstring";
import { OGM } from "../../src";
import { cleanNodes } from "../utils/clean-nodes";
import { UniqueType } from "../utils/utils";
import neo4j from "./neo4j";

describe("OGM", () => {
    let driver: Driver;
    let typeMovie: UniqueType;
    let typeActor: UniqueType;
    let typeGenre: UniqueType;
    let typeProduct: UniqueType;
    let typeSize: UniqueType;
    let typeColor: UniqueType;
    let typePhoto: UniqueType;

    beforeAll(async () => {
        driver = await neo4j();
    });

    afterAll(async () => {
        await driver.close();
    });

    beforeEach(() => {
        typeMovie = new UniqueType("Movie");
        typeActor = new UniqueType("Actor");
        typeGenre = new UniqueType("Genre");
        typeProduct = new UniqueType("Product");
        typeSize = new UniqueType("Size");
        typeColor = new UniqueType("Color");
        typePhoto = new UniqueType("Photo");
    });

    afterEach(async () => {
        const session = driver.session();
        await cleanNodes(session, [typeMovie, typeActor, typeGenre, typeProduct, typeSize, typeColor, typePhoto]);
        await session.close();
    });

    test("should specify the database via OGM construction", async () => {
        const session = driver.session();

        const typeDefs = /* GraphQL */ `
            type ${typeMovie} {
                id: ID!
            }
        `;

        const ogm = new OGM({ typeDefs, driver, database: "another-random-db" });

        await ogm.init();

        await expect(ogm.model(typeMovie.name).find()).rejects.toThrow();

        await session.close();
    });

    test("should filter the document and remove directives such as authentication", async () => {
        const session = driver.session();

        const typeDefs = /* GraphQL */ `
            type ${typeMovie} @authentication {
                id: ID
            }
        `;

        const ogm = new OGM({ typeDefs, driver });

        await ogm.init();

        const id = generate({
            charset: "alphabetic",
        });

        try {
            await ogm.checkNeo4jCompat();

            await session.run(`
                CREATE (:${typeMovie} {id: "${id}"})
            `);

            const Movie = ogm.model(typeMovie.name);

            const movies = await Movie.find({ where: { id } });

            // should return without error due to the fact auth should be removed
            expect(movies).toEqual([{ id }]);
        } finally {
            await session.close();
        }
    });

    describe("find", () => {
        test("find a single node", async () => {
            const session = driver.session();

            const typeDefs = /* GraphQL */ `
                type ${typeMovie} {
                    id: ID
                }
            `;

            const ogm = new OGM({ typeDefs, driver });

            await ogm.init();

            const id = generate({
                charset: "alphabetic",
            });

            try {
                await ogm.checkNeo4jCompat();

                await session.run(`
                    CREATE (:${typeMovie} {id: "${id}"})
                `);

                const Movie = ogm.model(typeMovie.name);

                const movies = await Movie.find({ where: { id } });

                expect(movies).toEqual([{ id }]);
            } finally {
                await session.close();
            }
        });

        test("should find and limit", async () => {
            const session = driver.session();

            const typeDefs = /* GraphQL */ `
                type ${typeMovie} {
                    id: ID
                }
            `;

            const ogm = new OGM({ typeDefs, driver });

            await ogm.init();

            const id = generate({
                charset: "alphabetic",
            });

            try {
                await session.run(`
                    CREATE (:${typeMovie} {id: "${id}"})
                    CREATE (:${typeMovie} {id: "${id}"})
                    CREATE (:${typeMovie} {id: "${id}"})
                    CREATE (:${typeMovie} {id: "${id}"})
                    CREATE (:${typeMovie} {id: "${id}"})
                `);

                const Movie = ogm.model(typeMovie.name);

                const movies = await Movie.find({ where: { id }, options: { limit: 2 } });

                expect(movies).toEqual([{ id }, { id }]);
            } finally {
                await session.close();
            }
        });

        test("should find and populate relationship using custom selectionSet", async () => {
            const session = driver.session();

            const typeDefs = /* GraphQL */ `
                type ${typeGenre} {
                    id: ID
                }

                type ${typeMovie} {
                    id: ID
                    ${typeGenre.plural}: [${typeGenre}!]! @relationship(type: "HAS_GENRE", direction: OUT)
                }
            `;

            const selectionSet = `
                {
                    id
                    ${typeGenre.plural} {
                        id
                    }
                }
            `;

            const ogm = new OGM({ typeDefs, driver });

            await ogm.init();

            const id = generate({
                charset: "alphabetic",
            });

            try {
                await session.run(`
                    CREATE (m:${typeMovie} {id: "${id}"})
                    CREATE (g:${typeGenre} {id: "${id}"})
                    MERGE (m)-[:HAS_GENRE]->(g)
                `);

                const Movie = ogm.model(typeMovie.name);

                const movies = await Movie.find({ where: { id }, selectionSet });

                expect(movies).toEqual([{ id, [typeGenre.plural]: [{ id }] }]);
            } finally {
                await session.close();
            }
        });
    });

    describe("create", () => {
        test("should create a single node", async () => {
            const session = driver.session();

            const typeDefs = /* GraphQL */ `
                type ${typeMovie} {
                    id: ID
                }
            `;

            const ogm = new OGM({ typeDefs, driver });

            await ogm.init();

            const id = generate({
                charset: "alphabetic",
            });

            try {
                const Movie = ogm.model(typeMovie.name);

                const createResult = await Movie.create({ input: [{ id }] });

                expect(createResult[typeMovie.plural]).toEqual([{ id }]);

                const reFind = await session.run(
                    `
                        MATCH (m:${typeMovie} {id: $id})
                        RETURN m
                    `,
                    { id }
                );

                expect(reFind.records[0].toObject().m.properties).toMatchObject({ id });
            } finally {
                await session.close();
            }
        });

        test("should create 2 nodes", async () => {
            const session = driver.session();

            const typeDefs = `
                type ${typeMovie} {
                    id: ID!
                }
            `;

            const ogm = new OGM({ typeDefs, driver });

            await ogm.init();

            const id1 = generate({
                charset: "alphabetic",
            });
            const id2 = generate({
                charset: "alphabetic",
            });

            try {
                const Movie = ogm.model(typeMovie.name);

                const createResult = await Movie.create({ input: [{ id: id1 }, { id: id2 }] });

                expect(createResult[typeMovie.plural]).toEqual([{ id: id1 }, { id: id2 }]);
            } finally {
                await session.close();
            }
        });

        test("should create a pringles product", async () => {
            const session = driver.session();

            const typeDefs = `
                type ${typeProduct} {
                    id: ID!
                    name: String!
                    ${typeSize.plural}: [${typeSize}!]! @relationship(type: "HAS_SIZE", direction: OUT)
                    ${typeColor.plural}: [${typeColor}!]! @relationship(type: "HAS_COLOR", direction: OUT)
                    ${typePhoto.plural}: [${typePhoto}!]! @relationship(type: "HAS_PHOTO", direction: OUT)
                }

                type ${typeSize} {
                    id: ID!
                    name: String!
                }

                type ${typeColor} {
                    id: ID!
                    name: String!
                    ${typePhoto.plural}: [${typePhoto}!]! @relationship(type: "OF_COLOR", direction: IN)
                }

                type ${typePhoto} {
                    id: ID!
                    description: String!
                    url: String!
                    ${typeColor.plural}: ${typeColor}! @relationship(type: "OF_COLOR", direction: OUT)
                }
            `;

            const ogm = new OGM({ typeDefs, driver });

            await ogm.init();

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

            const Product = ogm.model(typeProduct.name);

            const createResult = await Product.create({
                input: [
                    {
                        ...product,
                        [typeSize.plural]: { create: sizes.map((x) => ({ node: x })) },
                        [typeColor.plural]: { create: colors.map((x) => ({ node: x })) },
                        [typePhoto.plural]: {
                            create: [
                                {
                                    node: {
                                        ...photos[0],
                                        [typeColor.plural]: { connect: { where: { node: { id: colors[0].id } } } },
                                    },
                                },
                                {
                                    node: {
                                        ...photos[1],
                                        [typeColor.plural]: { connect: { where: { node: { id: colors[1].id } } } },
                                    },
                                },
                            ],
                        },
                    },
                ],
            });
            const [createdProduct] = createResult[typeProduct.plural];

            expect(createdProduct.id).toEqual(product.id);

            const cypher = `
                MATCH (product:${typeProduct} {id: $id})
                CALL {
                    MATCH (:${typeProduct} {id: $id})-[:HAS_SIZE]->(size:${typeSize})
                    WITH collect(size.id) AS sizeIds
                    RETURN sizeIds
                }
                CALL {
                    MATCH (:${typeProduct} {id: $id})-[:HAS_COLOR]->(color:${typeColor})
                    WITH collect(color.id) AS colorIds
                    RETURN colorIds
                }
                CALL {
                    MATCH (:${typeProduct} {id: $id})-[:HAS_PHOTO]->(photo:${typePhoto})-[:OF_COLOR]->(photoColor)
                    WITH collect(photo.id) AS photoIds, collect(photoColor.id) as photoColorIds
                    RETURN photoIds, photoColorIds
                }
                RETURN product {.id, .name, sizes: sizeIds, colors: colorIds, photos: {ids: photoIds, colors: photoColorIds} } as product
            `;

            const neo4jResult = await session.run(cypher, { id: product.id });
            const neo4jProduct = neo4jResult.records[0].toObject().product;

            expect(neo4jProduct.id).toMatch(product.id);
            expect(neo4jProduct.name).toMatch(product.name);
            neo4jProduct.sizes.forEach((size: string) => {
                expect(sizes.map((x) => x.id).includes(size)).toBeTruthy();
            });
            neo4jProduct.colors.forEach((color: string) => {
                expect(colors.map((x) => x.id).includes(color)).toBeTruthy();
            });
            neo4jProduct.photos.ids.forEach((photo: string) => {
                expect(photos.map((x) => x.id).includes(photo)).toBeTruthy();
            });
            neo4jProduct.photos.colors.forEach((photoColor: string) => {
                expect(colors.map((x) => x.id).includes(photoColor)).toBeTruthy();
            });
        });
    });

    describe("update", () => {
        test("should update a single node", async () => {
            const session = driver.session();

            const typeDefs = `
                type ${typeMovie} {
                    id: ID!
                    name: String
                }
            `;

            const ogm = new OGM({ typeDefs, driver });

            await ogm.init();

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
                    CREATE (:${typeMovie} {id: $id, name: $initialName})
                `,
                    {
                        id,
                        initialName,
                    }
                );

                const Movie = ogm.model(typeMovie.name);

                const updateResult = await Movie.update({ where: { id }, update: { name: updatedName } });

                expect(updateResult[typeMovie.plural]).toEqual([{ id, name: updatedName }]);
            } finally {
                await session.close();
            }
        });

        test("should update 2 nodes", async () => {
            const session = driver.session();

            const typeDefs = `
                type ${typeMovie} {
                    id: ID!
                    name: String
                }
            `;

            const ogm = new OGM({ typeDefs, driver });

            await ogm.init();

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
                    CREATE (:${typeMovie} {id: $id1, name: $initialName})
                    CREATE (:${typeMovie} {id: $id2, name: $initialName})
                `,
                    {
                        id1,
                        id2,
                        initialName,
                    }
                );

                const Movie = ogm.model(typeMovie.name);

                const updateResult = await Movie.update({
                    where: { id_IN: [id1, id2] },
                    update: { name: updatedName },
                });

                const movie1 = updateResult[typeMovie.plural].find((x) => x.id === id1);
                expect(movie1.name).toEqual(updatedName);

                const movie2 = updateResult[typeMovie.plural].find((x) => x.id === id2);
                expect(movie2.name).toEqual(updatedName);
            } finally {
                await session.close();
            }
        });

        test("should connect to a single node", async () => {
            const session = driver.session();

            const typeDefs = `
                type ${typeActor} {
                    id: ID
                    ${typeMovie.plural}: [${typeMovie}!]! @relationship(type: "ACTED_IN", direction: OUT)
                }

                type ${typeMovie} {
                    id: ID
                    ${typeActor.plural}: [${typeActor}!]! @relationship(type: "ACTED_IN", direction: IN)
                }
            `;

            const ogm = new OGM({ typeDefs, driver });

            await ogm.init();

            const movieId = generate({
                charset: "alphabetic",
            });

            const actorId = generate({
                charset: "alphabetic",
            });

            try {
                await session.run(
                    `
                    CREATE (:${typeMovie} {id: $movieId})
                    CREATE (:${typeActor} {id: $actorId})
                `,
                    {
                        movieId,
                        actorId,
                    }
                );

                const Movie = ogm.model(typeMovie.name);

                const updateResult = await Movie.update({
                    where: { id: movieId },
                    connect: { [typeActor.plural]: [{ where: { node: { id: actorId } } }] },
                    selectionSet: `
                    {
                        ${typeMovie.plural} {
                            id
                            ${typeActor.plural} {
                                id
                            }
                        }
                    }
                `,
                });

                expect(updateResult[typeMovie.plural]).toEqual([
                    { id: movieId, [typeActor.plural]: [{ id: actorId }] },
                ]);
            } finally {
                await session.close();
            }
        });

        test("should connect and create a single node", async () => {
            const session = driver.session();

            const typeDefs = `
                type ${typeActor} {
                    id: ID
                    ${typeMovie.plural}: [${typeMovie}!]! @relationship(type: "ACTED_IN", direction: OUT)
                }

                type ${typeMovie} {
                    id: ID
                    ${typeActor.plural}: [${typeActor}!]! @relationship(type: "ACTED_IN", direction: IN)
                }
            `;

            const ogm = new OGM({ typeDefs, driver });

            await ogm.init();

            const movieId = generate({
                charset: "alphabetic",
            });

            const actorId = generate({
                charset: "alphabetic",
            });

            try {
                await session.run(
                    `
                    CREATE (:${typeMovie} {id: $movieId})
                `,
                    {
                        movieId,
                    }
                );

                const Movie = ogm.model(typeMovie.name);

                const updateResult = await Movie.update({
                    where: { id: movieId },
                    create: { [typeActor.plural]: [{ node: { id: actorId } }] },
                    selectionSet: `
                        {
                            ${typeMovie.plural} {
                                id
                                ${typeActor.plural} {
                                    id
                                }
                            }
                        }
                    `,
                });

                expect(updateResult[typeMovie.plural]).toEqual([
                    { id: movieId, [typeActor.plural]: [{ id: actorId }] },
                ]);
            } finally {
                await session.close();
            }
        });

        test("should disconnect from single node", async () => {
            const session = driver.session();

            const typeDefs = `
                type ${typeActor} {
                    id: ID
                    ${typeMovie.plural}: [${typeMovie}!]! @relationship(type: "ACTED_IN", direction: OUT)
                }

                type ${typeMovie} {
                    id: ID
                    ${typeActor.plural}: [${typeActor}!]! @relationship(type: "ACTED_IN", direction: IN)
                }
            `;

            const ogm = new OGM({ typeDefs, driver });

            await ogm.init();

            const movieId = generate({
                charset: "alphabetic",
            });

            const actorId = generate({
                charset: "alphabetic",
            });

            try {
                await session.run(
                    `
                    CREATE (m:${typeMovie} {id: $movieId})
                    CREATE (a:${typeActor} {id: $actorId})
                    MERGE (m)<-[:ACTED_IN]-(a)
                `,
                    {
                        movieId,
                        actorId,
                    }
                );

                const Movie = ogm.model(typeMovie.name);

                const updateResult = await Movie.update({
                    where: { id: movieId },
                    disconnect: { [typeActor.plural]: [{ where: { node: { id: actorId } } }] },
                    selectionSet: `
                        {
                            ${typeMovie.plural} {
                                id
                                ${typeActor.plural} {
                                    id
                                }
                            }
                        }
                    `,
                });

                expect(updateResult[typeMovie.plural]).toEqual([{ id: movieId, [typeActor.plural]: [] }]);
            } finally {
                await session.close();
            }
        });
    });

    describe("delete", () => {
        test("should delete a single node", async () => {
            const session = driver.session();

            const typeDefs = /* GraphQL */ `
                type ${typeMovie} {
                    id: ID
                    name: String
                }
            `;

            const ogm = new OGM({ typeDefs, driver });

            await ogm.init();

            const id = generate({
                charset: "alphabetic",
            });

            try {
                await session.run(`
                    CREATE (:${typeMovie} {id: "${id}"})
                `);

                const Movie = ogm.model(typeMovie.name);

                const result = await Movie.delete({ where: { id } });

                expect(result).toEqual({ nodesDeleted: 1, relationshipsDeleted: 0 });
            } finally {
                await session.close();
            }
        });

        test("should delete movie and nested genre", async () => {
            const session = driver.session();

            const typeDefs = /* GraphQL */ `
                type ${typeMovie} {
                    id: ID
                    ${typeGenre.plural}: [${typeGenre}!]! @relationship(type: "IN_GENRE", direction: OUT)
                }

                type ${typeGenre} {
                    id: ID
                }
            `;

            const ogm = new OGM({ typeDefs, driver });

            await ogm.init();

            const movieId = generate({
                charset: "alphabetic",
            });
            const genreId = generate({
                charset: "alphabetic",
            });

            try {
                await session.run(`
                    CREATE (:${typeMovie} {id: "${movieId}"})-[:IN_GENRE]->(:${typeGenre} {id: "${genreId}"})
                `);

                const Movie = ogm.model(typeMovie.name);

                const result = await Movie.delete({
                    where: { id: movieId },
                    delete: { [typeGenre.plural]: { where: { node: { id: genreId } } } },
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

            const typeDefs = /* GraphQL */ `
                type User {
                    id: ID
                    password: String @private
                }
            `;

            const ogm = new OGM({ typeDefs, driver });
            const User = ogm.model("User");

            await ogm.init();

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

    describe("aggregations", () => {
        test("should return aggregated count on its own", async () => {
            const session = driver.session();

            const typeDefs = /* GraphQL */ `
                type ${typeMovie} {
                    testId: ID
                    title: String
                    imdbRating: Int
                }
            `;

            const ogm = new OGM({ typeDefs, driver });

            await ogm.init();

            const testId = generate({
                charset: "alphabetic",
            });

            try {
                await session.run(`
                    CREATE (:${typeMovie} {testId: "${testId}"})
                    CREATE (:${typeMovie} {testId: "${testId}"})
                    CREATE (:${typeMovie} {testId: "${testId}"})
                    CREATE (:${typeMovie} {testId: "${testId}"})
                `);

                const Movie = ogm.model(typeMovie.name);

                const result = await Movie.aggregate({
                    where: { testId },
                    aggregate: {
                        count: true,
                    },
                });

                expect(result).toEqual({
                    count: 4,
                });
            } finally {
                await session.close();
            }
        });

        test("should return aggregated fields", async () => {
            const session = driver.session();

            const typeDefs = /* GraphQL */ `
                type ${typeMovie} {
                    testId: ID
                    title: String
                    imdbRating: Int
                }
            `;

            const ogm = new OGM({ typeDefs, driver });

            await ogm.init();

            const testId = generate({
                charset: "alphabetic",
            });

            try {
                await session.run(`
                    CREATE (:${typeMovie} {testId: "${testId}", title: "1", imdbRating: 1})
                    CREATE (:${typeMovie} {testId: "${testId}", title: "22", imdbRating: 2})
                    CREATE (:${typeMovie} {testId: "${testId}", title: "333", imdbRating: 3})
                    CREATE (:${typeMovie} {testId: "${testId}", title: "4444", imdbRating: 4})
                `);

                const Movie = ogm.model(typeMovie.name);

                const result = await Movie.aggregate({
                    where: { testId },
                    aggregate: {
                        title: {
                            shortest: true,
                            longest: true,
                        },
                        imdbRating: {
                            min: true,
                            max: true,
                            average: true,
                        },
                    },
                });

                expect(result).toEqual({
                    title: { shortest: "1", longest: "4444" },
                    imdbRating: { min: 1, max: 4, average: 2.5 },
                });
            } finally {
                await session.close();
            }
        });
    });

    describe("indexes and constraints", () => {
        test("should create constraints with `assertIndexesAndConstraints` method", async () => {
            const session = driver.session();

            const typeDefs = /* GraphQL */ `
                type Book {
                    isbn: String! @unique
                    title: String
                }
            `;

            const ogm = new OGM({ typeDefs, driver });
            const Book = ogm.model("Book");

            await ogm.init();

            const isbn = generate({ readable: true });
            const title = generate({ readable: true });

            const createDuplicateBooks = async () =>
                await Book.create<{ books: any[] }>({
                    input: [
                        { isbn, title },
                        { isbn, title },
                    ],
                });

            try {
                // ensure the constraint does not exist
                await session.run(`DROP CONSTRAINT Book_isbn IF EXISTS`);

                // assert
                await expect(ogm.assertIndexesAndConstraints()).rejects.toThrow("Missing constraint for Book.isbn");

                // create
                await expect(ogm.assertIndexesAndConstraints({ options: { create: true } })).resolves.not.toThrow();

                // assert again
                await expect(ogm.assertIndexesAndConstraints()).resolves.not.toThrow();

                await expect(createDuplicateBooks()).rejects.toThrow("Constraint validation failed");
            } finally {
                await session.close();
            }
        });
    });

    describe("authentication", () => {
        test("should allow the use of types requiring authentication in the OGM", async () => {
            const session = driver.session();

            const typeDefs = /* GraphQL */ `
                type User @authentication {
                    id: ID
                    password: String
                }
            `;

            const ogm = new OGM({ typeDefs, driver });
            const User = ogm.model("User");

            await ogm.init();

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
