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

describe("Cypher Auth Projection On Connections On Unions", () => {
    const secret = "secret";
    let typeDefs: DocumentNode;
    let neoSchema: Neo4jGraphQL;

    beforeAll(() => {
        typeDefs = gql`
            type Post {
                content: String
                creator: User! @relationship(type: "HAS_POST", direction: IN)
            }

            type User {
                id: ID
                name: String
                content: [Content!]! @relationship(type: "PUBLISHED", direction: OUT)
            }

            union Content = Post

            extend type User @authorization(validate: [{ when: BEFORE, where: { node: { id: "$jwt.sub" } } }])
            extend type Post
                @authorization(validate: [{ when: BEFORE, where: { node: { creator: { id: "$jwt.sub" } } } }])
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

    test("Two connection", async () => {
        const query = gql`
            {
                users {
                    contentConnection {
                        edges {
                            node {
                                ... on Post {
                                    content
                                    creatorConnection {
                                        edges {
                                            node {
                                                name
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            }
        `;

        const token = createBearerToken(secret, { sub: "super_admin" });
        const result = await translateQuery(neoSchema, query, {
            token,
        });

        expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
            "MATCH (this:User)
            WITH *
            WHERE apoc.util.validatePredicate(NOT ($isAuthenticated = true AND this.id = coalesce($jwt.sub, $jwtDefault)), \\"@neo4j/graphql/FORBIDDEN\\", [0])
            CALL {
                WITH this
                CALL {
                    WITH this
                    MATCH (this)-[this0:PUBLISHED]->(this1:Post)
                    OPTIONAL MATCH (this1)<-[:HAS_POST]-(this2:User)
                    WITH *, count(this2) AS creatorCount
                    WITH *
                    WHERE apoc.util.validatePredicate(NOT ($isAuthenticated = true AND (creatorCount <> 0 AND this2.id = coalesce($jwt.sub, $jwtDefault))), \\"@neo4j/graphql/FORBIDDEN\\", [0])
                    CALL {
                        WITH this1
                        MATCH (this1:Post)<-[this3:HAS_POST]-(this4:User)
                        WHERE apoc.util.validatePredicate(NOT ($isAuthenticated = true AND this4.id = coalesce($jwt.sub, $jwtDefault)), \\"@neo4j/graphql/FORBIDDEN\\", [0])
                        WITH { node: { name: this4.name } } AS edge
                        WITH collect(edge) AS edges
                        WITH edges, size(edges) AS totalCount
                        RETURN { edges: edges, totalCount: totalCount } AS var5
                    }
                    WITH { node: { __resolveType: \\"Post\\", __id: id(this1), content: this1.content, creatorConnection: var5 } } AS edge
                    RETURN edge
                }
                WITH collect(edge) AS edges
                WITH edges, size(edges) AS totalCount
                RETURN { edges: edges, totalCount: totalCount } AS var6
            }
            RETURN this { contentConnection: var6 } AS this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"isAuthenticated\\": true,
                \\"jwt\\": {
                    \\"roles\\": [],
                    \\"sub\\": \\"super_admin\\"
                },
                \\"jwtDefault\\": {}
            }"
        `);
    });
});
