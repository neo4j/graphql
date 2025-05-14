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

import { Neo4jGraphQL } from "../../../src";
import { createBearerToken } from "../../utils/create-bearer-token";
import { formatCypher, formatParams, translateQuery } from "../utils/tck-test-utils";

describe("https://github.com/neo4j/graphql/issues/4292", () => {
    test("authorization subqueries should be wrapped in a Cypher.CALL", async () => {
        const typeDefs = /* GraphQL */ `
            type User {
                id: ID! @unique
                email: String! @unique
                name: String
                creator: [Group!]! @relationship(type: "CREATOR_OF", direction: OUT)
                admin: [Admin!]! @relationship(type: "IS_USER", direction: IN)
                contributor: [Contributor!]! @relationship(type: "IS_USER", direction: IN)
                invitations: [Invitee!]! @relationship(type: "CREATOR_OF", direction: OUT)
                roles: [String!]!
            }

            type Group {
                id: ID! @id @unique
                name: String
                members: [Person!]! @relationship(type: "MEMBER_OF", direction: IN)
                creator: User!
                    @relationship(type: "CREATOR_OF", direction: IN)
                    @settable(onCreate: true, onUpdate: true)

                admins: [Admin!]! @relationship(type: "ADMIN_OF", direction: IN)
                contributors: [Contributor!]! @relationship(type: "CONTRIBUTOR_TO", direction: IN)
            }

            type Person
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
                creator: User!
                    @relationship(type: "CREATOR_OF", direction: IN, nestedOperations: [CONNECT])
                    @settable(onCreate: true, onUpdate: true)
                group: Group! @relationship(type: "MEMBER_OF", direction: OUT)
                partners: [Person!]!
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
                creator: User! @declareRelationship
                group: Group! @declareRelationship
                status: InviteeStatus!
                user: User @declareRelationship
                role: InviteeRole!
            }

            type Admin implements Invitee {
                id: ID! @unique @id
                group: Group! @relationship(type: "ADMIN_OF", direction: OUT)
                creator: User! @relationship(type: "CREATOR_OF", direction: IN)
                email: String!
                name: String
                status: InviteeStatus! @default(value: INVITED)
                user: User @relationship(type: "IS_USER", direction: OUT)
                role: InviteeRole! @default(value: ADMIN)
            }

            type Contributor implements Invitee {
                id: ID! @unique @id
                group: Group! @relationship(type: "CONTRIBUTOR_TO", direction: OUT)
                creator: User! @relationship(type: "CREATOR_OF", direction: IN)
                email: String!
                name: String
                status: InviteeStatus! @default(value: INVITED)
                user: User @relationship(type: "IS_USER", direction: OUT)
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

            extend schema @authentication
        `;

        const neoSchema = new Neo4jGraphQL({ typeDefs, features: { authorization: { key: "secret" } } });

        const query = /* GraphQL */ `
            query Groups {
                groups(where: { id: "family_id_1" }) {
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

        const token = createBearerToken("secret", { roles: ["admin"], id: "something", email: "something" });
        const result = await translateQuery(neoSchema, query, { token });

        expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
            "MATCH (this:Group)
            WHERE this.id = $param0
            CALL {
                WITH this
                MATCH (this)<-[this0:MEMBER_OF]-(this1:Person)
                WITH *
                WHERE apoc.util.validatePredicate(NOT ($isAuthenticated = true AND (size([(this1)<-[:CREATOR_OF]-(this2:User) WHERE ($jwt.uid IS NOT NULL AND this2.id = $jwt.uid) | 1]) > 0 OR size([(this1)-[:MEMBER_OF]->(this5:Group) WHERE size([(this5)<-[:ADMIN_OF]-(this4:Admin) WHERE single(this3 IN [(this4)-[:IS_USER]->(this3:User) WHERE ($jwt.uid IS NOT NULL AND this3.id = $jwt.uid) | 1] WHERE true) | 1]) > 0 | 1]) > 0 OR size([(this1)-[:MEMBER_OF]->(this8:Group) WHERE size([(this8)<-[:CONTRIBUTOR_TO]-(this7:Contributor) WHERE single(this6 IN [(this7)-[:IS_USER]->(this6:User) WHERE ($jwt.uid IS NOT NULL AND this6.id = $jwt.uid) | 1] WHERE true) | 1]) > 0 | 1]) > 0 OR size([(this1)-[:MEMBER_OF]->(this10:Group) WHERE size([(this10)<-[:CREATOR_OF]-(this9:User) WHERE ($jwt.uid IS NOT NULL AND this9.id = $jwt.uid) | 1]) > 0 | 1]) > 0)), \\"@neo4j/graphql/FORBIDDEN\\", [0])
                CALL {
                    WITH this1
                    MATCH (this1)-[this11:PARTNER_OF]-(this12:Person)
                    WHERE apoc.util.validatePredicate(NOT ($isAuthenticated = true AND (size([(this12)<-[:CREATOR_OF]-(this13:User) WHERE ($jwt.uid IS NOT NULL AND this13.id = $jwt.uid) | 1]) > 0 OR size([(this12)-[:MEMBER_OF]->(this16:Group) WHERE size([(this16)<-[:ADMIN_OF]-(this15:Admin) WHERE single(this14 IN [(this15)-[:IS_USER]->(this14:User) WHERE ($jwt.uid IS NOT NULL AND this14.id = $jwt.uid) | 1] WHERE true) | 1]) > 0 | 1]) > 0 OR size([(this12)-[:MEMBER_OF]->(this19:Group) WHERE size([(this19)<-[:CONTRIBUTOR_TO]-(this18:Contributor) WHERE single(this17 IN [(this18)-[:IS_USER]->(this17:User) WHERE ($jwt.uid IS NOT NULL AND this17.id = $jwt.uid) | 1] WHERE true) | 1]) > 0 | 1]) > 0 OR size([(this12)-[:MEMBER_OF]->(this21:Group) WHERE size([(this21)<-[:CREATOR_OF]-(this20:User) WHERE ($jwt.uid IS NOT NULL AND this20.id = $jwt.uid) | 1]) > 0 | 1]) > 0)), \\"@neo4j/graphql/FORBIDDEN\\", [0])
                    WITH collect({ node: this12, relationship: this11 }) AS edges
                    WITH edges, size(edges) AS totalCount
                    CALL {
                        WITH edges
                        UNWIND edges AS edge
                        WITH edge.node AS this12, edge.relationship AS this11
                        RETURN collect({ properties: { active: this11.active, firstDay: this11.firstDay, lastDay: this11.lastDay, __resolveType: \\"PartnerOf\\" }, node: { __id: id(this12), __resolveType: \\"Person\\" } }) AS var22
                    }
                    RETURN { edges: var22, totalCount: totalCount } AS var23
                }
                WITH this1 { .id, .name, partnersConnection: var23 } AS this1
                RETURN collect(this1) AS var24
            }
            RETURN this { .id, .name, members: var24 } AS this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"param0\\": \\"family_id_1\\",
                \\"isAuthenticated\\": true,
                \\"jwt\\": {
                    \\"roles\\": [
                        \\"admin\\"
                    ],
                    \\"id\\": \\"something\\",
                    \\"email\\": \\"something\\"
                }
            }"
        `);
    });
});
