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

import { graphql, GraphQLSchema } from "graphql";
import { gql } from "apollo-server";
import { Driver } from "neo4j-driver";
import neo4j from "../neo4j";
import { Neo4jGraphQL } from "../../../src";

describe("https://github.com/neo4j/graphql/issues/1221", () => {
    let schema: GraphQLSchema;
    let driver: Driver;

    beforeAll(async () => {
        driver = await neo4j();

        const typeDefs = gql`
            type Series {
                id: ID! @id(autogenerate: false)
                current: Boolean!
                architecture: [MasterData!]!
                    @relationship(type: "ARCHITECTURE", properties: "RelationProps", direction: OUT)
            }

            type NameDetails @exclude(operations: [CREATE, UPDATE, DELETE, READ]) {
                fullName: String!
            }

            interface RelationProps {
                current: Boolean!
            }

            type MasterData {
                id: ID! @id(autogenerate: false)
                current: Boolean!
                nameDetails: NameDetails @relationship(type: "HAS_NAME", properties: "RelationProps", direction: OUT)
            }
        `;
        const neoGraphql = new Neo4jGraphQL({
            typeDefs,
            driver,
        });
        schema = await neoGraphql.getSchema();
    });

    afterAll(async () => {
        // const session = driver.session();

        // await session.run(`
        //        MATCH (n:LABEEEELLL) DETACH DELETE n
        //  `);

        await driver.close();
    });

    test("should apply where filter for deep relations", async () => {
        // const session = driver.session();

        // await session.run(`
        //         CREATE (:${testSource.name} { id: "${sourceId}" })
        //  `);

        await session.run(
            `
                CREATE (:NameDetails { fullName: "MHA" })<-[:HAS_NAME { current: true }]-(:MasterData { current: true, id: "123" })<-[:ARCHITECTURE { current: true }]-(:Series { current: true, id: "321" })
                CREATE (:NameDetails { fullName: "MHB" })<-[:HAS_NAME { current: true }]-(:MasterData { current: true, id: "523" })<-[:ARCHITECTURE { current: true }]-(:Series { current: true, id: "621" })
        
                `
        );

        const query = `
            query getSeriesFilteredByArchitectureNameDetails(
                $where: SeriesWhere = { current: true }
                $connectionWhere: RelationPropsWhere = { current: true }
            ) {
                series(where: $where) {
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

        const res = await graphql({
            schema,
            source: query,
            variableValues,
            contextValue: {
                driver,
            },
        });

        expect(res.errors).toBeUndefined();

        expect(res.data).toEqual({ series: [] });
    });
});
