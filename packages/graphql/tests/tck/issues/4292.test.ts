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

import gql from "graphql-tag";
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
                WITH *, count(this2) AS creatorCount
                OPTIONAL MATCH (this1)-[:MEMBER_OF]->(this3:Group)
                WITH *, count(this3) AS groupCount
                OPTIONAL MATCH (this1)-[:MEMBER_OF]->(this4:Group)
                WITH *, count(this4) AS groupCount
                CALL {
                    WITH this1
                    MATCH (this1)-[:MEMBER_OF]->(this5:Group)
                    OPTIONAL MATCH (this5)<-[:CREATOR_OF]-(this6:User)
                    WITH *, count(this6) AS creatorCount
                    WITH *
                    WHERE (creatorCount <> 0 AND ($jwt.uid IS NOT NULL AND this6.id = $jwt.uid))
                    RETURN count(this5) = 1 AS var7
                }
                WITH *
                WHERE apoc.util.validatePredicate(NOT ($isAuthenticated = true AND ((creatorCount <> 0 AND ($jwt.uid IS NOT NULL AND this2.id = $jwt.uid)) OR (groupCount <> 0 AND size([(this3)<-[:ADMIN_OF]-(this9:Admin) WHERE single(this8 IN [(this9)-[:IS_USER]->(this8:User) WHERE ($jwt.uid IS NOT NULL AND this8.id = $jwt.uid) | 1] WHERE true) | 1]) > 0) OR (groupCount <> 0 AND size([(this4)<-[:CONTRIBUTOR_TO]-(this11:Contributor) WHERE single(this10 IN [(this11)-[:IS_USER]->(this10:User) WHERE ($jwt.uid IS NOT NULL AND this10.id = $jwt.uid) | 1] WHERE true) | 1]) > 0) OR var7 = true)), \\"@neo4j/graphql/FORBIDDEN\\", [0])
                CALL {
                    WITH this1
                    MATCH (this1)-[this12:PARTNER_OF]-(this13:Person)
                    OPTIONAL MATCH (this13)<-[:CREATOR_OF]-(this14:User)
                    WITH *, count(this14) AS creatorCount
                    OPTIONAL MATCH (this13)-[:MEMBER_OF]->(this15:Group)
                    WITH *, count(this15) AS groupCount
                    OPTIONAL MATCH (this13)-[:MEMBER_OF]->(this16:Group)
                    WITH *, count(this16) AS groupCount
                    OPTIONAL MATCH (this13)-[:MEMBER_OF]->(this17:Group)
                    WITH *, count(this17) AS groupCount
                    WITH *
                    CALL {
                        WITH this13
                        MATCH (this13)-[:MEMBER_OF]->(this18:Group)
                        OPTIONAL MATCH (this18)<-[:CREATOR_OF]-(this19:User)
                        WITH *, count(this19) AS creatorCount
                        WITH *
                        WHERE (creatorCount <> 0 AND ($jwt.uid IS NOT NULL AND this19.id = $jwt.uid))
                        RETURN count(this18) = 1 AS var20
                    }
                    WITH *
                    WHERE apoc.util.validatePredicate(NOT ($isAuthenticated = true AND ((creatorCount <> 0 AND ($jwt.uid IS NOT NULL AND this14.id = $jwt.uid)) OR (groupCount <> 0 AND size([(this15)<-[:ADMIN_OF]-(this22:Admin) WHERE single(this21 IN [(this22)-[:IS_USER]->(this21:User) WHERE ($jwt.uid IS NOT NULL AND this21.id = $jwt.uid) | 1] WHERE true) | 1]) > 0) OR (groupCount <> 0 AND size([(this16)<-[:CONTRIBUTOR_TO]-(this24:Contributor) WHERE single(this23 IN [(this24)-[:IS_USER]->(this23:User) WHERE ($jwt.uid IS NOT NULL AND this23.id = $jwt.uid) | 1] WHERE true) | 1]) > 0) OR var20 = true)), \\"@neo4j/graphql/FORBIDDEN\\", [0])
                    WITH collect({ node: this13, relationship: this12 }) AS edges
                    WITH edges, size(edges) AS totalCount
                    CALL {
                        WITH edges
                        UNWIND edges AS edge
                        WITH edge.node AS this13, edge.relationship AS this12
                        RETURN collect({ properties: { active: this12.active, firstDay: this12.firstDay, lastDay: this12.lastDay, __resolveType: \\"PartnerOf\\" }, node: { __id: id(this13), __resolveType: \\"Person\\" } }) AS var25
                    }
                    RETURN { edges: var25, totalCount: totalCount } AS var26
                }
                WITH this1 { .id, .name, partnersConnection: var26 } AS this1
                RETURN collect(this1) AS var27
            }
            RETURN this { .id, .name, members: var27 } AS this"
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
