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

describe("https://github.com/neo4j/graphql/issues/1783", () => {
    const testHelper = new TestHelper();

    let testSeries: UniqueType;
    let testNameDetails: UniqueType;
    let testMasterData: UniqueType;

    beforeAll(async () => {
        testSeries = testHelper.createUniqueType("Series");
        testNameDetails = testHelper.createUniqueType("NameDetails");
        testMasterData = testHelper.createUniqueType("MasterData");

        const typeDefs = `
            type ${testSeries} {
                id: ID! @unique
                current: Boolean!
                architecture: [${testMasterData}!]!
                    @relationship(type: "ARCHITECTURE", properties: "RelationProps", direction: OUT)
                nameDetails: ${testNameDetails} @relationship(type: "HAS_NAME", properties: "RelationProps", direction: OUT)
            }
    
            type ${testNameDetails} @mutation(operations: []) @query(read: false, aggregate: false) {
                fullName: String!
            }
    
            type RelationProps @relationshipProperties {
                current: Boolean!
            }
    
            type ${testMasterData} {
                id: ID! @unique
                current: Boolean!
                nameDetails: ${testNameDetails} @relationship(type: "HAS_NAME", properties: "RelationProps", direction: OUT)
            }
        `;
        await testHelper.initNeo4jGraphQL({
            typeDefs,
        });
    });

    afterAll(async () => {
        await testHelper.close();
    });

    test("missing parameter with implicit AND", async () => {
        await testHelper.executeCypher(`
                CREATE (:${testNameDetails} { fullName: "MHA" })<-[:HAS_NAME { current: true }]-(:${testMasterData} { current: true, id: "123" })<-[:ARCHITECTURE { current: true }]-(:${testSeries} { current: true, id: "321" })
                CREATE (:${testNameDetails} { fullName: "MHA" })<-[:HAS_NAME { current: true }]-(:${testMasterData} { current: true, id: "123" })<-[:ARCHITECTURE { current: true }]-(:${testSeries} { current: true, id: "3213" })-[:HAS_NAME { current: true }]->(:${testNameDetails} { fullName: "MHA1" })
                CREATE (m:${testMasterData} { current: true, id: "323" })
                CREATE (:${testNameDetails} { fullName: "MHA" })<-[:HAS_NAME { current: true }]-(m)<-[:ARCHITECTURE { current: true }]-(:${testSeries} { current: true, id: "421" })
                CREATE (:${testNameDetails} { fullName: "MHA" })<-[:HAS_NAME { current: true }]-(m)

                // For verification purpose, this should be filtered out by the where clause:
                CREATE (:${testNameDetails} { fullName: "MHBB" })<-[:HAS_NAME { current: true }]-(:${testMasterData} { current: true, id: "523" })<-[:ARCHITECTURE { current: true }]-(:${testSeries} { current: true, id: "621" })
            `);

        const query = `
                query (
                    $where: ${testSeries}Where
                    $connectionWhere: RelationPropsWhere
                ) {
                    ${testSeries.plural}(where: $where) {
                        id
                        nameDetailsConnection(where: {edge: $connectionWhere}) {
                            edges {
                                node {
                                    fullName
                                }
                            }
                        }
                        architectureConnection(where: { edge: $connectionWhere }) {
                            edges {
                                node {
                                    nameDetailsConnection(where: { edge: $connectionWhere }) {
                                        edges {
                                            node {
                                                fullName
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            `;

        const variableValues = {
            where: {
                current: true,
                nameDetailsConnection: {
                    edge: {
                        current: true,
                    },
                    node: {
                        fullName_CONTAINS: "1",
                    },
                },
                architectureConnection_SINGLE: {
                    edge: {
                        current: true,
                    },
                    node: {
                        nameDetailsConnection: {
                            edge: {
                                current: true,
                            },
                            node: {
                                fullName: "MHA",
                            },
                        },
                    },
                },
            },
            connectionWhere: {
                current: true,
            },
        };

        const res = await testHelper.executeGraphQL(query, {
            variableValues,
        });

        expect(res.errors).toBeUndefined();

        expect(res.data).toEqual({
            [testSeries.plural]: [
                {
                    nameDetailsConnection: {
                        edges: [
                            {
                                node: {
                                    fullName: "MHA1",
                                },
                            },
                        ],
                    },
                    architectureConnection: {
                        edges: [
                            {
                                node: {
                                    nameDetailsConnection: {
                                        edges: [
                                            {
                                                node: {
                                                    fullName: "MHA",
                                                },
                                            },
                                        ],
                                    },
                                },
                            },
                        ],
                    },
                    id: "3213",
                },
            ],
        });
    });
});
