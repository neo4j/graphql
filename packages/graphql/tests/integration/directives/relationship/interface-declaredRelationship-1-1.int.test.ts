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

describe("Entity api on single element relationships from an Interface type using declared relationship", () => {
    let Movie: UniqueType;
    let Person: UniqueType;
    let Dog: UniqueType;
    let Series: UniqueType;

    const testHelper = new TestHelper();

    beforeEach(async () => {
        Movie = testHelper.createUniqueType("Movie");
        Person = testHelper.createUniqueType("Person");
        Dog = testHelper.createUniqueType("Dog");
        Series = testHelper.createUniqueType("Series");

        const typeDefs = /* GraphQL */ `
            interface Actor {
                name: String!
            }
            interface Production {
                title: String!
                actor: Actor @declareRelationship
                director: ${Person}! @declareRelationship
            }

            type ${Movie} implements Production @node {
                title: String!
                actor: Actor @relationship(type: "ACTED_IN", direction: IN)
                director: ${Person}! @relationship(type: "DIRECTED", direction: IN)
            }

            type ${Series} @node {
                name: String!
                actor: Actor @relationship(type: "ACTED_IN", direction: IN)
                director: ${Person}! @relationship(type: "DIRECTED", direction: IN)
            }

            type ${Dog} implements Actor @node {
                name: String!
            }

            type ${Person} implements Actor @node{
                name: String!
             }
        `;

        await testHelper.initNeo4jGraphQL({
            typeDefs,
        });
    });

    afterEach(async () => {
        await testHelper.close();
    });

    test("returns first element of 1-1 relationship with multiple relationships on top level interface query", async () => {
        await testHelper.executeCypher(`
            CREATE(m:${Movie} { title: "The Matrix"})<-[:ACTED_IN]-(a:${Dog} { name: "Hachiko"})
            CREATE(m)<-[:ACTED_IN]-(:${Person} { name: "Keanu"})
            CREATE(m)<-[:DIRECTED]-(:${Person} { name: "Director"})
            CREATE(m)<-[:DIRECTED]-(:${Series} { name: "T-800"})
        `);

        const query = `
            query {
              productions {
                    actor {
                        name
                    }
                    director {
                       name
                    }
                }
            }
        `;

        const result = await testHelper.executeGraphQL(query);
        expect(result.errors).toBeFalsy();
        expect(result.data).toEqual({
            productions: [
                {
                    actor: {
                        name: "Hachiko",
                    },
                    director: {
                        name: "Director",
                    },
                },
            ],
        });
    });

    test("returns first element of 1-1 relationship with multiple relationships on top level type query", async () => {
        await testHelper.executeCypher(`
            CREATE(m:${Movie} { title: "The Matrix"})<-[:ACTED_IN]-(a:${Dog} { name: "Hachiko"})
            CREATE(m)<-[:ACTED_IN]-(:${Person} { name: "Keanu"})
            CREATE(m)<-[:DIRECTED]-(:${Person} { name: "Director"})
            CREATE(m)<-[:DIRECTED]-(:${Series} { name: "T-800"})
        `);

        const query = `
            query {
               ${Movie.plural} {
                    actor {
                        name
                    }
                    director {
                       name
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
                        name: "Hachiko",
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
                       name
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
                        name
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
