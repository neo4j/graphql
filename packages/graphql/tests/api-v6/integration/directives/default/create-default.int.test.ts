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

import { TestHelper } from "../../../../utils/tests-helper";

describe("Create with @default", () => {
    const testHelper = new TestHelper({ v6Api: true });

    afterEach(async () => {
        await testHelper.close();
    });

    test.each([
        { dataType: "Int", value: 1 },
        { dataType: "Float", value: 1.2 },
        { dataType: "DateTime", value: "2024-05-28T13:56:22.368Z" },
    ] as const)("should create two movies with a $dataType default value", async ({ dataType, value }) => {
        const Movie = testHelper.createUniqueType("Movie");

        const typeDefs = /* GraphQL */ `
            type ${Movie} @node {
                title: String! 
                testField: ${dataType} @default(value: ${typeof value === "string" ? `"${value}"` : value})
            }
        `;
        await testHelper.initNeo4jGraphQL({ typeDefs });

        const mutation = /* GraphQL */ `
            mutation {
                ${Movie.operations.create}(input: [ 
                        { node: { title: "The Matrix" } }, 
                        { node: { title: "The Matrix 2"} } 
                    ]) {
                    ${Movie.plural} {
                        title
                        testField
                    }
                }
            }
        `;

        const gqlResult = await testHelper.executeGraphQL(mutation);
        expect(gqlResult.errors).toBeFalsy();
        expect(gqlResult.data).toEqual({
            [Movie.operations.create]: {
                [Movie.plural]: expect.toIncludeSameMembers([
                    { title: "The Matrix", testField: value },
                    { title: "The Matrix 2", testField: value },
                ]),
            },
        });
    });
});
