import { Driver } from "neo4j-driver";
import { graphql } from "graphql";
import { generate } from "randomstring";
import { describe, beforeAll, afterAll, test, expect } from "@jest/globals";
import neo4j from "./neo4j";
import makeAugmentedSchema from "../../src/schema/make-augmented-schema";

describe("unions", () => {
    let driver: Driver;

    beforeAll(async () => {
        driver = await neo4j();
    });

    afterAll(async () => {
        await driver.close();
    });

    test("should read and return unions", async () => {
        const session = driver.session();

        const typeDefs = `
            union Search = Movie | Genre

            type Genre {
                name: String
            }

            type Movie {
                title: String
                search: [Search] @relationship(type: "SEARCH", direction: "OUT")
            }
        `;

        const neoSchema = makeAugmentedSchema({
            typeDefs,
            resolvers: {},
        });

        const movieTitle = generate({
            charset: "alphabetic",
        });

        const genreName = generate({
            charset: "alphabetic",
        });

        const create = `
            {
                Movies (where: {title: "${movieTitle}"}) {
                    search {
                        __typename
                        ... on Movie {
                            title
                        }
                        ... on Genre {
                            name
                        }
                    }
                }
            }
        `;

        try {
            await session.run(`
                CREATE (m:Movie {title: "${movieTitle}"})
                CREATE (g:Genre {name: "${genreName}"})
                MERGE (m)-[:SEARCH]->(m)
                MERGE (m)-[:SEARCH]->(g)
            `);
            const gqlResult = await graphql({
                schema: neoSchema.schema,
                source: create,
                contextValue: { driver },
            });

            expect(gqlResult.errors).toBeFalsy();

            expect(gqlResult.data as any).toEqual({
                Movies: [
                    {
                        search: [
                            { __typename: "Movie", title: movieTitle },
                            { __typename: "Genre", name: genreName },
                        ],
                    },
                ],
            });
        } finally {
            await session.close();
        }
    });
});
