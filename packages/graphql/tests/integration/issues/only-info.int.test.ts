/*
 * Copyright (c) "Neo4j"
 * Neo4j Sweden AB [http://neo4j.com]
 */

import { generate } from "randomstring";
import type { UniqueType } from "../../utils/graphql-types";
import { TestHelper } from "../../utils/tests-helper";

describe("https://github.com/neo4j/graphql/issues/567", () => {
    const testHelper = new TestHelper();
    let typeDefs: string;
    let Movie: UniqueType;

    beforeEach(async () => {
        Movie = testHelper.createUniqueType("Movie");

        typeDefs = `
        type ${Movie} @node {
            id: ID!
            title: String!
        }
    `;

        await testHelper.initNeo4jGraphQL({ typeDefs });
    });

    afterEach(async () => {
        await testHelper.close();
    });

    test("should not throw when only returning info on update", async () => {
        const movieId = generate({
            charset: "alphabetic",
        });

        const existingTitle = generate({
            charset: "alphabetic",
        });

        const newTitle = generate({
            charset: "alphabetic",
        });

        const query = /* GraphQL */ `
            mutation {
                ${Movie.operations.update}(where: { id_EQ: "${movieId}" }, update: { title_SET: "${newTitle}" }) {
                    info {
                        nodesCreated
                        nodesDeleted
                    }
                }
            }
        `;

        await testHelper.executeCypher(`
                CREATE (:${Movie} { id: "${movieId}", title: "${existingTitle}" })
            `);

        const result = await testHelper.executeGraphQL(query);

        if (result.errors) {
            console.log(JSON.stringify(result.errors, null, 2));
        }

        expect(result.errors).toBeFalsy();

        expect(result.data as any).toEqual({
            [Movie.operations.update]: {
                info: {
                    nodesCreated: 0,
                    nodesDeleted: 0,
                },
            },
        });
    });

    test("should not throw when only returning info on create", async () => {
        const movieId = generate({
            charset: "alphabetic",
        });

        const existingTitle = generate({
            charset: "alphabetic",
        });

        const query = `
            mutation {
                ${Movie.operations.create}(input: [{ id: "${movieId}", title: "${existingTitle}" }]) {
                    info {
                        nodesCreated
                    }
                }
            }
        `;

        const result = await testHelper.executeGraphQL(query);

        expect(result.errors).toBeFalsy();

        expect(result.data as any).toEqual({
            [Movie.operations.create]: {
                info: {
                    nodesCreated: 1,
                },
            },
        });
    });
});
