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

    test("should create 2 movies", async () => {
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

        const id1 = generate({
            charset: "alphabetic",
        });
        const id2 = generate({
            charset: "alphabetic",
        });

        const query = `
        mutation($id1: ID!, $id2: ID!) {
            createMovies(input: [{ id: $id1 }, {id: $id2}]) {
              id
            }
          }
        `;

        try {
            const gqlResult = await graphql({
                schema: neoSchema.schema,
                source: query,
                variableValues: { id1, id2 },
                contextValue: { driver },
            });

            expect(gqlResult.errors).toBeFalsy();

            expect(gqlResult?.data?.createMovies).toEqual([{ id: id1 }, { id: id2 }]);

            const reFind = await session.run(
                `
              MATCH (m:Movie)
              WHERE m.id = $id1 OR m.id = $id2
              RETURN m
            `,
                { id1, id2 }
            );

            expect((reFind.records[0].toObject() as any).m.properties.id).toEqual(id1);
            expect((reFind.records[1].toObject() as any).m.properties.id).toEqual(id2);
        } finally {
            await session.close();
        }
    });
});
