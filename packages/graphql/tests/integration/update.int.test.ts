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
});
