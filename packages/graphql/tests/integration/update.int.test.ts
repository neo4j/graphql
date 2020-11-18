import { Driver } from "neo4j-driver";
import { graphql } from "graphql";
import { generate } from "randomstring";
import { describe, beforeAll, afterAll, expect, test } from "@jest/globals";
import neo4j from "./neo4j";
import makeAugmentedSchema from "../../src/schema/make-augmented-schema";

describe("update", () => {
    let driver: Driver;

    beforeAll(async () => {
        driver = await neo4j();
    });

    afterAll(async () => {
        await driver.close();
    });

    test("should update no movies where predicate yields false", async () => {
        const session = driver.session();

        const typeDefs = `
            type Movie {
                id: ID!
                name: String
            }
        `;

        const neoSchema = makeAugmentedSchema({ typeDefs });

        const id = generate({
            charset: "alphabetic",
        });

        const updatedName = generate({
            charset: "alphabetic",
        });

        const query = `
        mutation($id: ID, $name: String) {
            updateMovies(where: { id: $id }, update: {name: $name}) {
              id
              name
            }
          }
        `;

        try {
            const gqlResult = await graphql({
                schema: neoSchema.schema,
                source: query,
                variableValues: { id, name: updatedName },
                contextValue: { driver },
            });

            expect(gqlResult.errors).toBeFalsy();

            expect(gqlResult?.data?.updateMovies).toEqual([]);
        } finally {
            await session.close();
        }
    });

    test("should update a single movie", async () => {
        const session = driver.session();

        const typeDefs = `
            type Movie {
                id: ID!
                name: String
            }
        `;

        const neoSchema = makeAugmentedSchema({ typeDefs });

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
              id
              name
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
                schema: neoSchema.schema,
                source: query,
                variableValues: { id, name: updatedName },
                contextValue: { driver },
            });

            expect(gqlResult.errors).toBeFalsy();

            expect(gqlResult?.data?.updateMovies).toEqual([{ id, name: updatedName }]);
        } finally {
            await session.close();
        }
    });

    test("should update 2 movies", async () => {
        const session = driver.session();

        const typeDefs = `
            type Movie {
                id: ID!
                name: String
            }
        `;

        const neoSchema = makeAugmentedSchema({ typeDefs });

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
              id
              name
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
                schema: neoSchema.schema,
                source: query,
                variableValues: { id1, id2, name: updatedName },
                contextValue: { driver },
            });

            expect(gqlResult.errors).toBeFalsy();

            expect((gqlResult?.data?.updateMovies as any[]).length).toEqual(2);

            (gqlResult?.data?.updateMovies as any[]).forEach((movie) => {
                expect([id1, id2].includes(movie.id)).toEqual(true);
                expect(movie.name).toEqual(updatedName);
            });
        } finally {
            await session.close();
        }
    });

    test("should update nested actors from a movie", async () => {
        const session = driver.session();

        const typeDefs = `
            type Actor {
                name: String
                movies: [Movie] @relationship(type: "ACTED_IN", direction: "OUT")
            }
                
            type Movie {
                id: ID
                actors: [Actor]! @relationship(type: "ACTED_IN", direction: "IN")
            }
        `;

        const neoSchema = makeAugmentedSchema({ typeDefs });

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
                actors: {
                  where: { name: $initialName },
                  update: { name: $updatedName }
                }
              }
          ) {
              id
              actors {
                  name
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
                schema: neoSchema.schema,
                source: query,
                variableValues: { movieId, updatedName, initialName },
                contextValue: { driver },
            });

            expect(gqlResult.errors).toBeFalsy();

            expect(gqlResult?.data?.updateMovies).toEqual([{ id: movieId, actors: [{ name: updatedName }] }]);
        } finally {
            await session.close();
        }
    });

    test("should update nested actors from a move then update the movie from the nested actors", async () => {
        const session = driver.session();

        const typeDefs = `
            type Actor {
              name: String
              movies: [Movie] @relationship(type: "ACTED_IN", direction: "OUT")
            }
              
            type Movie {
              id: ID
              title: String
              actors: [Actor]! @relationship(type: "ACTED_IN", direction: "IN")
            }
        `;

        const neoSchema = makeAugmentedSchema({ typeDefs });

        const movieId = generate({
            charset: "alphabetic",
        });

        const query = `
        mutation {
            updateMovies(
              where: { id: "${movieId}" }
              update: {
                actors: {
                  where: { name: "old actor name" }
                  update: {
                    name: "new actor name"
                    movies: {
                      where: { title: "old movie title" }
                      update: { title: "new movie title" }
                    }
                  }
                }
              }
            ) {
              id
              title
              actors {
                name
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
                schema: neoSchema.schema,
                source: query,
                variableValues: {},
                contextValue: { driver },
            });

            expect(gqlResult.errors).toBeFalsy();

            expect(gqlResult?.data?.updateMovies).toEqual([
                { id: movieId, title: "new movie title", actors: [{ name: "new actor name" }] },
            ]);
        } finally {
            await session.close();
        }
    });

    test("should connect a single movie to a actor", async () => {
        const session = driver.session();

        const typeDefs = `
            type Actor {
                id: ID
                movies: [Movie] @relationship(type: "ACTED_IN", direction: "OUT")
            }
            
            type Movie {
                id: ID
                actors: [Actor]! @relationship(type: "ACTED_IN", direction: "IN")
            }
        `;

        const neoSchema = makeAugmentedSchema({ typeDefs });

        const movieId = generate({
            charset: "alphabetic",
        });

        const actorId = generate({
            charset: "alphabetic",
        });

        const query = `
        mutation {
            updateMovies(where: { id: "${movieId}" }, connect: {actors: [{where: {id: "${actorId}"}}]}) {
              id
              actors {
                  id
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
                schema: neoSchema.schema,
                source: query,
                variableValues: {},
                contextValue: { driver },
            });

            expect(gqlResult.errors).toBeFalsy();

            expect(gqlResult?.data?.updateMovies).toEqual([{ id: movieId, actors: [{ id: actorId }] }]);
        } finally {
            await session.close();
        }
    });

    test("should disconnect an actor from a movie", async () => {
        const session = driver.session();

        const typeDefs = `
            type Actor {
                id: ID
                movies: [Movie] @relationship(type: "ACTED_IN", direction: "OUT")
            }
            
            type Movie {
                id: ID
                actors: [Actor]! @relationship(type: "ACTED_IN", direction: "IN")
            }
        `;

        const neoSchema = makeAugmentedSchema({ typeDefs });

        const movieId = generate({
            charset: "alphabetic",
        });

        const actorId = generate({
            charset: "alphabetic",
        });

        const query = `
        mutation {
            updateMovies(where: { id: "${movieId}" }, disconnect: {actors: [{where: {id: "${actorId}"}}]}) {
              id
              actors {
                  id
              }
            }
          }
        `;

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

            const gqlResult = await graphql({
                schema: neoSchema.schema,
                source: query,
                variableValues: {},
                contextValue: { driver },
            });

            expect(gqlResult.errors).toBeFalsy();

            expect(gqlResult?.data?.updateMovies).toEqual([{ id: movieId, actors: [] }]);
        } finally {
            await session.close();
        }
    });

    test("should disconnect a color from a photo through a product", async () => {
        const session = driver.session();

        const typeDefs = `
            type Product {
                id: ID
                photos: [Photo] @relationship(type: "HAS_PHOTO", direction: "OUT")
            }     
            
            type Color {
                id: ID
            }
            
            type Photo {
                id: ID
                color: Color @relationship(type: "OF_COLOR", direction: "OUT")
            }
        `;

        const neoSchema = makeAugmentedSchema({ typeDefs });

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
                photos: {
                  where: { id: "${photoId}" }
                  update: {
                    color: { disconnect: { where: { id: "${colorId}" } } }
                  }
                }
              }
            ){
              id
              photos {
                  id
                  color {
                      id
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
                schema: neoSchema.schema,
                source: query,
                variableValues: {},
                contextValue: { driver },
            });

            expect(gqlResult.errors).toBeFalsy();

            expect(gqlResult?.data?.updateProducts).toEqual([
                { id: productId, photos: [{ id: photoId, color: null }] },
            ]);
        } finally {
            await session.close();
        }
    });
});
