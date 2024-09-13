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

describe("https://github.com/neo4j/graphql/issues/3929", () => {
    const secret = "secret";
    let typeDefs: string;
    let neoSchema: Neo4jGraphQL;

    beforeAll(() => {
        typeDefs = /* GraphQL */ `
            type User @authorization(filter: [{ where: { node: { id: "$jwt.uid" } } }]) {
                id: ID! @unique
                email: String!
                name: String
            }

            type Group @authorization(validate: [{ where: { node: { creator: { id: "$jwt.uid" } } } }]) {
                id: ID! @id @unique
                name: String
                members: [Person!]! @relationship(type: "MEMBER_OF", direction: IN)
                creator: User! @relationship(type: "CREATOR_OF", direction: IN, nestedOperations: [CONNECT])
            }

            type Person @authorization(validate: [{ where: { node: { creator: { id: "$jwt.uid" } } } }]) {
                id: ID! @id @unique
                name: String!
                creator: User! @relationship(type: "CREATOR_OF", direction: IN)
                group: Group! @relationship(type: "MEMBER_OF", direction: OUT)
            }

            extend schema @authentication
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

    test("should not add an authorization check for connects coming from create", async () => {
        const query = /* GraphQL */ `
            mutation UpdateGroups($where: GroupWhere, $delete: GroupDeleteInput) {
                updateGroups(where: $where, delete: $delete) {
                    info {
                        nodesDeleted
                        relationshipsDeleted
                    }
                }
            }
        `;

        const token = createBearerToken(secret, { sub: "michel" });
        const result = await translateQuery(neoSchema, query, {
            token,
            variableValues: {
                where: {
                    id: "group1_id",
                },
                delete: {
                    members: [
                        {
                            where: {
                                node: {
                                    id: "member1_id",
                                },
                            },
                        },
                    ],
                },
            },
        });

        expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
            "MATCH (this:Group)
            OPTIONAL MATCH (this)<-[:CREATOR_OF]-(this0:User)
            WITH *, count(this0) AS creatorCount
            WITH *
            WHERE (this.id = $param0 AND apoc.util.validatePredicate(NOT ($isAuthenticated = true AND (creatorCount <> 0 AND ($jwt.uid IS NOT NULL AND this0.id = $jwt.uid))), \\"@neo4j/graphql/FORBIDDEN\\", [0]))
            WITH *
            CALL {
            WITH *
            OPTIONAL MATCH (this)<-[this_delete_members0_relationship:MEMBER_OF]-(this_delete_members0:Person)
            OPTIONAL MATCH (this_delete_members0)<-[:CREATOR_OF]-(authorization__before_this0:User)
            WITH *, count(authorization__before_this0) AS creatorCount
            WITH *
            WHERE this_delete_members0.id = $updateGroups_args_delete_members0_where_this_delete_members0param0 AND apoc.util.validatePredicate(NOT ($isAuthenticated = true AND (creatorCount <> 0 AND ($jwt.uid IS NOT NULL AND authorization__before_this0.id = $jwt.uid))), \\"@neo4j/graphql/FORBIDDEN\\", [0])
            WITH this_delete_members0_relationship, collect(DISTINCT this_delete_members0) AS this_delete_members0_to_delete
            CALL {
            	WITH this_delete_members0_to_delete
            	UNWIND this_delete_members0_to_delete AS x
            	DETACH DELETE x
            }
            }
            WITH *
            WITH *
            CALL {
            	WITH this
            	MATCH (this)<-[this_creator_User_unique:CREATOR_OF]-(:User)
            	WITH count(this_creator_User_unique) as c
            	WHERE apoc.util.validatePredicate(NOT (c = 1), '@neo4j/graphql/RELATIONSHIP-REQUIREDGroup.creator required exactly once', [0])
            	RETURN c AS this_creator_User_unique_ignored
            }
            RETURN \\"Query cannot conclude with CALL\\""
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"param0\\": \\"group1_id\\",
                \\"isAuthenticated\\": true,
                \\"jwt\\": {
                    \\"roles\\": [],
                    \\"sub\\": \\"michel\\"
                },
                \\"updateGroups_args_delete_members0_where_this_delete_members0param0\\": \\"member1_id\\",
                \\"updateGroups\\": {
                    \\"args\\": {
                        \\"delete\\": {
                            \\"members\\": [
                                {
                                    \\"where\\": {
                                        \\"node\\": {
                                            \\"id\\": \\"member1_id\\"
                                        }
                                    }
                                }
                            ]
                        }
                    }
                },
                \\"resolvedCallbacks\\": {}
            }"
        `);
    });
});
