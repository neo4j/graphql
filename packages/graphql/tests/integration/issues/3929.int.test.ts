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

import { createBearerToken } from "../../utils/create-bearer-token";
import type { UniqueType } from "../../utils/graphql-types";
import { TestHelper } from "../../utils/tests-helper";

describe("https://github.com/neo4j/graphql/issues/3929", () => {
    const testHelper = new TestHelper();

    const secret = "secret";

    let User: UniqueType;
    let Group: UniqueType;
    let Person: UniqueType;

    beforeEach(async () => {
        User = testHelper.createUniqueType("User");
        Group = testHelper.createUniqueType("Group");
        Person = testHelper.createUniqueType("Person");

        const typeDefs = `
            type JWT @jwt {
                uid: String!
            }

            type ${User} @authorization(filter: [{ where: { node: { id: "$jwt.uid" } } }]) {
                id: ID! @unique
                email: String!
                name: String
            }

            type ${Group} @authorization(validate: [{ where: { node: { creator: { id: "$jwt.uid" } } } }]) {
                id: ID! @id @unique
                name: String
                members: [${Person}!]! @relationship(type: "MEMBER_OF", direction: IN)
                creator: ${User}! @relationship(type: "CREATOR_OF", direction: IN, nestedOperations: [CONNECT])
            }

            type ${Person} @authorization(validate: [{ where: { node: { creator: { id: "$jwt.uid" }}}}]) {
                id: ID! @id @unique
                name: String!
                creator: ${User}! @relationship(type: "CREATOR_OF", direction: IN)
                group: ${Group}! @relationship(type: "MEMBER_OF", direction: OUT)
            }

            extend schema @authentication
        `;

        await testHelper.initNeo4jGraphQL({
            typeDefs,
            features: {
                authorization: {
                    key: secret,
                },
            },
        });
    });

    afterEach(async () => {
        await testHelper.close();
    });

    test("should not raise cardinality error when deleting on update", async () => {
        const createUsers = /* GraphQL */ `
            mutation {
                ${User.operations.create}(input: [{ id: "user1_id", email: "user1_id@email.com" }]) {
                    ${User.plural} {
                        id
                    }
                }
            }
        `;

        const createGroups = /* GraphQL */ `
            mutation CreateGroups($input: [${Group}CreateInput!]!) {
                ${Group.operations.create}(input: $input) {
                    ${Group.plural} {
                        id
                        name
                        members {
                            id
                            name
                        }
                    }
                }
            }
        `;

        const updateGroups = /* GraphQL */ `
            mutation UpdateGroups($where: ${Group}Where, $delete: ${Group}DeleteInput) {
                ${Group.operations.update}(where: $where, delete: $delete) {
                    info {
                        nodesDeleted
                        relationshipsDeleted
                    }
                }
            }
        `;

        const token = createBearerToken(secret, { uid: "user1_id" });

        const createUsersResult = await testHelper.executeGraphQLWithToken(createUsers, token);

        expect(createUsersResult.errors).toBeFalsy();

        const createGroupsResult = await testHelper.executeGraphQLWithToken(createGroups, token, {
            variableValues: {
                input: [
                    {
                        name: "Group 1",
                        creator: {
                            connect: {
                                where: {
                                    node: {
                                        id: "user1_id",
                                    },
                                },
                            },
                        },
                        members: {
                            create: [
                                {
                                    node: {
                                        name: "Member 1",
                                        creator: {
                                            connect: {
                                                where: {
                                                    node: {
                                                        id: "user1_id",
                                                    },
                                                },
                                                overwrite: true,
                                            },
                                        },
                                    },
                                },
                            ],
                        },
                    },
                ],
            },
        });

        expect(createGroupsResult.errors).toBeFalsy();

        const updateGroupsResult = await testHelper.executeGraphQLWithToken(updateGroups, token, {
            variableValues: {
                where: {
                    name: "Group 1",
                },
                delete: {
                    members: [
                        {
                            where: {
                                node: {
                                    name: "Member 1",
                                },
                            },
                        },
                    ],
                },
            },
        });

        expect(updateGroupsResult.errors).toBeFalsy();
        // Before the fix, the Mutation was actually deleting two nodes incorrectly
        expect(updateGroupsResult.data).toEqual({
            [Group.operations.update]: {
                info: {
                    nodesDeleted: 1,
                    relationshipsDeleted: 2,
                },
            },
        });
    });
});
