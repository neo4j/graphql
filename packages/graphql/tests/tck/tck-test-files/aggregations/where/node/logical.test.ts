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
import { Neo4jGraphQL } from "../../../../../../src";
import { createJwtRequest } from "../../../../../../src/utils/test/utils";
import { formatCypher, translateQuery, formatParams } from "../../../../utils/tck-test-utils";

describe("Cypher Aggregations where node with Logical AND + OR", () => {
    const secret = "secret";
    let typeDefs: DocumentNode;
    let neoSchema: Neo4jGraphQL;

    beforeAll(() => {
        typeDefs = gql`
            type User {
                someFloat: Float
            }

            type Post {
                content: String!
                likes: [User] @relationship(type: "LIKES", direction: IN)
            }
        `;

        neoSchema = new Neo4jGraphQL({
            typeDefs,
            config: { enableRegex: true, jwt: { secret } },
        });
    });

    test("AND", async () => {
        const query = gql`
            {
                posts(
                    where: { likesAggregate: { node: { AND: [{ someFloat_EQUAL: 10 }, { someFloat_EQUAL: 11 }] } } }
                ) {
                    content
                }
            }
        `;

        const req = createJwtRequest("secret", {});
        const result = await translateQuery(neoSchema, query, {
            req,
        });

        expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
            "MATCH (this:Post)
            WHERE apoc.cypher.runFirstColumn(\\" MATCH (this)<-[this_likesAggregate_edge:LIKES]-(this_likesAggregate_node:User)
            RETURN (this_likesAggregate_node.someFloat = $this_likesAggregate_node_AND_0_someFloat_EQUAL AND this_likesAggregate_node.someFloat = $this_likesAggregate_node_AND_1_someFloat_EQUAL)
            \\", { this: this, this_likesAggregate_node_AND_0_someFloat_EQUAL: $this_likesAggregate_node_AND_0_someFloat_EQUAL, this_likesAggregate_node_AND_1_someFloat_EQUAL: $this_likesAggregate_node_AND_1_someFloat_EQUAL }, false )
            RETURN this { .content } as this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"this_likesAggregate_node_AND_0_someFloat_EQUAL\\": 10,
                \\"this_likesAggregate_node_AND_1_someFloat_EQUAL\\": 11
            }"
        `);
    });

    test("OR", async () => {
        const query = gql`
            {
                posts(where: { likesAggregate: { node: { OR: [{ someFloat_EQUAL: 10 }, { someFloat_EQUAL: 11 }] } } }) {
                    content
                }
            }
        `;

        const req = createJwtRequest("secret", {});
        const result = await translateQuery(neoSchema, query, {
            req,
        });

        expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
            "MATCH (this:Post)
            WHERE apoc.cypher.runFirstColumn(\\" MATCH (this)<-[this_likesAggregate_edge:LIKES]-(this_likesAggregate_node:User)
            RETURN (this_likesAggregate_node.someFloat = $this_likesAggregate_node_OR_0_someFloat_EQUAL OR this_likesAggregate_node.someFloat = $this_likesAggregate_node_OR_1_someFloat_EQUAL)
            \\", { this: this, this_likesAggregate_node_OR_0_someFloat_EQUAL: $this_likesAggregate_node_OR_0_someFloat_EQUAL, this_likesAggregate_node_OR_1_someFloat_EQUAL: $this_likesAggregate_node_OR_1_someFloat_EQUAL }, false )
            RETURN this { .content } as this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"this_likesAggregate_node_OR_0_someFloat_EQUAL\\": 10,
                \\"this_likesAggregate_node_OR_1_someFloat_EQUAL\\": 11
            }"
        `);
    });
});
