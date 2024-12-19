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

import { Neo4jGraphQL } from "../../../../src";
import { createBearerToken } from "../../../utils/create-bearer-token";
import { formatCypher, formatParams, translateQuery } from "../../utils/tck-test-utils";

describe("Cypher Auth Projection On Connections On Unions", () => {
    const secret = "secret";
    let typeDefs: string;
    let neoSchema: Neo4jGraphQL;

    beforeAll(() => {
        typeDefs = /* GraphQL */ `
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
        const query = /* GraphQL */ `
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
            WHERE apoc.util.validatePredicate(NOT ($isAuthenticated = true AND ($jwt.sub IS NOT NULL AND this.id = $jwt.sub)), \\"@neo4j/graphql/FORBIDDEN\\", [0])
            CALL {
                WITH this
                CALL {
                    WITH this
                    MATCH (this)-[this0:PUBLISHED]->(this1:Post)
                    OPTIONAL MATCH (this1)<-[:HAS_POST]-(this2:User)
                    WITH *, count(this2) AS var3
                    WITH *
                    WHERE apoc.util.validatePredicate(NOT ($isAuthenticated = true AND (var3 <> 0 AND ($jwt.sub IS NOT NULL AND this2.id = $jwt.sub))), \\"@neo4j/graphql/FORBIDDEN\\", [0])
                    CALL {
                        WITH this1
                        MATCH (this1)<-[this4:HAS_POST]-(this5:User)
                        WHERE apoc.util.validatePredicate(NOT ($isAuthenticated = true AND ($jwt.sub IS NOT NULL AND this5.id = $jwt.sub)), \\"@neo4j/graphql/FORBIDDEN\\", [0])
                        WITH collect({ node: this5, relationship: this4 }) AS edges
                        WITH edges, size(edges) AS totalCount
                        CALL {
                            WITH edges
                            UNWIND edges AS edge
                            WITH edge.node AS this5, edge.relationship AS this4
                            RETURN collect({ node: { name: this5.name, __resolveType: \\"User\\" } }) AS var6
                        }
                        RETURN { edges: var6, totalCount: totalCount } AS var7
                    }
                    WITH { node: { __resolveType: \\"Post\\", __id: id(this1), content: this1.content, creatorConnection: var7 } } AS edge
                    RETURN edge
                }
                WITH collect(edge) AS edges
                WITH edges, size(edges) AS totalCount
                RETURN { edges: edges, totalCount: totalCount } AS var8
            }
            RETURN this { contentConnection: var8 } AS this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"isAuthenticated\\": true,
                \\"jwt\\": {
                    \\"roles\\": [],
                    \\"sub\\": \\"super_admin\\"
                }
            }"
        `);
    });
});
