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

import { graphql } from "graphql";
import type { Driver } from "neo4j-driver";
import { generate } from "randomstring";
import { Neo4jGraphQL } from "../../src/classes";
import { UniqueType } from "../utils/graphql-types";
import Neo4jHelper from "./neo4j";

describe("create", () => {
    let driver: Driver;
    let neo4j: Neo4jHelper;
    let neoSchema: Neo4jGraphQL;
    let Actor: UniqueType;
    let Movie: UniqueType;

    beforeAll(async () => {
        neo4j = new Neo4jHelper();
        driver = await neo4j.getDriver();
        Actor = new UniqueType("Actor");
        Movie = new UniqueType("Movie");

        const typeDefs = `
            type ${Actor} {
                name: String
                movies: [${Movie}!]! @relationship(type: "ACTED_IN", direction: OUT)
            }
        
            type ${Movie} {
                id: ID!
                title: String
                actors: [${Actor}!]! @relationship(type: "ACTED_IN", direction: IN)
            }
        `;

        neoSchema = new Neo4jGraphQL({ typeDefs });
    });

    afterAll(async () => {
        await driver.close();
    });

    test("should create a single movie", async () => {
        const session = await neo4j.getSession();

        const id = generate({
            charset: "alphabetic",
        });

        const query = `
        mutation($id: ID!) {
            ${Movie.operations.create}(input: [{ id: $id }]) {
                ${Movie.plural} {
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

            expect(gqlResult?.data?.[Movie.operations.create]).toEqual({ [Movie.plural]: [{ id }] });

            const reFind = await session.run(
                `
              MATCH (m:${Movie} {id: $id})
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

        const schema = await neoSchema.getSchema();

        const movieTitle = generate({ charset: "alphabetic" });
        const actorName = generate({ charset: "alphabetic" });

        const query = `
            mutation ($movieTitle: String!, $actorName: String!) {
                ${Actor.operations.create}(
                    input: {
                        name: $actorName
                        movies: { connect: { where: { node: { title: $movieTitle } } } }
                    }
                ) {
                    ${Actor.plural} {
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
                    CREATE (movie:${Movie} {title: $movieTitle})
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
            expect(result.data?.[Actor.operations.create]).toEqual({
                [Actor.plural]: [
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

        const id1 = generate({
            charset: "alphabetic",
        });
        const id2 = generate({
            charset: "alphabetic",
        });

        const query = `
        mutation($id1: ID!, $id2: ID!) {
            ${Movie.operations.create}(input: [{ id: $id1 }, {id: $id2}]) {
                ${Movie.plural} {
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

            expect(gqlResult?.data?.[Movie.operations.create]).toEqual({ [Movie.plural]: [{ id: id1 }, { id: id2 }] });

            const reFind = await session.run(
                `
              MATCH (m:${Movie})
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
        const Size = new UniqueType("Size");
        const Product = new UniqueType("Product");
        const Color = new UniqueType("Color");
        const Photo = new UniqueType("Photo");

        const typeDefs = `
            type ${Product} {
                id: ID!
                name: String!
                sizes: [${Size}!]! @relationship(type: "HAS_SIZE", direction: OUT)
                colors: [${Color}!]! @relationship(type: "HAS_COLOR", direction: OUT)
                photos: [${Photo}!]! @relationship(type: "HAS_PHOTO", direction: OUT)
            }

            type ${Size} {
                id: ID!
                name: String!
            }

            type ${Color} {
                id: ID!
                name: String!
                photos: [${Photo}!]! @relationship(type: "OF_COLOR", direction: IN)
            }

            type ${Photo} {
                id: ID!
                description: String!
                url: String!
                color: ${Color}! @relationship(type: "OF_COLOR", direction: OUT)
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
            mutation($input: [${Product}CreateInput!]!) {
                ${Product.operations.create}(
                  input: $input
                ) {
                    ${Product.plural} {
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

        const graphqlProduct = (gqlResult?.data as any)[Product.operations.create][Product.plural][0];
        expect(graphqlProduct.id).toEqual(product.id);

        const cypher = `
            MATCH (product:${Product} {id: $id})
            CALL {
                MATCH (:${Product} {id: $id})-[:HAS_SIZE]->(size:${Color})
                WITH collect(size.id) AS sizeIds
                RETURN sizeIds
            }
            CALL {
                MATCH (:${Product} {id: $id})-[:HAS_COLOR]->(color:${Color})
                WITH collect(color.id) AS colorIds
                RETURN colorIds
            }
            CALL {
                MATCH (:${Product} {id: $id})-[:HAS_PHOTO]->(photo:${Photo})-[:OF_COLOR]->(photoColor)
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
