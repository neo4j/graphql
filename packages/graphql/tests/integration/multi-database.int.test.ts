import { Driver } from "neo4j-driver";
import { graphql } from "graphql";
import { generate } from "randomstring";
import neo4j from "./neo4j";
import { Neo4jGraphQL, OGM } from "../../src/classes";

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
            const result = await graphql({
                schema: neoSchema.schema,
                source: query,
                variableValues: { id },
                contextValue: { driver, driverConfig: { database: "another-random-db" } },
            });
            expect((result.errors as any)[0].message).toBeTruthy();
        } finally {
            await session.close();
        }
    });

    test("should specify the database via neo4j construction", async () => {
        const session = driver.session();

        const typeDefs = `
            type Movie {
                id: ID!
            }
        `;

        const neoSchema = new Neo4jGraphQL({ typeDefs, driver, driverConfig: { database: "another-random-db" } });

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
            const result = await graphql({
                schema: neoSchema.schema,
                source: query,
                variableValues: { id },
            });
            expect((result.errors as any)[0].message).toBeTruthy();
        } finally {
            await session.close();
        }
    });

    test("should specify the database via OGM construction", async () => {
        const session = driver.session();

        const typeDefs = `
            type Movie {
                id: ID!
            }
        `;

        const ogm = new OGM({ typeDefs, driver, driverConfig: { database: "another-random-db" } });

        await expect(ogm.model("Movie")?.find()).rejects.toThrow();

        await session.close();
    });
});
