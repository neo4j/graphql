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

import type { Integer } from "neo4j-driver";
import type { UniqueType } from "../../utils/graphql-types";
import { TestHelper } from "../../utils/tests-helper";

describe("Upsert Batch", () => {
    const testHelper = new TestHelper();

    let Movie: UniqueType;
    let Actor: UniqueType;

    beforeEach(async () => {
        Movie = testHelper.createUniqueType("Movie");
        Actor = testHelper.createUniqueType("Actor");

        const typeDefs = /* GraphQL */ `
            type ${Actor} {
                name: String!
            }

            type ${Movie} {
                title: String!
                released: Int
                actors: [${Actor}!]! @relationship(type: "ACTED_IN", direction: IN)
            }
        `;

        await testHelper.initNeo4jGraphQL({ typeDefs });
    });

    afterEach(async () => {
        await testHelper.close();
    });

    test("should do 2 merge operations", async () => {
        const query = /* GraphQL */ `
            mutation {
                ${Movie.operations.upsert}(input: [{ node: { title: "The Matrix" } }, { node: { title: "The Matrix Revolutions" } }]) {
                    ${Movie.plural} {
                        title
                    }
                }
            }
        `;

        const gqlResult = await testHelper.executeGraphQL(query);
        const movieCountResult = await testHelper.executeCypher(`MATCH(m:${Movie}) RETURN COUNT(m) AS count`);
        const movieCount = movieCountResult.records[0]?.toObject().count as Integer;

        expect(gqlResult.errors).toBeFalsy();
        expect(gqlResult.data).toEqual({
            [Movie.operations.upsert]: {
                [Movie.plural]: expect.toIncludeSameMembers([
                    {
                        title: "The Matrix",
                    },
                    {
                        title: "The Matrix Revolutions",
                    },
                ]),
            },
        });
        expect(movieCount.equals(2)).toBeTrue();
    });
});
