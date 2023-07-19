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
import { graphql } from "graphql";
import { generate } from "randomstring";
import Neo4j from "./neo4j";
import { Neo4jGraphQL } from "../../src/classes";

describe("create", () => {
    let driver: Driver;
    let neo4j: Neo4j;

    beforeAll(async () => {
        neo4j = new Neo4j();
        driver = await neo4j.getDriver();
    });

    afterAll(async () => {
        await driver.close();
    });

    test("should create a single movie", async () => {
        const session = await neo4j.getSession();

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
                schema: await neoSchema.getSchema(),
                source: query,
                variableValues: { id },
                contextValue: neo4j.getContextValues(),
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

            expect((reFind.records[0]?.toObject() as any).m.properties).toMatchObject({ id });
        } finally {
            await session.close();
        }
    });

    test("should create actor and resolve actorsConnection with where clause on movie field", async () => {
        const session = await neo4j.getSession();

        const typeDefs = `
            type Actor {
                name: String!
                movies: [Movie!]! @relationship(type: "ACTED_IN", direction: OUT)
            }

            type Movie {
                title: String!
                actors: [Actor!]! @relationship(type: "ACTED_IN", direction: IN)
            }
        `;

        const neoSchema = new Neo4jGraphQL({ typeDefs });
        const schema = await neoSchema.getSchema();

        const movieTitle = generate({ charset: "alphabetic" });
        const actorName = generate({ charset: "alphabetic" });

        const query = `
            mutation ($movieTitle: String!, $actorName: String!) {
                createActors(
                    input: {
                        name: $actorName
                        movies: { connect: { where: { node: { title: $movieTitle } } } }
                    }
                ) {
                    actors {
                        name
                        movies {
                            title
                            actorsConnection(where: { node: { name: $actorName } }) {
                                totalCount
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
        try {
            await session.run(
                `
                    CREATE (movie:Movie {title: $movieTitle})
                `,
                {
                    movieTitle,
                }
            );

            const result = await graphql({
                schema,
                source: query,
                contextValue: neo4j.getContextValues(),
                variableValues: { movieTitle, actorName },
            });

            expect(result.errors).toBeFalsy();
            expect(result.data?.createActors).toEqual({
                actors: [
                    {
                        name: actorName,
                        movies: [
                            {
                                title: movieTitle,
                                actorsConnection: {
                                    totalCount: 1,
                                    edges: [
                                        {
                                            node: {
                                                name: actorName,
                                            },
                                        },
                                    ],
                                },
                            },
                        ],
                    },
                ],
            });
        } finally {
            await session.close();
        }
    });

    test("should create 2 movies", async () => {
        const session = await neo4j.getSession();

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
                schema: await neoSchema.getSchema(),
                source: query,
                variableValues: { id1, id2 },
                contextValue: neo4j.getContextValues(),
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

            expect(reFind.records.map((r) => r.toObject().m.properties.id)).toIncludeSameMembers([id1, id2]);
        } finally {
            await session.close();
        }
    });

    test("should create and return pringles product", async () => {
        const session = await neo4j.getSession();

        const typeDefs = `
            type Product {
                id: ID!
                name: String!
                sizes: [Size!]! @relationship(type: "HAS_SIZE", direction: OUT)
                colors: [Color!]! @relationship(type: "HAS_COLOR", direction: OUT)
                photos: [Photo!]! @relationship(type: "HAS_PHOTO", direction: OUT)
            }

            type Size {
                id: ID!
                name: String!
            }

            type Color {
                id: ID!
                name: String!
                photos: [Photo!]! @relationship(type: "OF_COLOR", direction: IN)
            }

            type Photo {
                id: ID!
                description: String!
                url: String!
                color: Color! @relationship(type: "OF_COLOR", direction: OUT)
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
            schema: await neoSchema.getSchema(),
            source: mutation,
            variableValues: {
                input: [
                    {
                        ...product,
                        sizes: { create: sizes.map((x) => ({ node: x })) },
                        colors: { create: colors.map((x) => ({ node: x })) },
                        photos: {
                            create: [
                                {
                                    node: {
                                        ...photos[0],
                                        color: { connect: { where: { node: { id: colors[0]?.id } } } },
                                    },
                                },
                                {
                                    node: {
                                        ...photos[1],
                                        color: { connect: { where: { node: { id: colors[1]?.id } } } },
                                    },
                                },
                            ],
                        },
                    },
                ],
            },
            contextValue: neo4j.getContextValues(),
        });

        expect(gqlResult.errors).toBeFalsy();

        const graphqlProduct = (gqlResult?.data as any)?.createProducts.products[0];
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
        const neo4jProduct = neo4jResult.records[0]?.toObject().product;

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
