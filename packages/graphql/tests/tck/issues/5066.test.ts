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

describe("https://github.com/neo4j/graphql/issues/5066", () => {
    let typeDefs: string;
    let neoSchema: Neo4jGraphQL;
    const secret = "secret";

    beforeAll(() => {
        typeDefs = /* GraphQL */ `
            type AdminGroup
                @node(labels: ["AdminGroup"])
                @mutation(operations: [])
                @authorization(filter: [{ where: { node: { createdBy: { id: "$jwt.sub" } } } }]) {
                id: ID! @id @unique
                createdAt: DateTime! @timestamp(operations: [CREATE]) @private
                updatedAt: DateTime! @timestamp(operations: [CREATE, UPDATE]) @private
                createdBy: User!
                    @relationship(type: "CREATED_ADMIN_GROUP", direction: IN)
                    @settable(onCreate: true, onUpdate: false)
            }

            type User
                @node(labels: ["User"])
                @mutation(operations: [])
                @authorization(
                    filter: [{ where: { node: { NOT: { blockedUsers_SOME: { to: { id: "$jwt.sub" } } } } } }]
                ) {
                id: ID! @unique @settable(onCreate: true, onUpdate: false)
                createdAt: DateTime! @private
                updatedAt: DateTime! @timestamp(operations: [CREATE, UPDATE]) @private
                username: String! @unique
                blockedUsers: [UserBlockedUser!]! @relationship(type: "HAS_BLOCKED", direction: OUT)
                createdAdminGroups: [AdminGroup!]! @relationship(type: "CREATED_ADMIN_GROUP", direction: OUT)
            }

            type UserBlockedUser
                @node(labels: ["UserBlockedUser"])
                @query(read: false, aggregate: false)
                @mutation(operations: [])
                @authorization(filter: [{ where: { node: { from: { id: "$jwt.sub" } } } }]) {
                id: ID! @id @unique
                createdAt: DateTime! @timestamp(operations: [CREATE]) @private
                updatedAt: DateTime! @timestamp(operations: [CREATE, UPDATE]) @private
                from: User! @relationship(type: "HAS_BLOCKED", direction: IN) @settable(onCreate: true, onUpdate: false)
                to: User! @relationship(type: "IS_BLOCKING", direction: OUT) @settable(onCreate: true, onUpdate: false)
            }

            union PartyCreator = User | AdminGroup

            type Party
                @node(labels: ["Party"])
                @mutation(operations: [])
                @authorization(
                    filter: [
                        { where: { node: { createdByConnection: { User: { node: { id: "$jwt.sub" } } } } } }
                        {
                            where: {
                                node: {
                                    createdByConnection: { AdminGroup: { node: { createdBy: { id: "$jwt.sub" } } } }
                                }
                            }
                        }
                    ]
                ) {
                id: ID! @id @unique
                createdAt: DateTime! @timestamp(operations: [CREATE]) @private
                updatedAt: DateTime! @timestamp(operations: [CREATE, UPDATE]) @private
                createdBy: PartyCreator!
                    @relationship(type: "CREATED_PARTY", direction: IN)
                    @settable(onCreate: true, onUpdate: false)
            }
        `;

        neoSchema = new Neo4jGraphQL({
            typeDefs,
            features: {
                authorization: {
                    key: secret,
                },
            },
        });
    });

    test("filter unions with authotization", async () => {
        const query = /* GraphQL */ `
            query Parties {
                parties {
                    id
                    createdBy {
                        ... on User {
                            username
                        }
                    }
                }
            }
        `;

        const token = createBearerToken(secret, { sub: "1" });
        const result = await translateQuery(neoSchema, query, {
            contextValues: {
                token,
            },
        });

        expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
            "MATCH (this:Party)
            WITH *
            WHERE (($isAuthenticated = true AND single(this0 IN [(this)<-[this1:CREATED_PARTY]-(this0:User) WHERE ($jwt.sub IS NOT NULL AND this0.id = $jwt.sub) | 1] WHERE true)) OR ($isAuthenticated = true AND single(this3 IN [(this)<-[this4:CREATED_PARTY]-(this3:AdminGroup) WHERE size([(this3)<-[:CREATED_ADMIN_GROUP]-(this2:User) WHERE ($jwt.sub IS NOT NULL AND this2.id = $jwt.sub) | 1]) > 0 | 1] WHERE true)))
            CALL {
                WITH this
                CALL {
                    WITH *
                    MATCH (this)<-[this5:CREATED_PARTY]-(this6:User)
                    WHERE ($isAuthenticated = true AND NOT (size([(this6)-[:HAS_BLOCKED]->(this8:UserBlockedUser) WHERE size([(this8)-[:IS_BLOCKING]->(this7:User) WHERE ($jwt.sub IS NOT NULL AND this7.id = $jwt.sub) | 1]) > 0 | 1]) > 0))
                    WITH this6 { .username, __resolveType: \\"User\\", __id: id(this6) } AS this6
                    RETURN this6 AS var9
                    UNION
                    WITH *
                    MATCH (this)<-[this10:CREATED_PARTY]-(this11:AdminGroup)
                    WHERE ($isAuthenticated = true AND size([(this11)<-[:CREATED_ADMIN_GROUP]-(this12:User) WHERE ($jwt.sub IS NOT NULL AND this12.id = $jwt.sub) | 1]) > 0)
                    WITH this11 { __resolveType: \\"AdminGroup\\", __id: id(this11) } AS this11
                    RETURN this11 AS var9
                }
                WITH var9
                RETURN head(collect(var9)) AS var9
            }
            RETURN this { .id, createdBy: var9 } AS this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"isAuthenticated\\": true,
                \\"jwt\\": {
                    \\"roles\\": [],
                    \\"sub\\": \\"1\\"
                }
            }"
        `);
    });
});
