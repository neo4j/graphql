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

describe("https://github.com/neo4j/graphql/issues/2249", () => {
    const testHelper = new TestHelper();

    let Movie: UniqueType;
    let Person: UniqueType;
    let Influencer: UniqueType;

    beforeEach(async () => {
        Movie = testHelper.createUniqueType("Movie");
        Person = testHelper.createUniqueType("Person");
        Influencer = testHelper.createUniqueType("Influencer");

        const typeDefs = `
            type ${Movie} {
                title: String!
                reviewers: [Reviewer!]! @relationship(type: "REVIEWED", properties: "Review", direction: IN)
                imdbId: Int @unique
            }

            type Review @relationshipProperties {
                score: Int!
            }

            type ${Person} implements Reviewer {
                name: String!
                reputation: Int!
            }
            type ${Influencer} implements Reviewer {
                reputation: Int!
                url: String!
                reviewerId: Int
            }

            interface Reviewer {
                reputation: Int!
            }
        `;

        await testHelper.initNeo4jGraphQL({
            typeDefs,
        });
    });

    afterEach(async () => {
        await testHelper.close();
    });

    test("Update with create on an interface type should return valid Cypher", async () => {
        await testHelper.executeCypher(`CREATE (:${Movie} { title: "John Wick" })`);

        const mutation = `
            mutation {
                ${Movie.operations.update}(
                    where: { title: "John Wick" }
                    update: {
                        reviewers: [
                            { create: [{ edge: { score: 10 }, node: { ${Person}: { reputation: 100, name: "Ana" } } }] }
                        ]
                    }
                ) {
                    ${Movie.plural} {
                        title
                        reviewers {
                            ... on ${Person} {
                              name
                              reputation
                            }
                          }
                    }
                }
            }
        `;

        const mutationResult = await testHelper.executeGraphQL(mutation);

        expect(mutationResult.errors).toBeFalsy();
        expect(mutationResult.data).toEqual({
            [Movie.operations.update]: {
                [Movie.plural]: [
                    {
                        title: "John Wick",
                        reviewers: [
                            {
                                name: "Ana",
                                reputation: 100,
                            },
                        ],
                    },
                ],
            },
        });
    });
});
