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
            type User @node {
                id: ID!
                email: String!
                name: String
                creator: [Group!]! @relationship(type: "CREATOR_OF", direction: OUT)
                admin: [Admin!]! @relationship(type: "IS_USER", direction: IN)
                contributor: [Contributor!]! @relationship(type: "IS_USER", direction: IN)
                invitations: [Invitee!]! @relationship(type: "CREATOR_OF", direction: OUT)
                roles: [String!]!
            }

            type Group @node {
                id: ID! @id
                name: String
                members: [Person!]! @relationship(type: "MEMBER_OF", direction: IN)
                creator: [User!]!
                    @relationship(type: "CREATOR_OF", direction: IN)
                    @settable(onCreate: true, onUpdate: true)

                admins: [Admin!]! @relationship(type: "ADMIN_OF", direction: IN)
                contributors: [Contributor!]! @relationship(type: "CONTRIBUTOR_TO", direction: IN)
            }

            type Person
                @node
                @authorization(
                    validate: [
                        {
                            operations: [CREATE]
                            where: {
                                node: { group: { some: { creator: { some: { roles: { includes: "plan:paid" } } } } } }
                            }
                        }
                        {
                            operations: [DELETE]
                            where: {
                                OR: [
                                    { node: { creator: { some: { id: { eq: "$jwt.uid" } } } } }
                                    {
                                        node: {
                                            group: {
                                                some: {
                                                    admins: { some: { user: { some: { id: { eq: "$jwt.uid" } } } } }
                                                }
                                            }
                                        }
                                    }
                                    { node: { group: { some: { creator: { some: { id: { eq: "$jwt.uid" } } } } } } }
                                ]
                            }
                        }
                        {
                            operations: [READ, UPDATE]
                            where: {
                                OR: [
                                    { node: { creator: { some: { id: { eq: "$jwt.uid" } } } } }
                                    {
                                        node: {
                                            group: {
                                                some: {
                                                    admins: { some: { user: { some: { id: { eq: "$jwt.uid" } } } } }
                                                }
                                            }
                                        }
                                    }
                                    {
                                        node: {
                                            group: {
                                                some: {
                                                    contributors: {
                                                        some: { user: { some: { id: { eq: "$jwt.uid" } } } }
                                                    }
                                                }
                                            }
                                        }
                                    }
                                    { node: { group: { some: { creator: { some: { id: { eq: "$jwt.uid" } } } } } } }
                                ]
                            }
                        }
                    ]
                ) {
                id: ID! @id
                name: String!
                creator: [User!]!
                    @relationship(type: "CREATOR_OF", direction: IN, nestedOperations: [CONNECT])
                    @settable(onCreate: true, onUpdate: true)
                group: [Group!]! @relationship(type: "MEMBER_OF", direction: OUT)
                partners: [Person!]!
                    @relationship(
                        type: "PARTNER_OF"
                        queryDirection: UNDIRECTED
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
                creator: [User!]! @declareRelationship
                group: [Group!]! @declareRelationship
                status: InviteeStatus!
                user: [User!]! @declareRelationship
                role: InviteeRole!
            }

            type Admin implements Invitee @node {
                id: ID! @id
                group: [Group!]! @relationship(type: "ADMIN_OF", direction: OUT)
                creator: [User!]! @relationship(type: "CREATOR_OF", direction: IN)
                email: String!
                name: String
                status: InviteeStatus! @default(value: INVITED)
                user: [User!]! @relationship(type: "IS_USER", direction: OUT)
                role: InviteeRole! @default(value: ADMIN)
            }

            type Contributor implements Invitee @node {
                id: ID! @id
                group: [Group!]! @relationship(type: "CONTRIBUTOR_TO", direction: OUT)
                creator: [User!]! @relationship(type: "CREATOR_OF", direction: IN)
                email: String!
                name: String
                status: InviteeStatus! @default(value: INVITED)
                user: [User!]! @relationship(type: "IS_USER", direction: OUT)
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
                groups(where: { id: { eq: "family_id_1" } }) {
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
            "CYPHER 5
            MATCH (this:Group)
            WHERE this.id = $param0
            CALL (this) {
                MATCH (this)<-[this0:MEMBER_OF]-(this1:Person)
                WITH DISTINCT this1
                WITH *
                CALL apoc.util.validate(NOT ($isAuthenticated = true AND (EXISTS {
                    MATCH (this1)<-[:CREATOR_OF]-(this2:User)
                    WHERE ($jwt.uid IS NOT NULL AND this2.id = $jwt.uid)
                } OR EXISTS {
                    MATCH (this1)-[:MEMBER_OF]->(this3:Group)
                    WHERE EXISTS {
                        MATCH (this3)<-[:ADMIN_OF]-(this4:Admin)
                        WHERE EXISTS {
                            MATCH (this4)-[:IS_USER]->(this5:User)
                            WHERE ($jwt.uid IS NOT NULL AND this5.id = $jwt.uid)
                        }
                    }
                } OR EXISTS {
                    MATCH (this1)-[:MEMBER_OF]->(this6:Group)
                    WHERE EXISTS {
                        MATCH (this6)<-[:CONTRIBUTOR_TO]-(this7:Contributor)
                        WHERE EXISTS {
                            MATCH (this7)-[:IS_USER]->(this8:User)
                            WHERE ($jwt.uid IS NOT NULL AND this8.id = $jwt.uid)
                        }
                    }
                } OR EXISTS {
                    MATCH (this1)-[:MEMBER_OF]->(this9:Group)
                    WHERE EXISTS {
                        MATCH (this9)<-[:CREATOR_OF]-(this10:User)
                        WHERE ($jwt.uid IS NOT NULL AND this10.id = $jwt.uid)
                    }
                })), \\"@neo4j/graphql/FORBIDDEN\\", [0])
                CALL (this1) {
                    MATCH (this1)-[this11:PARTNER_OF]-(this12:Person)
                    CALL apoc.util.validate(NOT ($isAuthenticated = true AND (EXISTS {
                        MATCH (this12)<-[:CREATOR_OF]-(this13:User)
                        WHERE ($jwt.uid IS NOT NULL AND this13.id = $jwt.uid)
                    } OR EXISTS {
                        MATCH (this12)-[:MEMBER_OF]->(this14:Group)
                        WHERE EXISTS {
                            MATCH (this14)<-[:ADMIN_OF]-(this15:Admin)
                            WHERE EXISTS {
                                MATCH (this15)-[:IS_USER]->(this16:User)
                                WHERE ($jwt.uid IS NOT NULL AND this16.id = $jwt.uid)
                            }
                        }
                    } OR EXISTS {
                        MATCH (this12)-[:MEMBER_OF]->(this17:Group)
                        WHERE EXISTS {
                            MATCH (this17)<-[:CONTRIBUTOR_TO]-(this18:Contributor)
                            WHERE EXISTS {
                                MATCH (this18)-[:IS_USER]->(this19:User)
                                WHERE ($jwt.uid IS NOT NULL AND this19.id = $jwt.uid)
                            }
                        }
                    } OR EXISTS {
                        MATCH (this12)-[:MEMBER_OF]->(this20:Group)
                        WHERE EXISTS {
                            MATCH (this20)<-[:CREATOR_OF]-(this21:User)
                            WHERE ($jwt.uid IS NOT NULL AND this21.id = $jwt.uid)
                        }
                    })), \\"@neo4j/graphql/FORBIDDEN\\", [0])
                    WITH collect({ node: this12, relationship: this11 }) AS edges
                    CALL (edges) {
                        UNWIND edges AS edge
                        WITH edge.node AS this12, edge.relationship AS this11
                        RETURN collect({ properties: { active: this11.active, firstDay: this11.firstDay, lastDay: this11.lastDay, __resolveType: \\"PartnerOf\\" }, node: { __id: id(this12), __resolveType: \\"Person\\" } }) AS var22
                    }
                    RETURN { edges: var22 } AS var23
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
