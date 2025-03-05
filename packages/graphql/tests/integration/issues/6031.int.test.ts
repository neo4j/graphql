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

describe("https://github.com/neo4j/graphql/issues/6031", () => {
    const testHelper = new TestHelper();
    let typeDefs: string;

    let Movie: UniqueType;
    let Actor: UniqueType;
    let Series: UniqueType;

    beforeAll(async () => {
        Movie = testHelper.createUniqueType("Movie");
        Actor = testHelper.createUniqueType("Actor");
        Series = testHelper.createUniqueType("Series");

        typeDefs = /* GraphQL */ `
            interface Production {
                title: String!
            }

            type ${Series} implements Production @node {
                title: String!
            }

            type ${Movie} implements Production @node {
                title: String!
                actors: [${Actor}!]! @relationship(type: "ACTED_IN", direction: IN, properties: "ActedIn")
            }
            type ${Actor} @node {
                name: String!
                ratings: [Int!]!
                lastRating: Int
                productions: [Production!]! @relationship(type: "ACTED_IN", direction: OUT, properties: "ActedIn")
            }

            type ActedIn @relationshipProperties {
                year: Int
            }
        `;

        await testHelper.executeCypher(`
            CREATE(a:${Actor.name} { name: "Keanu" })
            CREATE(a)-[:ACTED_IN]->(m:${Movie.name} { title: "The Matrix" })
            CREATE(a)-[:ACTED_IN]->(s:${Series.name} { title: "The Matrix the series" })
        `);

        await testHelper.initNeo4jGraphQL({
            typeDefs,
        });
    });

    afterAll(async () => {
        await testHelper.close();
    });

    test("typename should be supported on top-level connection where", async () => {
        const query = /* GraphQL */ `
            query TopLevelCount {
                productionsConnection(where: { typename: [${Movie}] }) {
                    edges {
                        node {
                            title
                        }
                    }
                }
            }
        `;

        const queryResult = await testHelper.executeGraphQL(query);
        expect(queryResult.errors).toBeUndefined();
        expect(queryResult.data).toEqual({
            productionsConnection: {
                edges: expect.toIncludeSameMembers([
                    {
                        node: {
                            title: "The Matrix",
                        },
                    },
                ]),
            },
        });
    });

    test("typename should be supported on nested-level connection where", async () => {
        const query = /* GraphQL */ `
            query TopLevelCount {
                ${Actor.operations.connection} {
                    edges {
                        node {
                            name
                            productionsConnection(where: { node: { typename: [${Movie}] } }) {
                                edges {
                                    node {
                                        title
                                    }
                                }
                            }
                        }
                    }
                }
              
            }
        `;

        const queryResult = await testHelper.executeGraphQL(query);
        expect(queryResult.errors).toBeUndefined();
        expect(queryResult.data).toEqual({
            [Actor.operations.connection]: {
                edges: [
                    {
                        node: {
                            name: "Keanu",
                            productionsConnection: {
                                edges: expect.toIncludeSameMembers([
                                    {
                                        node: {
                                            title: "The Matrix",
                                        },
                                    },
                                ]),
                            },
                        },
                    },
                ],
            },
        });
    });
});
