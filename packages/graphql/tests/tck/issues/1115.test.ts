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

describe("https://github.com/neo4j/graphql/issues/1115", () => {
    let typeDefs: string;
    let neoSchema: Neo4jGraphQL;

    beforeAll(() => {
        typeDefs = /* GraphQL */ `
            type JWT @jwt {
                roles: [String!]!
            }

            type Parent @node {
                children: [Child!]! @relationship(type: "HAS", direction: IN)
            }

            type Child @node {
                tcId: String @unique
            }

            extend type Child
                @authorization(
                    validate: [
                        {
                            operations: [READ, CREATE, UPDATE, DELETE, CREATE_RELATIONSHIP, DELETE_RELATIONSHIP]
                            where: { jwt: { roles_INCLUDES: "upstream" } }
                        }
                        { operations: [READ], where: { jwt: { roles_INCLUDES: "downstream" } } }
                    ]
                )
        `;

        neoSchema = new Neo4jGraphQL({
            typeDefs,
            features: { authorization: { key: "secret" } },
        });
    });

    test("multiple connectOrCreate operations with auth", async () => {
        const query = /* GraphQL */ `
            mutation UpdateParents {
                updateParents(
                    update: {
                        children: {
                            connectOrCreate: [
                                { where: { node: { tcId_EQ: "123" } }, onCreate: { node: { tcId: "123" } } }
                                { where: { node: { tcId_EQ: "456" } }, onCreate: { node: { tcId: "456" } } }
                            ]
                        }
                    }
                ) {
                    info {
                        nodesCreated
                    }
                }
            }
        `;

        const result = await translateQuery(neoSchema, query, {
            contextValues: { token: createBearerToken("secret") },
        });

        expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
            "MATCH (this:Parent)
            WITH this
            CALL {
                WITH this
                MERGE (this_children0_connectOrCreate0:Child { tcId: $this_children0_connectOrCreate_param0 })
                ON CREATE SET
                    this_children0_connectOrCreate0.tcId = $this_children0_connectOrCreate_param1
                MERGE (this)<-[this_children0_connectOrCreate_this0:HAS]-(this_children0_connectOrCreate0)
                WITH *
                WHERE apoc.util.validatePredicate(NOT ($isAuthenticated = true AND ($jwt.roles IS NOT NULL AND $this_children0_connectOrCreate_param4 IN $jwt.roles)), \\"@neo4j/graphql/FORBIDDEN\\", [0])
                RETURN count(*) AS _
            }
            WITH this
            CALL {
                WITH this
                MERGE (this_children0_connectOrCreate1:Child { tcId: $this_children0_connectOrCreate_param5 })
                ON CREATE SET
                    this_children0_connectOrCreate1.tcId = $this_children0_connectOrCreate_param6
                MERGE (this)<-[this_children0_connectOrCreate_this1:HAS]-(this_children0_connectOrCreate1)
                WITH *
                WHERE apoc.util.validatePredicate(NOT ($isAuthenticated = true AND ($jwt.roles IS NOT NULL AND $this_children0_connectOrCreate_param7 IN $jwt.roles)), \\"@neo4j/graphql/FORBIDDEN\\", [0])
                RETURN count(*) AS _
            }
            RETURN \\"Query cannot conclude with CALL\\""
        `);
        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"this_children0_connectOrCreate_param0\\": \\"123\\",
                \\"this_children0_connectOrCreate_param1\\": \\"123\\",
                \\"isAuthenticated\\": true,
                \\"jwt\\": {
                    \\"roles\\": []
                },
                \\"this_children0_connectOrCreate_param4\\": \\"upstream\\",
                \\"this_children0_connectOrCreate_param5\\": \\"456\\",
                \\"this_children0_connectOrCreate_param6\\": \\"456\\",
                \\"this_children0_connectOrCreate_param7\\": \\"upstream\\",
                \\"resolvedCallbacks\\": {}
            }"
        `);
    });
});
