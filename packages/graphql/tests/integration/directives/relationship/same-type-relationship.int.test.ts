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

import type { UniqueType } from "../../../utils/graphql-types";
import { TestHelper } from "../../../utils/tests-helper";

describe("Same type relationship - https://github.com/neo4j/graphql/issues/3279", () => {
    const testHelper = new TestHelper();

    let Person: UniqueType;

    beforeEach(async () => {
        Person = testHelper.createUniqueType("Person");

        const typeDefs = `
            type ${Person} @node {
                name: String!
                messagesTo: [${Person}!]! @relationship(type: "MESSAGE", properties: "MessageProps", direction: OUT)
                messagesFrom: [${Person}!]! @relationship(type: "MESSAGE", properties: "MessageProps", direction: IN)
            }

            type MessageProps @relationshipProperties {
                text: String!
            }
        `;

        await testHelper.initNeo4jGraphQL({
            typeDefs,
        });
    });

    afterEach(async () => {
        await testHelper.close();
    });

    test("create multiple edges of same type", async () => {
        await testHelper.executeCypher(`
                CREATE(:${Person} {name: "Arthur"})
                CREATE(:${Person} {name: "Marvin"})
            `);

        const sendMessage = /* GraphQL */ `
            mutation SendMessageTo($from: String!, $to: String!, $text: String!) {
                ${Person.operations.update}(
                    where: { name: { eq: $from } }
                    update: {
                        messagesTo: { connect: { where: { node: { name: {eq: $to } } }, edge: { text: $text } } }
                    }
                ) {
                    info {
                        relationshipsCreated
                    }
                }
            }
        `;

        const message1 = await testHelper.executeGraphQL(sendMessage, {
            variableValues: {
                from: "Arthur",
                to: "Marvin",
                text: "Hey Marvin",
            },
        });
        const message2 = await testHelper.executeGraphQL(sendMessage, {
            variableValues: {
                from: "Marvin",
                to: "Arthur",
                text: "Life? Don't talk to me about life",
            },
        });
        const message3 = await testHelper.executeGraphQL(sendMessage, {
            variableValues: {
                from: "Arthur",
                to: "Marvin",
                text: "Don't Panic!",
            },
        });

        const result = await testHelper.executeGraphQL(/* GraphQL */ `
            query {
                ${Person.plural}(where: {name: {eq: "Arthur"}}) {
                    name
                    messagesToConnection {
                        edges {
                            properties {
                                text
                            }
                            node {
                                name
                            }
                        }
                    }
                    messagesFromConnection {
                        edges {
                            properties {
                                text
                            }
                            node {
                                name
                            }
                        }
                    }
                }
            }
        `);

        expect(message1.errors).toBeFalsy();
        expect(message2.errors).toBeFalsy();
        expect(message3.errors).toBeFalsy();

        expect(message1.data).toEqual({
            [Person.operations.update]: {
                info: {
                    relationshipsCreated: 1,
                },
            },
        });
        expect(message2.data).toEqual({
            [Person.operations.update]: {
                info: {
                    relationshipsCreated: 1,
                },
            },
        });
        expect(message3.data).toEqual({
            [Person.operations.update]: {
                info: {
                    relationshipsCreated: 1,
                },
            },
        });

        expect(result.errors).toBeFalsy();
        expect(result.data).toEqual({
            [Person.plural]: expect.toIncludeSameMembers([
                {
                    name: "Arthur",
                    messagesToConnection: {
                        edges: expect.toIncludeSameMembers([
                            {
                                properties: {
                                    text: "Hey Marvin",
                                },
                                node: {
                                    name: "Marvin",
                                },
                            },
                            {
                                properties: {
                                    text: "Don't Panic!",
                                },
                                node: {
                                    name: "Marvin",
                                },
                            },
                        ]),
                    },
                    messagesFromConnection: {
                        edges: expect.toIncludeSameMembers([
                            {
                                properties: {
                                    text: "Life? Don't talk to me about life",
                                },
                                node: {
                                    name: "Marvin",
                                },
                            },
                        ]),
                    },
                },
            ]),
        });
    });
});
