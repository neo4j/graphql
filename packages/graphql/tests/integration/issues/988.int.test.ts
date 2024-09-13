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

describe("https://github.com/neo4j/graphql/issues/988", () => {
    let seriesType: UniqueType;
    let brandType: UniqueType;
    let manufacturerType: UniqueType;

    const testHelper = new TestHelper();

    beforeAll(async () => {
        seriesType = testHelper.createUniqueType("Series");
        brandType = testHelper.createUniqueType("Brand");
        manufacturerType = testHelper.createUniqueType("Manufacturer");

        const typeDefs = `
            type ${seriesType.name} {
                name: String
                current: Boolean!
                manufacturer: [${manufacturerType.name}!]!
                    @relationship(type: "MANUFACTURER", properties: "RelationProps", direction: OUT)
                brand: [${brandType.name}!]! @relationship(type: "BRAND", properties: "RelationProps", direction: OUT)
            }

            type ${brandType.name} {
                name: String
                current: Boolean!
            }

            type ${manufacturerType.name} {
                name: String
                current: Boolean!
            }

            type RelationProps @relationshipProperties {
                current: Boolean!
            }
        `;
        await testHelper.initNeo4jGraphQL({ typeDefs });
        await testHelper.executeCypher(
            `CREATE (:${manufacturerType.name} {name: "C", id: "a"})<-[:MANUFACTURER {current: true}]-(:${seriesType.name} {name: "123", current: true})-[:BRAND {current: true}]->(:${brandType.name} {name: "smart"})<-[:BRAND {current: true}]-(:${seriesType.name} {name: "456", current: true})-[:MANUFACTURER {current: false}]->(:${manufacturerType.name} {name: "AM"})`
        );
    });

    afterAll(async () => {
        await testHelper.close();
    });

    test("should query nested connection", async () => {
        const query = /* GraphQL */ `
            query getSeriesWithRelationFilters($where: ${seriesType.name}Where = { current: true }) {
                ${seriesType.plural}(where: $where) {
                    name
                    current
                    manufacturerConnection {
                        edges {
                            properties {
                                current
                            }
                            node {
                                name
                            }
                        }
                    }
                    brandConnection {
                        edges {
                            properties {
                                current
                            }
                            node {
                                name
                            }
                        }
                    }
                }
            }
        `;

        const res = await testHelper.executeGraphQL(query, {
            variableValues: {
                where: {
                    current: true,
                    AND: [
                        {
                            OR: [
                                {
                                    manufacturerConnection: {
                                        edge: {
                                            current: true,
                                        },
                                        node: {
                                            name: "C",
                                        },
                                    },
                                },
                                {
                                    manufacturerConnection: {
                                        edge: {
                                            current: false,
                                        },
                                        node: {
                                            name: "AM",
                                        },
                                    },
                                },
                            ],
                        },
                        {
                            OR: [
                                {
                                    brandConnection: {
                                        edge: {
                                            current: true,
                                        },
                                        node: {
                                            name: "smart",
                                        },
                                    },
                                },
                            ],
                        },
                    ],
                },
            },
        });

        expect(res.errors).toBeUndefined();

        expect(res.data).toEqual({
            [seriesType.plural]: expect.toIncludeSameMembers([
                {
                    name: "123",
                    current: true,
                    manufacturerConnection: {
                        edges: [
                            {
                                properties: { current: true },
                                node: {
                                    name: "C",
                                },
                            },
                        ],
                    },
                    brandConnection: {
                        edges: [
                            {
                                properties: { current: true },
                                node: {
                                    name: "smart",
                                },
                            },
                        ],
                    },
                },
                {
                    name: "456",
                    current: true,
                    manufacturerConnection: {
                        edges: [
                            {
                                properties: { current: false },
                                node: {
                                    name: "AM",
                                },
                            },
                        ],
                    },
                    brandConnection: {
                        edges: [
                            {
                                properties: { current: true },
                                node: {
                                    name: "smart",
                                },
                            },
                        ],
                    },
                },
            ]),
        });
    });
});
