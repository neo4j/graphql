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
import { Driver } from "neo4j-driver";
import neo4j from "../neo4j";
import { Neo4jGraphQL } from "../../../src";
import { generateUniqueType } from "../../utils/graphql-types";

describe("https://github.com/neo4j/graphql/issues/988", () => {
    const seriesType = generateUniqueType("Series");
    const brandType = generateUniqueType("Brand");
    const manufacturerType = generateUniqueType("Manufacturer");

    let schema: GraphQLSchema;
    let driver: Driver;

    beforeAll(async () => {
        driver = await neo4j();

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

            interface RelationProps {
                current: Boolean!
            }
        `;
        const neoGraphql = new Neo4jGraphQL({ typeDefs, driver });
        schema = neoGraphql.schema;
    });

    beforeEach(async () => {
        const session = driver.session();
        await session.run(
            `CREATE (:${manufacturerType.name} {name: "C", id: "a"})<-[:MANUFACTURER {current: true}]-(:${seriesType.name} {name: "123", current: true})-[:BRAND {current: true}]->(:${brandType.name} {name: "smart"})<-[:BRAND {current: true}]-(:${seriesType.name} {name: "456", current: true})-[:MANUFACTURER {current: false}]->(:${manufacturerType.name} {name: "AM"})`
        );
        await session.close();
    });

    afterEach(async () => {
        const session = driver.session();

        await session.run(`MATCH (s:${seriesType.name}) DETACH DELETE s`);
        await session.run(`MATCH (b:${brandType.name}) DETACH DELETE b`);
        await session.run(`MATCH (m:${manufacturerType.name}) DETACH DELETE m`);

        await session.close();
    });

    afterAll(async () => {
        await driver.close();
    });

    test("should query nested connection", async () => {
        const query = `
            query getSeriesWithRelationFilters($where: ${seriesType.name}Where = { current: true }) {
                ${seriesType.plural}(where: $where) {
                    name
                    current
                    manufacturerConnection {
                        edges {
                            current
                            node {
                                name
                            }
                        }
                    }
                    brandConnection {
                        edges {
                            current
                            node {
                                name
                            }
                        }
                    }
                }
            }
        `;

        const res = await graphql({
            schema,
            source: query,
            contextValue: {
                driver,
            },
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

        expect(res.data?.[seriesType.plural]).toHaveLength(2);
        expect(res.data).toEqual({
            [seriesType.plural]: expect.arrayContaining([
                {
                    name: "123",
                    current: true,
                    manufacturerConnection: {
                        edges: [
                            {
                                current: true,
                                node: {
                                    name: "C",
                                },
                            },
                        ],
                    },
                    brandConnection: {
                        edges: [
                            {
                                current: true,
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
                                current: false,
                                node: {
                                    name: "AM",
                                },
                            },
                        ],
                    },
                    brandConnection: {
                        edges: [
                            {
                                current: true,
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
