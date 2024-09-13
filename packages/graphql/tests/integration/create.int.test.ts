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

import { generate } from "randomstring";
import type { UniqueType } from "../utils/graphql-types";
import { TestHelper } from "../utils/tests-helper";

describe("create", () => {
    const testHelper = new TestHelper();
    let Actor: UniqueType;
    let Movie: UniqueType;

    beforeEach(async () => {
        Actor = testHelper.createUniqueType("Actor");
        Movie = testHelper.createUniqueType("Movie");

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

        await testHelper.initNeo4jGraphQL({ typeDefs });
    });

    afterEach(async () => {
        await testHelper.close();
    });

    test("should create a single movie", async () => {
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

        const gqlResult = await testHelper.executeGraphQL(query, {
            variableValues: { id },
        });

        expect(gqlResult.errors).toBeFalsy();

        expect(gqlResult?.data?.[Movie.operations.create]).toEqual({ [Movie.plural]: [{ id }] });

        const reFind = await testHelper.executeCypher(
            `
              MATCH (m:${Movie} {id: $id})
              RETURN m
            `,
            { id }
        );

        expect(reFind.records[0]?.toObject().m.properties).toMatchObject({ id });
    });

    test("should create actor and resolve actorsConnection with where clause on movie field", async () => {
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
        await testHelper.executeCypher(
            `
                    CREATE (movie:${Movie} {title: $movieTitle})
                `,
            {
                movieTitle,
            }
        );

        const result = await testHelper.executeGraphQL(query, {
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
    });

    test("should create 2 movies", async () => {
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

        const gqlResult = await testHelper.executeGraphQL(query, {
            variableValues: { id1, id2 },
        });

        expect(gqlResult.errors).toBeFalsy();

        expect(gqlResult?.data?.[Movie.operations.create]).toEqual({ [Movie.plural]: [{ id: id1 }, { id: id2 }] });

        const reFind = await testHelper.executeCypher(
            `
              MATCH (m:${Movie})
              WHERE m.id = $id1 OR m.id = $id2
              RETURN m
            `,
            { id1, id2 }
        );

        expect(reFind.records.map((r) => r.toObject().m.properties.id)).toIncludeSameMembers([id1, id2]);
    });

    test("should create and return pringles product", async () => {
        const Size = testHelper.createUniqueType("Size");
        const Product = testHelper.createUniqueType("Product");
        const Color = testHelper.createUniqueType("Color");
        const Photo = testHelper.createUniqueType("Photo");

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

        await testHelper.close();
        await testHelper.initNeo4jGraphQL({ typeDefs });

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

        const gqlResult = await testHelper.executeGraphQL(mutation, {
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
        });

        expect(gqlResult.errors).toBeFalsy();

        expect(gqlResult.data).toEqual({
            [Product.operations.create]: {
                [Product.plural]: [
                    {
                        id: product.id,
                    },
                ],
            },
        });

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

        const neo4jResult = await testHelper.executeCypher(cypher, { id: product.id });
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
