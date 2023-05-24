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
import { Neo4jGraphQL } from "../../../../../src";
import { createJwtRequest } from "../../../../utils/create-jwt-request";
import { formatCypher, translateQuery, formatParams } from "../../../utils/tck-test-utils";

describe("Cypher Aggregations where node with Logical AND + OR", () => {
    let typeDefs: DocumentNode;
    let neoSchema: Neo4jGraphQL;

    beforeAll(() => {
        typeDefs = gql`
            type User {
                someFloat: Float
            }

            type Post {
                content: String!
                likes: [User!]! @relationship(type: "LIKES", direction: IN)
            }
        `;

        neoSchema = new Neo4jGraphQL({
            typeDefs,
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
            "MATCH (this:\`Post\`)
            CALL {
                WITH this
                MATCH (this)<-[this0:LIKES]-(this1:\`User\`)
                RETURN any(var2 IN collect(this1.someFloat) WHERE var2 = $param0) AS var3, any(var4 IN collect(this1.someFloat) WHERE var4 = $param1) AS var5
            }
            WITH *
            WHERE (var3 = true AND var5 = true)
            RETURN this { .content } AS this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"param0\\": 10,
                \\"param1\\": 11
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
            "MATCH (this:\`Post\`)
            CALL {
                WITH this
                MATCH (this)<-[this0:LIKES]-(this1:\`User\`)
                RETURN any(var2 IN collect(this1.someFloat) WHERE var2 = $param0) AS var3, any(var4 IN collect(this1.someFloat) WHERE var4 = $param1) AS var5
            }
            WITH *
            WHERE (var3 = true OR var5 = true)
            RETURN this { .content } AS this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"param0\\": 10,
                \\"param1\\": 11
            }"
        `);
    });

    test("NOT", async () => {
        const query = gql`
            {
                posts(where: { likesAggregate: { node: { NOT: { someFloat_EQUAL: 10 } } } }) {
                    content
                }
            }
        `;

        const req = createJwtRequest("secret", {});
        const result = await translateQuery(neoSchema, query, {
            req,
        });

        expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
            "MATCH (this:\`Post\`)
            CALL {
                WITH this
                MATCH (this)<-[this0:LIKES]-(this1:\`User\`)
                RETURN any(var2 IN collect(this1.someFloat) WHERE var2 = $param0) AS var3
            }
            WITH *
            WHERE NOT (var3 = true)
            RETURN this { .content } AS this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"param0\\": 10
            }"
        `);
    });
});
