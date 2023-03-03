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

import { Neo4jGraphQLAuthJWTPlugin } from "@neo4j/graphql-plugin-auth";
import { gql } from "apollo-server";
import type { DocumentNode } from "graphql";
import { Neo4jGraphQL } from "../../../src";
import { createJwtRequest } from "../../utils/create-jwt-request";
import { formatCypher, translateQuery, formatParams } from "../utils/tck-test-utils";

describe("Cypher Aggregations with Auth", () => {
    const secret = "secret";
    let typeDefs: DocumentNode;
    let neoSchema: Neo4jGraphQL;

    beforeAll(() => {
        typeDefs = gql`
            type User {
                id: ID @auth(rules: [{ allow: { id: "$jwt.sub" } }])
                name: String! @auth(rules: [{ allow: { id: "$jwt.sub" } }])
                imdbRatingInt: Int! @auth(rules: [{ allow: { id: "$jwt.sub" } }])
                imdbRatingFloat: Float! @auth(rules: [{ allow: { id: "$jwt.sub" } }])
                imdbRatingBigInt: BigInt! @auth(rules: [{ allow: { id: "$jwt.sub" } }])
                createdAt: DateTime @auth(rules: [{ allow: { id: "$jwt.sub" } }])
            }

            extend type User @auth(rules: [{ allow: { id: "$jwt.sub" }, where: { id: "$jwt.sub" } }])
        `;

        neoSchema = new Neo4jGraphQL({
            typeDefs,
            config: { enableRegex: true },
            plugins: {
                auth: new Neo4jGraphQLAuthJWTPlugin({
                    secret,
                }),
            },
        });
    });

    test("Simple Count", async () => {
        const query = gql`
            {
                usersAggregate {
                    count
                }
            }
        `;

        const req = createJwtRequest("secret", { sub: "super_admin" });
        const result = await translateQuery(neoSchema, query, {
            req,
        });

        expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
            "MATCH (this:\`User\`)
            WHERE (this.\`id\` IS NOT NULL AND this.\`id\` = $auth_param0)
            CALL apoc.util.validate(NOT ((this.\`id\` IS NOT NULL AND this.\`id\` = $thisauth_param0)), \\"@neo4j/graphql/FORBIDDEN\\", [0])
            RETURN { count: count(this) }"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"auth_param0\\": \\"super_admin\\",
                \\"thisauth_param0\\": \\"super_admin\\"
            }"
        `);
    });

    test("Count with WHERE", async () => {
        const query = gql`
            {
                usersAggregate(where: { name: "some-name" }) {
                    count
                }
            }
        `;

        const req = createJwtRequest("secret", { sub: "super_admin" });
        const result = await translateQuery(neoSchema, query, {
            req,
        });

        expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
            "MATCH (this:\`User\`)
            WHERE (this.\`name\` = $param0 AND (this.\`id\` IS NOT NULL AND this.\`id\` = $auth_param0))
            CALL apoc.util.validate(NOT ((this.\`id\` IS NOT NULL AND this.\`id\` = $thisauth_param0)), \\"@neo4j/graphql/FORBIDDEN\\", [0])
            RETURN { count: count(this) }"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"param0\\": \\"some-name\\",
                \\"auth_param0\\": \\"super_admin\\",
                \\"thisauth_param0\\": \\"super_admin\\"
            }"
        `);
    });

    test("Field Int with auth", async () => {
        const query = gql`
            {
                usersAggregate {
                    imdbRatingInt {
                        min
                        max
                    }
                }
            }
        `;

        const req = createJwtRequest("secret", { sub: "super_admin" });
        const result = await translateQuery(neoSchema, query, {
            req,
        });

        expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
            "MATCH (this:\`User\`)
            WHERE (this.\`id\` IS NOT NULL AND this.\`id\` = $auth_param0)
            CALL apoc.util.validate(NOT ((this.\`id\` IS NOT NULL AND this.\`id\` = $thisauth_param0)), \\"@neo4j/graphql/FORBIDDEN\\", [0])
            CALL apoc.util.validate(NOT ((this.\`id\` IS NOT NULL AND this.\`id\` = $thisauth_param0)), \\"@neo4j/graphql/FORBIDDEN\\", [0])
            RETURN { imdbRatingInt: { min: min(this.imdbRatingInt), max: max(this.imdbRatingInt) } }"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"auth_param0\\": \\"super_admin\\",
                \\"thisauth_param0\\": \\"super_admin\\"
            }"
        `);
    });

    test("Field Float with auth", async () => {
        const query = gql`
            {
                usersAggregate {
                    imdbRatingFloat {
                        min
                        max
                    }
                }
            }
        `;

        const req = createJwtRequest("secret", { sub: "super_admin" });
        const result = await translateQuery(neoSchema, query, {
            req,
        });

        expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
            "MATCH (this:\`User\`)
            WHERE (this.\`id\` IS NOT NULL AND this.\`id\` = $auth_param0)
            CALL apoc.util.validate(NOT ((this.\`id\` IS NOT NULL AND this.\`id\` = $thisauth_param0)), \\"@neo4j/graphql/FORBIDDEN\\", [0])
            CALL apoc.util.validate(NOT ((this.\`id\` IS NOT NULL AND this.\`id\` = $thisauth_param0)), \\"@neo4j/graphql/FORBIDDEN\\", [0])
            RETURN { imdbRatingFloat: { min: min(this.imdbRatingFloat), max: max(this.imdbRatingFloat) } }"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"auth_param0\\": \\"super_admin\\",
                \\"thisauth_param0\\": \\"super_admin\\"
            }"
        `);
    });

    test("Field BigInt with auth", async () => {
        const query = gql`
            {
                usersAggregate {
                    imdbRatingBigInt {
                        min
                        max
                    }
                }
            }
        `;

        const req = createJwtRequest("secret", { sub: "super_admin" });
        const result = await translateQuery(neoSchema, query, {
            req,
        });

        expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
            "MATCH (this:\`User\`)
            WHERE (this.\`id\` IS NOT NULL AND this.\`id\` = $auth_param0)
            CALL apoc.util.validate(NOT ((this.\`id\` IS NOT NULL AND this.\`id\` = $thisauth_param0)), \\"@neo4j/graphql/FORBIDDEN\\", [0])
            CALL apoc.util.validate(NOT ((this.\`id\` IS NOT NULL AND this.\`id\` = $thisauth_param0)), \\"@neo4j/graphql/FORBIDDEN\\", [0])
            RETURN { imdbRatingBigInt: { min: min(this.imdbRatingBigInt), max: max(this.imdbRatingBigInt) } }"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"auth_param0\\": \\"super_admin\\",
                \\"thisauth_param0\\": \\"super_admin\\"
            }"
        `);
    });

    test("Field ID with auth", async () => {
        const query = gql`
            {
                usersAggregate {
                    id {
                        shortest
                        longest
                    }
                }
            }
        `;

        const req = createJwtRequest("secret", { sub: "super_admin" });
        const result = await translateQuery(neoSchema, query, {
            req,
        });

        expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
            "MATCH (this:\`User\`)
            WHERE (this.\`id\` IS NOT NULL AND this.\`id\` = $auth_param0)
            CALL apoc.util.validate(NOT ((this.\`id\` IS NOT NULL AND this.\`id\` = $thisauth_param0)), \\"@neo4j/graphql/FORBIDDEN\\", [0])
            CALL apoc.util.validate(NOT ((this.\`id\` IS NOT NULL AND this.\`id\` = $thisauth_param0)), \\"@neo4j/graphql/FORBIDDEN\\", [0])
            RETURN { id: { shortest: min(this.id), longest: max(this.id) } }"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"auth_param0\\": \\"super_admin\\",
                \\"thisauth_param0\\": \\"super_admin\\"
            }"
        `);
    });

    test("Field String with auth", async () => {
        const query = gql`
            {
                usersAggregate {
                    name {
                        shortest
                        longest
                    }
                }
            }
        `;

        const req = createJwtRequest("secret", { sub: "super_admin" });
        const result = await translateQuery(neoSchema, query, {
            req,
        });

        expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
            "MATCH (this:\`User\`)
            WHERE (this.\`id\` IS NOT NULL AND this.\`id\` = $auth_param0)
            CALL apoc.util.validate(NOT ((this.\`id\` IS NOT NULL AND this.\`id\` = $thisauth_param0)), \\"@neo4j/graphql/FORBIDDEN\\", [0])
            CALL apoc.util.validate(NOT ((this.\`id\` IS NOT NULL AND this.\`id\` = $thisauth_param0)), \\"@neo4j/graphql/FORBIDDEN\\", [0])
            RETURN { name: { shortest:
                                        reduce(aggVar = collect(this.name)[0], current IN collect(this.name) |
                                            CASE
                                            WHEN size(current) < size(aggVar) THEN current
                                            ELSE aggVar
                                            END
                                        )
                                    , longest:
                                        reduce(aggVar = collect(this.name)[0], current IN collect(this.name) |
                                            CASE
                                            WHEN size(current) > size(aggVar) THEN current
                                            ELSE aggVar
                                            END
                                        )
                                     } }"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"auth_param0\\": \\"super_admin\\",
                \\"thisauth_param0\\": \\"super_admin\\"
            }"
        `);
    });

    test("Field DateTime with auth", async () => {
        const query = gql`
            {
                usersAggregate {
                    createdAt {
                        min
                        max
                    }
                }
            }
        `;

        const req = createJwtRequest("secret", { sub: "super_admin" });
        const result = await translateQuery(neoSchema, query, {
            req,
        });

        expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
            "MATCH (this:\`User\`)
            WHERE (this.\`id\` IS NOT NULL AND this.\`id\` = $auth_param0)
            CALL apoc.util.validate(NOT ((this.\`id\` IS NOT NULL AND this.\`id\` = $thisauth_param0)), \\"@neo4j/graphql/FORBIDDEN\\", [0])
            CALL apoc.util.validate(NOT ((this.\`id\` IS NOT NULL AND this.\`id\` = $thisauth_param0)), \\"@neo4j/graphql/FORBIDDEN\\", [0])
            RETURN { createdAt: { min: apoc.date.convertFormat(toString(min(this.createdAt)), \\"iso_zoned_date_time\\", \\"iso_offset_date_time\\"), max: apoc.date.convertFormat(toString(max(this.createdAt)), \\"iso_zoned_date_time\\", \\"iso_offset_date_time\\") } }"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"auth_param0\\": \\"super_admin\\",
                \\"thisauth_param0\\": \\"super_admin\\"
            }"
        `);
    });
});
