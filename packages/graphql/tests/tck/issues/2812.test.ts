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
            "UNWIND $create_param1 AS create_var2
            CALL {
                WITH create_var2
                CREATE (create_this1:\`Movie\`)
                SET
                    create_this1.id = create_var2.id
                WITH create_this1, create_var2
                CALL {
                    WITH create_this1, create_var2
                    UNWIND create_var2.actors.create AS create_var3
                    WITH create_var3.node AS create_var4, create_var3.edge AS create_var5, create_this1
                    CREATE (create_this6:\`Actor\`)
                    SET
                        create_this6.name = create_var4.name,
                        create_this6.nodeCreatedBy = create_var4.nodeCreatedBy,
                        create_this6.fieldA = create_var4.fieldA,
                        create_this6.fieldB = create_var4.fieldB,
                        create_this6.id = randomUUID()
                    MERGE (create_this6)-[create_this7:ACTED_IN]->(create_this1)
                    WITH *
                    CALL apoc.util.validate(NOT ((create_var4.fieldA IS NULL OR any(auth_var1 IN [\\"role-A\\"] WHERE any(auth_var0 IN $auth.roles WHERE auth_var0 = auth_var1))) AND (create_var4.fieldB IS NULL OR any(auth_var1 IN [\\"role-B\\"] WHERE any(auth_var0 IN $auth.roles WHERE auth_var0 = auth_var1)))), \\"@neo4j/graphql/FORBIDDEN\\", [0])
                    RETURN collect(NULL) AS create_var8
                }
                WITH *
                CALL apoc.util.validate(NOT (any(auth_var1 IN [\\"admin\\"] WHERE any(auth_var0 IN $auth.roles WHERE auth_var0 = auth_var1))), \\"@neo4j/graphql/FORBIDDEN\\", [0])
                RETURN create_this1
            }
            CALL {
                WITH create_this1
                MATCH (create_this1_actors:\`Actor\`)-[create_this0:ACTED_IN]->(create_this1)
                WHERE apoc.util.validatePredicate(NOT ((create_this1_actors.nodeCreatedBy IS NOT NULL AND create_this1_actors.nodeCreatedBy = $create_param0)), \\"@neo4j/graphql/FORBIDDEN\\", [0])
                WITH create_this1_actors { .name } AS create_this1_actors
                RETURN collect(create_this1_actors) AS create_this1_actors
            }
            RETURN collect(create_this1 { .id, actors: create_this1_actors }) AS data"
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
            "UNWIND $create_param1 AS create_var2
            CALL {
                WITH create_var2
                CREATE (create_this1:\`Movie\`)
                SET
                    create_this1.id = create_var2.id
                WITH create_this1, create_var2
                CALL {
                    WITH create_this1, create_var2
                    UNWIND create_var2.actors.create AS create_var3
                    WITH create_var3.node AS create_var4, create_var3.edge AS create_var5, create_this1
                    CREATE (create_this6:\`Actor\`)
                    SET
                        create_this6.name = create_var4.name,
                        create_this6.nodeCreatedBy = create_var4.nodeCreatedBy,
                        create_this6.fieldA = create_var4.fieldA,
                        create_this6.fieldB = create_var4.fieldB,
                        create_this6.id = randomUUID()
                    MERGE (create_this6)-[create_this7:ACTED_IN]->(create_this1)
                    WITH *
                    CALL apoc.util.validate(NOT ((create_var4.fieldA IS NULL OR any(auth_var1 IN [\\"role-A\\"] WHERE any(auth_var0 IN $auth.roles WHERE auth_var0 = auth_var1))) AND (create_var4.fieldB IS NULL OR any(auth_var1 IN [\\"role-B\\"] WHERE any(auth_var0 IN $auth.roles WHERE auth_var0 = auth_var1)))), \\"@neo4j/graphql/FORBIDDEN\\", [0])
                    RETURN collect(NULL) AS create_var8
                }
                WITH *
                CALL apoc.util.validate(NOT (any(auth_var1 IN [\\"admin\\"] WHERE any(auth_var0 IN $auth.roles WHERE auth_var0 = auth_var1))), \\"@neo4j/graphql/FORBIDDEN\\", [0])
                RETURN create_this1
            }
            CALL {
                WITH create_this1
                MATCH (create_this1_actors:\`Actor\`)-[create_this0:ACTED_IN]->(create_this1)
                WHERE apoc.util.validatePredicate(NOT ((create_this1_actors.nodeCreatedBy IS NOT NULL AND create_this1_actors.nodeCreatedBy = $create_param0)), \\"@neo4j/graphql/FORBIDDEN\\", [0])
                WITH create_this1_actors { .name } AS create_this1_actors
                RETURN collect(create_this1_actors) AS create_this1_actors
            }
            RETURN collect(create_this1 { .id, actors: create_this1_actors }) AS data"
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
            "UNWIND $create_param1 AS create_var2
            CALL {
                WITH create_var2
                CREATE (create_this1:\`Movie\`)
                SET
                    create_this1.id = create_var2.id
                WITH create_this1, create_var2
                CALL {
                    WITH create_this1, create_var2
                    UNWIND create_var2.actors.create AS create_var3
                    WITH create_var3.node AS create_var4, create_var3.edge AS create_var5, create_this1
                    CREATE (create_this6:\`Actor\`)
                    SET
                        create_this6.name = create_var4.name,
                        create_this6.nodeCreatedBy = create_var4.nodeCreatedBy,
                        create_this6.id = randomUUID()
                    MERGE (create_this6)-[create_this7:ACTED_IN]->(create_this1)
                    RETURN collect(NULL) AS create_var8
                }
                WITH *
                CALL apoc.util.validate(NOT (any(auth_var1 IN [\\"admin\\"] WHERE any(auth_var0 IN $auth.roles WHERE auth_var0 = auth_var1))), \\"@neo4j/graphql/FORBIDDEN\\", [0])
                RETURN create_this1
            }
            CALL {
                WITH create_this1
                MATCH (create_this1_actors:\`Actor\`)-[create_this0:ACTED_IN]->(create_this1)
                WHERE apoc.util.validatePredicate(NOT ((create_this1_actors.nodeCreatedBy IS NOT NULL AND create_this1_actors.nodeCreatedBy = $create_param0)), \\"@neo4j/graphql/FORBIDDEN\\", [0])
                WITH create_this1_actors { .name } AS create_this1_actors
                RETURN collect(create_this1_actors) AS create_this1_actors
            }
            RETURN collect(create_this1 { .id, actors: create_this1_actors }) AS data"
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
