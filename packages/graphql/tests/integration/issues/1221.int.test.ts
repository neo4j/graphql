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

describe("https://github.com/neo4j/graphql/issues/1221", () => {
    const testHelper = new TestHelper();

    let testMain: UniqueType;
    let testSeries: UniqueType;
    let testNameDetails: UniqueType;
    let testMasterData: UniqueType;

    let typeDefs: string;

    let extendedTypeDefs: string;

    beforeEach(() => {
        testMain = testHelper.createUniqueType("Main");
        testSeries = testHelper.createUniqueType("Series");
        testNameDetails = testHelper.createUniqueType("NameDetails");
        testMasterData = testHelper.createUniqueType("MasterData");

        typeDefs = `
            type ${testSeries} {
                id: ID! @unique
                current: Boolean!
                architecture: [${testMasterData}!]!
                    @relationship(type: "ARCHITECTURE", properties: "RelationProps", direction: OUT)
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

        extendedTypeDefs = `
            type ${testMain} {
                id: ID! @unique
                current: Boolean!
                main: [${testSeries}!]! @relationship(type: "MAIN", properties: "RelationProps", direction: OUT)
            }
    
            ${typeDefs}
        `;
    });

    afterEach(async () => {
        await testHelper.close();
    });

    test("should only return the single 'chain' and not the 'chain' having two HAS_NAME relationships, two relations deep", async () => {
        await testHelper.initNeo4jGraphQL({
            typeDefs,
        });

        await testHelper.executeCypher(`
                CREATE (:${testNameDetails} { fullName: "MHA" })<-[:HAS_NAME { current: true }]-(:${testMasterData} { current: true, id: "123" })<-[:ARCHITECTURE { current: true }]-(:${testSeries} { current: true, id: "321" })
                CREATE (m:${testMasterData} { current: true, id: "323" })
                CREATE (:${testNameDetails} { fullName: "MHA" })<-[:HAS_NAME { current: true }]-(m)<-[:ARCHITECTURE { current: true }]-(:${testSeries} { current: true, id: "421" })
                CREATE (:${testNameDetails} { fullName: "MHA" })<-[:HAS_NAME { current: true }]-(m)

                // For verification purpose, this should be filtered out by the where clause:
                CREATE (:${testNameDetails} { fullName: "MHBB" })<-[:HAS_NAME { current: true }]-(:${testMasterData} { current: true, id: "523" })<-[:ARCHITECTURE { current: true }]-(:${testSeries} { current: true, id: "621" })
            `);

        const query = `
                query (
                    $where: ${testSeries}Where = { current: true }
                    $connectionWhere: RelationPropsWhere = { current: true }
                ) {
                    ${testSeries.plural}(where: $where) {
                        id
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
                architectureConnection_SINGLE: {
                    node: {
                        nameDetailsConnection: {
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
            [testSeries.plural]: expect.toIncludeSameMembers([
                {
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
                    id: "321",
                },
            ]),
        });
    });

    test("should return both seperate single 'chains', two relations deep", async () => {
        await testHelper.initNeo4jGraphQL({
            typeDefs,
        });

        await testHelper.executeCypher(`
                CREATE (:${testNameDetails} { fullName: "MHA" })<-[:HAS_NAME { current: true }]-(:${testMasterData} { current: true, id: "123" })<-[:ARCHITECTURE { current: true }]-(:${testSeries} { current: true, id: "321" })
                CREATE (:${testNameDetails} { fullName: "MHA" })<-[:HAS_NAME { current: true }]-(:${testMasterData} { current: true, id: "323" })<-[:ARCHITECTURE { current: true }]-(:${testSeries} { current: true, id: "621" })

                // For verification purpose, this should be filtered out by the where clause:
                CREATE (:${testNameDetails} { fullName: "MHBB" })<-[:HAS_NAME { current: true }]-(:${testMasterData} { current: true, id: "523" })<-[:ARCHITECTURE { current: true }]-(:${testSeries} { current: true, id: "621" })
            `);

        const query = `
                query (
                    $where: ${testSeries}Where = { current: true }
                    $connectionWhere: RelationPropsWhere = { current: true }
                ) {
                    ${testSeries.plural}(where: $where) {
                        id
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
                architectureConnection_SINGLE: {
                    node: {
                        nameDetailsConnection: {
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
            [testSeries.plural]: expect.toIncludeSameMembers([
                {
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
                    id: "321",
                },
                {
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
                    id: "621",
                },
            ]),
        });
    });

    test("should return as two single 'chains', two relations deep", async () => {
        await testHelper.initNeo4jGraphQL({
            typeDefs,
        });

        await testHelper.executeCypher(`
                CREATE (:${testNameDetails} { fullName: "MHA" })<-[:HAS_NAME { current: true }]-(m:${testMasterData} { current: true, id: "123" })
                CREATE (m)<-[:ARCHITECTURE { current: true }]-(:${testSeries} { current: true, id: "321" })
                CREATE (m)<-[:ARCHITECTURE { current: true }]-(:${testSeries} { current: true, id: "921" })

                // For verification purpose, this should be filtered out by the where clause:
                CREATE (:${testNameDetails} { fullName: "MHDD" })<-[:HAS_NAME { current: true }]-(:${testMasterData} { current: true, id: "523" })<-[:ARCHITECTURE { current: true }]-(:${testSeries} { current: true, id: "621" })
            `);

        const query = `
                query (
                    $where: ${testSeries}Where = { current: true }
                    $connectionWhere: RelationPropsWhere = { current: true }
                ) {
                    ${testSeries.plural}(where: $where) {
                        id
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
                architectureConnection_SINGLE: {
                    node: {
                        nameDetailsConnection: {
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
            [testSeries.plural]: expect.toIncludeSameMembers([
                {
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
                    id: "321",
                },
                {
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
                    id: "921",
                },
            ]),
        });
    });

    test("should only return the single 'chain' and not the 'chain' having two HAS_NAME and ARCHITECTURE relationships, three relations deep", async () => {
        await testHelper.initNeo4jGraphQL({
            typeDefs: extendedTypeDefs,
        });

        await testHelper.executeCypher(`
                CREATE (:${testNameDetails} { fullName: "MHA" })<-[:HAS_NAME { current: true }]-(:${testMasterData} { current: true, id: "123" })<-[:ARCHITECTURE { current: true }]-(:${testSeries} { current: true, id: "321" })<-[:MAIN { current: true }]-(:${testMain} { current: true, id: "1321" })
                CREATE (s:${testSeries} { current: true, id: "421" })
                CREATE (:${testNameDetails} { fullName: "MHA" })<-[:HAS_NAME { current: true }]-(:${testMasterData} { current: true, id: "123" })<-[:ARCHITECTURE { current: true }]-(s)<-[:MAIN { current: true }]-(:${testMain} { current: true, id: "1321" })
                CREATE (:${testNameDetails} { fullName: "MHA" })<-[:HAS_NAME { current: true }]-(:${testMasterData} { current: true, id: "1123" })<-[:ARCHITECTURE { current: true }]-(s)

                // For verification purpose, this should be filtered out by the where clause:
                CREATE (:${testNameDetails} { fullName: "MHBB" })<-[:HAS_NAME { current: true }]-(:${testMasterData} { current: true, id: "523" })<-[:ARCHITECTURE { current: true }]-(:${testSeries} { current: true, id: "621" })<-[:MAIN { current: true }]-(:${testMain} { current: true, id: "1621" })
            `);

        const query = `
                query (
                    $where: ${testMain}Where = { current: true }
                    $connectionWhere: RelationPropsWhere = { current: true }
                ) {
                    ${testMain.plural}(where: $where) {
                        id
                        mainConnection(where: { edge: $connectionWhere }) {
                            edges {
                                node {
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
                        }
                    }
                }
        `;

        const variableValues = {
            where: {
                current: true,
                mainConnection_SINGLE: {
                    node: {
                        architectureConnection_SINGLE: {
                            node: {
                                nameDetailsConnection: {
                                    node: {
                                        fullName: "MHA",
                                    },
                                },
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
            [testMain.plural]: expect.toIncludeSameMembers([
                {
                    mainConnection: {
                        edges: [
                            {
                                node: {
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
                                },
                            },
                        ],
                    },
                    id: "1321",
                },
            ]),
        });
    });

    test("should return as two single 'chains', three relations deep", async () => {
        await testHelper.initNeo4jGraphQL({
            typeDefs: extendedTypeDefs,
        });

        await testHelper.executeCypher(`
                CREATE (:${testNameDetails} { fullName: "MHA" })<-[:HAS_NAME { current: true }]-(m:${testMasterData} { current: true, id: "123" })
                CREATE (m)<-[:ARCHITECTURE { current: true }]-(:${testSeries} { current: true, id: "321" })
                CREATE (m)<-[:ARCHITECTURE { current: true }]-(s:${testSeries} { current: true, id: "921" })
                CREATE (s)<-[:MAIN { current: true }]-(:${testMain} { current: true, id: "1321" })
                CREATE (s)<-[:MAIN { current: true }]-(:${testMain} { current: true, id: "1621" })

                // For verification purpose, this should be filtered out by the where clause:
                CREATE (:${testNameDetails} { fullName: "MHCC" })<-[:HAS_NAME { current: true }]-(:${testMasterData} { current: true, id: "523" })<-[:ARCHITECTURE { current: true }]-(:${testSeries} { current: true, id: "621" })<-[:MAIN { current: true }]-(:${testMain} { current: true, id: "1621" })
            `);

        const query = `
                query (
                    $where: ${testMain}Where = { current: true }
                    $connectionWhere: RelationPropsWhere = { current: true }
                ) {
                    ${testMain.plural}(where: $where) {
                        id
                        mainConnection(where: { edge: $connectionWhere }) {
                            edges {
                                node {
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
                        }
                    }
                }
        `;

        const variableValues = {
            where: {
                current: true,
                mainConnection_SINGLE: {
                    node: {
                        architectureConnection_SINGLE: {
                            node: {
                                nameDetailsConnection: {
                                    node: {
                                        fullName: "MHA",
                                    },
                                },
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
            [testMain.plural]: expect.toIncludeAllMembers([
                {
                    mainConnection: {
                        edges: [
                            {
                                node: {
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
                                },
                            },
                        ],
                    },
                    id: "1321",
                },
                {
                    mainConnection: {
                        edges: [
                            {
                                node: {
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
                                },
                            },
                        ],
                    },
                    id: "1621",
                },
            ]),
        });
    });
});
