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
import type { Driver, Session } from "neo4j-driver";
import { Neo4jGraphQL } from "../../../src";
import { cleanNodes } from "../../utils/clean-nodes";
import { createBearerToken } from "../../utils/create-bearer-token";
import { UniqueType } from "../../utils/graphql-types";
import Neo4jHelper from "../neo4j";

describe("https://github.com/neo4j/graphql/issues/3938", () => {
    let driver: Driver;
    let neo4j: Neo4jHelper;
    let neoSchema: Neo4jGraphQL;
    let session: Session;
    const secret = "secret";

    let Group: UniqueType;
    let Invitee: UniqueType;

    beforeAll(async () => {
        neo4j = new Neo4jHelper();
        driver = await neo4j.getDriver();
    });

    beforeEach(async () => {
        session = await neo4j.getSession();

        Group = new UniqueType("Group");
        Invitee = new UniqueType("Invitee");

        const typeDefs = /* GraphQL */ `
            type ${Group} {
                id: ID! @id @unique
                name: String!
                invitees: [${Invitee}!]! @relationship(type: "INVITED_TO", direction: IN, aggregate: true)
            }

            enum InviteeStatus {
                PENDING
                ACCEPTED
            }

            type ${Invitee}
                @authorization(
                    validate: [
                        { operations: [CREATE], where: { node: { group: { inviteesAggregate: { count_LT: 5 } } } } }
                    ]
                ) {
                id: ID! @id @unique
                group: ${Group}! @relationship(type: "INVITED_TO", direction: OUT)
                email: String!
                status: InviteeStatus! @default(value: PENDING)
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
        await cleanNodes(driver, [Group, Invitee]);
        await session.close();
    });

    afterAll(async () => {
        await driver.close();
    });

    test("should not raise variable already declared error", async () => {
        const createGroups = /* GraphQL */ `
            mutation CreateGroups($input: [${Group}CreateInput!]!) {
                ${Group.operations.create}(input: $input) {
                    info {
                        nodesCreated
                    }
                }
            }
        `;

        const updateGroups = /* GraphQL */ `
            mutation UpdateGroups($create: ${Group}RelationInput, $where: ${Group}Where) {
                ${Group.operations.update}(create: $create, where: $where) {
                    ${Group.plural} {
                        invitees {
                            email
                        }
                    }
                }
            }
        `;

        const token = createBearerToken(secret, {});

        const createGroupsResult = await graphql({
            schema: await neoSchema.getSchema(),
            source: createGroups,
            contextValue: neo4j.getContextValues({ token }),
            variableValues: { input: [{ name: "test" }] },
        });

        expect(createGroupsResult.errors).toBeFalsy();

        const updateGroupsResult = await graphql({
            schema: await neoSchema.getSchema(),
            source: updateGroups,
            contextValue: neo4j.getContextValues({ token }),
            variableValues: {
                where: {
                    name: "test",
                },
                create: {
                    invitees: [
                        {
                            node: {
                                email: "test@test.com",
                                group: {
                                    connect: {
                                        where: {
                                            node: {
                                                id: "insert_group_id_here",
                                            },
                                        },
                                    },
                                },
                            },
                        },
                    ],
                },
            },
        });

        expect(updateGroupsResult.errors).toBeFalsy();
        expect(updateGroupsResult.data).toEqual({
            [Group.operations.update]: {
                [Group.plural]: [
                    {
                        invitees: [{ email: "test@test.com" }],
                    },
                ],
            },
        });
    });
});
