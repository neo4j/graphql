/*
 * Copyright (c) "Neo4j"
 * Neo4j Sweden AB [http://neo4j.com]
 *
 * This file is part of Neo4j.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
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
                @fulltext(indexes: [{ indexName: "fulltext_index_space_name_number", fields: ["Name", "Number"] }]) {
                Id: ID! @id @unique
                Number: String
                Name: String!
            }
        `;
        const neoSchema = await testHelper.initNeo4jGraphQL({
            typeDefs,
        });

        await neoSchema.getSchema();
        await neoSchema.assertIndexesAndConstraints({
            driver: await testHelper.getDriver(),
            sessionConfig: { database: databaseName },
            options: { create: true },
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
                ${Space.operations.connection}(fulltext: {
                    fulltext_index_space_name_number: {
                        phrase: "Bedroom"
                    }
                }) {
                    totalCount
                    edges {
                        node {
                            Name
                            Number
                        }
                    }
                }
                ${Space.operations.aggregate}(fulltext: {
                    fulltext_index_space_name_number: {
                        phrase: "Bedroom"
                    }
                }) {
                    count
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
            [Space.operations.connection]: {
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
            [Space.operations.aggregate]: {
                count: 2,
            },
        });
    });
});
