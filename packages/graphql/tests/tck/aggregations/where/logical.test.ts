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
import { createJwtRequest } from "../../../utils/create-jwt-request";
import { formatCypher, translateQuery, formatParams } from "../../utils/tck-test-utils";

describe("Cypher Aggregations where with logical AND plus OR", () => {
    let typeDefs: DocumentNode;
    let neoSchema: Neo4jGraphQL;

    beforeAll(() => {
        typeDefs = gql`
            type User {
                name: String!
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
                posts(where: { likesAggregate: { AND: [{ count_GT: 10 }, { count_LT: 20 }] } }) {
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
                RETURN count(this1) > $param0 AS var2, count(this1) < $param1 AS var3
            }
            WITH *
            WHERE (var2 = true AND var3 = true)
            RETURN this { .content } AS this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"param0\\": {
                    \\"low\\": 10,
                    \\"high\\": 0
                },
                \\"param1\\": {
                    \\"low\\": 20,
                    \\"high\\": 0
                }
            }"
        `);
    });

    test("OR", async () => {
        const query = gql`
            {
                posts(where: { likesAggregate: { OR: [{ count_GT: 10 }, { count_LT: 20 }] } }) {
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
                RETURN count(this1) > $param0 AS var2, count(this1) < $param1 AS var3
            }
            WITH *
            WHERE (var2 = true OR var3 = true)
            RETURN this { .content } AS this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"param0\\": {
                    \\"low\\": 10,
                    \\"high\\": 0
                },
                \\"param1\\": {
                    \\"low\\": 20,
                    \\"high\\": 0
                }
            }"
        `);
    });

    test("NOT", async () => {
        const query = gql`
            {
                posts(where: { likesAggregate: { NOT: { count_GT: 10 } } }) {
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
                RETURN count(this1) > $param0 AS var2
            }
            WITH *
            WHERE NOT (var2 = true)
            RETURN this { .content } AS this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"param0\\": {
                    \\"low\\": 10,
                    \\"high\\": 0
                }
            }"
        `);
    });

    test("AND plus OR", async () => {
        const query = gql`
            {
                posts(
                    where: {
                        likesAggregate: {
                            AND: [{ count_GT: 10 }, { count_LT: 20 }]
                            OR: [{ count_GT: 10 }, { count_LT: 20 }]
                        }
                    }
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
                RETURN count(this1) > $param0 AS var2, count(this1) < $param1 AS var3, count(this1) > $param2 AS var4, count(this1) < $param3 AS var5
            }
            WITH *
            WHERE ((var2 = true AND var3 = true) AND (var4 = true OR var5 = true))
            RETURN this { .content } AS this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"param0\\": {
                    \\"low\\": 10,
                    \\"high\\": 0
                },
                \\"param1\\": {
                    \\"low\\": 20,
                    \\"high\\": 0
                },
                \\"param2\\": {
                    \\"low\\": 10,
                    \\"high\\": 0
                },
                \\"param3\\": {
                    \\"low\\": 20,
                    \\"high\\": 0
                }
            }"
        `);
    });
});
