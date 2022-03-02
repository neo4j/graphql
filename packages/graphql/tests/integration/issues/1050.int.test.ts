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
import { Driver, Session } from "neo4j-driver";
import { gql } from "apollo-server";
import neo4j from "../neo4j";
import { getQuerySource } from "../../utils/get-query-source";
import { generateUniqueType } from "../../utils/graphql-types";
import { Neo4jGraphQL } from "../../../src";

describe("https://github.com/neo4j/graphql/issues/1050", () => {
    const testUser = generateUniqueType("User");
    const testInbox = generateUniqueType("Inbox");
    const testMessage = generateUniqueType("Message");
    const testAttachment = generateUniqueType("Attachment");

    let schema: GraphQLSchema;
    let driver: Driver;
    let session: Session;

    beforeAll(async () => {
        driver = await neo4j();

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

            extend type ${testUser.name} @auth(
                rules: [
                    {
                        operations: [READ],
                        allow: { id: "$context.user.id" },
                    }
                ]
            )

            extend type ${testInbox.name} @auth(
                rules: [
                    {
                        operations: [READ],
                        allow: { ownerId: "$context.user.id" },
                    }
                ]
            )

            extend type ${testMessage.name} @auth(
                rules: [
                    {
                        operations: [READ],
                        allow: { ownerId: "$context.user.id" },
                    }
                ]
            )

            extend type ${testAttachment.name} @auth(
                rules: [
                    {
                        operations: [READ],
                        allow: { ownerId: "$context.user.id" },
                    }
                ]
            )
        `;
        const neoGraphql = new Neo4jGraphQL({ typeDefs, driver });
        schema = await neoGraphql.getSchema();
    });

    beforeEach(() => {
        session = driver.session();
    });

    afterEach(async () => {
        const labelMatches = [testUser, testInbox, testMessage, testAttachment]
            .map((testNodeType) => `n:${testNodeType.name}`)
            .join(" OR ");
        await session.run(`MATCH (n) WHERE ${labelMatches} DETACH DELETE n`);

        await session.close();
    });

    afterAll(async () => {
        await driver.close();
    });

    test("should handle auth appropriately for nested connection", async () => {
        await session.run(`
          CREATE (c:${testUser.name} {id: 'abc'})
            -[:OWNS]->(i:${testInbox.name} {ownerId: 'abc'})
            -[:CONTAINS]->(m:${testMessage.name} {ownerId: 'abc', subject: 'Hello', body: 'World'})
            <-[:ATTACHED_TO]-(a:${testAttachment.name} {ownerId: 'abc', contents: 'something interesting'})
        `);

        const query = gql`
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

        const result = await graphql({
            schema,
            source: getQuerySource(query),
            contextValue: {
                driver,
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
