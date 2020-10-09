import { Driver } from "neo4j-driver";
import { graphql } from "graphql";
import { generate } from "randomstring";
import neo4j from "./neo4j";
import makeAugmentedSchema from "../../src/schema/make-augmented-schema";

describe("findMany", () => {
    let driver: Driver;

    beforeAll(async () => {
        driver = await neo4j();
    });

    afterAll(async () => {
        await driver.close();
    });

    test("should findMany Movie by id", async () => {
        const session = driver.session();

        const typeDefs = `
            type Actor {
                name: String
                movies: [Movie] @relationship(type: "ACTED_IN", direction: "IN")
            }

            type Movie {
                id: ID!
                title: String!
                actors: [Actor] @relationship(type: "ACTED_IN", direction: "OUT")
            }
        `;

        const neoSchema = makeAugmentedSchema({ typeDefs });

        const id = generate({
            charset: "alphabetic",
        });

        const query = `
            query($id: ID){
                FindMany_Movie(where: {id: $id}){
                    id
                }
            }
        `;

        try {
            await session.run(
                `
              CREATE (:Movie {id: $id}), (:Movie {id: $id}), (:Movie {id: $id})
            `,
                { id }
            );

            const result = await graphql({
                schema: neoSchema.schema,
                source: query,
                variableValues: { id },
                contextValue: { driver },
            });

            expect(result.errors).toBeFalsy();

            expect(result?.data?.FindMany_Movie).toEqual([{ id }, { id }, { id }]);
        } finally {
            await session.close();
        }
    });

    it("should findMany Move by id and limit", async () => {
        const session = driver.session();

        const typeDefs = `
            type Actor {
                name: String
                movies: [Movie] @relationship(type: "ACTED_IN", direction: "IN")
            }

            type Movie {
                id: ID!
                title: String!
                actors: [Actor] @relationship(type: "ACTED_IN", direction: "OUT")
            }
        `;

        const neoSchema = makeAugmentedSchema({ typeDefs });

        const id = generate({
            charset: "alphabetic",
        });

        const query = `
            query($id: ID){
                FindMany_Movie(where: {id: $id}, options: {limit: 2}){
                    id
                }
            }
        `;

        try {
            await session.run(
                `
              CREATE (:Movie {id: $id}), (:Movie {id: $id}), (:Movie {id: $id})
            `,
                { id }
            );

            const result = await graphql({
                schema: neoSchema.schema,
                source: query,
                variableValues: { id },
                contextValue: { driver },
            });

            expect(result.errors).toBeFalsy();

            expect(result?.data?.FindMany_Movie).toEqual([{ id }, { id }]);
        } finally {
            await session.close();
        }
    });

    test("should findMany Movie IN ids", async () => {
        const session = driver.session();

        const typeDefs = `
            type Actor {
                name: String
                movies: [Movie] @relationship(type: "ACTED_IN", direction: "IN")
            }

            type Movie {
                id: ID!
                title: String!
                actors: [Actor] @relationship(type: "ACTED_IN", direction: "OUT")
            }
        `;

        const id1 = generate({
            charset: "alphabetic",
        });
        const id2 = generate({
            charset: "alphabetic",
        });
        const id3 = generate({
            charset: "alphabetic",
        });

        const neoSchema = makeAugmentedSchema({ typeDefs });

        const query = `
            query($ids: [ID]){
                FindMany_Movie(where: {id_IN: $ids}){
                    id
                }
            }
        `;

        try {
            await session.run(
                `
              CREATE (:Movie {id: $id1}), (:Movie {id: $id2}), (:Movie {id: $id3})
            `,
                { id1, id2, id3 }
            );

            const result = await graphql({
                schema: neoSchema.schema,
                source: query,
                variableValues: { ids: [id1, id2, id3] },
                contextValue: { driver },
            });

            expect(result.errors).toBeFalsy();

            result?.data?.FindMany_Movie.forEach((e: { id: string }) => {
                expect([id1, id2, id3].includes(e.id)).toBeTruthy();
            });
        } finally {
            await session.close();
        }
    });

    test("should findMany Movie IN ids with one other param", async () => {
        const session = driver.session();

        const typeDefs = `
            type Actor {
                name: String
                movies: [Movie] @relationship(type: "ACTED_IN", direction: "IN")
            }

            type Movie {
                id: ID!
                title: String!
                actors: [Actor] @relationship(type: "ACTED_IN", direction: "OUT")
            }
        `;

        const neoSchema = makeAugmentedSchema({ typeDefs });

        const id1 = generate({
            charset: "alphabetic",
        });
        const id2 = generate({
            charset: "alphabetic",
        });
        const id3 = generate({
            charset: "alphabetic",
        });
        const title = generate({
            charset: "alphabetic",
        });

        const query = `
            query($ids: [ID], $title: String){
                FindMany_Movie(where: {id_IN: $ids, title: $title}){
                    id
                    title
                }
            }
        `;

        try {
            await session.run(
                `
                CREATE (:User {id: $id1, title: $title}), (:User {id: $id2, title: $title}), (:User {id: $id3, title: $title})
                `,
                { id1, id2, id3, title }
            );

            const result = await graphql({
                schema: neoSchema.schema,
                source: query,
                variableValues: { ids: [id1, id2, id3], title },
                contextValue: { driver },
            });

            expect(result.errors).toBeFalsy();

            result?.data?.FindMany_Movie.forEach((e: { id: string; title: string }) => {
                expect([id1, id2, id3].includes(e.id)).toBeTruthy();
                expect(e.title).toEqual(title);
            });
        } finally {
            await session.close();
        }
    });

    test("should findMany Movie IN id and many Movie.actor IN id", async () => {
        const session = driver.session();

        const typeDefs = `
            type Actor {
                id: ID!
                movies: [Movie] @relationship(type: "ACTED_IN", direction: "IN")
            }

            type Movie {
                id: ID!
                actors: [Actor] @relationship(type: "ACTED_IN", direction: "OUT")
            }
        `;

        const neoSchema = makeAugmentedSchema({ typeDefs });

        const movieId1 = generate({
            charset: "alphabetic",
        });
        const movieId2 = generate({
            charset: "alphabetic",
        });
        const movieId3 = generate({
            charset: "alphabetic",
        });

        const actorId1 = generate({
            charset: "alphabetic",
        });
        const actorId2 = generate({
            charset: "alphabetic",
        });
        const actorId3 = generate({
            charset: "alphabetic",
        });

        const query = `
            query($movieIds: [ID], $actorIds: [ID]){
                FindMany_Movie(where: {id_IN: $movieIds}){
                    id
                    actors(where: {id_IN: $actorIds}){
                        id
                        movies {
                            id
                            actors {
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
                CREATE (:Movie {id: $movieId1})-[:ACTED_IN]->(:Actor {id: $actorId1}),
                       (:Movie {id: $movieId2})-[:ACTED_IN]->(:Actor {id: $actorId2}),
                       (:Movie {id: $movieId3})-[:ACTED_IN]->(:Actor {id: $actorId3})
                `,
                {
                    movieId1,
                    movieId2,
                    movieId3,
                    actorId1,
                    actorId2,
                    actorId3,
                }
            );

            const result = await graphql({
                schema: neoSchema.schema,
                source: query,
                variableValues: {
                    movieIds: [movieId1, movieId2, movieId3],
                    actorIds: [actorId1, actorId2, actorId3],
                },
                contextValue: { driver },
            });

            expect(result.errors).toBeFalsy();

            result?.data?.FindMany_Movie.forEach((movie: { id: string; title: string; actors: { id: string }[] }) => {
                expect([movieId1, movieId2, movieId3].includes(movie.id)).toBeTruthy();

                switch (movie.id) {
                    case movieId1:
                        expect(movie.actors).toEqual([
                            {
                                id: actorId1,
                                movies: [
                                    {
                                        id: movieId1,
                                        actors: [{ id: actorId1 }],
                                    },
                                ],
                            },
                        ]);
                        break;
                    case movieId2:
                        expect(movie.actors).toEqual([
                            {
                                id: actorId2,
                                movies: [
                                    {
                                        id: movieId2,
                                        actors: [{ id: actorId2 }],
                                    },
                                ],
                            },
                        ]);
                        break;
                    case movieId3:
                        expect(movie.actors).toEqual([
                            {
                                id: actorId3,
                                movies: [
                                    {
                                        id: movieId3,
                                        actors: [{ id: actorId3 }],
                                    },
                                ],
                            },
                        ]);
                        break;
                    default:
                        throw new Error("Fail");
                }
            });
        } finally {
            await session.close();
        }
    });

    it("should findMany Movie and populate nested cypher query", async () => {
        const session = driver.session();

        const typeDefs = `
            type Actor {
                id: ID
            }

            type Movie {
                id: ID!
                actors(actorIds: [ID]): [Actor] @cypher(
                   statement:  """
                   MATCH (a:Actor)
                   WHERE a.id IN $actorIds
                   RETURN a
                   """
                )
            }
        `;

        const neoSchema = makeAugmentedSchema({ typeDefs });

        const movieId1 = generate({
            charset: "alphabetic",
        });
        const movieId2 = generate({
            charset: "alphabetic",
        });
        const movieId3 = generate({
            charset: "alphabetic",
        });

        const actorId1 = generate({
            charset: "alphabetic",
        });
        const actorId2 = generate({
            charset: "alphabetic",
        });
        const actorId3 = generate({
            charset: "alphabetic",
        });

        const query = `
            query($movieIds: [ID], $actorIds: [ID]){
                FindMany_Movie(where: {id_IN: $movieIds}){
                    id
                    actors(actorIds: $actorIds) {
                        id
                    }
                }
            }
        `;

        try {
            await session.run(
                `
                CREATE (:Movie {id: $movieId1}),
                       (:Movie {id: $movieId2}),
                       (:Movie {id: $movieId3}),
                       (:Actor {id: $actorId1}),
                       (:Actor {id: $actorId2}),
                       (:Actor {id: $actorId3})
            `,
                {
                    movieId1,
                    movieId2,
                    movieId3,
                    actorId1,
                    actorId2,
                    actorId3,
                }
            );

            const result = await graphql({
                schema: neoSchema.schema,
                source: query,
                variableValues: { movieIds: [movieId1, movieId2, movieId3], actorIds: [actorId1, actorId2, actorId3] },
                contextValue: { driver },
            });

            expect(result.errors).toBeFalsy();

            result?.data?.FindMany_Movie.forEach((movie: { id: string; actors: { id: string }[] }) => {
                expect([movieId1, movieId2, movieId3].includes(movie.id)).toBeTruthy();

                movie.actors.forEach((actor) => {
                    expect([actorId1, actorId2, actorId3].includes(actor.id));
                });
            });
        } finally {
            await session.close();
        }
    });
});
