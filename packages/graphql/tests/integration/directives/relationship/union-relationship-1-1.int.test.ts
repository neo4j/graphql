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

import type { UniqueType } from "../../../utils/graphql-types";
import { TestHelper } from "../../../utils/tests-helper";

describe("Entity api on single element relationships to a Union type", () => {
    let Movie: UniqueType;
    let Person: UniqueType;
    let Dog: UniqueType;
    let AI: UniqueType;

    const testHelper = new TestHelper();

    beforeEach(async () => {
        Movie = testHelper.createUniqueType("Movie");
        Person = testHelper.createUniqueType("Person");
        Dog = testHelper.createUniqueType("Dog");
        AI = testHelper.createUniqueType("AI");

        const typeDefs = /* GraphQL */ `
            union Actor =  ${Dog} | ${Person} 
            union Director = ${Person} | ${AI}
            type ${Movie} @node {
                title: String!
                actor: Actor @relationship(type: "ACTED_IN", direction: IN)
                director: Director! @relationship(type: "DIRECTED", direction: IN)
            }

            type ${Person} @node {
                name: String!
            }

            type ${Dog} @node {
                nickName: String!
            }
            type ${AI} @node {
                model: String!
            }
        `;

        await testHelper.initNeo4jGraphQL({
            typeDefs,
        });
    });

    afterEach(async () => {
        await testHelper.close();
    });

    test("returns first element of 1-1 relationship with multiple relationships", async () => {
        await testHelper.executeCypher(`
            CREATE(m:${Movie} { title: "The Matrix"})<-[:ACTED_IN]-(a:${Dog} { nickName: "Hachiko"})
            CREATE(m)<-[:ACTED_IN]-(:${Person} { name: "Keanu"})
            CREATE(m)<-[:DIRECTED]-(:${Person} { name: "Director"})
            CREATE(m)<-[:DIRECTED]-(:${AI} { model: "T-800"})
        `);

        const query = `
            query {
               ${Movie.plural} {
                    actor {
                        ... on ${Person} {
                            name
                        }
                        ... on ${Dog} {
                            nickName
                        }
                    }
                    director {
                        ... on ${Person} {
                            name
                        }
                        ... on ${AI} {
                            model
                        }
                    }
                }
            }
        `;

        const result = await testHelper.executeGraphQL(query);
        expect(result.errors).toBeFalsy();
        expect(result.data).toEqual({
            [Movie.plural]: [
                {
                    actor: {
                        nickName: "Hachiko",
                    },
                    director: {
                        name: "Director",
                    },
                },
            ],
        });
    });

    test("returns null on 1-1 nullable relationship", async () => {
        await testHelper.executeCypher(`
            CREATE(m:${Movie} { title: "The Matrix"})
        `);

        const query = `
            query {
                ${Movie.plural} {
                      actor {
                        ... on ${Person} {
                            name
                        }
                        ... on ${Dog} {
                            nickName
                        }
                    }
                }
            }
        `;

        const result = await testHelper.executeGraphQL(query);
        expect(result.errors).toBeFalsy();
        expect(result.data).toEqual({
            [Movie.plural]: [
                {
                    actor: null,
                },
            ],
        });
    });

    test("fails on 1-1 non nullable relationship", async () => {
        await testHelper.executeCypher(`
            CREATE(m:${Movie} { title: "The Matrix"})
        `);

        const query = `
            query {
                ${Movie.plural} {
                    director {
                        ... on ${Person} {
                            name
                        }
                        ... on ${AI} {
                            model
                        }
                    }
                }
            }
        `;

        const result = await testHelper.executeGraphQL(query);
        expect(result.errors).toEqual([
            expect.objectContaining({
                message: `Cannot return null for non-nullable field ${Movie}.director.`,
            }),
        ]);
    });
});
