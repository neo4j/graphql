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

import type { UniqueType } from "../../../../../utils/graphql-types";
import { TestHelper } from "../../../../../utils/tests-helper";

describe("Create Nodes with DateTime fields", () => {
    const testHelper = new TestHelper({ v6Api: true });
    let Movie: UniqueType;

    beforeEach(async () => {
        Movie = testHelper.createUniqueType("Movie");
        const typeDefs = /* GraphQL */ `
        type ${Movie.name} @node {
            datetime: DateTime
        }
    `;
        await testHelper.initNeo4jGraphQL({ typeDefs });
    });

    afterEach(async () => {
        await testHelper.close();
    });

    test("should be able to create nodes with DateTime fields", async () => {
        const date1 = new Date(1716904582368);
        const date2 = new Date(1796904582368);

        const mutation = /* GraphQL */ `
            mutation {
                ${Movie.operations.create}(input: [
                        { node: { datetime: "${date1.toISOString()}" } }
                        { node: { datetime: "${date2.toISOString()}" } }
                    ]) {
                    ${Movie.plural} {
                        datetime
                    }
                }
            }
        `;

        const gqlResult = await testHelper.executeGraphQL(mutation);

        expect(gqlResult.errors).toBeFalsy();
        expect(gqlResult.data).toEqual({
            [Movie.operations.create]: {
                [Movie.plural]: expect.toIncludeSameMembers([
                    { datetime: date1.toISOString() },
                    { datetime: date2.toISOString() },
                ]),
            },
        });
    });
});