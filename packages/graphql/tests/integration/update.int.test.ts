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
import { gql } from "graphql-tag";
import Neo4j from "./neo4j";
import { Neo4jGraphQL } from "../../src/classes";

describe("update", () => {
    let driver: Driver;
    let neo4j: Neo4j;

    beforeAll(async () => {
        neo4j = new Neo4j();
        driver = await neo4j.getDriver();
    });

    afterAll(async () => {
        await driver.close();
    });

    test("should update no movies where predicate yields false", async () => {
        const session = await neo4j.getSession();

        const typeDefs = `
            type Movie {
                id: ID!
                name: String
            }
        `;

        const neoSchema = new Neo4jGraphQL({ typeDefs });

        const id = generate({
            charset: "alphabetic",
        });

        const updatedName = generate({
            charset: "alphabetic",
        });

        const query = `
        mutation($id: ID, $name: String) {
            updateMovies(where: { id: $id }, update: {name: $name}) {
                movies {
                    id
                    name
                }
            }
          }
        `;

        try {
            const gqlResult = await graphql({
                schema: await neoSchema.getSchema(),
                source: query,
                variableValues: { id, name: updatedName },
                contextValue: neo4j.getContextValues(),
            });

            expect(gqlResult.errors).toBeFalsy();

            expect(gqlResult?.data?.updateMovies).toEqual({ movies: [] });
        } finally {
            await session.close();
        }
    });

    test("should update a single movie", async () => {
        const session = await neo4j.getSession();

        const typeDefs = `
            type Movie {
                id: ID!
                name: String
            }
        `;

        const neoSchema = new Neo4jGraphQL({ typeDefs });

        const id = generate({
            charset: "alphabetic",
        });

        const initialName = generate({
            charset: "alphabetic",
        });

        const updatedName = generate({
            charset: "alphabetic",
        });

        const query = `
        mutation($id: ID, $name: String) {
            updateMovies(where: { id: $id }, update: {name: $name}) {
                movies {
                    id
                    name
                }
            }
          }
        `;

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

            const gqlResult = await graphql({
                schema: await neoSchema.getSchema(),
                source: query,
                variableValues: { id, name: updatedName },
                contextValue: neo4j.getContextValues(),
            });

            expect(gqlResult.errors).toBeFalsy();

            expect(gqlResult?.data?.updateMovies).toEqual({ movies: [{ id, name: updatedName }] });
        } finally {
            await session.close();
        }
    });

    test("should update a movie when matching on relationship property", async () => {
        const session = await neo4j.getSession();

        const typeDefs = `
            type Actor {
                name: String
                movies: [Movie!]! @relationship(type: "ACTED_IN", direction: OUT)
            }

            type Movie {
                id: ID
                actors: [Actor!]! @relationship(type: "ACTED_IN", direction: IN)
            }
        `;

        const neoSchema = new Neo4jGraphQL({ typeDefs });

        const initialMovieId = generate({
            charset: "alphabetic",
        });

        const updatedMovieId = generate({
            charset: "alphabetic",
        });

        const actorName = generate({
            charset: "alphabetic",
        });

        const query = `
        mutation($updatedMovieId: ID, $actorName: String) {
            updateMovies(
              where: { actorsConnection: { node: { name: $actorName } } },
              update: {
                id: $updatedMovieId
              }
          ) {
              movies {
                id
                actors {
                    name
                }
              }
            }
          }
        `;

        try {
            await session.run(
                `
                CREATE (m:Movie {id: $initialMovieId})<-[:ACTED_IN]-(a:Actor {name: $actorName})
            `,
                {
                    initialMovieId,
                    actorName,
                }
            );

            const gqlResult = await graphql({
                schema: await neoSchema.getSchema(),
                source: query,
                variableValues: { updatedMovieId, actorName },
                contextValue: neo4j.getContextValues(),
            });

            expect(gqlResult.errors).toBeFalsy();

            expect(gqlResult?.data?.updateMovies).toEqual({
                movies: [{ id: updatedMovieId, actors: [{ name: actorName }] }],
            });
        } finally {
            await session.close();
        }
    });

    test("should update 2 movies", async () => {
        const session = await neo4j.getSession();

        const typeDefs = `
            type Movie {
                id: ID!
                name: String
            }
        `;

        const neoSchema = new Neo4jGraphQL({ typeDefs });

        const id1 = generate({
            charset: "alphabetic",
        });

        const id2 = generate({
            charset: "alphabetic",
        });

        const updatedName = "Beer";

        const query = `
        mutation($id1: ID, $id2: ID, $name: String) {
            updateMovies(where: { OR: [{id: $id1}, {id: $id2}] }, update: {name: $name}) {
                movies {
                    id
                    name
                }
            }
          }
        `;

        try {
            await session.run(
                `
                CREATE (:Movie {id: $id1})
                CREATE (:Movie {id: $id2})
            `,
                {
                    id1,
                    id2,
                }
            );

            const gqlResult = await graphql({
                schema: await neoSchema.getSchema(),
                source: query,
                variableValues: { id1, id2, name: updatedName },
                contextValue: neo4j.getContextValues(),
            });

            expect(gqlResult.errors).toBeFalsy();

            expect((gqlResult?.data as any)?.updateMovies.movies as any[]).toHaveLength(2);

            ((gqlResult?.data as any)?.updateMovies.movies as any[]).forEach((movie) => {
                expect([id1, id2]).toContain(movie.id);
                expect(movie.name).toEqual(updatedName);
            });
        } finally {
            await session.close();
        }
    });

    test("should update nested actors from a movie", async () => {
        const session = await neo4j.getSession();

        const typeDefs = `
            type Actor {
                name: String
                movies: [Movie!]! @relationship(type: "ACTED_IN", direction: OUT)
            }

            type Movie {
                id: ID
                actors: [Actor!]! @relationship(type: "ACTED_IN", direction: IN)
            }
        `;

        const neoSchema = new Neo4jGraphQL({ typeDefs });

        const movieId = generate({
            charset: "alphabetic",
        });

        const initialName = generate({
            charset: "alphabetic",
        });

        const updatedName = generate({
            charset: "alphabetic",
        });

        const query = `
        mutation($movieId: ID, $initialName: String, $updatedName: String) {
            updateMovies(
              where: { id: $movieId },
              update: {
                actors: [{
                  where: { node: { name: $initialName } },
                  update: { node: { name: $updatedName } }
                }]
              }
          ) {
              movies {
                id
                actors {
                    name
                }
              }
            }
          }
        `;

        try {
            await session.run(
                `
                CREATE (m:Movie {id: $movieId})
                CREATE (a:Actor {name: $initialName})
                MERGE (a)-[:ACTED_IN]->(m)
            `,
                {
                    movieId,
                    initialName,
                }
            );

            const gqlResult = await graphql({
                schema: await neoSchema.getSchema(),
                source: query,
                variableValues: { movieId, updatedName, initialName },
                contextValue: neo4j.getContextValues(),
            });

            expect(gqlResult.errors).toBeFalsy();

            expect(gqlResult?.data?.updateMovies).toEqual({
                movies: [{ id: movieId, actors: [{ name: updatedName }] }],
            });
        } finally {
            await session.close();
        }
    });

    test("should delete a nested actor from a movie abc", async () => {
        const session = await neo4j.getSession();

        const typeDefs = gql`
            type Actor {
                name: String
                movies: [Movie!]! @relationship(type: "ACTED_IN", direction: OUT)
            }

            type Movie {
                id: ID
                actors: [Actor!]! @relationship(type: "ACTED_IN", direction: IN)
            }
        `;

        const neoSchema = new Neo4jGraphQL({ typeDefs });

        const id = generate({
            charset: "alphabetic",
        });

        const actorName1 = generate({
            charset: "alphabetic",
        });
        const actorName2 = generate({
            charset: "alphabetic",
        });

        const mutation = `
            mutation($id: ID, $actorName1: String) {
                updateMovies(where: { id: $id }, delete: { actors: { where: { node: { name: $actorName1 } } } }) {
                    movies {
                        id
                        actors {
                            name
                        }
                    }
                }
            }
        `;

        try {
            await session.run(
                `
                CREATE (m:Movie {id: $id})
                CREATE (a1:Actor {name: $actorName1})
                CREATE (a2:Actor {name: $actorName2})
                MERGE (a1)-[:ACTED_IN]->(m)
                MERGE (a2)-[:ACTED_IN]->(m)
            `,
                {
                    id,
                    actorName1,
                    actorName2,
                }
            );

            const gqlResult = await graphql({
                schema: await neoSchema.getSchema(),
                source: mutation,
                variableValues: { id, actorName1 },
                contextValue: neo4j.getContextValues(),
            });

            expect(gqlResult.errors).toBeFalsy();

            expect(gqlResult?.data?.updateMovies).toEqual({
                movies: [{ id, actors: [{ name: actorName2 }] }],
            });
        } finally {
            await session.close();
        }
    });

    test("should delete a nested actor from a movie within an update block", async () => {
        const session = await neo4j.getSession();

        const typeDefs = gql`
            type Actor {
                name: String
                movies: [Movie!]! @relationship(type: "ACTED_IN", direction: OUT)
            }

            type Movie {
                id: ID
                actors: [Actor!]! @relationship(type: "ACTED_IN", direction: IN)
            }
        `;

        const neoSchema = new Neo4jGraphQL({ typeDefs });

        const id = generate({
            charset: "alphabetic",
        });

        const actorName1 = generate({
            charset: "alphabetic",
        });
        const actorName2 = generate({
            charset: "alphabetic",
        });

        const mutation = `
            mutation($id: ID, $actorName1: String) {
                updateMovies(where: { id: $id }, update: { actors: { delete: { where: { node: { name: $actorName1 } } } } }) {
                    movies {
                        id
                        actors {
                            name
                        }
                    }
                }
            }
        `;

        try {
            await session.run(
                `
                CREATE (m:Movie {id: $id})
                CREATE (a1:Actor {name: $actorName1})
                CREATE (a2:Actor {name: $actorName2})
                MERGE (a1)-[:ACTED_IN]->(m)
                MERGE (a2)-[:ACTED_IN]->(m)
            `,
                {
                    id,
                    actorName1,
                    actorName2,
                }
            );

            const gqlResult = await graphql({
                schema: await neoSchema.getSchema(),
                source: mutation,
                variableValues: { id, actorName1 },
                contextValue: neo4j.getContextValues(),
            });

            expect(gqlResult.errors).toBeFalsy();

            expect(gqlResult?.data?.updateMovies).toEqual({
                movies: [{ id, actors: [{ name: actorName2 }] }],
            });
        } finally {
            await session.close();
        }
    });

    test("should delete a nested actor and one of their nested movies, within an update block abc", async () => {
        const session = await neo4j.getSession();

        const typeDefs = gql`
            type Actor {
                name: String
                movies: [Movie!]! @relationship(type: "ACTED_IN", direction: OUT)
            }

            type Movie {
                id: ID
                actors: [Actor!]! @relationship(type: "ACTED_IN", direction: IN)
            }
        `;

        const neoSchema = new Neo4jGraphQL({ typeDefs });

        const movieId1 = generate({
            charset: "alphabetic",
        });

        const movieId2 = generate({
            charset: "alphabetic",
        });

        const actorName1 = generate({
            charset: "alphabetic",
        });

        const actorName2 = generate({
            charset: "alphabetic",
        });

        const mutation = `
            mutation($movieId1: ID, $actorName1: String, $movieId2: ID) {
                updateMovies(
                    where: { id: $movieId1 }
                    update: {
                        actors: { delete: { where: { node: { name: $actorName1 } }, delete: { movies: { where: { node: { id: $movieId2 } } } } } }
                    }
                ) {
                    movies {
                        id
                        actors {
                            name
                        }
                    }
                }
            }
        `;

        try {
            await session.run(
                `
                CREATE (m1:Movie {id: $movieId1})
                CREATE (m2:Movie {id: $movieId2})

                CREATE (a1:Actor {name: $actorName1})
                CREATE (a2:Actor {name: $actorName2})

                MERGE (a1)-[:ACTED_IN]->(m1)
                MERGE (a1)-[:ACTED_IN]->(m2)

                MERGE (a2)-[:ACTED_IN]->(m1)
                MERGE (a2)-[:ACTED_IN]->(m2)
            `,
                {
                    movieId1,
                    actorName1,
                    actorName2,
                    movieId2,
                }
            );

            const gqlResult = await graphql({
                schema: await neoSchema.getSchema(),
                source: mutation,
                variableValues: { movieId1, actorName1, movieId2 },
                contextValue: neo4j.getContextValues(),
            });

            expect(gqlResult.errors).toBeFalsy();

            expect(gqlResult?.data?.updateMovies).toEqual({
                movies: [{ id: movieId1, actors: [{ name: actorName2 }] }],
            });

            const movie2 = await session.run(
                `
              MATCH (m:Movie {id: $id})
              RETURN m
            `,
                { id: movieId2 }
            );

            expect(movie2.records).toHaveLength(0);
        } finally {
            await session.close();
        }
    });

    test("should delete multiple nested actors from a movie", async () => {
        const session = await neo4j.getSession();

        const typeDefs = gql`
            type Actor {
                name: String
                movies: [Movie!]! @relationship(type: "ACTED_IN", direction: OUT)
            }

            type Movie {
                id: ID
                actors: [Actor!]! @relationship(type: "ACTED_IN", direction: IN)
            }
        `;

        const neoSchema = new Neo4jGraphQL({ typeDefs });

        const id = generate({
            charset: "alphabetic",
        });

        const name1 = generate({
            charset: "alphabetic",
        });

        const name2 = generate({
            charset: "alphabetic",
        });

        const name3 = generate({
            charset: "alphabetic",
        });

        const mutation = `
            mutation($id: ID, $name1: String, $name3: String) {
                updateMovies(
                    where: { id: $id }
                    delete: { actors: [{ where: { node: { name: $name1 } } }, { where: { node: { name: $name3 } } }] }
                ) {
                    movies {
                        id
                        actors {
                            name
                        }
                    }
                }
            }
        `;

        try {
            await session.run(
                `
                CREATE (m:Movie {id: $id})
                CREATE (a1:Actor {name: $name1})
                CREATE (a2:Actor {name: $name2})
                CREATE (a3:Actor {name: $name3})
                MERGE (a1)-[:ACTED_IN]->(m)
                MERGE (a2)-[:ACTED_IN]->(m)
                MERGE (a3)-[:ACTED_IN]->(m)
            `,
                {
                    id,
                    name1,
                    name2,
                    name3,
                }
            );

            const gqlResult = await graphql({
                schema: await neoSchema.getSchema(),
                source: mutation,
                variableValues: { id, name1, name3 },
                contextValue: neo4j.getContextValues(),
            });

            expect(gqlResult.errors).toBeFalsy();

            expect(gqlResult?.data?.updateMovies).toEqual({
                movies: [{ id, actors: [{ name: name2 }] }],
            });
        } finally {
            await session.close();
        }
    });

    test("should update nested actors from a move then update the movie from the nested actors", async () => {
        const session = await neo4j.getSession();

        const typeDefs = `
            type Actor {
              name: String
              movies: [Movie!]! @relationship(type: "ACTED_IN", direction: OUT)
            }

            type Movie {
              id: ID
              title: String
              actors: [Actor!]! @relationship(type: "ACTED_IN", direction: IN)
            }
        `;

        const neoSchema = new Neo4jGraphQL({ typeDefs });

        const movieId = generate({
            charset: "alphabetic",
        });

        const query = `
        mutation {
            updateMovies(
              where: { id: "${movieId}" }
              update: {
                actors: [{
                  where: { node: { name: "old actor name" } }
                  update: {
                    node: {
                        name: "new actor name"
                        movies: [{
                            where: { node: { title: "old movie title" } }
                            update: { node: { title: "new movie title" } }
                        }]
                    }
                  }
                }]
              }
            ) {
                movies {
                    id
                    title
                    actors {
                        name
                    }
                }
            }
          }
        `;

        try {
            await session.run(
                `
            CREATE (:Movie {id: $movieId, title: "old movie title"})<-[:ACTED_IN]-(:Actor {name: "old actor name"})
        `,
                {
                    movieId,
                }
            );

            const gqlResult = await graphql({
                schema: await neoSchema.getSchema(),
                source: query,
                variableValues: {},
                contextValue: neo4j.getContextValues(),
            });

            expect(gqlResult.errors).toBeFalsy();

            expect(gqlResult?.data?.updateMovies).toEqual({
                movies: [{ id: movieId, title: "new movie title", actors: [{ name: "new actor name" }] }],
            });
        } finally {
            await session.close();
        }
    });

    test("should connect a single movie to a actor", async () => {
        const session = await neo4j.getSession();

        const typeDefs = `
            type Actor {
                id: ID
                movies: [Movie!]! @relationship(type: "ACTED_IN", direction: OUT)
            }

            type Movie {
                id: ID
                actors: [Actor!]! @relationship(type: "ACTED_IN", direction: IN)
            }
        `;

        const neoSchema = new Neo4jGraphQL({ typeDefs });

        const movieId = generate({
            charset: "alphabetic",
        });

        const actorId = generate({
            charset: "alphabetic",
        });

        const query = `
        mutation {
            updateMovies(where: { id: "${movieId}" }, connect: {actors: [{where: {node:{id: "${actorId}"}}}]}) {
                movies {
                    id
                    actors {
                        id
                    }
                }
            }
          }
        `;

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

            const gqlResult = await graphql({
                schema: await neoSchema.getSchema(),
                source: query,
                variableValues: {},
                contextValue: neo4j.getContextValues(),
            });

            expect(gqlResult.errors).toBeFalsy();

            expect(gqlResult?.data?.updateMovies).toEqual({ movies: [{ id: movieId, actors: [{ id: actorId }] }] });
        } finally {
            await session.close();
        }
    });

    test("should connect a single movie to a actor based on a connection predicate", async () => {
        const session = await neo4j.getSession();

        const typeDefs = `
            type Actor {
                id: ID
                movies: [Movie!]! @relationship(type: "ACTED_IN", direction: OUT)
                series: [Series!]! @relationship(type: "ACTED_IN", direction: OUT)
            }

            type Movie {
                id: ID
                actors: [Actor!]! @relationship(type: "ACTED_IN", direction: IN)
            }

            type Series {
                id: ID
                actors: [Actor!]! @relationship(type: "ACTED_IN", direction: IN)
            }
        `;

        const neoSchema = new Neo4jGraphQL({ typeDefs });

        const movieId = generate({
            charset: "alphabetic",
        });

        const actorId = generate({
            charset: "alphabetic",
        });

        const seriesId = generate({
            charset: "alphabetic",
        });

        const query = `
            mutation($movieId: ID, $seriesId: ID) {
                updateMovies(
                    where: { id: $movieId }
                    connect: { actors: [{ where: { node: { seriesConnection: { node: { id: $seriesId } } } } }] }
                ) {
                    movies {
                        id
                        actors {
                            id
                        }
                    }
                }
            }
        `;

        try {
            await session.run(
                `
                CREATE (:Movie {id: $movieId})
                CREATE (:Actor {id: $actorId})-[:ACTED_IN]->(:Series {id: $seriesId})
            `,
                {
                    movieId,
                    actorId,
                    seriesId,
                }
            );

            const gqlResult = await graphql({
                schema: await neoSchema.getSchema(),
                source: query,
                variableValues: { movieId, seriesId },
                contextValue: neo4j.getContextValues(),
            });

            expect(gqlResult.errors).toBeFalsy();

            expect(gqlResult?.data?.updateMovies).toEqual({ movies: [{ id: movieId, actors: [{ id: actorId }] }] });
        } finally {
            await session.close();
        }
    });

    test("should disconnect an actor from a movie", async () => {
        const session = await neo4j.getSession();

        const typeDefs = `
            type Actor {
                id: ID
                movies: [Movie!]! @relationship(type: "ACTED_IN", direction: OUT)
            }

            type Movie {
                id: ID
                actors: [Actor!]! @relationship(type: "ACTED_IN", direction: IN)
            }
        `;

        const neoSchema = new Neo4jGraphQL({ typeDefs });

        const movieId = generate({
            charset: "alphabetic",
        });

        const actorId1 = generate({
            charset: "alphabetic",
        });
        const actorId2 = generate({
            charset: "alphabetic",
        });

        const query = `
        mutation {
            updateMovies(where: { id: "${movieId}" }, disconnect: {actors: [{where: { node: { id: "${actorId1}"}}}]}) {
                movies {
                    id
                    actors {
                        id
                    }
                }
            }
          }
        `;

        try {
            await session.run(
                `
                CREATE (m:Movie {id: $movieId})
                CREATE (a1:Actor {id: $actorId1})
                CREATE (a2:Actor {id: $actorId2})
                MERGE (m)<-[:ACTED_IN]-(a1)
                MERGE (m)<-[:ACTED_IN]-(a2)
            `,
                {
                    movieId,
                    actorId1,
                    actorId2,
                }
            );

            const gqlResult = await graphql({
                schema: await neoSchema.getSchema(),
                source: query,
                variableValues: {},
                contextValue: neo4j.getContextValues(),
            });

            expect(gqlResult.errors).toBeFalsy();

            expect(gqlResult?.data?.updateMovies).toEqual({ movies: [{ id: movieId, actors: [{ id: actorId2 }] }] });
        } finally {
            await session.close();
        }
    });

    test("should disconnect a color from a photo through a product", async () => {
        const session = await neo4j.getSession();

        const typeDefs = `
            type Product {
                id: ID
                photos: [Photo!]! @relationship(type: "HAS_PHOTO", direction: OUT)
            }

            type Color {
                id: ID
            }

            type Photo {
                id: ID
                color: Color @relationship(type: "OF_COLOR", direction: OUT)
            }
        `;

        const neoSchema = new Neo4jGraphQL({ typeDefs });

        const productId = generate({
            charset: "alphabetic",
        });

        const photoId = generate({
            charset: "alphabetic",
        });

        const colorId = generate({
            charset: "alphabetic",
        });

        const query = `
        mutation {
            updateProducts(
              where: { id: "${productId}" }
              update: {
                photos: [{
                  where: { node: { id: "${photoId}" } }
                  update: {
                      node: {
                        color: { disconnect: { where: { node: { id: "${colorId}" } } } }
                      }
                  }
                }]
              }
            ){
                products {
                    id
                    photos {
                        id
                        color {
                            id
                        }
                    }
                }
            }
          }
        `;

        try {
            await session.run(
                `
                CREATE (p:Product {id: $productId})
                CREATE (photo:Photo {id: $photoId})
                CREATE (color:Color {id: $colorId})
                MERGE (p)-[:HAS_PHOTO]->(photo)-[:OF_COLOR]->(color)

            `,
                {
                    productId,
                    photoId,
                    colorId,
                }
            );

            const gqlResult = await graphql({
                schema: await neoSchema.getSchema(),
                source: query,
                variableValues: {},
                contextValue: neo4j.getContextValues(),
            });

            expect(gqlResult.errors).toBeFalsy();

            expect(gqlResult?.data?.updateProducts).toEqual({
                products: [{ id: productId, photos: [{ id: photoId, color: null }] }],
            });
        } finally {
            await session.close();
        }
    });

    test("should update the colors of a product to light versions", async () => {
        const session = await neo4j.getSession();

        const typeDefs = `
          type Product {
             id: ID
             name: String
             photos: [Photo!]! @relationship(type: "HAS_PHOTO", direction: OUT)
           }


           type Color {
             name: String
             id: ID
           }

           type Photo {
             id: ID
             name: String
             color: Color! @relationship(type: "OF_COLOR", direction: OUT)
           }
        `;

        const neoSchema = new Neo4jGraphQL({ typeDefs });

        const productId = generate({
            charset: "alphabetic",
        });

        const photo0Id = generate({
            charset: "alphabetic",
        });

        const photo0Color0Id = generate({
            charset: "alphabetic",
        });

        const photo0Color1Id = generate({
            charset: "alphabetic",
        });

        const photo1Id = generate({
            charset: "alphabetic",
        });

        const photo1Color0Id = generate({
            charset: "alphabetic",
        });

        const photo1Color1Id = generate({
            charset: "alphabetic",
        });

        const query = `
            mutation {
                updateProducts(
                  where: { id: "${productId}" }
                  update: {
                    photos: [
                      {
                        where: { node: { name: "Green Photo", id: "${photo0Id}" } }
                        update: {
                            node: {
                                name: "Light Green Photo"
                                color: {
                                    connect: { where: { node: { name: "Light Green", id: "${photo0Color1Id}" } } }
                                    disconnect: { where: { node: { name: "Green", id: "${photo0Color0Id}" } } }
                                }
                            }
                        }
                      }
                      {
                        where: { node: { name: "Yellow Photo", id: "${photo1Id}" } }
                        update: {
                            node: {
                                name: "Light Yellow Photo"
                                color: {
                                    connect: { where: { node: { name: "Light Yellow", id: "${photo1Color1Id}" } } }
                                    disconnect: { where: { node: { name: "Yellow", id: "${photo1Color0Id}" } } }
                                }
                            }
                        }
                      }
                    ]
                  }
                ) {
                    products {
                        id
                        photos {
                            id
                            name
                            color {
                            id
                            name
                            }
                        }
                    }
                }
              }
        `;

        try {
            await session.run(
                `
                    CREATE (product:Product {name: "Pringles", id: $productId})
                    CREATE (photo0:Photo {id: $photo0Id, name: "Green Photo"})
                    CREATE (photo0_color0:Color {id: $photo0_color0Id, name: "Green"})
                    CREATE (photo0_color1:Color {id: $photo0_color1Id, name: "Light Green"})
                    CREATE (photo1:Photo {id: $photo1Id, name: "Yellow Photo"})
                    CREATE (photo1_color0:Color {id: $photo1_color0Id, name: "Yellow"})
                    CREATE (photo1_color1:Color {id: $photo1_color1Id, name: "Light Yellow"})
                    MERGE (product)-[:HAS_PHOTO]->(photo0)
                    MERGE (photo0)-[:OF_COLOR]->(photo0_color0)
                    MERGE (product)-[:HAS_PHOTO]->(photo1)
                    MERGE (photo1)-[:OF_COLOR]->(photo1_color0)


            `,
                {
                    productId,
                    photo0Id,
                    photo0_color0Id: photo0Color0Id,
                    photo0_color1Id: photo0Color1Id,
                    photo1Id,
                    photo1_color0Id: photo1Color0Id,
                    photo1_color1Id: photo1Color1Id,
                }
            );

            const gqlResult = await graphql({
                schema: await neoSchema.getSchema(),
                source: query,
                variableValues: {},
                contextValue: neo4j.getContextValues(),
            });

            expect(gqlResult.errors).toBeFalsy();

            expect((gqlResult?.data as any)?.updateProducts.products as any[]).toHaveLength(1);

            const { photos } = ((gqlResult?.data as any)?.updateProducts.products as any[])[0];

            const greenPhoto = photos.find((x) => x.id === photo0Id);

            expect(greenPhoto).toMatchObject({
                id: photo0Id,
                name: "Light Green Photo",
                color: { id: photo0Color1Id, name: "Light Green" },
            });

            const yellowPhoto = photos.find((x) => x.id === photo1Id);

            expect(yellowPhoto).toMatchObject({
                id: photo1Id,
                name: "Light Yellow Photo",
                color: { id: photo1Color1Id, name: "Light Yellow" },
            });
        } finally {
            await session.close();
        }
    });

    test("should update a Product via creating a new Photo and creating a new Color (via field level update)", async () => {
        const session = await neo4j.getSession();

        const typeDefs = `
          type Product {
             id: ID
             name: String
             photos: [Photo!]! @relationship(type: "HAS_PHOTO", direction: OUT)
           }


           type Color {
             name: String
             id: ID
           }

           type Photo {
             id: ID
             name: String
             color: Color! @relationship(type: "OF_COLOR", direction: OUT)
           }
        `;

        const neoSchema = new Neo4jGraphQL({ typeDefs });

        const productId = generate({
            charset: "alphabetic",
        });

        const photoId = generate({
            charset: "alphabetic",
        });

        const colorId = generate({
            charset: "alphabetic",
        });

        const query = `
            mutation {
                updateProducts(
                  where: { id: "${productId}" }
                  update: {
                      photos: [{
                          create: [{
                            node: {
                                id: "${photoId}",
                                name: "Green Photo",
                                color: {
                                    create: {
                                        node: {
                                            id: "${colorId}",
                                            name: "Green"
                                        }
                                    }
                                }
                            }
                         }]
                      }]
                  }
                ) {
                    products {
                        id
                        photos {
                          id
                          name
                          color {
                            id
                            name
                          }
                        }
                    }
                }
              }
        `;

        try {
            await session.run(
                `
                    CREATE (product:Product {name: "Pringles", id: $productId})
            `,
                {
                    productId,
                }
            );

            const gqlResult = await graphql({
                schema: await neoSchema.getSchema(),
                source: query,
                variableValues: {},
                contextValue: neo4j.getContextValues(),
            });

            expect(gqlResult.errors).toBeFalsy();

            expect(((gqlResult?.data as any)?.updateProducts.products as any[])[0]).toMatchObject({
                id: productId,
                photos: [{ id: photoId, name: "Green Photo", color: { id: colorId, name: "Green" } }],
            });
        } finally {
            await session.close();
        }
    });

    test("should update a Product via creating a new Photo and creating a new Color (via top level create)", async () => {
        const session = await neo4j.getSession();

        const typeDefs = `
          type Product {
             id: ID
             name: String
             photos: [Photo!]! @relationship(type: "HAS_PHOTO", direction: OUT)
           }


           type Color {
             name: String
             id: ID
           }

           type Photo {
             id: ID
             name: String
             color: Color! @relationship(type: "OF_COLOR", direction: OUT)
           }
        `;

        const neoSchema = new Neo4jGraphQL({ typeDefs });

        const productId = generate({
            charset: "alphabetic",
        });

        const photoId = generate({
            charset: "alphabetic",
        });

        const colorId = generate({
            charset: "alphabetic",
        });

        const query = `
            mutation {
                updateProducts(
                  where: { id: "${productId}" }
                  create: {
                    photos: [{
                      node: {
                        id: "${photoId}",
                        name: "Green Photo",
                        color: {
                            create: {
                              node: {
                                id: "${colorId}",
                                name: "Green"
                              }
                            }
                        }
                      }
                    }]
                  }
                ) {
                    products {
                        id
                        photos {
                            id
                            name
                            color {
                                id
                                name
                            }
                        }
                    }
                }
              }
        `;

        try {
            await session.run(
                `
                    CREATE (product:Product {name: "Pringles", id: $productId})
            `,
                {
                    productId,
                }
            );

            const gqlResult = await graphql({
                schema: await neoSchema.getSchema(),
                source: query,
                variableValues: {},
                contextValue: neo4j.getContextValues(),
            });

            expect(gqlResult.errors).toBeFalsy();

            expect(((gqlResult?.data as any)?.updateProducts.products as any[])[0]).toMatchObject({
                id: productId,
                photos: [{ id: photoId, name: "Green Photo", color: { id: colorId, name: "Green" } }],
            });
        } finally {
            await session.close();
        }
    });
});
