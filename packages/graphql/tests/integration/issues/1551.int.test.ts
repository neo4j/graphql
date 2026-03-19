/*
 * Copyright (c) "Neo4j"
 * Neo4j Sweden AB [http://neo4j.com]
 */

import { GraphQLError } from "graphql";
import type { UniqueType } from "../../utils/graphql-types";
import { TestHelper } from "../../utils/tests-helper";

describe("https://github.com/neo4j/graphql/issues/1551", () => {
    let testType: UniqueType;

    const testHelper = new TestHelper();

    beforeAll(async () => {
        testType = testHelper.createUniqueType("AttribValue");

        const typeDefs = `
            type ${testType} @node {
                prodid: Int!
                attribid: Int!
                level: Int!
                ord: Int!
                attribvalue: String
            }
        `;

        await testHelper.initNeo4jGraphQL({ typeDefs });
    });

    afterAll(async () => {
        await testHelper.close();
    });

    test("should throw an error when trying to set non-nullable field to null", async () => {
        const createMutation = `
            mutation {
                ${testType.operations.create}(input: [{ prodid: 1, attribid: 2, level: 1, ord: 1 }]) {
                    info {
                        nodesCreated
                        relationshipsCreated
                    }
                    ${testType.plural} {
                        prodid
                        attribid
                        level
                        ord
                        attribvalue
                    }
                }
            }
        `;

        await testHelper.executeGraphQL(createMutation);

        const updateMutation = `
            mutation {
                ${testType.operations.update}(where: { prodid_EQ: 1, attribid_EQ: 2 }, update: { level_SET: null }) {
                    ${testType.plural} {
                        prodid
                        attribid
                        level
                        attribvalue
                    }
                }
            }
        `;

        const updateResult = await testHelper.executeGraphQL(updateMutation);
        expect(updateResult.errors).toEqual([
            new GraphQLError(`Cannot set non-nullable field ${testType.name}.level to null`),
        ]);
    });
});
