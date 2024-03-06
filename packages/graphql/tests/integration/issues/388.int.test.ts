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

import { graphql } from "graphql";
import type { Driver } from "neo4j-driver";
import { generate } from "randomstring";
import { Neo4jGraphQL } from "../../../src/classes";
import { UniqueType } from "../../utils/graphql-types";
import Neo4jHelper from "../neo4j";

describe("https://github.com/neo4j/graphql/issues/388", () => {
    let driver: Driver;
    let neo4j: Neo4jHelper;

    let Post: UniqueType;
    let User: UniqueType;
    let typeDefs: string;

    beforeAll(async () => {
        neo4j = new Neo4jHelper();
        driver = await neo4j.getDriver();
        Post = new UniqueType("Post");
        User = new UniqueType("User");

        typeDefs = `
            union Content = ${Post}
    
            type ${Post} {
                content: String!
                modifiedDate: DateTime! @timestamp(operations: [CREATE, UPDATE])
            }
    
            type ${User} {
                id: ID!
                friends: [${User}!]! @relationship(type: "HAS_FRIEND", direction: OUT)
                posts: [${Post}!]! @relationship(type: "HAS_POST", direction: OUT)
            }
    
            type Query {
                getContent(userID: ID): [Content]
                    @cypher(
                        statement: """
                        MATCH (myUser:${User} {id: $userID})
                        OPTIONAL MATCH (myUser)-[:HAS_FRIEND]->(myFriends:${User})
                        CALL {
                            WITH myUser, myFriends
                            MATCH (myUser)-[:HAS_POST]->(post:${Post})
                            RETURN post
                            UNION
                            WITH myUser, myFriends
                            MATCH (myFriends)-[:HAS_POST]->(post:${Post})
                            RETURN post
                        }
                        RETURN DISTINCT post AS result ORDER BY result.modifiedDate DESC
                        """
                        columnName: "result"
                    )
            }
        `;
    });

    afterAll(async () => {
        await driver.close();
    });

    test("should be able to alias union fields of custom cypher", async () => {
        const session = await neo4j.getSession();

        const neoSchema = new Neo4jGraphQL({ typeDefs, driver });

        const userID = generate({ charset: "alphabetic" });

        const input = [
            {
                id: userID,
                friends: {
                    create: [
                        {
                            node: {
                                id: generate({ charset: "alphabetic" }),
                                posts: {
                                    create: [
                                        {
                                            node: {
                                                content: generate({ charset: "alphabetic" }),
                                            },
                                        },
                                        {
                                            node: {
                                                content: generate({ charset: "alphabetic" }),
                                            },
                                        },
                                        {
                                            node: {
                                                content: generate({ charset: "alphabetic" }),
                                            },
                                        },
                                    ],
                                },
                            },
                        },
                        {
                            node: {
                                id: generate({ charset: "alphabetic" }),
                                posts: {
                                    create: [
                                        {
                                            node: {
                                                content: generate({ charset: "alphabetic" }),
                                            },
                                        },
                                        {
                                            node: {
                                                content: generate({ charset: "alphabetic" }),
                                            },
                                        },
                                        {
                                            node: {
                                                content: generate({ charset: "alphabetic" }),
                                            },
                                        },
                                    ],
                                },
                            },
                        },
                        {
                            node: {
                                id: generate({ charset: "alphabetic" }),
                                posts: {
                                    create: [
                                        {
                                            node: {
                                                content: generate({ charset: "alphabetic" }),
                                            },
                                        },
                                        {
                                            node: {
                                                content: generate({ charset: "alphabetic" }),
                                            },
                                        },
                                        {
                                            node: {
                                                content: generate({ charset: "alphabetic" }),
                                            },
                                        },
                                    ],
                                },
                            },
                        },
                    ],
                },
                posts: {
                    create: [
                        {
                            node: {
                                content: generate({ charset: "alphabetic" }),
                            },
                        },
                        {
                            node: {
                                content: generate({ charset: "alphabetic" }),
                            },
                        },
                        {
                            node: {
                                content: generate({ charset: "alphabetic" }),
                            },
                        },
                    ],
                },
            },
        ];

        const mutation = `
            mutation CreateUsers($input: [${User}CreateInput!]!) {
                ${User.operations.create}(input: $input) {
                    ${User.plural} {
                        id
                        friends {
                            id
                            posts {
                                content
                            }
                        }
                        posts {
                            content
                        }
                    }
                }
            }
        `;

        const query = `
            query GetContent($userID: ID) {
                getContent(userID: $userID) {
                    __typename
                    ... on ${Post} {
                        postContent: content
                    }
                }
            }
        `;

        try {
            await neoSchema.checkNeo4jCompat();

            const mutationResult = await graphql({
                schema: await neoSchema.getSchema(),
                source: mutation,
                contextValue: neo4j.getContextValues(),
                variableValues: { input },
            });

            expect(mutationResult.errors).toBeFalsy();

            expect((mutationResult?.data as any)[User.operations.create][User.plural][0].id).toEqual(userID);
            expect((mutationResult?.data as any)[User.operations.create][User.plural][0].friends).toHaveLength(3);
            expect((mutationResult?.data as any)[User.operations.create][User.plural][0].posts).toHaveLength(3);

            (mutationResult?.data as any)[User.operations.create][User.plural][0].friends.forEach((friend) => {
                expect(friend.posts).toHaveLength(3);
            });

            const queryResult = await graphql({
                schema: await neoSchema.getSchema(),
                source: query,
                contextValue: neo4j.getContextValues(),
                variableValues: {
                    userID,
                },
            });

            expect(queryResult.errors).toBeFalsy();

            expect(queryResult?.data?.getContent).toHaveLength(12);
            (queryResult?.data as any)?.getContent.forEach((content) => {
                expect(content.postContent).toBeTruthy();
            });
        } finally {
            await session.close();
        }
    });
});
