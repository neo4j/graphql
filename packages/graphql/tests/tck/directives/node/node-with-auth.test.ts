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

import { gql } from "graphql-tag";
import type { DocumentNode } from "graphql";
import { Neo4jGraphQL } from "../../../../src";
import { formatCypher, translateQuery, formatParams } from "../../utils/tck-test-utils";
import { createBearerToken } from "../../../utils/create-bearer-token";

describe("Node Directive", () => {
    const secret = "secret";
    let typeDefs: DocumentNode;
    let neoSchema: Neo4jGraphQL;

    beforeAll(() => {
        typeDefs = gql`
            type JWT @jwt {
                roles: [String!]!
            }

            type Post @node(labels: ["Comment"]) {
                id: ID
                content: String
                creator: User! @relationship(type: "HAS_POST", direction: IN)
            }

            extend type Post
                @authorization(validate: [{ operations: [DELETE], where: { jwt: { roles_INCLUDES: "admin" } } }])

            type User @node(labels: ["Person"]) {
                id: ID
                name: String
                posts: [Post!]! @relationship(type: "HAS_POST", direction: OUT)
            }

            extend type User
                @authorization(
                    validate: [
                        {
                            operations: [READ, UPDATE, DELETE, DELETE_RELATIONSHIP, CREATE_RELATIONSHIP]
                            when: [BEFORE]
                            where: { node: { id: "$jwt.sub" } }
                        }
                    ]
                )
        `;

        neoSchema = new Neo4jGraphQL({
            typeDefs,
            features: { authorization: { key: secret } },
        });
    });

    test("Read User", async () => {
        const query = gql`
            {
                users {
                    id
                }
            }
        `;

        const token = createBearerToken("secret", { sub: "id-01", roles: ["admin"] });
        const result = await translateQuery(neoSchema, query, {
            token,
        });

        expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
            "MATCH (this:Person)
            WITH *
            WHERE apoc.util.validatePredicate(NOT ($isAuthenticated = true AND this.id = coalesce($jwt.sub, $jwtDefault)), \\"@neo4j/graphql/FORBIDDEN\\", [0])
            RETURN this { .id } AS this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"isAuthenticated\\": true,
                \\"jwt\\": {
                    \\"roles\\": [
                        \\"admin\\"
                    ],
                    \\"sub\\": \\"id-01\\"
                },
                \\"jwtDefault\\": {}
            }"
        `);
    });

    test("Admin Deletes Post", async () => {
        const query = gql`
            mutation {
                deletePosts(where: { creator: { id: "123" } }) {
                    nodesDeleted
                }
            }
        `;

        const token = createBearerToken("secret", { sub: "id-01", roles: ["admin"] });
        const result = await translateQuery(neoSchema, query, { token });

        expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
            "MATCH (this:Comment)
            OPTIONAL MATCH (this)<-[:HAS_POST]-(this0:Person)
            WITH *, count(this0) AS creatorCount
            WITH *
            WHERE ((creatorCount <> 0 AND this0.id = $param0) AND apoc.util.validatePredicate(NOT ($isAuthenticated = true AND $param2 IN $jwt.roles), \\"@neo4j/graphql/FORBIDDEN\\", [0]))
            DETACH DELETE this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"param0\\": \\"123\\",
                \\"isAuthenticated\\": true,
                \\"param2\\": \\"admin\\",
                \\"jwt\\": {
                    \\"roles\\": [
                        \\"admin\\"
                    ],
                    \\"sub\\": \\"id-01\\"
                }
            }"
        `);
    });
});
