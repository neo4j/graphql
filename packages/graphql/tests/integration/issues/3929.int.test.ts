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

import type { Driver, Session } from "neo4j-driver";
import { graphql } from "graphql";
import Neo4jHelper from "../neo4j";
import { Neo4jGraphQL } from "../../../src";
import { UniqueType } from "../../utils/graphql-types";
import { cleanNodesUsingSession } from "../../utils/clean-nodes";
import { createBearerToken } from "../../utils/create-bearer-token";

describe("https://github.com/neo4j/graphql/issues/3929", () => {
    let driver: Driver;
    let neo4j: Neo4jHelper;
    let neoSchema: Neo4jGraphQL;
    let session: Session;
    const secret = "secret";

    let User: UniqueType;
    let Group: UniqueType;
    let Person: UniqueType;

    beforeAll(async () => {
        neo4j = new Neo4jHelper();
        driver = await neo4j.getDriver();
    });

    beforeEach(async () => {
        session = await neo4j.getSession();

        User = new UniqueType("User");
        Group = new UniqueType("Group");
        Person = new UniqueType("Person");

        const typeDefs = /* GraphQL */ `
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

        neoSchema = new Neo4jGraphQL({
            typeDefs,
            driver,
            features: {
                authorization: {
                    key: secret,
                },
            },
        });
    });

    afterEach(async () => {
        await cleanNodesUsingSession(session, [User, Group, Person]);
        await session.close();
    });

    afterAll(async () => {
        await driver.close();
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

        const createUsersResult = await graphql({
            schema: await neoSchema.getSchema(),
            source: createUsers,
            contextValue: neo4j.getContextValues({ token }),
        });

        expect(createUsersResult.errors).toBeFalsy();

        const createGroupsResult = await graphql({
            schema: await neoSchema.getSchema(),
            source: createGroups,
            contextValue: neo4j.getContextValues({ token }),
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

        const updateGroupsResult = await graphql({
            schema: await neoSchema.getSchema(),
            source: updateGroups,
            contextValue: neo4j.getContextValues({ token }),
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
