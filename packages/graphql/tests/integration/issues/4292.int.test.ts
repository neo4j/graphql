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
import { Neo4jGraphQL } from "../../../src/classes";
import { cleanNodesUsingSession } from "../../utils/clean-nodes";
import { UniqueType } from "../../utils/graphql-types";
import Neo4jHelper from "../neo4j";

describe("https://github.com/neo4j/graphql/issues/4292", () => {
    let driver: Driver;
    let neo4j: Neo4jHelper;
    let neo4jGraphql: Neo4jGraphQL;
    const User = new UniqueType("User");
    const Group = new UniqueType("Group");
    const Person = new UniqueType("Person");
    const Admin = new UniqueType("Admin");
    const Contributor = new UniqueType("Contributor");

    beforeAll(async () => {
        neo4j = new Neo4jHelper();
        driver = await neo4j.getDriver();
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
        neo4jGraphql = new Neo4jGraphQL({
            typeDefs,
            driver,
            features: {
                authorization: {
                    key: "secret",
                },
            },
        });

        const session = await neo4j.getSession();
        try {
            await session.run(
                `
                CREATE (m:${Person.name} {title: "SomeTitle", id: "person-1", name: "SomePerson"})<-[:CREATOR_OF]-(u:${User.name} { id: "user-1", email: "email-1", roles: ["admin"]})
                CREATE (g:${Group.name} { id: "family_id_1", name: "group-1" })<-[:MEMBER_OF]-(m)
                `,
                {}
            );
        } finally {
            await session.close();
        }
    });

    afterAll(async () => {
        const session = await neo4j.getSession();
        try {
            await cleanNodesUsingSession(session, [User.name, Group.name, Person.name, Admin.name, Contributor.name]);
        } finally {
            await session.close();
        }
        await driver.close();
    });

    test("should return groups with valid JWT", async () => {
        const schema = await neo4jGraphql.getSchema();

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

        const response = await graphql({
            schema,
            source: query,
            contextValue: neo4j.getContextValues({ jwt: { uid: "user-1", email: "some-email", roles: ["admin"] } }),
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
        const schema = await neo4jGraphql.getSchema();

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

        const response = await graphql({
            schema,
            source: query,
            contextValue: neo4j.getContextValues({ jwt: { uid: "not-user-1", email: "some-email", roles: ["admin"] } }),
        });
        expect(response.errors?.[0]?.message).toContain("Forbidden");
    });
});
