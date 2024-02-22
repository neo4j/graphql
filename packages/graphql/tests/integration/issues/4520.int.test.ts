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

import { graphql } from "graphql/index";
import type { Driver } from "neo4j-driver";
import { generate } from "randomstring";
import { Neo4jGraphQL } from "../../../src";
import { cleanNodes } from "../../utils/clean-nodes";
import { UniqueType } from "../../utils/graphql-types";
import Neo4jHelper from "../neo4j";

const testLabel = generate({ charset: "alphabetic" });

describe("https://github.com/neo4j/graphql/issues/4520", () => {
    let driver: Driver;
    let neo4j: Neo4jHelper;
    let neo4jGraphql: Neo4jGraphQL;

    const Movie = new UniqueType("Movie");
    const Serie = new UniqueType("Serie");
    const FxEngineer = new UniqueType("FxEngineer");
    const Actor = new UniqueType("Actor");

    beforeAll(async () => {
        neo4j = new Neo4jHelper();
        driver = await neo4j.getDriver();
        const typeDefs = /* GraphQL */ `
            interface Production {
                title: String!
                crew: [Person!]! @declareRelationship
            }

            interface Person {
                name: String
            }

            type ${Movie} implements Production {
                title: String!
                crew: [Person!]! @relationship(type: "WORKED_AT", direction: IN)
            }

            type ${Serie} implements Production {
                title: String!
                crew: [Person!]! @relationship(type: "WORKED_AT", direction: IN)
            }

            type ${FxEngineer} implements Person {
                name: String!
            }

            type ${Actor} implements Person {
                name: String!
            }

            type Collection {
                name: String!
                productions: [Production!]! @relationship(type: "HAS_PRODUCTION", direction: OUT)
            }
        `;

        neo4jGraphql = new Neo4jGraphQL({
            typeDefs,
            driver,
        });

        const session = await neo4j.getSession();
        try {
            await session.run(
                `
                    CREATE
                        (m:${Movie}:${testLabel} {title: 'Test Movie'}),
                        (s:${Serie}:${testLabel} {title: 'Test Serie'}),
                        (f:${FxEngineer}:${testLabel} {name: 'Test FxEngineer'}),
                        (a:${Actor}:${testLabel} {name: 'Test Actor'}),
                        (m)<-[:WORKED_AT]-(f),
                        (m)<-[:WORKED_AT]-(a),
                        (s)<-[:WORKED_AT]-(f),
                        (s)<-[:WORKED_AT]-(a)
                `,
                {}
            );
        } finally {
            await session.close();
        }
    });

    afterAll(async () => {
        const session = await neo4j.getSession();
        try {
            await cleanNodes(driver, [Movie, Serie, FxEngineer, Actor]);
        } finally {
            await session.close();
        }
        await driver.close();
    });

    test("sorting by interface", async () => {
        const schema = await neo4jGraphql.getSchema();

        const query = /* GraphQL */ `
            query {
                productions(where: { title: "Test Movie" }) {
                    asc: crewConnection(sort: [{ node: { name: ASC } }]) {
                        edges {
                            node {
                                name
                            }
                        }
                    }
                    desc: crewConnection(sort: [{ node: { name: DESC } }]) {
                        edges {
                            node {
                                name
                            }
                        }
                    }
                }
            }
        `;

        const response = await graphql({
            schema,
            source: query,
            contextValue: neo4j.getContextValues(),
        });

        expect(response.errors).toBeFalsy();
        expect(response.data).toEqual({
            productions: [
                {
                    asc: {
                        edges: [
                            {
                                node: {
                                    name: "Test Actor",
                                },
                            },
                            {
                                node: {
                                    name: "Test FxEngineer",
                                },
                            },
                        ],
                    },
                    desc: {
                        edges: [
                            {
                                node: {
                                    name: "Test FxEngineer",
                                },
                            },
                            {
                                node: {
                                    name: "Test Actor",
                                },
                            },
                        ],
                    },
                },
            ],
        });
    });
});
