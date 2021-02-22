import { Driver } from "neo4j-driver";
import { graphql } from "graphql";
import { generate } from "randomstring";
import neo4j from "./neo4j";
import { Neo4jGraphQL } from "../../src/classes";

describe("multi-database", () => {
    let driver: Driver;

    beforeAll(async () => {
        driver = await neo4j();
    });

    afterAll(async () => {
        await driver.close();
    });

    test("should specify the database via context", async () => {
        const session = driver.session();

        const typeDefs = `
            type Movie {
                id: ID!
            }
        `;

        const neoSchema = new Neo4jGraphQL({ typeDefs });

        const id = generate({
            charset: "alphabetic",
        });

        const query = `
            query {
                movies(where: { id: "${id}" }) {
                    id
                }
            }
        `;

        try {
            const movieGQLSecondResult = await graphql({
                schema: neoSchema.schema,
                source: query,
                variableValues: { id },
                contextValue: { driver, neo4jDatabase: "another-random-db" },
            });
            expect(
                (movieGQLSecondResult.errors as any)[0].message.includes(
                    "Unable to get a routing table for database 'another-random-db'"
                )
            ).toEqual(true);
        } finally {
            await session.close();
        }
    });
});
