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

import type { Driver, Session } from "neo4j-driver";
import { graphql } from "graphql";
import Neo4j from "../neo4j";
import { Neo4jGraphQL } from "../../../src/classes";
import { generateUniqueType, UniqueType } from "../../utils/graphql-types";

describe("https://github.com/neo4j/graphql/issues/2249", () => {
    let driver: Driver;
    let neo4j: Neo4j;
    let neoSchema: Neo4jGraphQL;
    let session: Session;

    let Movie: UniqueType;
    let Person: UniqueType;
    let Influencer: UniqueType;

    beforeAll(async () => {
        neo4j = new Neo4j();
        driver = await neo4j.getDriver();
    });

    beforeEach(async () => {
        Movie = generateUniqueType("Movie");
        Person = generateUniqueType("Person");
        Influencer = generateUniqueType("Influencer");
        session = await neo4j.getSession();

        const typeDefs = `
            type ${Movie} {
                title: String!
                reviewers: [Reviewer!]! @relationship(type: "REVIEWED", properties: "Review", direction: IN)
                imdbId: Int @unique
            }

            interface Review {
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

        neoSchema = new Neo4jGraphQL({
            typeDefs,
            driver,
        });
    });

    afterEach(async () => {
        await session.close();
    });

    afterAll(async () => {
        await driver.close();
    });

    test("Update with create on an interface type should return valid Cypher", async () => {
        await session.run(`CREATE (:${Movie} { title: "John Wick" })`);

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

        const mutationResult = await graphql({
            schema: await neoSchema.getSchema(),
            source: mutation,
            contextValue: neo4j.getContextValues(),
        });

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
