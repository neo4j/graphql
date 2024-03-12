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
import { Neo4jGraphQL } from "../../../src";
import { cleanNodesUsingSession } from "../../utils/clean-nodes";
import { UniqueType } from "../../utils/graphql-types";
import Neo4jHelper from "../neo4j";

describe("https://github.com/neo4j/graphql/issues/4814", () => {
    const AStep = new UniqueType("AStep");
    const BStep = new UniqueType("BStep");

    let schema: GraphQLSchema;
    let driver: Driver;
    let neo4j: Neo4jHelper;

    async function graphqlQuery(query: string) {
        return graphql({
            schema,
            source: query,
            contextValue: neo4j.getContextValues(),
        });
    }

    beforeAll(async () => {
        neo4j = new Neo4jHelper();
        driver = await neo4j.getDriver();

        const typeDefs = /* GraphQL */ `
            interface Step {
                id: ID!
                nexts: [Step!]! @declareRelationship
                prevs: [Step!]! @declareRelationship
            }

            type ${AStep} implements Step {
                id: ID! @id
                nexts: [Step!]! @relationship(type: "FOLLOWED_BY", direction: OUT)
                prevs: [Step!]! @relationship(type: "FOLLOWED_BY", direction: IN)
            }

            type ${BStep} implements Step {
                id: ID! @id
                nexts: [Step!]! @relationship(type: "FOLLOWED_BY", direction: OUT)
                prevs: [Step!]! @relationship(type: "FOLLOWED_BY", direction: IN)
            }
        `;
        const neoGraphql = new Neo4jGraphQL({ typeDefs, driver });
        schema = await neoGraphql.getSchema();

        await neo4j.run(`
            CREATE (step0:${AStep} { id: "0"})
            CREATE (step1:${AStep} { id: "1"})
            CREATE (step2:${BStep} { id: "2"})
            CREATE (step3:${AStep} { id: "3"})
            
            CREATE (step0)-[:FOLLOWED_BY]->(step1)
            CREATE (step1)-[:FOLLOWED_BY]->(step2)
            CREATE (step2)-[:FOLLOWED_BY]->(step3)
        `);
    });

    afterAll(async () => {
        const session = await neo4j.getSession();
        await cleanNodesUsingSession(session, [AStep, BStep]);
        await driver.close();
    });

    test("should use the direction specified in the typeDefs - Connection", async () => {
        const query = /* GraphQL */ `
            query GetNextStep {
                steps {
                    __typename
                    id
                    prevsConnection {
                        edges {
                            node {
                                id
                                __typename
                            }
                        }
                    }
                    nextsConnection {
                        edges {
                            node {
                                id
                                __typename
                            }
                        }
                    }
                }
            }
        `;

        const queryResults = await graphqlQuery(query);
        expect(queryResults.errors).toBeUndefined();
        expect(queryResults.data).toEqual({
            steps: expect.toIncludeSameMembers([
                {
                    __typename: AStep.name,
                    id: "0",
                    prevsConnection: {
                        edges: [],
                    },
                    nextsConnection: {
                        edges: [
                            {
                                node: {
                                    id: "1",
                                    __typename: AStep.name,
                                },
                            },
                        ],
                    },
                },
                {
                    __typename: AStep.name,
                    id: "1",
                    prevsConnection: {
                        edges: [
                            {
                                node: {
                                    id: "0",
                                    __typename: AStep.name,
                                },
                            },
                        ],
                    },
                    nextsConnection: {
                        edges: [
                            {
                                node: {
                                    id: "2",
                                    __typename: BStep.name,
                                },
                            },
                        ],
                    },
                },
                {
                    __typename: BStep.name,
                    id: "2",
                    prevsConnection: {
                        edges: [
                            {
                                node: {
                                    id: "1",
                                    __typename: AStep.name,
                                },
                            },
                        ],
                    },
                    nextsConnection: {
                        edges: [
                            {
                                node: {
                                    id: "3",
                                    __typename: AStep.name,
                                },
                            },
                        ],
                    },
                },
                {
                    __typename: AStep.name,
                    id: "3",
                    prevsConnection: {
                        edges: [
                            {
                                node: {
                                    id: "2",
                                    __typename: BStep.name,
                                },
                            },
                        ],
                    },
                    nextsConnection: {
                        edges: [],
                    },
                },
            ]),
        });
    });

    test("should use the direction specified in the typeDefs - Simple", async () => {
        const query = /* GraphQL */ `
            query GetNextStep {
                steps {
                    __typename
                    id
                    prevs {
                        __typename
                        id
                    }

                    nexts {
                        __typename
                        id
                    }
                }
            }
        `;

        const queryResults = await graphqlQuery(query);
        expect(queryResults.errors).toBeUndefined();
        expect(queryResults.data).toEqual({
            steps: expect.toIncludeSameMembers([
                {
                    __typename: AStep.name,
                    id: "0",
                    prevs: [],
                    nexts: [
                        {
                            __typename: AStep.name,
                            id: "1",
                        },
                    ],
                },
                {
                    __typename: AStep.name,
                    id: "1",
                    prevs: [
                        {
                            __typename: AStep.name,
                            id: "0",
                        },
                    ],
                    nexts: [
                        {
                            __typename: BStep.name,
                            id: "2",
                        },
                    ],
                },
                {
                    __typename: BStep.name,
                    id: "2",
                    prevs: [
                        {
                            __typename: AStep.name,
                            id: "1",
                        },
                    ],
                    nexts: [
                        {
                            __typename: AStep.name,
                            id: "3",
                        },
                    ],
                },
                {
                    __typename: AStep.name,
                    id: "3",
                    prevs: [
                        {
                            __typename: BStep.name,
                            id: "2",
                        },
                    ],
                    nexts: [],
                },
            ]),
        });
    });
});
