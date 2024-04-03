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

import { UniqueType } from "../../utils/graphql-types";
import { TestHelper } from "../../utils/tests-helper";

describe("https://github.com/neo4j/graphql/issues/4814", () => {
    let AStep: UniqueType;
    let BStep: UniqueType;

    const testHelper = new TestHelper();

    beforeAll(async () => {
        AStep = new UniqueType("AStep");
        BStep = new UniqueType("BStep");

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
        await testHelper.initNeo4jGraphQL({ typeDefs });

        await testHelper.executeCypher(`
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
        await testHelper.close();
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

        const queryResults = await testHelper.executeGraphQL(query);
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

        const queryResults = await testHelper.executeGraphQL(query);
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
