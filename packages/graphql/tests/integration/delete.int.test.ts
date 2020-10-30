import { Driver } from "neo4j-driver";
import { graphql } from "graphql";
import { generate } from "randomstring";
import neo4j from "./neo4j";
import makeAugmentedSchema from "../../src/schema/make-augmented-schema";

describe("delete", () => {
    let driver: Driver;

    beforeAll(async () => {
        driver = await neo4j();
    });

    afterAll(async () => {
        await driver.close();
    });

    test("should delete a single movie", async () => {
        const session = driver.session();

        const typeDefs = `
            type Movie {
                id: ID!
            }
        `;

        const neoSchema = makeAugmentedSchema({ typeDefs });

        const id = generate({
            charset: "alphabetic",
        });

        const mutation = `
        mutation($id: ID!) {
            deleteMovies(where: { id: $id }) {
              nodesDeleted
              relationshipsDeleted
            }
          }
        `;

        try {
            await session.run(
                `
                CREATE (:Movie {id: $id})
            `,
                { id }
            );

            const gqlResult = await graphql({
                schema: neoSchema.schema,
                source: mutation,
                variableValues: { id },
                contextValue: { driver },
            });

            expect(gqlResult.errors).toBeFalsy();

            expect(gqlResult?.data?.deleteMovies).toEqual({ nodesDeleted: 1, relationshipsDeleted: 0 });

            const reFind = await session.run(
                `
              MATCH (m:Movie {id: $id})
              RETURN m
            `,
                { id }
            );

            expect(reFind.records.length).toEqual(0);
        } finally {
            await session.close();
        }
    });
});
