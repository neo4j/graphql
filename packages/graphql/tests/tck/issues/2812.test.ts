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
import { Neo4jGraphQL } from "../../../src";
import { formatCypher, translateQuery, formatParams } from "../utils/tck-test-utils";
import { createJwtRequest } from "../../utils/create-jwt-request";
import { Neo4jGraphQLAuthJWTPlugin } from "@neo4j/graphql-plugin-auth";

describe("https://github.com/neo4j/graphql/issues/2812", () => {
    const secret = "secret";
    const typeDefs = `
        type Actor @auth(rules: [{ allow: { nodeCreatedBy: "$jwt.sub" } }]) {
            id: ID! @id
            name: String
            nodeCreatedBy: String
            fieldA: String @auth(rules: [{ operations: [CREATE, UPDATE], roles: ["role-A"] }])
            fieldB: String @auth(rules: [{ operations: [CREATE, UPDATE], roles: ["role-B"] }])
            movies: [Movie!]! @relationship(type: "ACTED_IN", direction: OUT)
        }
        type Movie @auth(rules: [{ operations: [CREATE, UPDATE], roles: ["admin"] }]) {
            id: ID
            actors: [Actor!]! @relationship(type: "ACTED_IN", direction: IN)
        }
    `;

    const neoSchema = new Neo4jGraphQL({
        typeDefs,
        plugins: {
            auth: new Neo4jGraphQLAuthJWTPlugin({
                secret,
            }),
        },
    });

    test("auth fields partially included in the input", async () => {
        const query = gql`
            mutation {
                createMovies(
                    input: [
                        {
                            id: "1"
                            actors: { create: [{ node: { nodeCreatedBy: "User", name: "actor 1", fieldA: "b" } }] }
                        }
                        { id: "2", actors: { create: [{ node: { nodeCreatedBy: "User", fieldB: "a" } }] } }
                    ]
                ) {
                    movies {
                        id
                        actors {
                            name
                        }
                    }
                }
            }
        `;
        const req = createJwtRequest(secret, { roles: ["role-A", "role-B", "admin"], sub: "User" });
        const result = await translateQuery(neoSchema, query, { req });

        expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
            "UNWIND $create_param1 AS create_var4
            CALL {
                WITH create_var4
                CREATE (create_this0:\`Movie\`)
                SET
                    create_this0.\`id\` = create_var4.\`id\`
                WITH create_this0, create_var4
                CALL {
                    WITH create_this0, create_var4
                    UNWIND create_var4.\`actors\`.\`create\` AS create_var5
                    WITH create_var5.\`node\` AS create_var6, create_var5.\`edge\` AS create_var7, create_this0
                    CREATE (create_this8:\`Actor\`)
                    SET
                        create_this8.\`name\` = create_var6.\`name\`,
                        create_this8.\`nodeCreatedBy\` = create_var6.\`nodeCreatedBy\`,
                        create_this8.\`fieldA\` = create_var6.\`fieldA\`,
                        create_this8.\`fieldB\` = create_var6.\`fieldB\`,
                        create_this8.\`id\` = randomUUID()
                    MERGE (create_this0)<-[create_this9:\`ACTED_IN\`]-(create_this8)
                    WITH *
                    CALL apoc.util.validate(NOT ((create_var6.\`fieldA\` IS NULL OR any(create_var11 IN [\\"role-A\\"] WHERE any(create_var10 IN $auth.\`roles\` WHERE create_var10 = create_var11))) AND (create_var6.\`fieldB\` IS NULL OR any(create_var13 IN [\\"role-B\\"] WHERE any(create_var12 IN $auth.\`roles\` WHERE create_var12 = create_var13)))), \\"@neo4j/graphql/FORBIDDEN\\", [0])
                    RETURN collect(NULL) AS create_var14
                }
                WITH *
                CALL apoc.util.validate(NOT (any(create_var16 IN [\\"admin\\"] WHERE any(create_var15 IN $auth.\`roles\` WHERE create_var15 = create_var16))), \\"@neo4j/graphql/FORBIDDEN\\", [0])
                RETURN create_this0
            }
            CALL {
                WITH create_this0
                MATCH (create_this0)<-[create_this1:\`ACTED_IN\`]-(create_this2:\`Actor\`)
                WHERE apoc.util.validatePredicate(NOT ((create_this2.\`nodeCreatedBy\` IS NOT NULL AND create_this2.\`nodeCreatedBy\` = $create_param0)), \\"@neo4j/graphql/FORBIDDEN\\", [0])
                WITH create_this2 { .name } AS create_this2
                RETURN collect(create_this2) AS create_var3
            }
            RETURN collect(create_this0 { .id, actors: create_var3 }) AS data"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"create_param0\\": \\"User\\",
                \\"create_param1\\": [
                    {
                        \\"id\\": \\"1\\",
                        \\"actors\\": {
                            \\"create\\": [
                                {
                                    \\"node\\": {
                                        \\"name\\": \\"actor 1\\",
                                        \\"nodeCreatedBy\\": \\"User\\",
                                        \\"fieldA\\": \\"b\\"
                                    }
                                }
                            ]
                        }
                    },
                    {
                        \\"id\\": \\"2\\",
                        \\"actors\\": {
                            \\"create\\": [
                                {
                                    \\"node\\": {
                                        \\"nodeCreatedBy\\": \\"User\\",
                                        \\"fieldB\\": \\"a\\"
                                    }
                                }
                            ]
                        }
                    }
                ],
                \\"resolvedCallbacks\\": {},
                \\"auth\\": {
                    \\"isAuthenticated\\": true,
                    \\"roles\\": [
                        \\"role-A\\",
                        \\"role-B\\",
                        \\"admin\\"
                    ],
                    \\"jwt\\": {
                        \\"roles\\": [
                            \\"role-A\\",
                            \\"role-B\\",
                            \\"admin\\"
                        ],
                        \\"sub\\": \\"User\\"
                    }
                }
            }"
        `);
    });

    test("auth fields always included in the input", async () => {
        const query = gql`
            mutation {
                createMovies(
                    input: [
                        {
                            id: "1"
                            actors: {
                                create: [{ node: { nodeCreatedBy: "User", name: "actor 1", fieldA: "b", fieldB: "a" } }]
                            }
                        }
                        { id: "2", actors: { create: [{ node: { nodeCreatedBy: "User", fieldA: "b", fieldB: "a" } }] } }
                    ]
                ) {
                    movies {
                        id
                        actors {
                            name
                        }
                    }
                }
            }
        `;
        const req = createJwtRequest(secret, { roles: ["role-A", "role-B", "admin"], sub: "User" });
        const result = await translateQuery(neoSchema, query, { req });

        expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
            "UNWIND $create_param1 AS create_var4
            CALL {
                WITH create_var4
                CREATE (create_this0:\`Movie\`)
                SET
                    create_this0.\`id\` = create_var4.\`id\`
                WITH create_this0, create_var4
                CALL {
                    WITH create_this0, create_var4
                    UNWIND create_var4.\`actors\`.\`create\` AS create_var5
                    WITH create_var5.\`node\` AS create_var6, create_var5.\`edge\` AS create_var7, create_this0
                    CREATE (create_this8:\`Actor\`)
                    SET
                        create_this8.\`name\` = create_var6.\`name\`,
                        create_this8.\`nodeCreatedBy\` = create_var6.\`nodeCreatedBy\`,
                        create_this8.\`fieldA\` = create_var6.\`fieldA\`,
                        create_this8.\`fieldB\` = create_var6.\`fieldB\`,
                        create_this8.\`id\` = randomUUID()
                    MERGE (create_this0)<-[create_this9:\`ACTED_IN\`]-(create_this8)
                    WITH *
                    CALL apoc.util.validate(NOT ((create_var6.\`fieldA\` IS NULL OR any(create_var11 IN [\\"role-A\\"] WHERE any(create_var10 IN $auth.\`roles\` WHERE create_var10 = create_var11))) AND (create_var6.\`fieldB\` IS NULL OR any(create_var13 IN [\\"role-B\\"] WHERE any(create_var12 IN $auth.\`roles\` WHERE create_var12 = create_var13)))), \\"@neo4j/graphql/FORBIDDEN\\", [0])
                    RETURN collect(NULL) AS create_var14
                }
                WITH *
                CALL apoc.util.validate(NOT (any(create_var16 IN [\\"admin\\"] WHERE any(create_var15 IN $auth.\`roles\` WHERE create_var15 = create_var16))), \\"@neo4j/graphql/FORBIDDEN\\", [0])
                RETURN create_this0
            }
            CALL {
                WITH create_this0
                MATCH (create_this0)<-[create_this1:\`ACTED_IN\`]-(create_this2:\`Actor\`)
                WHERE apoc.util.validatePredicate(NOT ((create_this2.\`nodeCreatedBy\` IS NOT NULL AND create_this2.\`nodeCreatedBy\` = $create_param0)), \\"@neo4j/graphql/FORBIDDEN\\", [0])
                WITH create_this2 { .name } AS create_this2
                RETURN collect(create_this2) AS create_var3
            }
            RETURN collect(create_this0 { .id, actors: create_var3 }) AS data"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"create_param0\\": \\"User\\",
                \\"create_param1\\": [
                    {
                        \\"id\\": \\"1\\",
                        \\"actors\\": {
                            \\"create\\": [
                                {
                                    \\"node\\": {
                                        \\"name\\": \\"actor 1\\",
                                        \\"nodeCreatedBy\\": \\"User\\",
                                        \\"fieldA\\": \\"b\\",
                                        \\"fieldB\\": \\"a\\"
                                    }
                                }
                            ]
                        }
                    },
                    {
                        \\"id\\": \\"2\\",
                        \\"actors\\": {
                            \\"create\\": [
                                {
                                    \\"node\\": {
                                        \\"nodeCreatedBy\\": \\"User\\",
                                        \\"fieldA\\": \\"b\\",
                                        \\"fieldB\\": \\"a\\"
                                    }
                                }
                            ]
                        }
                    }
                ],
                \\"resolvedCallbacks\\": {},
                \\"auth\\": {
                    \\"isAuthenticated\\": true,
                    \\"roles\\": [
                        \\"role-A\\",
                        \\"role-B\\",
                        \\"admin\\"
                    ],
                    \\"jwt\\": {
                        \\"roles\\": [
                            \\"role-A\\",
                            \\"role-B\\",
                            \\"admin\\"
                        ],
                        \\"sub\\": \\"User\\"
                    }
                }
            }"
        `);
    });

    test("auth fields not included in the input", async () => {
        const query = gql`
            mutation {
                createMovies(
                    input: [
                        { id: "1", actors: { create: [{ node: { nodeCreatedBy: "User", name: "actor 1" } }] } }
                        { id: "2", actors: { create: [{ node: { nodeCreatedBy: "User" } }] } }
                    ]
                ) {
                    movies {
                        id
                        actors {
                            name
                        }
                    }
                }
            }
        `;

        const req = createJwtRequest(secret, { roles: ["role-A", "role-B", "admin"], sub: "User" });
        const result = await translateQuery(neoSchema, query, { req });

        expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
            "UNWIND $create_param1 AS create_var4
            CALL {
                WITH create_var4
                CREATE (create_this0:\`Movie\`)
                SET
                    create_this0.\`id\` = create_var4.\`id\`
                WITH create_this0, create_var4
                CALL {
                    WITH create_this0, create_var4
                    UNWIND create_var4.\`actors\`.\`create\` AS create_var5
                    WITH create_var5.\`node\` AS create_var6, create_var5.\`edge\` AS create_var7, create_this0
                    CREATE (create_this8:\`Actor\`)
                    SET
                        create_this8.\`name\` = create_var6.\`name\`,
                        create_this8.\`nodeCreatedBy\` = create_var6.\`nodeCreatedBy\`,
                        create_this8.\`id\` = randomUUID()
                    MERGE (create_this0)<-[create_this9:\`ACTED_IN\`]-(create_this8)
                    RETURN collect(NULL) AS create_var10
                }
                WITH *
                CALL apoc.util.validate(NOT (any(create_var12 IN [\\"admin\\"] WHERE any(create_var11 IN $auth.\`roles\` WHERE create_var11 = create_var12))), \\"@neo4j/graphql/FORBIDDEN\\", [0])
                RETURN create_this0
            }
            CALL {
                WITH create_this0
                MATCH (create_this0)<-[create_this1:\`ACTED_IN\`]-(create_this2:\`Actor\`)
                WHERE apoc.util.validatePredicate(NOT ((create_this2.\`nodeCreatedBy\` IS NOT NULL AND create_this2.\`nodeCreatedBy\` = $create_param0)), \\"@neo4j/graphql/FORBIDDEN\\", [0])
                WITH create_this2 { .name } AS create_this2
                RETURN collect(create_this2) AS create_var3
            }
            RETURN collect(create_this0 { .id, actors: create_var3 }) AS data"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"create_param0\\": \\"User\\",
                \\"create_param1\\": [
                    {
                        \\"id\\": \\"1\\",
                        \\"actors\\": {
                            \\"create\\": [
                                {
                                    \\"node\\": {
                                        \\"name\\": \\"actor 1\\",
                                        \\"nodeCreatedBy\\": \\"User\\"
                                    }
                                }
                            ]
                        }
                    },
                    {
                        \\"id\\": \\"2\\",
                        \\"actors\\": {
                            \\"create\\": [
                                {
                                    \\"node\\": {
                                        \\"nodeCreatedBy\\": \\"User\\"
                                    }
                                }
                            ]
                        }
                    }
                ],
                \\"resolvedCallbacks\\": {},
                \\"auth\\": {
                    \\"isAuthenticated\\": true,
                    \\"roles\\": [
                        \\"role-A\\",
                        \\"role-B\\",
                        \\"admin\\"
                    ],
                    \\"jwt\\": {
                        \\"roles\\": [
                            \\"role-A\\",
                            \\"role-B\\",
                            \\"admin\\"
                        ],
                        \\"sub\\": \\"User\\"
                    }
                }
            }"
        `);
    });
});
