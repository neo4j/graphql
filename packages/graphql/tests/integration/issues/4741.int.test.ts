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

describe("https://github.com/neo4j/graphql/issues/4741", () => {
    let Opportunity: UniqueType;
    let ListOli: UniqueType;

    const testHelper = new TestHelper();

    beforeAll(async () => {
        Opportunity = testHelper.createUniqueType("Opportunity");
        ListOli = testHelper.createUniqueType("ListOli");

        const typeDefs = /* GraphQL */ `
            type ${Opportunity} {
                country: String!
                listsOlis: [${ListOli}!]! @relationship(type: "HAS_LIST", direction: OUT)
            }

            type ${ListOli} {
                name: String!
            }
        `;
        await testHelper.initNeo4jGraphQL({ typeDefs });

        await testHelper.executeCypher(`
            CREATE (:${Opportunity} {country: "UK"})
            CREATE (o:${Opportunity} {country: "ES"})-[:HAS_LIST]->(:${ListOli} {name: "l1"})
            CREATE (o)-[:HAS_LIST]->(:${ListOli} {name: "l2"})
        `);
    });

    afterAll(async () => {
        await testHelper.close();
    });

    test("should return only one Opportunity filtering by count", async () => {
        const query = /* GraphQL */ `
            query {
                ${Opportunity.operations.connection}(first: 10, where: { listsOlisAggregate: { count_GT: 1 } }) {
                    edges {
                        node {
                            country
                            listsOlisConnection {
                                totalCount
                            }
                        }
                    }
                }
            }
        `;

        const queryResults = await testHelper.executeGraphQL(query);
        expect(queryResults.errors).toBeUndefined();
        expect(queryResults.data).toEqual({
            [Opportunity.operations.connection]: {
                edges: expect.toIncludeSameMembers([
                    {
                        node: {
                            country: "ES",
                            listsOlisConnection: {
                                totalCount: 2,
                            },
                        },
                    },
                ]),
            },
        });
    });

    test("should return only one Opportunity filering by name length", async () => {
        const query = /* GraphQL */ `
            query {
                ${Opportunity.operations.connection}(first: 10, where: { listsOlisAggregate: { node: { name_LT: 10 } } }) {
                    edges {
                        node {
                            country
                            listsOlisConnection {
                                totalCount
                            }
                        }
                    }
                }
            }
        `;

        const queryResults = await testHelper.executeGraphQL(query);
        expect(queryResults.errors).toBeUndefined();
        expect(queryResults.data).toEqual({
            [Opportunity.operations.connection]: {
                edges: expect.toIncludeSameMembers([
                    {
                        node: {
                            country: "ES",
                            listsOlisConnection: {
                                totalCount: 2,
                            },
                        },
                    },
                ]),
            },
        });
    });
});
