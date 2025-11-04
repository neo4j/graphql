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

import { GraphQLError } from "graphql";
import type { UniqueType } from "../../utils/graphql-types";
import { TestHelper } from "../../utils/tests-helper";

describe("https://github.com/neo4j/graphql/issues/1551", () => {
    let testType: UniqueType;

    const testHelper = new TestHelper();

    beforeAll(async () => {
        testType = testHelper.createUniqueType("AttribValue");

        const typeDefs = `
            type ${testType} {
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
                        bookmark
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
                ${testType.operations.update}(where: { prodid: 1, attribid: 2 }, update: { level: null }) {
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
