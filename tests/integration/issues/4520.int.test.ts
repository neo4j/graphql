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

import { generate } from "randomstring";
import type { UniqueType } from "../../utils/graphql-types";
import { TestHelper } from "../../utils/tests-helper";

const testLabel = generate({ charset: "alphabetic" });

describe("https://github.com/neo4j/graphql/issues/4520", () => {
    const testHelper = new TestHelper();

    let Movie: UniqueType;
    let Serie: UniqueType;
    let FxEngineer: UniqueType;
    let Actor: UniqueType;

    beforeAll(async () => {
        Movie = testHelper.createUniqueType("Movie");
        Serie = testHelper.createUniqueType("Serie");
        FxEngineer = testHelper.createUniqueType("FxEngineer");
        Actor = testHelper.createUniqueType("Actor");

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

        await testHelper.initNeo4jGraphQL({
            typeDefs,
        });

        await testHelper.executeCypher(
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
                `
        );
    });

    afterAll(async () => {
        await testHelper.close();
    });

    test("sorting by interface", async () => {
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

        const response = await testHelper.executeGraphQL(query);

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
