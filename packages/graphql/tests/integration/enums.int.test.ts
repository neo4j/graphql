import { Driver } from "neo4j-driver";
import { graphql } from "graphql";
import { generate } from "randomstring";
import { describe, beforeAll, afterAll, test, expect } from "@jest/globals";
import neo4j from "./neo4j";
import makeAugmentedSchema from "../../src/schema/make-augmented-schema";

describe("enums", () => {
    let driver: Driver;

    beforeAll(async () => {
        driver = await neo4j();
    });

    afterAll(async () => {
        await driver.close();
    });

    test("should create a movie (with a custom enum)", async () => {
        const session = driver.session();

        const statusResolver = {
            ACTIVE: "active",
        };

        const typeDefs = `
            enum Status {
                ACTIVE
            }
          
            type Movie {
              id: ID
              status: Status
            }
        `;

        const neoSchema = makeAugmentedSchema({ typeDefs, resolvers: { Status: statusResolver } });

        const id = generate({
            charset: "alphabetic",
        });

        const create = `
            mutation {
                createMovies(input:[{id: "${id}", status: ACTIVE}]) {
                    movies {
                        id
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

            const result = await session.run(`
                MATCH (m:Movie {id: "${id}"})
                RETURN m {.id, .status} as m
            `);

            expect((result.records[0].toObject() as any).m).toEqual({ id, status: "active" });
        } finally {
            await session.close();
        }
    });
});
