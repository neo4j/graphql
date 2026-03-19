/*
 * Copyright (c) "Neo4j"
 * Neo4j Sweden AB [http://neo4j.com]
 */

import { generate } from "randomstring";
import type { UniqueType } from "../utils/graphql-types";
import { TestHelper } from "../utils/tests-helper";

describe("Aliasing", () => {
    const testHelper = new TestHelper();

    let Movie: UniqueType;
    let id: string;
    let budget: number;
    let boxOffice: number;

    beforeAll(async () => {
        Movie = testHelper.createUniqueType("Movie");

        const typeDefs = `
        type ${Movie} @node {
            id: ID!
            budget: Int!
            boxOffice: Float!
        }
        `;

        id = generate({ readable: false });
        budget = 63;
        boxOffice = 465.3;
        await testHelper.initNeo4jGraphQL({ typeDefs });

        await testHelper.executeCypher(
            `
                    CREATE (movie:${Movie})
                    SET movie += $properties
                `,
            {
                properties: {
                    id,
                    boxOffice,
                    budget,
                },
            }
        );
    });

    afterAll(async () => {
        await testHelper.close();
    });

    test("should correctly alias an ID field", async () => {
        const query = `
            query ($id: ID!) {
                ${Movie.plural}(where: { id_EQ: $id }) {
                    aliased: id
                    budget
                    boxOffice
                }
            }
        `;

        const gqlResult = await testHelper.executeGraphQL(query, {
            variableValues: { id },
        });

        expect(gqlResult.errors).toBeFalsy();
        expect((gqlResult?.data as any)[Movie.plural][0]).toEqual({
            aliased: id,
            budget,
            boxOffice,
        });
    });

    test("should correctly alias an Int field", async () => {
        const query = `
            query ($id: ID!) {
                ${Movie.plural}(where: { id_EQ: $id }) {
                    id
                    aliased: budget
                    boxOffice
                }
            }
        `;

        const gqlResult = await testHelper.executeGraphQL(query, {
            variableValues: { id },
        });

        expect(gqlResult.errors).toBeFalsy();
        expect((gqlResult?.data as any)[Movie.plural][0]).toEqual({
            id,
            aliased: budget,
            boxOffice,
        });
    });

    test("should correctly alias an Float field", async () => {
        const query = `
            query ($id: ID!) {
                ${Movie.plural}(where: { id_EQ: $id }) {
                    id
                    budget
                    aliased: boxOffice
                }
            }
        `;

        const gqlResult = await testHelper.executeGraphQL(query, {
            variableValues: { id },
        });

        expect(gqlResult.errors).toBeFalsy();
        expect((gqlResult?.data as any)[Movie.plural][0]).toEqual({
            id,
            budget,
            aliased: boxOffice,
        });
    });
});
