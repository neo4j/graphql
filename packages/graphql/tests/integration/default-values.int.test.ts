import { Driver } from "neo4j-driver";
import { graphql } from "graphql";
import { generate } from "randomstring";
import { Neo4jGraphQL } from "../../src/classes";
import neo4j from "./neo4j";

describe("Default values", () => {
    let driver: Driver;

    beforeAll(async () => {
        driver = await neo4j();
        process.env.JWT_SECRET = "secret";
    });

    afterAll(async () => {
        await driver.close();
        delete process.env.JWT_SECRET;
    });

    test("should allow default value on custom @cypher node field", async () => {
        const session = driver.session();

        const typeDefs = `
            type Movie {
              id: ID
              field(skip: Int = 100): Int
                @cypher(
                    statement: """
                    return $skip
                    """
                )
            }
        `;

        const neoSchema = new Neo4jGraphQL({
            typeDefs,
        });

        const id = generate({
            charset: "alphabetic",
        });

        const create = `
            {
                movies(where: {id: "${id}"}){
                    id
                    field
                }
            }
        `;

        try {
            await session.run(`
                CREATE (:Movie {id: "${id}"})
            `);

            const gqlResult = await graphql({
                schema: neoSchema.schema,
                source: create,
                contextValue: { driver },
            });

            expect(gqlResult.errors).toBeFalsy();

            expect((gqlResult.data as any).movies[0]).toEqual({
                id,
                field: 100,
            });
        } finally {
            await session.close();
        }
    });

    test("should allow default value on custom @cypher custom resolver field", async () => {
        const session = driver.session();

        const typeDefs = `
            type Movie {
                id: ID
            }

            type Query {
                field(skip: Int = 100): Int
                @cypher(
                    statement: """
                    return $skip
                    """
                )
            }
        `;

        const neoSchema = new Neo4jGraphQL({
            typeDefs,
        });

        const create = `
            {
                field
            }
        `;

        try {
            const gqlResult = await graphql({
                schema: neoSchema.schema,
                source: create,
                contextValue: { driver },
            });

            expect(gqlResult.errors).toBeFalsy();

            expect((gqlResult.data as any).field).toEqual(100);
        } finally {
            await session.close();
        }
    });
});
