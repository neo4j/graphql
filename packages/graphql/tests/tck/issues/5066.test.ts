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
            CALL {
                WITH this
                MATCH (this)<-[this0:CREATED_PARTY]-(this1:AdminGroup)
                OPTIONAL MATCH (this1)<-[:CREATED_ADMIN_GROUP]-(this2:User)
                WITH *, count(this2) AS createdByCount
                WITH *
                WHERE (createdByCount <> 0 AND ($jwt.sub IS NOT NULL AND this2.id = $jwt.sub))
                RETURN count(this1) > 0 AS var3
            }
            WITH *
            WHERE (($isAuthenticated = true AND single(this4 IN [(this)<-[this5:CREATED_PARTY]-(this4:User) WHERE ($jwt.sub IS NOT NULL AND this4.id = $jwt.sub) | 1] WHERE true)) OR ($isAuthenticated = true AND var3 = true))
            CALL {
                WITH this
                CALL {
                    WITH *
                    MATCH (this)<-[this6:CREATED_PARTY]-(this7:User)
                    CALL {
                        WITH this7
                        MATCH (this7)-[:HAS_BLOCKED]->(this8:UserBlockedUser)
                        OPTIONAL MATCH (this8)-[:IS_BLOCKING]->(this9:User)
                        WITH *, count(this9) AS toCount
                        WITH *
                        WHERE (toCount <> 0 AND ($jwt.sub IS NOT NULL AND this9.id = $jwt.sub))
                        RETURN count(this8) > 0 AS var10
                    }
                    WITH *
                    WHERE ($isAuthenticated = true AND NOT (var10 = true))
                    WITH this7 { .username, __resolveType: \\"User\\", __id: id(this7) } AS this7
                    RETURN this7 AS var11
                    UNION
                    WITH *
                    MATCH (this)<-[this12:CREATED_PARTY]-(this13:AdminGroup)
                    OPTIONAL MATCH (this13)<-[:CREATED_ADMIN_GROUP]-(this14:User)
                    WITH *, count(this14) AS createdByCount
                    WITH *
                    WHERE ($isAuthenticated = true AND (createdByCount <> 0 AND ($jwt.sub IS NOT NULL AND this14.id = $jwt.sub)))
                    WITH this13 { __resolveType: \\"AdminGroup\\", __id: id(this13) } AS this13
                    RETURN this13 AS var11
                }
                WITH var11
                RETURN head(collect(var11)) AS var11
            }
            RETURN this { .id, createdBy: var11 } AS this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"jwt\\": {
                    \\"roles\\": [],
                    \\"sub\\": \\"1\\"
                },
                \\"isAuthenticated\\": true
            }"
        `);
    });
});
