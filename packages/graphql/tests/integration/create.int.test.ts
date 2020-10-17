import { Driver } from "neo4j-driver";
import { graphql } from "graphql";
import { generate } from "randomstring";
import neo4j from "./neo4j";
import makeAugmentedSchema from "../../src/schema/make-augmented-schema";

describe("create", () => {
    let driver: Driver;

    beforeAll(async () => {
        driver = await neo4j();
    });

    afterAll(async () => {
        await driver.close();
    });

    test("should create a single movie", async () => {
        const session = driver.session();

        const typeDefs = `
            type Actor {
                name: String
            }

            type Movie {
                id: ID!
               
            }
        `;

        const neoSchema = makeAugmentedSchema({ typeDefs });

        const id = generate({
            charset: "alphabetic",
        });

        const query = `
        mutation($id: ID!) {
            createMovies(input: [{ id: $id }]) {
              id
            }
          }
        `;

        try {
            const gqlResult = await graphql({
                schema: neoSchema.schema,
                source: query,
                variableValues: { id },
                contextValue: { driver },
            });

            expect(gqlResult.errors).toBeFalsy();

            expect(gqlResult?.data?.createMovies).toEqual([{ id }]);

            const reFind = await session.run(
                `
              MATCH (m:Movie {id: $id})
              RETURN m
            `,
                { id }
            );

            expect((reFind.records[0].toObject() as any).m.properties).toMatchObject({ id });
        } finally {
            await session.close();
        }
    });
});
