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

describe("typename_IN", () => {
    const testHelper = new TestHelper();
    let typeDefs: string;

    let Movie: UniqueType;
    let Actor: UniqueType;
    let Series: UniqueType;
    let Cartoon: UniqueType;

    beforeAll(async () => {
        Movie = testHelper.createUniqueType("Movie");
        Actor = testHelper.createUniqueType("Actor");
        Series = testHelper.createUniqueType("Series");
        Cartoon = testHelper.createUniqueType("Cartoon");

        typeDefs = `
        interface Production {
            title: String!
            cost: Float!
        }

        type ${Movie.name} implements Production {
            title: String!
            cost: Float!
            runtime: Int!
        }

        type ${Series.name} implements Production {
            title: String!
            cost: Float!
            episodes: Int!
        }

        type ${Cartoon.name} implements Production {
            title: String!
            cost: Float!
            cartoonist: String!
        }

        type ActedIn @relationshipProperties {
            screenTime: Int!
        }

        type ${Actor.name}  {
            name: String!
            actedIn: [Production!]! @relationship(type: "ACTED_IN", direction: OUT, properties: "ActedIn")
        }
        `;

        await testHelper.executeCypher(`
            CREATE(a:${Actor.name} { name: "Keanu" })
            CREATE(a)-[:ACTED_IN]->(m:${Movie.name} { title: "The Matrix" })
            CREATE(a)-[:ACTED_IN]->(s:${Series.name} { title: "The Matrix animated series" })
            CREATE(a)-[:ACTED_IN]->(c:${Cartoon.name} { title: "Matrix the cartoon" })
        `);

        await testHelper.initNeo4jGraphQL({
            typeDefs,
        });
    });

    afterAll(async () => {
        await testHelper.close();
    });

    test("top-level", async () => {
        const query = `
        {
            productions(where: { OR: [{ AND: [{ title: "The Matrix" }, { typename_IN: [${Movie.name}] }] }, { typename_IN: [${Series.name}] }]}) {
                __typename
                title
            }
        }  
        `;

        const queryResult = await testHelper.executeGraphQL(query);
        expect(queryResult.errors).toBeUndefined();
        expect(queryResult.data).toEqual({
            productions: expect.toIncludeSameMembers([
                {
                    __typename: Movie.name,
                    title: "The Matrix",
                },
                {
                    __typename: Series.name,
                    title: "The Matrix animated series",
                },
            ]),
        });
    });

    test("nested", async () => {
        const query = `
        {
            ${Actor.plural} {
                actedIn(where: { OR: [
                    { AND: [{ title: "The Matrix" }, { typename_IN: [${Movie.name}] }] }
                    { typename_IN: [${Series.name}] }
                ] }) {
                    __typename
                    title
                }
            }
        } 
        `;

        const queryResult = await testHelper.executeGraphQL(query);
        expect(queryResult.errors).toBeUndefined();
        expect(queryResult.data).toEqual({
            [Actor.plural]: [
                {
                    actedIn: expect.toIncludeSameMembers([
                        {
                            __typename: Movie.name,
                            title: "The Matrix",
                        },
                        {
                            __typename: Series.name,
                            title: "The Matrix animated series",
                        },
                    ]),
                },
            ],
        });
    });

    test("aggregation", async () => {
        const query = `
        {
            productionsAggregate(where: { OR: [ { typename_IN: [${Movie.name}, ${Series.name}] } { typename_IN: [${Cartoon.name}] } ] }) {
                count
            }
        }  
        `;

        const queryResult = await testHelper.executeGraphQL(query);
        expect(queryResult.errors).toBeUndefined();
        expect(queryResult.data).toEqual({
            productionsAggregate: {
                count: 3,
            },
        });
    });

    test("nested aggregation", async () => {
        const query = `
        {
            ${Actor.plural} {
                actedInAggregate(where: { NOT:  { typename_IN: [${Movie.name}, ${Series.name}] } }) {
                    count
                }
            }
        } 
        `;

        const queryResult = await testHelper.executeGraphQL(query);
        expect(queryResult.errors).toBeUndefined();
        expect(queryResult.data).toEqual({
            [Actor.plural]: expect.arrayContaining([
                {
                    actedInAggregate: {
                        count: 1,
                    },
                },
            ]),
        });
    });
});
