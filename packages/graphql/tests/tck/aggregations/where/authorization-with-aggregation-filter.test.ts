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
import { formatCypher, formatParams, translateQuery } from "../../utils/tck-test-utils";

describe("Authorization with aggregation filter rule", () => {
    let typeDefs: string;
    let neoSchema: Neo4jGraphQL;

    beforeAll(() => {
        typeDefs = /* GraphQL */ `
            type User @node {
                name: String!
            }

            type Post
                @node
                @authorization(
                    filter: [{ where: { node: { likesConnection: { aggregate: { count: { nodes: { eq: 3 } } } } } } }]
                ) {
                content: String!
                likes: [User!]! @relationship(type: "LIKES", direction: IN)
            }
        `;

        neoSchema = new Neo4jGraphQL({
            typeDefs,
            features: { authorization: { key: "secret" } },
        });
    });

    test("Equality Count", async () => {
        const query = /* GraphQL */ `
            {
                posts {
                    content
                }
            }
        `;
        const result = await translateQuery(neoSchema, query);

        expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
            "CYPHER 5
            MATCH (this:Post)
            CALL (this) {
                MATCH (this)<-[this0:LIKES]-(this1:User)
                WITH DISTINCT this1
                RETURN count(this1) = $param0 AS var2
            }
            WITH *
            WHERE ($isAuthenticated = true AND var2 = true)
            RETURN this { .content } AS this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"param0\\": 3,
                \\"isAuthenticated\\": false
            }"
        `);
    });

    test("Equality Count (connection)", async () => {
        const query = /* GraphQL */ `
            {
                postsConnection {
                    edges {
                        node {
                            content
                        }
                    }
                }
            }
        `;

        const result = await translateQuery(neoSchema, query);

        expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
            "CYPHER 5
            MATCH (this0:Post)
            CALL (this0) {
                MATCH (this0)<-[this1:LIKES]-(this2:User)
                WITH DISTINCT this2
                RETURN count(this2) = $param0 AS var3
            }
            WITH *
            WHERE ($isAuthenticated = true AND var3 = true)
            WITH collect({ node: this0 }) AS edges
            CALL (edges) {
                UNWIND edges AS edge
                WITH edge.node AS this0
                RETURN collect({ node: { content: this0.content, __resolveType: \\"Post\\" } }) AS var4
            }
            RETURN { edges: var4 } AS this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"param0\\": 3,
                \\"isAuthenticated\\": false
            }"
        `);
    });
});
