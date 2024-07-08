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

import type { DocumentNode } from "graphql";
import { gql } from "graphql-tag";
import type { UniqueType } from "../../../utils/graphql-types";
import { TestHelper } from "../../../utils/tests-helper";

describe("https://github.com/neo4j/graphql/issues/190", () => {
    let User: UniqueType;
    let UserDemographics: UniqueType;
    let typeDefs: DocumentNode;

    const testHelper = new TestHelper({ v6Api: true });

    beforeAll(async () => {
        User = testHelper.createUniqueType("User");
        UserDemographics = testHelper.createUniqueType("UserDemographics");

        typeDefs = gql`
        type ${User} @node {
            client_id: String
            uid: String
            demographics: [${UserDemographics}!]! @relationship(type: "HAS_DEMOGRAPHIC", direction: OUT)
        }

        type ${UserDemographics} @node {
            client_id: String
            type: String
            value: String
            users: [${User}!]! @relationship(type: "HAS_DEMOGRAPHIC", direction: IN)
        }
    `;

        await testHelper.executeCypher(`
                    CREATE (user1:${User} {uid: 'user1'}),(user2:${User} {uid: 'user2'}),(female:${UserDemographics}{type:'Gender',value:'Female'}),(male:${UserDemographics}{type:'Gender',value:'Male'}),(age:${UserDemographics}{type:'Age',value:'50+'}),(state:${UserDemographics}{type:'State',value:'VIC'})
                    CREATE (user1)-[:HAS_DEMOGRAPHIC]->(female)
                    CREATE (user2)-[:HAS_DEMOGRAPHIC]->(male)
                    CREATE (user1)-[:HAS_DEMOGRAPHIC]->(age)
                    CREATE (user2)-[:HAS_DEMOGRAPHIC]->(age)
                    CREATE (user1)-[:HAS_DEMOGRAPHIC]->(state)
                    CREATE (user2)-[:HAS_DEMOGRAPHIC]->(state)
                `);
        await testHelper.initNeo4jGraphQL({ typeDefs });
    });

    afterAll(async () => {
        await testHelper.close();
    });

    test("Example 1", async () => {
        const query = /* GraphQL */ `
            query {
                ${User.plural}(where: { edges: { node: { demographics: { edges: { some: {node: { type: { equals: "Gender" }, value: { equals: "Female" } } } } } } } }) {
                    connection {
                        edges {
                            node {
                                uid
                                demographics {
                                    connection {
                                        edges {
                                            node {
                                                type
                                                value
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

        const result = await testHelper.executeGraphQL(query);

        expect(result.errors).toBeFalsy();

        expect(result).toEqual({
            data: {
                [User.plural]: {
                    connection: {
                        edges: [
                            {
                                node: {
                                    uid: "user1",
                                    demographics: {
                                        connection: {
                                            edges: expect.toIncludeSameMembers([
                                                {
                                                    node: {
                                                        type: "State",
                                                        value: "VIC",
                                                    },
                                                },
                                                {
                                                    node: {
                                                        type: "Age",
                                                        value: "50+",
                                                    },
                                                },
                                                {
                                                    node: {
                                                        type: "Gender",
                                                        value: "Female",
                                                    },
                                                },
                                            ]),
                                        },
                                    },
                                },
                            },
                        ],
                    },
                },
            },
        });
    });

    test("Example 2", async () => {
        const query = /* GraphQL */ `
            query {
                ${User.plural} (
                    where: {
                        edges: {
                            node: {
                                demographics: {
                                    edges: {
                                        some: {
                                            node: {
                                                OR: [{ type: {equals: "Gender"}, value:{equals:  "Female"} }, { type: {equals: "State"} }, { type: {equals: "Age"} }]
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    }
                ) {
                    connection {
                        edges {
                            node {
                                uid
                                demographics {
                                    connection {
                                        edges {
                                            node {
                                                type
                                                value
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

        const result = await testHelper.executeGraphQL(query);

        expect(result.errors).toBeFalsy();
        expect(result).toEqual({
            data: {
                [User.plural]: {
                    connection: {
                        edges: expect.toIncludeSameMembers([
                            {
                                node: {
                                    uid: "user1",
                                    demographics: {
                                        connection: {
                                            edges: expect.toIncludeSameMembers([
                                                {
                                                    node: {
                                                        type: "State",
                                                        value: "VIC",
                                                    },
                                                },
                                                {
                                                    node: {
                                                        type: "Age",
                                                        value: "50+",
                                                    },
                                                },
                                                {
                                                    node: {
                                                        type: "Gender",
                                                        value: "Female",
                                                    },
                                                },
                                            ]),
                                        },
                                    },
                                },
                            },
                            {
                                node: {
                                    uid: "user2",
                                    demographics: {
                                        connection: {
                                            edges: expect.toIncludeSameMembers([
                                                {
                                                    node: {
                                                        type: "State",
                                                        value: "VIC",
                                                    },
                                                },
                                                {
                                                    node: {
                                                        type: "Age",
                                                        value: "50+",
                                                    },
                                                },
                                                {
                                                    node: {
                                                        type: "Gender",
                                                        value: "Male",
                                                    },
                                                },
                                            ]),
                                        },
                                    },
                                },
                            },
                        ]),
                    },
                },
            },
        });
    });
});
