import { Driver } from "neo4j-driver";
import { graphql } from "graphql";
import { generate } from "randomstring";
import neo4j from "./neo4j";
import makeAugmentedSchema from "../../src/api/make-augmented-schema";

describe("integration", () => {
    let driver: Driver;

    beforeAll(async () => {
        driver = await neo4j();
    });

    afterAll(async () => {
        await driver.close();
    });

    test("should find a movie by its id", async () => {
        const session = driver.session();

        const typeDefs = `
            type Movie {
                id: ID
            }
        `;

        const neoSchema = makeAugmentedSchema({ typeDefs });

        const query = `
            query($id: ID){
                Movie(id: $id){
                    id
                }
            }
        `;

        const id = generate({
            charset: "alphabetic",
        });

        try {
            await session.run(
                `
              CREATE (:Movie {id: $id})
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

            expect(result?.data?.Movie).toEqual([{ id }]);
        } finally {
            await session.close();
        }
    });
});
