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

import type { UniqueType } from "../../utils/graphql-types";
import { TestHelper } from "../../utils/tests-helper";

describe("https://github.com/neo4j/graphql/issues/6797", () => {
    const testHelper = new TestHelper();
    let typeDefs: string;
    const secret = "sssh";

    let Group: UniqueType;
    let Invitee: UniqueType;

    beforeAll(async () => {
        Group = testHelper.createUniqueType("Group");
        Invitee = testHelper.createUniqueType("Invitee");

        typeDefs = /* GraphQL */ `
            type ${Group} @node {
                id: ID! @id
                name: String!
                invitees: [${Invitee}!]! @relationship(type: "INVITED_TO", direction: IN, aggregate: true)
            }

            enum InviteeStatus {
                PENDING
                ACCEPTED
            }

            type ${Invitee}
                @node
                @authorization(
                    validate: [
                        {
                            operations: [CREATE]
                            where: { node: { group_ALL: { inviteesAggregate: { count_LT: 5 } } } }
                        }
                    ]
                ) {
                id: ID! @id
                group: [${Group}!]! @relationship(type: "INVITED_TO", direction: OUT)
                email: String!
                status: InviteeStatus! @default(value: PENDING)
            }
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

    afterAll(async () => {
        await testHelper.close();
    });

    test("create and connect invitees to groups", async () => {
        await testHelper.executeCypher(`
            CREATE (:${Group} { id: "an-id", name: "groupymcgroupface" });
        `);

        const mutation = /* GraphQL */ `
            mutation {
                ${Group.operations.create}(
                    input: [
                        {
                            name: "My Name"
                            invitees: {
                                create: [
                                    {
                                        node: {
                                            email: "an email"
                                            group: { connect: [{ where: { node: { id_EQ: "an-id" } } }] }
                                        }
                                    }
                                ]
                            }
                        }
                    ]
                ) {
                    ${Group.plural} {
                        invitees {
                            email
                            group {
                                id
                            }
                        }
                    }
                }
            }
        `;

        const token = testHelper.createBearerToken(secret);
        const queryResult = await testHelper.executeGraphQLWithToken(mutation, token);

        expect(queryResult.errors).toBeUndefined();
        expect(queryResult.data).toEqual({
            [Group.operations.create]: {
                [Group.plural]: [
                    {
                        invitees: [
                            {
                                email: "an email",
                                group: expect.toIncludeSameMembers([
                                    {
                                        id: "an-id",
                                    },
                                    {
                                        id: expect.toBeString(),
                                    },
                                ]),
                            },
                        ],
                    },
                ],
            },
        });

        await testHelper.expectRelationship(Invitee, Group, "INVITED_TO").count(2);
    });
});
