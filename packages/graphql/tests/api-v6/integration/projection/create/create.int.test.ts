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

import type { UniqueType } from "../../../../utils/graphql-types";
import { TestHelper } from "../../../../utils/tests-helper";

describe("Top-Level Create projection", () => {
    const testHelper = new TestHelper({ v6Api: true });

    let Movie: UniqueType;
    beforeAll(async () => {
        Movie = testHelper.createUniqueType("Movie");

        const typeDefs = /* GraphQL */ `
            type ${Movie} @node {
                title: String!
                released: Int
            }
        `;
        await testHelper.initNeo4jGraphQL({ typeDefs });
    });

    afterAll(async () => {
        await testHelper.close();
    });

    test("should create two movies and project them", async () => {
        const mutation = /* GraphQL */ `
            mutation {
                ${Movie.operations.create}(input: [ 
                        { node: { title: "The Matrix" } }, 
                        { node: { title: "The Matrix 2", released: 2001 } } 
                    ]) {
                    ${Movie.plural} {
                        title
                        released
                    }
                }
            }
        `;

        const gqlResult = await testHelper.executeGraphQL(mutation);
        expect(gqlResult.errors).toBeFalsy();
        expect(gqlResult.data).toEqual({
            [Movie.operations.create]: {
                [Movie.plural]: expect.toIncludeSameMembers([
                    { title: "The Matrix", released: null },
                    { title: "The Matrix 2", released: 2001 },
                ]),
            },
        });
    });
});
