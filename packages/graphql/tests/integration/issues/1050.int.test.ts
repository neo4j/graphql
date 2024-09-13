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

import { gql } from "graphql-tag";
import type { UniqueType } from "../../utils/graphql-types";
import { TestHelper } from "../../utils/tests-helper";

describe("https://github.com/neo4j/graphql/issues/1050", () => {
    let testUser: UniqueType;
    let testInbox: UniqueType;
    let testMessage: UniqueType;
    let testAttachment: UniqueType;

    const testHelper = new TestHelper();

    beforeEach(async () => {
        testUser = testHelper.createUniqueType("User");
        testInbox = testHelper.createUniqueType("Inbox");
        testMessage = testHelper.createUniqueType("Message");
        testAttachment = testHelper.createUniqueType("Attachment");

        const typeDefs = gql`
            type ${testUser.name} {
                id: String
                inboxes: [${testInbox.name}!]! @relationship(type: "OWNS", direction: OUT)
            }

            type ${testInbox.name} {
                ownerId: String
                messages: [${testMessage.name}!]! @relationship(type: "CONTAINS", direction: OUT)
            }

            type ${testMessage.name} {
                ownerId: String
                attachments: [${testAttachment.name}!]! @relationship(type: "ATTACHED_TO", direction: IN)
            }

            type ${testAttachment.name} {
                ownerId: String
                contents: String
            }

            extend type ${testUser.name} @authorization(
                validate: [
                    {
                        operations: [READ],
                        when: [BEFORE],
                        where: { node: { id: "$context.user.id" } }
                    }
                ]
            )

            extend type ${testInbox.name} @authorization(
                validate: [
                    {
                        operations: [READ],
                        when: [BEFORE],
                        where: { node: { ownerId: "$context.user.id" } }
                    }
                ]
            )

            extend type ${testMessage.name} @authorization(
                validate: [
                    {
                        operations: [READ],
                        when: [BEFORE],
                        where: { node: { ownerId: "$context.user.id" } }
                    }
                ]
            )

            extend type ${testAttachment.name} @authorization(
                validate: [
                    {
                        operations: [READ],
                        when: [BEFORE],
                        where: { node: { ownerId: "$context.user.id" } }
                    }
                ]
            )
        `;
        await testHelper.initNeo4jGraphQL({
            typeDefs,
            features: { authorization: { key: "secret" } },
        });
    });

    afterEach(async () => {
        await testHelper.close();
    });

    test("should handle auth appropriately for nested connection", async () => {
        await testHelper.executeCypher(`
          CREATE (c:${testUser.name} {id: 'abc'})
            -[:OWNS]->(i:${testInbox.name} {ownerId: 'abc'})
            -[:CONTAINS]->(m:${testMessage.name} {ownerId: 'abc', subject: 'Hello', body: 'World'})
            <-[:ATTACHED_TO]-(a:${testAttachment.name} {ownerId: 'abc', contents: 'something interesting'})
        `);

        const query = /* GraphQL */ `
            query {
                ${testUser.plural} {
                    inboxes {
                        messagesConnection {
                            edges {
                                node {
                                    attachments {
                                        contents
                                    }
                                }
                            }
                        }
                    }
                }
            }
        `;

        const result = await testHelper.executeGraphQL(query, {
            contextValue: {
                token: testHelper.createBearerToken("secret"),
                user: {
                    id: "abc",
                },
            },
        });
        expect(result.errors).toBeUndefined();
        expect(result.data as any).toEqual({
            [testUser.plural]: [
                {
                    inboxes: [
                        {
                            messagesConnection: {
                                edges: [
                                    {
                                        node: {
                                            attachments: [
                                                {
                                                    contents: "something interesting",
                                                },
                                            ],
                                        },
                                    },
                                ],
                            },
                        },
                    ],
                },
            ],
        });
    });
});
