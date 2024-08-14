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

describe("Top-Level Update", () => {
    const testHelper = new TestHelper({ v6Api: true });

    let Movie: UniqueType;
    let Actor: UniqueType;
    beforeEach(async () => {
        Movie = testHelper.createUniqueType("Movie");
        Actor = testHelper.createUniqueType("Actor");

        const typeDefs = /* GraphQL */ `
            type ${Movie} @node {
                title: String!
                released: Int
                actors: [${Actor}!]! @relationship(direction: IN, type: "ACTED_IN")
            }

            type ${Actor} @node {
                name: String!
            }
        `;
        await testHelper.initNeo4jGraphQL({ typeDefs });
    });

    afterEach(async () => {
        await testHelper.close();
    });

    test("should update a movie", async () => {
        await testHelper.executeCypher(`
            CREATE(n:${Movie} {title: "The Matrix"})
            CREATE(:${Movie} {title: "The Matrix 2"})
        `);

        const mutation = /* GraphQL */ `
            mutation {
                ${Movie.operations.update}(
                    where: {
                        node: {
                            title: {
                                equals: "The Matrix"
                            }
                        }
                    }
                    input:  
                        { node: { title: { set: "Another Movie"} } }
                    ) {
                   info {
                        nodesCreated
                   }
                    ${Movie.plural} {
                        title
                    }
                }
            }
        `;

        const gqlResult = await testHelper.executeGraphQL(mutation);
        expect(gqlResult.errors).toBeFalsy();
        expect(gqlResult.data).toEqual({
            [Movie.operations.update]: {
                info: {
                    nodesCreated: 0,
                },
                [Movie.plural]: [
                    {
                        title: "Another Movie",
                    },
                ],
            },
        });

        const cypherMatch = await testHelper.executeCypher(
            `
              MATCH (m:${Movie})
              RETURN {title: m.title} as m
            `,
            {}
        );
        const records = cypherMatch.records.map((record) => record.toObject());
        expect(records).toEqual(
            expect.toIncludeSameMembers([
                {
                    m: {
                        title: "The Matrix 2",
                    },
                },
                {
                    m: {
                        title: "Another Movie",
                    },
                },
            ])
        );
    });

    test("should update a movies with nested filter", async () => {
        await testHelper.executeCypher(`
            CREATE(n:${Movie} {title: "The Matrix"})<-[:ACTED_IN]-(:${Actor} {name: "Keanu"})
            CREATE(:${Movie} {title: "The Matrix 2"})<-[:ACTED_IN]-(:${Actor} {name: "Uneak"})
        `);

        const mutation = /* GraphQL */ `
            mutation {
                ${Movie.operations.update}(
                    where: {
                        node: {
                            actors: {
                                some: {
                                    edges: {
                                        node: {
                                            name: {equals: "Keanu"}
                                        }
                                    }
                                }
                            }
                        }
                    }
                    input:  
                        { node: { title: { set: "Another Movie"} } }
                    ) {
                   info {
                        nodesCreated
                   }
                    ${Movie.plural} {
                        title
                    }
                }
            }
        `;

        const gqlResult = await testHelper.executeGraphQL(mutation);
        expect(gqlResult.errors).toBeFalsy();
        expect(gqlResult.data).toEqual({
            [Movie.operations.update]: {
                info: {
                    nodesCreated: 0,
                },
                [Movie.plural]: [
                    {
                        title: "Another Movie",
                    },
                ],
            },
        });

        const cypherMatch = await testHelper.executeCypher(
            `
              MATCH (m:${Movie})
              RETURN {title: m.title} as m
            `,
            {}
        );
        const records = cypherMatch.records.map((record) => record.toObject());
        expect(records).toEqual(
            expect.toIncludeSameMembers([
                {
                    m: {
                        title: "The Matrix 2",
                    },
                },
                {
                    m: {
                        title: "Another Movie",
                    },
                },
            ])
        );
    });
});
