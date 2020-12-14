import { Driver } from "neo4j-driver";
import { generate } from "randomstring";
import { describe, beforeAll, afterAll, test, expect } from "@jest/globals";
import { parse } from "graphql";
import gql from "graphql-tag";
import neo4j from "./neo4j";
import makeAugmentedSchema from "../../src/schema/make-augmented-schema";

describe("ogm", () => {
    let driver: Driver;

    beforeAll(async () => {
        driver = await neo4j();
    });

    afterAll(async () => {
        await driver.close();
    });

    describe("find", () => {
        test("find a single node", async () => {
            const session = driver.session();

            const typeDefs = `
                type Movie {
                    id: ID
                    name: String
                }
            `;

            const neoSchema = makeAugmentedSchema({ typeDefs, context: { driver } });

            const id = generate({
                charset: "alphabetic",
            });

            try {
                await session.run(`
                    CREATE (:Movie {id: "${id}"})
                `);

                const Movie = neoSchema.model("Movie");

                const movies = await Movie.find({ where: { id } });

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
                    name: String
                }
            `;

            const neoSchema = makeAugmentedSchema({ typeDefs, context: { driver } });

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

                const Movie = neoSchema.model("Movie");

                const movies = await Movie.find({ where: { id }, options: { limit: 2 } });

                expect(movies).toEqual([{ id }, { id }]);
            } finally {
                await session.close();
            }
        });

        describe("Selection Set", () => {
            test("should find and populate relationship using custom string", async () => {
                const session = driver.session();

                const typeDefs = `
                    type Genre {
                        id: ID
                    }

                    type Movie {
                        id: ID
                        genres: [Genre] @relationship(type: "HAS_GENRE", direction: "OUT")
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

                const neoSchema = makeAugmentedSchema({ typeDefs, context: { driver } });

                const id = generate({
                    charset: "alphabetic",
                });

                try {
                    await session.run(`
                        CREATE (m:Movie {id: "${id}"})
                        CREATE (g:Genre {id: "${id}"})
                        MERGE (m)-[:HAS_GENRE]->(g)
                    `);

                    const Movie = neoSchema.model("Movie");

                    const movies = await Movie.find({ where: { id }, selectionSet });

                    expect(movies).toEqual([{ id, genres: [{ id }] }]);
                } finally {
                    await session.close();
                }
            });

            test("should find and populate relationship using document", async () => {
                const session = driver.session();

                const typeDefs = `
                    type Genre {
                        id: ID
                    }

                    type Movie {
                        id: ID
                        genres: [Genre] @relationship(type: "HAS_GENRE", direction: "OUT")
                    }
                `;

                const selectionSet = parse(`
                    {
                        id
                        genres {
                            id
                        }
                    }
                `);

                const neoSchema = makeAugmentedSchema({ typeDefs, context: { driver } });

                const id = generate({
                    charset: "alphabetic",
                });

                try {
                    await session.run(`
                        CREATE (m:Movie {id: "${id}"})
                        CREATE (g:Genre {id: "${id}"})
                        MERGE (m)-[:HAS_GENRE]->(g)
                    `);

                    const Movie = neoSchema.model("Movie");

                    const movies = await Movie.find({ where: { id }, selectionSet });

                    expect(movies).toEqual([{ id, genres: [{ id }] }]);
                } finally {
                    await session.close();
                }
            });

            test("should find and populate relationship using gql-tag", async () => {
                const session = driver.session();

                const typeDefs = `
                    type Genre {
                        id: ID
                    }
                
                    type Movie {
                        id: ID
                        genres: [Genre] @relationship(type: "HAS_GENRE", direction: "OUT")
                    }
                `;

                const selectionSet = gql`
                    {
                        id
                        genres {
                            id
                        }
                    }
                `;

                const neoSchema = makeAugmentedSchema({ typeDefs, context: { driver } });

                const id = generate({
                    charset: "alphabetic",
                });

                try {
                    await session.run(`
                        CREATE (m:Movie {id: "${id}"})
                        CREATE (g:Genre {id: "${id}"})
                        MERGE (m)-[:HAS_GENRE]->(g)
                    `);

                    const Movie = neoSchema.model("Movie");

                    const movies = await Movie.find({ where: { id }, selectionSet });

                    expect(movies).toEqual([{ id, genres: [{ id }] }]);
                } finally {
                    await session.close();
                }
            });
        });
    });

    describe("create", () => {
        test("should create a single node", async () => {
            const session = driver.session();

            const typeDefs = gql`
                type Movie {
                    id: ID
                    name: String
                }
            `;

            const neoSchema = makeAugmentedSchema({ typeDefs, context: { driver } });

            const id = generate({
                charset: "alphabetic",
            });

            try {
                const Movie = neoSchema.model("Movie");

                const movies = await Movie.create({ input: [{ id }] });

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

        test("should create 2 movies", async () => {
            const session = driver.session();

            const typeDefs = `
                type Movie {
                    id: ID!
                }
            `;

            const neoSchema = makeAugmentedSchema({ typeDefs, context: { driver } });

            const id1 = generate({
                charset: "alphabetic",
            });
            const id2 = generate({
                charset: "alphabetic",
            });

            try {
                const Movie = neoSchema.model("Movie");

                const movies = await Movie.create({ input: [{ id: id1 }, { id: id2 }] });

                expect(movies).toEqual([{ id: id1 }, { id: id2 }]);
            } finally {
                await session.close();
            }
        });

        test("should create a pringles product", async () => {
            const session = driver.session();

            const typeDefs = `
                type Product {
                    id: ID!
                    name: String!
                    sizes: [Size] @relationship(type: "HAS_SIZE", direction: "OUT")
                    colors: [Color] @relationship(type: "HAS_COLOR", direction: "OUT")
                    photos: [Photo] @relationship(type: "HAS_PHOTO", direction: "OUT")
                }
                
                type Size {
                    id: ID!
                    name: String!
                }
                
                type Color {
                    id: ID!
                    name: String!
                    photos: [Photo] @relationship(type: "OF_COLOR", direction: "IN")
                }
                
                type Photo {
                    id: ID!
                    description: String!
                    url: String!
                    color: Color @relationship(type: "OF_COLOR", direction: "OUT")
                }
            `;

            const neoSchema = makeAugmentedSchema({ typeDefs, context: { driver } });

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

            const Product = neoSchema.model("Product");

            const [createdProduct] = await Product.create({
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
});
