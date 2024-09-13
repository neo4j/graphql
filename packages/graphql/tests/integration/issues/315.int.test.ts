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

describe("https://github.com/neo4j/graphql/issues/315", () => {
    const testHelper = new TestHelper();
    let typeDefs: string;

    let Post: UniqueType;
    let User: UniqueType;

    beforeAll(() => {
        Post = testHelper.createUniqueType("Post");
        User = testHelper.createUniqueType("User");
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
        await testHelper.close();
    });

    test("multiple entries are returned for custom cypher", async () => {
        const neoSchema = await testHelper.initNeo4jGraphQL({ typeDefs });

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
                        content
                    }
                }
            }
        `;

        await neoSchema.checkNeo4jCompat();

        const mutationResult = await testHelper.executeGraphQL(mutation, {
            variableValues: { input },
        });

        expect(mutationResult.errors).toBeFalsy();

        expect((mutationResult?.data as any)[User.operations.create][User.plural][0].id).toEqual(userID);
        expect((mutationResult?.data as any)[User.operations.create][User.plural][0].friends).toHaveLength(3);
        expect((mutationResult?.data as any)[User.operations.create][User.plural][0].posts).toHaveLength(3);

        (mutationResult?.data as any)[User.operations.create][User.plural][0].friends.forEach((friend) => {
            expect(friend.posts).toHaveLength(3);
        });

        const queryResult = await testHelper.executeGraphQL(query, {
            variableValues: {
                userID,
            },
        });

        expect(queryResult.errors).toBeFalsy();

        expect(queryResult?.data?.getContent).toHaveLength(12);
    });
});
