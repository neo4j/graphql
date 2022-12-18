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

import type { GraphQLSchema } from "graphql";
import { graphql } from "graphql";
import type { Driver, Session } from "neo4j-driver";
import Neo4j from "../neo4j";
import { Neo4jGraphQL } from "../../../src";
import { generateUniqueType } from "../../utils/graphql-types";
import { cleanNodes } from "../../utils/clean-nodes";

describe("https://github.com/neo4j/graphql/issues/1782", () => {
    let schema: GraphQLSchema;
    let driver: Driver;
    let neo4j: Neo4j;
    let session: Session;

    const testMain = generateUniqueType("Main");
    const testSeries = generateUniqueType("Series");
    const testNameDetails = generateUniqueType("NameDetails");
    const testMasterData = generateUniqueType("MasterData");

    const typeDefs = `
        type ${testSeries} {
            id: ID! @id(autogenerate: false)
            current: Boolean!
            architecture: [${testMasterData}!]!
                @relationship(type: "ARCHITECTURE", properties: "RelationProps", direction: OUT)
        }

        type ${testNameDetails} @exclude(operations: [CREATE, UPDATE, DELETE, READ]) {
            fullName: String!
        }

        interface RelationProps {
            current: Boolean!
        }

        type ${testMasterData} {
            id: ID! @id(autogenerate: false)
            current: Boolean!
            nameDetails: ${testNameDetails} @relationship(type: "HAS_NAME", properties: "RelationProps", direction: OUT)
        }
    `;

    const extendedTypeDefs = `
        type ${testMain} {
            id: ID! @id(autogenerate: false)
            current: Boolean!
            main: [${testSeries}!]! @relationship(type: "MAIN", properties: "RelationProps", direction: OUT)
        }

        ${typeDefs}
    `;

    beforeAll(async () => {
        neo4j = new Neo4j();
        driver = await neo4j.getDriver();
    });

    beforeEach(async () => {
        session = await neo4j.getSession();
    });

    afterEach(async () => {
        try {
            await cleanNodes(session, [testMain, testSeries, testNameDetails, testMasterData]);
        } finally {
            await session.close();
        }
    });

    afterAll(async () => {
        await driver.close();
    });

    test("should only return the single 'chain' and the multiple nested 'chains', three relations deep, using SOME", async () => {
        const neoGraphql = new Neo4jGraphQL({
            typeDefs: extendedTypeDefs,
            driver,
        });
        schema = await neoGraphql.getSchema();

        await session.run(`
                CREATE (:${testNameDetails} { fullName: "MHA" })<-[:HAS_NAME { current: true }]-(:${testMasterData} { current: true, id: "123" })<-[:ARCHITECTURE { current: true }]-(:${testSeries} { current: true, id: "321" })<-[:MAIN { current: true }]-(:${testMain} { current: true, id: "1321" })
                CREATE (s:${testSeries} { current: true, id: "421" })
                CREATE (:${testNameDetails} { fullName: "MHA" })<-[:HAS_NAME { current: true }]-(:${testMasterData} { current: true, id: "123" })<-[:ARCHITECTURE { current: true }]-(s)<-[:MAIN { current: true }]-(:${testMain} { current: true, id: "1322" })
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
                        architectureConnection_SOME: {
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

        const res = await graphql({
            schema,
            source: query,
            variableValues,
            contextValue: neo4j.getContextValuesWithBookmarks(session.lastBookmark()),
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
                    id: "1322",
                },
            ]),
        });
    });
});
