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

import type { UniqueType } from "../../utils/graphql-types";
import { TestHelper } from "../../utils/tests-helper";

describe("https://github.com/neo4j/graphql/issues/5467", () => {
    const testHelper = new TestHelper();

    let User: UniqueType;
    let Cabinet: UniqueType;
    let Category: UniqueType;
    let File: UniqueType;

    beforeAll(async () => {
        User = testHelper.createUniqueType("User");
        Cabinet = testHelper.createUniqueType("Cabinet");
        Category = testHelper.createUniqueType("Category");
        File = testHelper.createUniqueType("File");

        const typeDefs = /* GraphQL */ `
            type JWT @jwt {
                roles: [String!]!
            }

            type ${User}
                @authorization(
                    validate: [
                        { operations: [CREATE, DELETE], where: { jwt: { roles_INCLUDES: "admin" } } }
                        { operations: [READ, UPDATE], where: { node: { id: "$jwt.sub" } } }
                    ]
                    filter: [{ where: { node: { id: "$jwt.sub" } } }]
                ) {
                id: ID!
                cabinets: [${Cabinet}!]! @relationship(type: "HAS_CABINET", direction: OUT)
            }

            type ${Cabinet} @authorization(filter: [{ where: { node: { user: { id: "$jwt.sub" } } } }]) {
                id: ID! @id
                categories: [${Category}!]! @relationship(type: "HAS_CATEGORY", direction: OUT)
                user: ${User}! @relationship(type: "HAS_CABINET", direction: IN)
            }

            type ${Category} @authorization(filter: [{ where: { node: { cabinet: { user: { id: "$jwt.sub" } } } } }]) {
                id: ID! @id
                files: [${File}!]! @relationship(type: "HAS_FILE", direction: OUT)
                cabinet: ${Cabinet}! @relationship(type: "HAS_CATEGORY", direction: IN)
            }

            type ${File} {
                id: ID! @unique
                category: ${Category} @relationship(type: "HAS_FILE", direction: IN)
            }
        `;
        await testHelper.initNeo4jGraphQL({
            typeDefs,
        });
    });

    afterAll(async () => {
        await testHelper.close();
    });

    test("should properly add where filters for auth", async () => {
        const query = /* GraphQL */ `
            mutation ($fileId: ID!, $newCategoryId: ID) {
                ${File.operations.update}(
                    where: { id: $fileId }
                    disconnect: { category: { where: { node: { NOT: { id: $newCategoryId } } } } }
                    connect: { category: { where: { node: { id: $newCategoryId } } } }
                ) {
                    info {
                        relationshipsDeleted
                        relationshipsCreated
                    }
                }
            }
        `;

        const response = await testHelper.executeGraphQL(query, {
            variableValues: {
                fileId: "old-id",
                newCategoryId: "new-id",
            },
        });

        expect(response.errors).toBeFalsy();
        expect(response.data).toEqual({
            [File.operations.update]: {
                info: {
                    relationshipsDeleted: 0,
                    relationshipsCreated: 0,
                },
            },
        });
    });
});
