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
import { graphql } from "graphql";
import { generate } from "randomstring";
import neo4j from "./neo4j";
import { Neo4jGraphQL } from "../../src/classes";

describe("create", () => {
    let driver: Driver;

    beforeAll(async () => {
        driver = await neo4j();
    });

    afterAll(async () => {
        await driver.close();
    });

    test("should create a single movie", async () => {
        const session = driver.session();

        const typeDefs = `
            type Actor {
                name: String
            }

            type Movie {
                id: ID!
            }
        `;

        const neoSchema = new Neo4jGraphQL({ typeDefs });

        const id = generate({
            charset: "alphabetic",
        });

        const query = `
        mutation($id: ID!) {
            createMovies(input: [{ id: $id }]) {
                movies {
                    id
                }
            }
          }
        `;

        try {
            const gqlResult = await graphql({
                schema: neoSchema.schema,
                source: query,
                variableValues: { id },
                contextValue: { driver, driverConfig: { bookmarks: [session.lastBookmark()] } },
            });

            expect(gqlResult.errors).toBeFalsy();

            expect(gqlResult?.data?.createMovies).toEqual({ movies: [{ id }] });

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
            type Actor {
                name: String
            }

            type Movie {
                id: ID!
            }
        `;

        const neoSchema = new Neo4jGraphQL({ typeDefs });

        const id1 = generate({
            charset: "alphabetic",
        });
        const id2 = generate({
            charset: "alphabetic",
        });

        const query = `
        mutation($id1: ID!, $id2: ID!) {
            createMovies(input: [{ id: $id1 }, {id: $id2}]) {
                movies {
                    id
                }
            }
          }
        `;

        try {
            const gqlResult = await graphql({
                schema: neoSchema.schema,
                source: query,
                variableValues: { id1, id2 },
                contextValue: { driver, driverConfig: { bookmarks: [session.lastBookmark()] } },
            });

            expect(gqlResult.errors).toBeFalsy();

            expect(gqlResult?.data?.createMovies).toEqual({ movies: [{ id: id1 }, { id: id2 }] });

            const reFind = await session.run(
                `
              MATCH (m:Movie)
              WHERE m.id = $id1 OR m.id = $id2
              RETURN m
            `,
                { id1, id2 }
            );

            expect((reFind.records[0].toObject() as any).m.properties.id).toEqual(id1);
            expect((reFind.records[1].toObject() as any).m.properties.id).toEqual(id2);
        } finally {
            await session.close();
        }
    });

    test("should create and return pringles product", async () => {
        const session = driver.session();

        const typeDefs = `
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

        const neoSchema = new Neo4jGraphQL({ typeDefs });

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

        const mutation = `
        mutation($input: [ProductCreateInput!]!) {
            createProducts(
              input: $input
            ) {
                products {
                    id
                }
            }
          }
        `;

        const gqlResult = await graphql({
            schema: neoSchema.schema,
            source: mutation,
            variableValues: {
                input: [
                    {
                        ...product,
                        sizes: { create: sizes.map((x) => ({ node: x })) },
                        colors: { create: colors.map((x) => ({ node: x })) },
                        photos: {
                            create: [
                                { node: photos[0] },
                                {
                                    node: {
                                        ...photos[1],
                                        color: { connect: { where: { node: { id: colors[0].id } } } },
                                    },
                                },
                                {
                                    node: {
                                        ...photos[2],
                                        color: { connect: { where: { node: { id: colors[1].id } } } },
                                    },
                                },
                            ],
                        },
                    },
                ],
            },
            contextValue: { driver, driverConfig: { bookmarks: [session.lastBookmark()] } },
        });

        expect(gqlResult.errors).toBeFalsy();

        const graphqlProduct = gqlResult?.data?.createProducts.products[0];
        expect(graphqlProduct.id).toEqual(product.id);

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
