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
import { Neo4jGraphQL } from "../../../../../src";
import { createJwtRequest } from "../../../../utils/create-jwt-request";
import { formatCypher, translateQuery, formatParams } from "../../../utils/tck-test-utils";

describe("Cypher Where Aggregations with @node directive", () => {
    const secret = "secret";
    let typeDefs: DocumentNode;
    let neoSchema: Neo4jGraphQL;

    beforeAll(() => {
        typeDefs = gql`
            type User @node(label: "_User", additionalLabels: ["additionalUser"]) {
                someName: String
            }

            type Post @node(label: "_Post", additionalLabels: ["additionalPost"]) {
                content: String!
                likes: [User] @relationship(type: "LIKES", direction: IN)
            }
        `;

        neoSchema = new Neo4jGraphQL({
            typeDefs,
            config: { enableRegex: true, jwt: { secret } },
        });
    });

    test("GT with node directive", async () => {
        const query = gql`
            {
                posts(where: { likesAggregate: { node: { someName_GT: 1 } } }) {
                    content
                }
            }
        `;

        const req = createJwtRequest("secret", {});
        const result = await translateQuery(neoSchema, query, {
            req,
        });

        expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
            "MATCH (this:_Post:additionalPost)
            WHERE apoc.cypher.runFirstColumn(\\" MATCH (this)<-[this_likesAggregate_edge:LIKES]-(this_likesAggregate_node:_User:additionalUser)
            RETURN size(this_likesAggregate_node.someName) > $this_likesAggregate_node_someName_GT
            \\", { this: this, this_likesAggregate_node_someName_GT: $this_likesAggregate_node_someName_GT }, false )
            RETURN this { .content } as this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"this_likesAggregate_node_someName_GT\\": {
                    \\"low\\": 1,
                    \\"high\\": 0
                }
            }"
        `);
    });
});
