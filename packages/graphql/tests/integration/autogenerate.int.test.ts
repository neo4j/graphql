import { Driver } from "neo4j-driver";
import { graphql } from "graphql";
import isUUID from "is-uuid";
import { describe, beforeAll, afterAll, test, expect } from "@jest/globals";
import neo4j from "./neo4j";
import { Neo4jGraphQL } from "../../src/classes";

describe("autogenerate", () => {
    let driver: Driver;

    beforeAll(async () => {
        driver = await neo4j();
    });

    afterAll(async () => {
        await driver.close();
    });

    test("should create a movie with autogenerate id", async () => {
        const session = driver.session();

        const typeDefs = `
            type Movie {
              id: ID! @autogenerate
              name: String
            }
        `;

        const neoSchema = new Neo4jGraphQL({ typeDefs });

        const create = `
            mutation {
                createMovies(input:[{name: "dan"}]) {
                    movies {
                        id
                        name
                    }
                }
            }
        `;

        try {
            const gqlResult = await graphql({
                schema: neoSchema.schema,
                source: create,
                contextValue: { driver },
            });

            expect(gqlResult.errors).toBeFalsy();

            const { id, name } = (gqlResult.data as any).createMovies.movies[0];

            expect(["v1", "v2", "v3", "v4", "v5"].some((t) => isUUID[t](id))).toEqual(true);
            expect(name).toEqual("dan");
        } finally {
            await session.close();
        }
    });

    test("should create a movie with autogenerate id and a nested genre with autogenerate id", async () => {
        const session = driver.session();

        const typeDefs = `
            type Genre {
                id: ID! @autogenerate
            }

            type Movie {
                id: ID! @autogenerate
                name: String
                genres: [Genre] @relationship(type: "HAS_GENRE", direction: "OUT")
            }
        `;

        const neoSchema = new Neo4jGraphQL({ typeDefs });

        const create = `
            mutation {
                createMovies(input:
                    [
                        { 
                            name: "dan",
                            genres: {
                                create: [{}]
                            }
                        }
                    ]
                ) {
                    movies {
                        id
                        name
                        genres {
                            id
                        }
                    }
                }
            }
        `;

        try {
            const gqlResult = await graphql({
                schema: neoSchema.schema,
                source: create,
                contextValue: { driver },
            });

            expect(gqlResult.errors).toBeFalsy();

            const { id, name, genres } = (gqlResult.data as any).createMovies.movies[0];

            expect(["v1", "v2", "v3", "v4", "v5"].some((t) => isUUID[t](id))).toEqual(true);
            expect(["v1", "v2", "v3", "v4", "v5"].some((t) => isUUID[t](genres[0].id))).toEqual(true);
            expect(name).toEqual("dan");
        } finally {
            await session.close();
        }
    });
});
