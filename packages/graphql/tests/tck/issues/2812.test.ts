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
import { formatCypher, translateQuery, formatParams } from "../utils/tck-test-utils";
import { createBearerToken } from "../../utils/create-bearer-token";

describe("https://github.com/neo4j/graphql/issues/2812", () => {
    const secret = "secret";
    const typeDefs = /* GraphQL */ `
        type JWT @jwt {
            roles: [String!]!
        }

        type Actor @authorization(validate: [{ when: [BEFORE], where: { node: { nodeCreatedBy: "$jwt.sub" } } }]) {
            id: ID! @id @unique
            name: String
            nodeCreatedBy: String
            fieldA: String
                @authorization(
                    validate: [{ operations: [CREATE, UPDATE], where: { jwt: { roles_INCLUDES: "role-A" } } }]
                )
            fieldB: String
                @authorization(
                    validate: [{ operations: [CREATE, UPDATE], where: { jwt: { roles_INCLUDES: "role-B" } } }]
                )
            movies: [Movie!]! @relationship(type: "ACTED_IN", direction: OUT)
        }
        type Movie
            @authorization(validate: [{ operations: [CREATE, UPDATE], where: { jwt: { roles_INCLUDES: "admin" } } }]) {
            id: ID
            actors: [Actor!]! @relationship(type: "ACTED_IN", direction: IN)
        }
    `;

    const neoSchema = new Neo4jGraphQL({
        typeDefs,
        features: { authorization: { key: secret } },
    });

    test("auth fields partially included in the input", async () => {
        const query = /* GraphQL */ `
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
        const token = createBearerToken(secret, { roles: ["role-A", "role-B", "admin"], sub: "User" });
        const result = await translateQuery(neoSchema, query, { token });

        expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
            "UNWIND $create_param0 AS create_var0
            CALL {
                WITH create_var0
                CREATE (create_this1:Movie)
                SET
                    create_this1.id = create_var0.id
                WITH create_this1, create_var0
                CALL {
                    WITH create_this1, create_var0
                    UNWIND create_var0.actors.create AS create_var2
                    CREATE (create_this3:Actor)
                    SET
                        create_this3.id = randomUUID(),
                        create_this3.name = create_var2.node.name,
                        create_this3.nodeCreatedBy = create_var2.node.nodeCreatedBy,
                        create_this3.fieldA = create_var2.node.fieldA,
                        create_this3.fieldB = create_var2.node.fieldB
                    MERGE (create_this1)<-[create_this4:ACTED_IN]-(create_this3)
                    WITH *
                    WHERE (apoc.util.validatePredicate((create_var2.node.fieldA IS NOT NULL AND NOT ($isAuthenticated = true AND ($jwt.roles IS NOT NULL AND $create_param3 IN $jwt.roles))), \\"@neo4j/graphql/FORBIDDEN\\", [0]) AND apoc.util.validatePredicate((create_var2.node.fieldB IS NOT NULL AND NOT ($isAuthenticated = true AND ($jwt.roles IS NOT NULL AND $create_param4 IN $jwt.roles))), \\"@neo4j/graphql/FORBIDDEN\\", [0]))
                    RETURN collect(NULL) AS create_var5
                }
                WITH *
                WHERE apoc.util.validatePredicate(NOT ($isAuthenticated = true AND ($jwt.roles IS NOT NULL AND $create_param5 IN $jwt.roles)), \\"@neo4j/graphql/FORBIDDEN\\", [0])
                RETURN create_this1
            }
            CALL {
                WITH create_this1
                MATCH (create_this1)<-[create_this6:ACTED_IN]-(create_this7:Actor)
                WHERE apoc.util.validatePredicate(NOT ($isAuthenticated = true AND ($jwt.sub IS NOT NULL AND create_this7.nodeCreatedBy = $jwt.sub)), \\"@neo4j/graphql/FORBIDDEN\\", [0])
                WITH create_this7 { .name } AS create_this7
                RETURN collect(create_this7) AS create_var8
            }
            RETURN collect(create_this1 { .id, actors: create_var8 }) AS data"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"create_param0\\": [
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
                \\"isAuthenticated\\": true,
                \\"jwt\\": {
                    \\"roles\\": [
                        \\"role-A\\",
                        \\"role-B\\",
                        \\"admin\\"
                    ],
                    \\"sub\\": \\"User\\"
                },
                \\"create_param3\\": \\"role-A\\",
                \\"create_param4\\": \\"role-B\\",
                \\"create_param5\\": \\"admin\\"
            }"
        `);
    });

    test("auth fields always included in the input", async () => {
        const query = /* GraphQL */ `
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
        const token = createBearerToken(secret, { roles: ["role-A", "role-B", "admin"], sub: "User" });
        const result = await translateQuery(neoSchema, query, { token });

        expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
            "UNWIND $create_param0 AS create_var0
            CALL {
                WITH create_var0
                CREATE (create_this1:Movie)
                SET
                    create_this1.id = create_var0.id
                WITH create_this1, create_var0
                CALL {
                    WITH create_this1, create_var0
                    UNWIND create_var0.actors.create AS create_var2
                    CREATE (create_this3:Actor)
                    SET
                        create_this3.id = randomUUID(),
                        create_this3.name = create_var2.node.name,
                        create_this3.nodeCreatedBy = create_var2.node.nodeCreatedBy,
                        create_this3.fieldA = create_var2.node.fieldA,
                        create_this3.fieldB = create_var2.node.fieldB
                    MERGE (create_this1)<-[create_this4:ACTED_IN]-(create_this3)
                    WITH *
                    WHERE (apoc.util.validatePredicate((create_var2.node.fieldA IS NOT NULL AND NOT ($isAuthenticated = true AND ($jwt.roles IS NOT NULL AND $create_param3 IN $jwt.roles))), \\"@neo4j/graphql/FORBIDDEN\\", [0]) AND apoc.util.validatePredicate((create_var2.node.fieldB IS NOT NULL AND NOT ($isAuthenticated = true AND ($jwt.roles IS NOT NULL AND $create_param4 IN $jwt.roles))), \\"@neo4j/graphql/FORBIDDEN\\", [0]))
                    RETURN collect(NULL) AS create_var5
                }
                WITH *
                WHERE apoc.util.validatePredicate(NOT ($isAuthenticated = true AND ($jwt.roles IS NOT NULL AND $create_param5 IN $jwt.roles)), \\"@neo4j/graphql/FORBIDDEN\\", [0])
                RETURN create_this1
            }
            CALL {
                WITH create_this1
                MATCH (create_this1)<-[create_this6:ACTED_IN]-(create_this7:Actor)
                WHERE apoc.util.validatePredicate(NOT ($isAuthenticated = true AND ($jwt.sub IS NOT NULL AND create_this7.nodeCreatedBy = $jwt.sub)), \\"@neo4j/graphql/FORBIDDEN\\", [0])
                WITH create_this7 { .name } AS create_this7
                RETURN collect(create_this7) AS create_var8
            }
            RETURN collect(create_this1 { .id, actors: create_var8 }) AS data"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"create_param0\\": [
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
                \\"isAuthenticated\\": true,
                \\"jwt\\": {
                    \\"roles\\": [
                        \\"role-A\\",
                        \\"role-B\\",
                        \\"admin\\"
                    ],
                    \\"sub\\": \\"User\\"
                },
                \\"create_param3\\": \\"role-A\\",
                \\"create_param4\\": \\"role-B\\",
                \\"create_param5\\": \\"admin\\"
            }"
        `);
    });

    test("auth fields not included in the input", async () => {
        const query = /* GraphQL */ `
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

        const token = createBearerToken(secret, { roles: ["role-A", "role-B", "admin"], sub: "User" });
        const result = await translateQuery(neoSchema, query, { token });

        expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
            "UNWIND $create_param0 AS create_var0
            CALL {
                WITH create_var0
                CREATE (create_this1:Movie)
                SET
                    create_this1.id = create_var0.id
                WITH create_this1, create_var0
                CALL {
                    WITH create_this1, create_var0
                    UNWIND create_var0.actors.create AS create_var2
                    CREATE (create_this3:Actor)
                    SET
                        create_this3.id = randomUUID(),
                        create_this3.name = create_var2.node.name,
                        create_this3.nodeCreatedBy = create_var2.node.nodeCreatedBy
                    MERGE (create_this1)<-[create_this4:ACTED_IN]-(create_this3)
                    WITH *
                    WHERE (apoc.util.validatePredicate((create_var2.node.fieldA IS NOT NULL AND NOT ($isAuthenticated = true AND ($jwt.roles IS NOT NULL AND $create_param3 IN $jwt.roles))), \\"@neo4j/graphql/FORBIDDEN\\", [0]) AND apoc.util.validatePredicate((create_var2.node.fieldB IS NOT NULL AND NOT ($isAuthenticated = true AND ($jwt.roles IS NOT NULL AND $create_param4 IN $jwt.roles))), \\"@neo4j/graphql/FORBIDDEN\\", [0]))
                    RETURN collect(NULL) AS create_var5
                }
                WITH *
                WHERE apoc.util.validatePredicate(NOT ($isAuthenticated = true AND ($jwt.roles IS NOT NULL AND $create_param5 IN $jwt.roles)), \\"@neo4j/graphql/FORBIDDEN\\", [0])
                RETURN create_this1
            }
            CALL {
                WITH create_this1
                MATCH (create_this1)<-[create_this6:ACTED_IN]-(create_this7:Actor)
                WHERE apoc.util.validatePredicate(NOT ($isAuthenticated = true AND ($jwt.sub IS NOT NULL AND create_this7.nodeCreatedBy = $jwt.sub)), \\"@neo4j/graphql/FORBIDDEN\\", [0])
                WITH create_this7 { .name } AS create_this7
                RETURN collect(create_this7) AS create_var8
            }
            RETURN collect(create_this1 { .id, actors: create_var8 }) AS data"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"create_param0\\": [
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
                \\"isAuthenticated\\": true,
                \\"jwt\\": {
                    \\"roles\\": [
                        \\"role-A\\",
                        \\"role-B\\",
                        \\"admin\\"
                    ],
                    \\"sub\\": \\"User\\"
                },
                \\"create_param3\\": \\"role-A\\",
                \\"create_param4\\": \\"role-B\\",
                \\"create_param5\\": \\"admin\\"
            }"
        `);
    });
});
