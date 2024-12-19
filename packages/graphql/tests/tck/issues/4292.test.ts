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
                OPTIONAL MATCH (this1)<-[:CREATOR_OF]-(this2:User)
                WITH *, count(this2) AS var3
                OPTIONAL MATCH (this1)-[:MEMBER_OF]->(this4:Group)
                WITH *, count(this4) AS var5
                OPTIONAL MATCH (this1)-[:MEMBER_OF]->(this6:Group)
                WITH *, count(this6) AS var7
                CALL {
                    WITH this1
                    MATCH (this1)-[:MEMBER_OF]->(this8:Group)
                    OPTIONAL MATCH (this8)<-[:CREATOR_OF]-(this9:User)
                    WITH *, count(this9) AS var10
                    WITH *
                    WHERE (var10 <> 0 AND ($jwt.uid IS NOT NULL AND this9.id = $jwt.uid))
                    RETURN count(this8) = 1 AS var11
                }
                WITH *
                WHERE apoc.util.validatePredicate(NOT ($isAuthenticated = true AND ((var3 <> 0 AND ($jwt.uid IS NOT NULL AND this2.id = $jwt.uid)) OR (var5 <> 0 AND size([(this4)<-[:ADMIN_OF]-(this13:Admin) WHERE single(this12 IN [(this13)-[:IS_USER]->(this12:User) WHERE ($jwt.uid IS NOT NULL AND this12.id = $jwt.uid) | 1] WHERE true) | 1]) > 0) OR (var7 <> 0 AND size([(this6)<-[:CONTRIBUTOR_TO]-(this15:Contributor) WHERE single(this14 IN [(this15)-[:IS_USER]->(this14:User) WHERE ($jwt.uid IS NOT NULL AND this14.id = $jwt.uid) | 1] WHERE true) | 1]) > 0) OR var11 = true)), \\"@neo4j/graphql/FORBIDDEN\\", [0])
                CALL {
                    WITH this1
                    MATCH (this1)-[this16:PARTNER_OF]-(this17:Person)
                    OPTIONAL MATCH (this17)<-[:CREATOR_OF]-(this18:User)
                    WITH *, count(this18) AS var19
                    OPTIONAL MATCH (this17)-[:MEMBER_OF]->(this20:Group)
                    WITH *, count(this20) AS var21
                    OPTIONAL MATCH (this17)-[:MEMBER_OF]->(this22:Group)
                    WITH *, count(this22) AS var23
                    OPTIONAL MATCH (this17)-[:MEMBER_OF]->(this24:Group)
                    WITH *, count(this24) AS var25
                    WITH *
                    CALL {
                        WITH this17
                        MATCH (this17)-[:MEMBER_OF]->(this26:Group)
                        OPTIONAL MATCH (this26)<-[:CREATOR_OF]-(this27:User)
                        WITH *, count(this27) AS var28
                        WITH *
                        WHERE (var28 <> 0 AND ($jwt.uid IS NOT NULL AND this27.id = $jwt.uid))
                        RETURN count(this26) = 1 AS var29
                    }
                    WITH *
                    WHERE apoc.util.validatePredicate(NOT ($isAuthenticated = true AND ((var19 <> 0 AND ($jwt.uid IS NOT NULL AND this18.id = $jwt.uid)) OR (var21 <> 0 AND size([(this20)<-[:ADMIN_OF]-(this31:Admin) WHERE single(this30 IN [(this31)-[:IS_USER]->(this30:User) WHERE ($jwt.uid IS NOT NULL AND this30.id = $jwt.uid) | 1] WHERE true) | 1]) > 0) OR (var23 <> 0 AND size([(this22)<-[:CONTRIBUTOR_TO]-(this33:Contributor) WHERE single(this32 IN [(this33)-[:IS_USER]->(this32:User) WHERE ($jwt.uid IS NOT NULL AND this32.id = $jwt.uid) | 1] WHERE true) | 1]) > 0) OR var29 = true)), \\"@neo4j/graphql/FORBIDDEN\\", [0])
                    WITH collect({ node: this17, relationship: this16 }) AS edges
                    WITH edges, size(edges) AS totalCount
                    CALL {
                        WITH edges
                        UNWIND edges AS edge
                        WITH edge.node AS this17, edge.relationship AS this16
                        RETURN collect({ properties: { active: this16.active, firstDay: this16.firstDay, lastDay: this16.lastDay, __resolveType: \\"PartnerOf\\" }, node: { __id: id(this17), __resolveType: \\"Person\\" } }) AS var34
                    }
                    RETURN { edges: var34, totalCount: totalCount } AS var35
                }
                WITH this1 { .id, .name, partnersConnection: var35 } AS this1
                RETURN collect(this1) AS var36
            }
            RETURN this { .id, .name, members: var36 } AS this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"param0\\": \\"family_id_1\\",
                \\"jwt\\": {
                    \\"roles\\": [
                        \\"admin\\"
                    ],
                    \\"id\\": \\"something\\",
                    \\"email\\": \\"something\\"
                },
                \\"isAuthenticated\\": true
            }"
        `);
    });
});
