/*
 * Copyright (c) "Neo4j"
 * Neo4j Sweden AB [http://neo4j.com]
 */

import { generate } from "randomstring";
import type { UniqueType } from "../../utils/graphql-types";
import { isMultiDbUnsupportedError } from "../../utils/is-multi-db-unsupported-error";
import { TestHelper } from "../../utils/tests-helper";

describe("https://github.com/neo4j/graphql/issues/5378", () => {
    let Space: UniqueType;
    let databaseName: string;
    const testHelper = new TestHelper();
    let MULTIDB_SUPPORT = true;

    beforeAll(async () => {
        databaseName = generate({ readable: true, charset: "alphabetic" });

        try {
            await testHelper.createDatabase(databaseName);
        } catch (e) {
            if (e instanceof Error) {
                if (isMultiDbUnsupportedError(e)) {
                    // No multi-db support, so we skip tests
                    MULTIDB_SUPPORT = false;
                    await testHelper.close();
                } else {
                    throw e;
                }
            }
        }
    });

    beforeEach(async () => {
        if (!MULTIDB_SUPPORT) {
            return;
        }
        Space = testHelper.createUniqueType("Space");

        const typeDefs = /* GraphQL */ `
            type ${Space}
                @node
                @fulltext(indexes: [{ indexName: "fulltext_index_space_name_number", queryName: "spacesByNameAndNumber", fields: ["Name", "Number"] }]) {
                Id: ID! @id
                Number: String
                Name: String!
            }
        `;
        const neoSchema = await testHelper.initNeo4jGraphQL({
            typeDefs,
        });

        await testHelper.createFulltextIndex("fulltext_index_space_name_number", Space.name, ["Name", "Number"]);
        await testHelper.createUniqueConstraint("unique_constraint_space_id", Space.name, "Id");

        await neoSchema.getSchema();
        await neoSchema.assertIndexesAndConstraints({
            driver: await testHelper.getDriver(),
            sessionConfig: { database: databaseName },
        });
    });

    afterEach(async () => {
        if (MULTIDB_SUPPORT) {
            await testHelper.close();
        }
    });

    afterAll(async () => {
        if (MULTIDB_SUPPORT) {
            await testHelper.dropDatabase();
            await testHelper.close();
        }
    });

    test("should return filtered results according to authorization rule", async () => {
        if (!MULTIDB_SUPPORT) {
            console.log("MULTIDB_SUPPORT NOT AVAILABLE - SKIPPING");
            return;
        }

        const query = /* GraphQL */ `
            query SpacesSearchConnection {
                spacesByNameAndNumber(phrase: "Bedroom") {
                    totalCount
                    edges {
                        node {
                            Name
                            Number
                        }
                    }
                }
            }
        `;

        await testHelper.executeCypher(`
                CREATE (:${Space} {Id: "id1", Name: "Bedroom 1", Number: "B1" })
                CREATE (:${Space} {Id: "id2", Name: "Bedroom 2", Number: "B2" })
                CREATE (:${Space} {Id: "id3", Name: "Kitchen", Number: "K3" })
            `);

        const gqlResult = await testHelper.executeGraphQL(query);
        expect(gqlResult.errors).toBeFalsy();
        expect(gqlResult.data).toEqual({
            spacesByNameAndNumber: {
                totalCount: 2,
                edges: expect.toIncludeSameMembers([
                    {
                        node: {
                            Name: "Bedroom 1",
                            Number: "B1",
                        },
                    },
                    {
                        node: {
                            Name: "Bedroom 2",
                            Number: "B2",
                        },
                    },
                ]),
            },
        });
    });
});
