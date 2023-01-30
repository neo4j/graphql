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

import type { Driver } from "neo4j-driver";
import { graphql } from "graphql";
import { generate } from "randomstring";
import Neo4j from "../neo4j";
import { Neo4jGraphQL } from "../../../src/classes";
import { UniqueType } from "../../utils/graphql-types";

describe("integration/rfcs/query-limits", () => {
    let driver: Driver;
    let neo4j: Neo4j;

    beforeAll(async () => {
        neo4j = new Neo4j();
        driver = await neo4j.getDriver();
    });

    afterAll(async () => {
        await driver.close();
    });

    describe("Top Level Query Limits", () => {
        test("should limit the top level query", async () => {
            const session = await neo4j.getSession();
            const randomType = new UniqueType("Movie");

            const typeDefs = `
                type ${randomType.name} @queryOptions(limit: {default:2}) {
                    id: ID!
                }
            `;

            const neoSchema = new Neo4jGraphQL({ typeDefs });

            try {
                await session.run(
                    `
                        WITH [1,2,3,4,5] AS iterate
                        UNWIND iterate AS i
                        CREATE (:${randomType.name} {id: randomUUID()})
                    `,
                    {}
                );

                const query = `
                        {
                            ${randomType.plural} {
                                id
                            }
                        }
                `;

                const gqlResult = await graphql({
                    schema: await neoSchema.getSchema(),
                    source: query,
                    contextValue: neo4j.getContextValuesWithBookmarks(session.lastBookmark()),
                });

                if (gqlResult.errors) {
                    console.log(JSON.stringify(gqlResult.errors, null, 2));
                }

                expect(gqlResult.errors).toBeUndefined();
                expect((gqlResult.data as any)[randomType.plural]).toHaveLength(2);
            } finally {
                await session.close();
            }
        });
    });

    describe("Field Level Query Limits", () => {
        test("should limit the normal field level query", async () => {
            const session = await neo4j.getSession();
            const randomType1 = new UniqueType("Movie");
            const randomType2 = new UniqueType("Person");
            const movieId = generate({
                charset: "alphabetic",
            });

            const typeDefs = `
                type ${randomType1.name}  {
                    id: ID!
                    actors: [${randomType2.name}!]! @relationship(type: "ACTED_IN", direction: IN)
                }

                type ${randomType2.name} @queryOptions(limit:{default: 3}) {
                    id: ID!
                }
            `;

            const neoSchema = new Neo4jGraphQL({ typeDefs });

            try {
                await session.run(
                    `
                        CREATE (movie:${randomType1.name} {id: "${movieId}"})
                        WITH movie, [1,2,3,4,5] AS iterate
                        UNWIND iterate AS i
                        MERGE (movie)<-[:ACTED_IN]-(:${randomType2.name} {id: randomUUID()})
                    `,
                    {}
                );

                const query = `
                        {
                            ${randomType1.plural} {
                                id
                                actors {
                                    id
                                }
                            }
                        }
                `;

                const gqlResult = await graphql({
                    schema: await neoSchema.getSchema(),
                    source: query,
                    contextValue: neo4j.getContextValuesWithBookmarks(session.lastBookmark()),
                });

                if (gqlResult.errors) {
                    console.log(JSON.stringify(gqlResult.errors, null, 2));
                }

                expect(gqlResult.errors).toBeUndefined();
                expect((gqlResult.data as any)[randomType1.plural][0].actors).toHaveLength(3);
            } finally {
                await session.close();
            }
        });

        test("should limit the connection field level query", async () => {
            const session = await neo4j.getSession();
            const randomType1 = new UniqueType("Movie");
            const randomType2 = new UniqueType("Person");
            const movieId = generate({
                charset: "alphabetic",
            });

            const typeDefs = `
                type ${randomType1.name}  {
                    id: ID!
                    actors: [${randomType2.name}!]! @relationship(type: "ACTED_IN", direction: IN)
                }

                type ${randomType2.name} @queryOptions(limit:{default: 4}) {
                    id: ID!
                }
            `;

            const neoSchema = new Neo4jGraphQL({ typeDefs });

            try {
                await session.run(
                    `
                        CREATE (movie:${randomType1.name} {id: "${movieId}"})
                        WITH movie, [1,2,3,4,5] AS iterate
                        UNWIND iterate AS i
                        MERGE (movie)<-[:ACTED_IN]-(:${randomType2.name} {id: randomUUID()})
                    `,
                    {}
                );

                const query = `
                        {
                            ${randomType1.plural} {
                                id
                                actorsConnection {
                                    edges {
                                        node {
                                            id
                                        }
                                    }
                                }
                            }
                        }
                `;

                const gqlResult = await graphql({
                    schema: await neoSchema.getSchema(),
                    source: query,
                    contextValue: neo4j.getContextValuesWithBookmarks(session.lastBookmark()),
                });

                if (gqlResult.errors) {
                    console.log(JSON.stringify(gqlResult.errors, null, 2));
                }

                expect(gqlResult.errors).toBeUndefined();
                expect((gqlResult.data as any)[randomType1.plural][0].actorsConnection.edges).toHaveLength(4);
            } finally {
                await session.close();
            }
        });
    });
});
