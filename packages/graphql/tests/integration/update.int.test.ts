import { Driver } from "neo4j-driver";
import { graphql } from "graphql";
import { generate } from "randomstring";
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

        await session.run(
            `
            CREATE (:Movie {id: $id, name: $initialName})
        `,
            {
                id,
                initialName,
            }
        );

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

            expect(gqlResult?.data?.updateMovies).toEqual([{ id, name: updatedName }]);
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

        await session.run(
            `
            CREATE (:Movie {id: $movieId, title: "old movie title"})<-[:ACTED_IN]-(:Actor {name: "old actor name"})
        `,
            {
                movieId,
            }
        );

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
});
