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

describe("create -> connect", () => {
    const testHelper = new TestHelper();
    let Actor: UniqueType;
    let Movie: UniqueType;

    beforeEach(async () => {
        Actor = testHelper.createUniqueType("Actor");
        Movie = testHelper.createUniqueType("Movie");

        const typeDefs = /* GraphQL */ `
            type ${Actor} @node {
                name: String
                movies: [${Movie}!]! @relationship(type: "ACTED_IN", direction: OUT)
            }
        
            type ${Movie} @node {
                title: String
                actors: [${Actor}!]! @relationship(type: "ACTED_IN", direction: IN)
            }
        `;

        await testHelper.initNeo4jGraphQL({ typeDefs });

        await testHelper.executeCypher(`CREATE (a:${Actor} {name: "Keanu"})`);
        await testHelper.executeCypher(`CREATE (m:${Movie} {title: "Another Matrix"})`);
    });

    afterEach(async () => {
        await testHelper.close();
    });

    test("should create a movie and connect to an actor", async () => {
        const query = /* GraphQL */ `
            mutation {
                ${Movie.operations.create}(
                    input: [
                        { title: "The Matrix", actors: { connect: [{ where: { node: { name: { eq: "Keanu" } } } }] } }
                    ]
                ) {
                    ${Movie.plural} {
                        title
                    }
                    info {
                        relationshipsCreated
                        nodesCreated
                    }
                }
            }
        `;

        const gqlResult = await testHelper.executeGraphQL(query);

        expect(gqlResult.errors).toBeFalsy();

        expect(gqlResult.data).toEqual({
            [Movie.operations.create]: {
                [Movie.plural]: [
                    {
                        title: "The Matrix",
                    },
                ],
                info: {
                    relationshipsCreated: 1,
                    nodesCreated: 1,
                },
            },
        });

        const path = await testHelper.executeCypher(`
                MATCH (m:${Movie} {title: "The Matrix"})-[:ACTED_IN]-(a:${Actor} {name: "Keanu"})
                RETURN COUNT(*) as resultsCount
            `);

        expect(path.records[0]?.toObject().resultsCount.toNumber()).toBe(1);
    });

    test("should create a movie and a nested connect -> connect", async () => {
        const query = /* GraphQL */ `
            mutation {
                ${Movie.operations.create}(
                    input: [
                        {
                            title: "The Matrix"
                            actors: {
                                connect: [
                                    {
                                        where: {
                                            node: {
                                                name: { eq: "Keanu" }
                                            }
                                        },
                                        connect: {
                                            movies: { where: { node: { title: { eq: "Another Matrix" } } } }
                                        }
                                    }
                                ]
                            }
                        }
                    ]
                ) {
                    ${Movie.plural} {
                        title
                    }
                    info {
                        relationshipsCreated
                        nodesCreated
                    }
                }
            }
        `;

        const gqlResult = await testHelper.executeGraphQL(query);

        expect(gqlResult.errors).toBeFalsy();

        expect(gqlResult.data).toEqual({
            [Movie.operations.create]: {
                [Movie.plural]: [
                    {
                        title: "The Matrix",
                    },
                ],
                info: {
                    relationshipsCreated: 2,
                    nodesCreated: 1,
                },
            },
        });

        const path = await testHelper.executeCypher(`
                MATCH (m:${Movie} {title: "The Matrix"})-[:ACTED_IN]-(:${Actor} {name: "Keanu"})-[:ACTED_IN]-(:${Movie} {title: "Another Matrix"})
                RETURN COUNT(*) as resultsCount
            `);

        expect(path.records[0]?.toObject().resultsCount.toNumber()).toBe(1);
    });
});
