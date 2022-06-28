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

import { gql } from "apollo-server";
import { DocumentNode } from "graphql";
import { Neo4jGraphQL } from "../../../../src";
import { createJwtRequest } from "../../../utils/create-jwt-request";
import { formatCypher, translateQuery, formatParams } from "../../utils/tck-test-utils";

describe("https://github.com/neo4j/graphql/issues/1115", () => {
    let typeDefs: DocumentNode;
    let neoSchema: Neo4jGraphQL;

    beforeAll(() => {
        typeDefs = gql`
            type Parent {
                children: [Child!]! @relationship(type: "HAS", direction: IN)
            }
            type Child {
                tcId: String @unique
            }

            extend type Child
                @auth(
                    rules: [
                        { operations: [READ, CREATE, UPDATE, DELETE, CONNECT, DISCONNECT], roles: ["upstream"] }
                        { operations: [READ], roles: ["downstream"] }
                    ]
                )
        `;

        neoSchema = new Neo4jGraphQL({
            typeDefs,
            config: { enableRegex: true },
        });
    });

    test("multiple connectOrCreate operations with auth", async () => {
        const query = gql`
            mutation UpdateParents {
                updateParents(
                    connectOrCreate: {
                        children: [
                            { where: { node: { tcId: "123" } }, onCreate: { node: { tcId: "123" } } }
                            { where: { node: { tcId: "456" } }, onCreate: { node: { tcId: "456" } } }
                        ]
                    }
                ) {
                    info {
                        nodesCreated
                    }
                }
            }
        `;

        const req = createJwtRequest("secret", {});
        const result = await translateQuery(neoSchema, query, {
            req,
        });

        expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
            "MATCH (this:Parent)
            	WITH this
            CALL {
            	WITH this
            	CALL apoc.util.validate(NOT (any(r IN [\\"upstream\\"] WHERE any(rr IN $auth.roles WHERE r = rr))), \\"@neo4j/graphql/FORBIDDEN\\", [0])
            MERGE (this_connectOrCreate_children_this1:\`Child\` { tcId: $this_connectOrCreate_children_param0 })
            ON CREATE SET
                    this_connectOrCreate_children_this1.tcId = $this_connectOrCreate_children_param1
            MERGE (this_connectOrCreate_children_this1)-[this_connectOrCreate_children_this0:\`HAS\`]->(this)
            	RETURN COUNT(*) AS _
            }
            	WITH this
            CALL {
            	WITH this
            	CALL apoc.util.validate(NOT (any(r IN [\\"upstream\\"] WHERE any(rr IN $auth.roles WHERE r = rr))), \\"@neo4j/graphql/FORBIDDEN\\", [0])
            MERGE (this_connectOrCreate_children_this4:\`Child\` { tcId: $this_connectOrCreate_children_param2 })
            ON CREATE SET
                    this_connectOrCreate_children_this4.tcId = $this_connectOrCreate_children_param3
            MERGE (this_connectOrCreate_children_this4)-[this_connectOrCreate_children_this3:\`HAS\`]->(this)
            	RETURN COUNT(*) AS _
            }
            RETURN 'Query cannot conclude with CALL'"
        `);
        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"this_connectOrCreate_children_param0\\": \\"123\\",
                \\"this_connectOrCreate_children_param1\\": \\"123\\",
                \\"this_connectOrCreate_children_param2\\": \\"456\\",
                \\"this_connectOrCreate_children_param3\\": \\"456\\",
                \\"resolvedCallbacks\\": {},
                \\"auth\\": {
                    \\"isAuthenticated\\": false,
                    \\"roles\\": []
                }
            }"
        `);
    });
});
