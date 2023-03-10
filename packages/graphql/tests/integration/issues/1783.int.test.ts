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
import type { Driver } from "neo4j-driver";
import Neo4j from "../neo4j";
import { Neo4jGraphQL } from "../../../src";
import { UniqueType } from "../../utils/graphql-types";

describe("https://github.com/neo4j/graphql/issues/1783", () => {
    let schema: GraphQLSchema;
    let driver: Driver;
    let neo4j: Neo4j;
    const testMain = new UniqueType("Main");
    const testSeries = new UniqueType("Series");
    const testNameDetails = new UniqueType("NameDetails");
    const testMasterData = new UniqueType("MasterData");

    const typeDefs = `
        type ${testSeries} {
            id: ID! @id(autogenerate: false)
            current: Boolean!
            architecture: [${testMasterData}!]!
                @relationship(type: "ARCHITECTURE", properties: "RelationProps", direction: OUT)
            nameDetails: ${testNameDetails} @relationship(type: "HAS_NAME", properties: "RelationProps", direction: OUT)
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

    beforeAll(async () => {
        neo4j = new Neo4j();
        driver = await neo4j.getDriver();
    });

    afterEach(async () => {
        const session = await neo4j.getSession();

        try {
            await session.run(`MATCH (o:${testMain}) DETACH DELETE o`);
            await session.run(`MATCH (s:${testSeries}) DETACH DELETE s`);
            await session.run(`MATCH (n:${testNameDetails}) DETACH DELETE n`);
            await session.run(`MATCH (m:${testMasterData}) DETACH DELETE m`);
        } finally {
            await session.close();
        }
    });

    afterAll(async () => {
        await driver.close();
    });

    test("missing parameter with implicit AND", async () => {
        const neoGraphql = new Neo4jGraphQL({
            typeDefs,
            driver,
        });
        schema = await neoGraphql.getSchema();

        const session = await neo4j.getSession();
        try {
            await session.run(`
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

            const res = await graphql({
                schema,
                source: query,
                variableValues,
                contextValue: neo4j.getContextValuesWithBookmarks(session.lastBookmark()),
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
        } finally {
            await session.close();
        }
    });
});
