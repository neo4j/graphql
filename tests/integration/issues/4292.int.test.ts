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

describe("https://github.com/neo4j/graphql/issues/4292", () => {
    let User: UniqueType;
    let Group: UniqueType;
    let Person: UniqueType;
    let Admin: UniqueType;
    let Contributor: UniqueType;

    const testHelper = new TestHelper();

    beforeAll(async () => {
        User = testHelper.createUniqueType("User");
        Group = testHelper.createUniqueType("Group");
        Person = testHelper.createUniqueType("Person");
        Admin = testHelper.createUniqueType("Admin");
        Contributor = testHelper.createUniqueType("Contributor");

        const typeDefs = /* GraphQL */ `
            type JWT @jwt {
                id: ID!
                email: String!
                roles: [String!]!
            }

            type ${User.name} {
                id: ID! @unique
                email: String! @unique
                name: String
                creator: [${Group.name}!]! @relationship(type: "CREATOR_OF", direction: OUT)
                admin: [${Admin.name}!]! @relationship(type: "IS_USER", direction: IN)
                contributor: [${Contributor.name}!]! @relationship(type: "IS_USER", direction: IN)
                invitations: [Invitee!]! @relationship(type: "CREATOR_OF", direction: OUT)
                roles: [String!]!
            }

            type ${Group.name} {
                id: ID! @id @unique
                name: String
                members: [${Person.name}!]! @relationship(type: "MEMBER_OF", direction: IN)
                creator: ${User.name}!
                    @relationship(type: "CREATOR_OF", direction: IN)
                    @settable(onCreate: true, onUpdate: true)
                admins: [${Admin.name}!]! @relationship(type: "ADMIN_OF", direction: IN)
                contributors: [${Contributor.name}!]! @relationship(type: "CONTRIBUTOR_TO", direction: IN)
            }

            type ${Person.name} 
                @authorization(
                    validate: [
                        {
                            operations: [CREATE]
                            where: { node: { group: { creator: { roles_INCLUDES: "plan:paid" } } } }
                        }
                        {
                            operations: [DELETE]
                            where: {
                                OR: [
                                    { node: { creator: { id: "$jwt.uid" } } }
                                    { node: { group: { admins_SOME: { user: { id: "$jwt.uid" } } } } }
                                    { node: { group: { creator: { id: "$jwt.uid" } } } }
                                ]
                            }
                        }
                        {
                            operations: [READ, UPDATE]
                            where: {
                                OR: [
                                    { node: { creator: { id: "$jwt.uid" } } }
                                    { node: { group: { admins_SOME: { user: { id: "$jwt.uid" } } } } }
                                    { node: { group: { contributors_SOME: { user: { id: "$jwt.uid" } } } } }
                                    { node: { group: { creator: { id: "$jwt.uid" } } } }
                                ]
                            }
                        }
                    ]
                ) {
                id: ID! @id @unique
                name: String!
                creator: ${User.name}!
                    @relationship(type: "CREATOR_OF", direction: IN, nestedOperations: [CONNECT])
                    @settable(onCreate: true, onUpdate: true)
                group: ${Group.name}! @relationship(type: "MEMBER_OF", direction: OUT)
                partners: [${Person.name}!]!
                    @relationship(
                        type: "PARTNER_OF"
                        queryDirection: UNDIRECTED_ONLY
                        direction: OUT
                        properties: "PartnerOf"
                    )
            }

            enum InviteeRole {
                ADMIN
                CONTRIBUTOR
            }

            enum InviteeStatus {
                INVITED
                ACCEPTED
            }

            interface Invitee {
                id: ID!
                email: String!
                name: String
                creator: ${User.name}! @declareRelationship 
                group: ${Group.name}! @declareRelationship 
                status: InviteeStatus!
                user: ${User.name} @declareRelationship 
                role: InviteeRole!
            }

            type ${Admin.name} implements Invitee {
                id: ID! @unique @id
                group: ${Group.name}! @relationship(type: "ADMIN_OF", direction: OUT)
                creator: ${User.name}! @relationship(type: "CREATOR_OF", direction: IN)
                email: String!
                name: String
                status: InviteeStatus! @default(value: INVITED)
                user: ${User.name} @relationship(type: "IS_USER", direction: OUT)
                role: InviteeRole! @default(value: ADMIN)
            }

            type ${Contributor.name} implements Invitee {
                id: ID! @unique @id
                group: ${Group.name}! @relationship(type: "CONTRIBUTOR_TO", direction: OUT)
                creator: ${User.name}! @relationship(type: "CREATOR_OF", direction: IN)
                email: String!
                name: String
                status: InviteeStatus! @default(value: INVITED)
                user: ${User.name} @relationship(type: "IS_USER", direction: OUT)
                role: InviteeRole! @default(value: CONTRIBUTOR)
            }

            type PartnerOf @relationshipProperties {
                id: ID! @id
                firstDay: Date
                lastDay: Date
                active: Boolean! @default(value: true)
            }

            type JWT @jwt {
                roles: [String!]!
            }

            type Mutation {
                sendInvite(id: ID!, role: InviteeRole!): Boolean!
            }

        `;

        await testHelper.initNeo4jGraphQL({
            typeDefs,
            features: {
                authorization: {
                    key: "secret",
                },
            },
        });

        await testHelper.executeCypher(`
                CREATE (m:${Person.name} {title: "SomeTitle", id: "person-1", name: "SomePerson"})<-[:CREATOR_OF]-(u:${User.name} { id: "user-1", email: "email-1", roles: ["admin"]})
                CREATE (g:${Group.name} { id: "family_id_1", name: "group-1" })<-[:MEMBER_OF]-(m)
                `);
    });

    afterAll(async () => {
        await testHelper.close();
    });

    test("should return groups with valid JWT", async () => {
        const query = /* GraphQL */ `
            query Groups {
                ${Group.plural}(where: { id: "family_id_1" }) {
                    id
                    name
                    members {
                        id
                        name
                        partnersConnection {
                            edges {
                               properties {
                                    active
                                    firstDay
                                    lastDay
                               }
                            }
                        }
                    }
                }
            }
        `;

        const response = await testHelper.executeGraphQL(query, {
            contextValue: {
                jwt: { uid: "user-1", email: "some-email", roles: ["admin"] },
            },
        });

        expect(response.errors).toBeFalsy();
        expect(response.data?.[Group.plural]).toStrictEqual(
            expect.arrayContaining([
                expect.objectContaining({
                    id: "family_id_1",
                    name: "group-1",
                    members: [expect.objectContaining({ id: "person-1", name: "SomePerson" })],
                }),
            ])
        );
    });

    test("should raise Forbidden with invalid JWT", async () => {
        const query = /* GraphQL */ `
            query Groups {
                ${Group.plural}(where: { id: "family_id_1" }) {
                    id
                    name
                    members {
                        id
                        name
                        partnersConnection {
                            edges {
                               properties {
                                    active
                                    firstDay
                                    lastDay
                               }
                            }
                        }
                    }
                }
            }
        `;

        const response = await testHelper.executeGraphQL(query, {
            contextValue: { jwt: { uid: "not-user-1", email: "some-email", roles: ["admin"] } },
        });
        expect(response.errors?.[0]?.message).toContain("Forbidden");
    });
});
