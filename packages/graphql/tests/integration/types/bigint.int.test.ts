import { Driver } from "neo4j-driver";
import { graphql } from "graphql";
import { generate } from "randomstring";
import neo4j from "../neo4j";
import { Neo4jGraphQL } from "../../../src/classes";

describe("BigInt", () => {
    let driver: Driver;

    beforeAll(async () => {
        driver = await neo4j();
    });

    afterAll(async () => {
        await driver.close();
    });

    describe("create", () => {
        test("should create an object with a BigInt specified inline in the mutation", async () => {
            const session = driver.session();

            const typeDefs = `
                type File {
                  name: String!
                  size: BigInt!
                }
            `;

            const neoSchema = new Neo4jGraphQL({
                typeDefs,
            });

            const name = generate({
                charset: "alphabetic",
            });

            const create = `
                mutation {
                    createFiles(input: [{ name: "${name}", size: 9223372036854775807 }]) {
                        files {
                            name
                            size
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
                    MATCH (f:File {name: "${name}"})
                    RETURN f {.name, .size} as f
                `);

                expect((result.records[0].toObject() as any).f).toEqual({
                    name,
                    size: {
                        high: 2147483647,
                        low: -1,
                    },
                });
            } finally {
                await session.close();
            }
        });
    });
});
