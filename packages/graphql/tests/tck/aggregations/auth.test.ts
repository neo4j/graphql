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

import { Neo4jGraphQL } from "../../../src";
import { createBearerToken } from "../../utils/create-bearer-token";
import { formatCypher, formatParams, translateQuery } from "../utils/tck-test-utils";

describe("Cypher Aggregations with Auth", () => {
    const secret = "secret";
    let typeDefs: string;
    let neoSchema: Neo4jGraphQL;

    beforeAll(() => {
        typeDefs = /* GraphQL */ `
            type User @node {
                id: ID
                    @authorization(
                        validate: [{ operations: [READ], when: [BEFORE], where: { node: { id: { eq: "$jwt.sub" } } } }]
                    )
                name: String!
                    @authorization(
                        validate: [{ operations: [READ], when: [BEFORE], where: { node: { id: { eq: "$jwt.sub" } } } }]
                    )
                imdbRatingInt: Int!
                    @authorization(
                        validate: [{ operations: [READ], when: [BEFORE], where: { node: { id: { eq: "$jwt.sub" } } } }]
                    )
                imdbRatingFloat: Float!
                    @authorization(
                        validate: [{ operations: [READ], when: [BEFORE], where: { node: { id: { eq: "$jwt.sub" } } } }]
                    )
                imdbRatingBigInt: BigInt!
                    @authorization(
                        validate: [{ operations: [READ], when: [BEFORE], where: { node: { id: { eq: "$jwt.sub" } } } }]
                    )
                createdAt: DateTime
                    @authorization(
                        validate: [{ operations: [READ], when: [BEFORE], where: { node: { id: { eq: "$jwt.sub" } } } }]
                    )
            }

            extend type User
                @authorization(
                    validate: [{ operations: [AGGREGATE], when: [BEFORE], where: { node: { id: { eq: "$jwt.sub" } } } }]
                    filter: [{ operations: [AGGREGATE], where: { node: { id: { eq: "$jwt.sub" } } } }]
                )
        `;

        neoSchema = new Neo4jGraphQL({
            typeDefs,
            features: { authorization: { key: secret } },
        });
    });

    test("Simple Count", async () => {
        const query = /* GraphQL */ `
            {
                usersConnection {
                    aggregate {
                        count {
                            nodes
                        }
                    }
                }
            }
        `;

        const token = createBearerToken("secret", { sub: "super_admin" });
        const result = await translateQuery(neoSchema, query, { token });

        expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
            "CYPHER 5
            CALL {
                MATCH (this:User)
                WHERE ($isAuthenticated = true AND ($jwt.sub IS NOT NULL AND this.id = $jwt.sub))
                CALL apoc.util.validate(NOT ($isAuthenticated = true AND ($jwt.sub IS NOT NULL AND this.id = $jwt.sub)), \\"@neo4j/graphql/FORBIDDEN\\", [0])
                RETURN { nodes: count(DISTINCT this) } AS var0
            }
            RETURN { aggregate: { count: var0 } } AS this"
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

    test("Count with WHERE", async () => {
        const query = /* GraphQL */ `
            {
                usersConnection(where: { name: { eq: "some-name" } }) {
                    aggregate {
                        count {
                            nodes
                        }
                    }
                }
            }
        `;

        const token = createBearerToken("secret", { sub: "super_admin" });
        const result = await translateQuery(neoSchema, query, { token });

        expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
            "CYPHER 5
            CALL {
                MATCH (this:User)
                WHERE (this.name = $param0 AND ($isAuthenticated = true AND ($jwt.sub IS NOT NULL AND this.id = $jwt.sub)))
                CALL apoc.util.validate(NOT ($isAuthenticated = true AND ($jwt.sub IS NOT NULL AND this.id = $jwt.sub)), \\"@neo4j/graphql/FORBIDDEN\\", [0])
                RETURN { nodes: count(DISTINCT this) } AS var0
            }
            RETURN { aggregate: { count: var0 } } AS this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"param0\\": \\"some-name\\",
                \\"isAuthenticated\\": true,
                \\"jwt\\": {
                    \\"roles\\": [],
                    \\"sub\\": \\"super_admin\\"
                }
            }"
        `);
    });

    test("Field Int with auth", async () => {
        const query = /* GraphQL */ `
            {
                usersConnection {
                    aggregate {
                        node {
                            imdbRatingInt {
                                min
                                max
                            }
                        }
                    }
                }
            }
        `;

        const token = createBearerToken("secret", { sub: "super_admin" });
        const result = await translateQuery(neoSchema, query, { token });

        expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
            "CYPHER 5
            CALL {
                MATCH (this:User)
                WHERE ($isAuthenticated = true AND ($jwt.sub IS NOT NULL AND this.id = $jwt.sub))
                CALL apoc.util.validate(NOT ($isAuthenticated = true AND ($jwt.sub IS NOT NULL AND this.id = $jwt.sub)), \\"@neo4j/graphql/FORBIDDEN\\", [0])
                WITH DISTINCT this
                RETURN { min: min(this.imdbRatingInt), max: max(this.imdbRatingInt) } AS var0
            }
            RETURN { aggregate: { node: { imdbRatingInt: var0 } } } AS this"
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

    test("Field Float with auth", async () => {
        const query = /* GraphQL */ `
            {
                usersConnection {
                    aggregate {
                        node {
                            imdbRatingFloat {
                                min
                                max
                            }
                        }
                    }
                }
            }
        `;

        const token = createBearerToken("secret", { sub: "super_admin" });
        const result = await translateQuery(neoSchema, query, { token });

        expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
            "CYPHER 5
            CALL {
                MATCH (this:User)
                WHERE ($isAuthenticated = true AND ($jwt.sub IS NOT NULL AND this.id = $jwt.sub))
                CALL apoc.util.validate(NOT ($isAuthenticated = true AND ($jwt.sub IS NOT NULL AND this.id = $jwt.sub)), \\"@neo4j/graphql/FORBIDDEN\\", [0])
                WITH DISTINCT this
                RETURN { min: min(this.imdbRatingFloat), max: max(this.imdbRatingFloat) } AS var0
            }
            RETURN { aggregate: { node: { imdbRatingFloat: var0 } } } AS this"
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

    test("Field BigInt with auth", async () => {
        const query = /* GraphQL */ `
            {
                usersConnection {
                    aggregate {
                        node {
                            imdbRatingBigInt {
                                min
                                max
                            }
                        }
                    }
                }
            }
        `;

        const token = createBearerToken("secret", { sub: "super_admin" });
        const result = await translateQuery(neoSchema, query, { token });

        expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
            "CYPHER 5
            CALL {
                MATCH (this:User)
                WHERE ($isAuthenticated = true AND ($jwt.sub IS NOT NULL AND this.id = $jwt.sub))
                CALL apoc.util.validate(NOT ($isAuthenticated = true AND ($jwt.sub IS NOT NULL AND this.id = $jwt.sub)), \\"@neo4j/graphql/FORBIDDEN\\", [0])
                WITH DISTINCT this
                RETURN { min: min(this.imdbRatingBigInt), max: max(this.imdbRatingBigInt) } AS var0
            }
            RETURN { aggregate: { node: { imdbRatingBigInt: var0 } } } AS this"
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

    test("Field String with auth", async () => {
        const query = /* GraphQL */ `
            {
                usersConnection {
                    aggregate {
                        node {
                            name {
                                shortest
                                longest
                            }
                        }
                    }
                }
            }
        `;

        const token = createBearerToken("secret", { sub: "super_admin" });
        const result = await translateQuery(neoSchema, query, { token });

        expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
            "CYPHER 5
            CALL {
                MATCH (this:User)
                WHERE ($isAuthenticated = true AND ($jwt.sub IS NOT NULL AND this.id = $jwt.sub))
                CALL apoc.util.validate(NOT ($isAuthenticated = true AND ($jwt.sub IS NOT NULL AND this.id = $jwt.sub)), \\"@neo4j/graphql/FORBIDDEN\\", [0])
                WITH DISTINCT this
                ORDER BY size(this.name) DESC
                WITH collect(this.name) AS list
                RETURN { longest: head(list), shortest: last(list) } AS var0
            }
            RETURN { aggregate: { node: { name: var0 } } } AS this"
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

    test("Field DateTime with auth", async () => {
        const query = /* GraphQL */ `
            {
                usersConnection {
                    aggregate {
                        node {
                            createdAt {
                                min
                                max
                            }
                        }
                    }
                }
            }
        `;

        const token = createBearerToken("secret", { sub: "super_admin" });
        const result = await translateQuery(neoSchema, query, { token });

        expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
            "CYPHER 5
            CALL {
                MATCH (this:User)
                WHERE ($isAuthenticated = true AND ($jwt.sub IS NOT NULL AND this.id = $jwt.sub))
                CALL apoc.util.validate(NOT ($isAuthenticated = true AND ($jwt.sub IS NOT NULL AND this.id = $jwt.sub)), \\"@neo4j/graphql/FORBIDDEN\\", [0])
                WITH DISTINCT this
                RETURN { min: apoc.date.convertFormat(toString(min(this.createdAt)), \\"iso_zoned_date_time\\", \\"iso_offset_date_time\\"), max: apoc.date.convertFormat(toString(max(this.createdAt)), \\"iso_zoned_date_time\\", \\"iso_offset_date_time\\") } AS var0
            }
            RETURN { aggregate: { node: { createdAt: var0 } } } AS this"
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
