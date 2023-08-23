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
import { Neo4jGraphQL } from "../../../src";
import { formatCypher, translateQuery, formatParams } from "../utils/tck-test-utils";
import { createBearerToken } from "../../utils/create-bearer-token";

describe("https://github.com/neo4j/graphql/issues/2812", () => {
    const secret = "secret";
    const typeDefs = gql`
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
        const token = createBearerToken(secret, { roles: ["role-A", "role-B", "admin"], sub: "User" });
        const result = await translateQuery(neoSchema, query, { token });

        expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
            "UNWIND $create_param2 AS create_var4
            CALL {
                WITH create_var4
                CREATE (create_this0:Movie)
                SET
                    create_this0.id = create_var4.id
                WITH create_this0, create_var4
                CALL {
                    WITH create_this0, create_var4
                    UNWIND create_var4.actors.create AS create_var5
                    WITH create_var5.node AS create_var6, create_var5.edge AS create_var7, create_this0
                    CREATE (create_this8:Actor)
                    SET
                        create_this8.name = create_var6.name,
                        create_this8.nodeCreatedBy = create_var6.nodeCreatedBy,
                        create_this8.fieldA = create_var6.fieldA,
                        create_this8.fieldB = create_var6.fieldB,
                        create_this8.id = randomUUID()
                    MERGE (create_this0)<-[create_this9:ACTED_IN]-(create_this8)
                    WITH *
                    WHERE (apoc.util.validatePredicate((create_var6.fieldA IS NOT NULL AND NOT ($isAuthenticated = true AND $create_param3 IN $jwt.roles)), \\"@neo4j/graphql/FORBIDDEN\\", [0]) AND apoc.util.validatePredicate((create_var6.fieldB IS NOT NULL AND NOT ($isAuthenticated = true AND $create_param4 IN $jwt.roles)), \\"@neo4j/graphql/FORBIDDEN\\", [0]))
                    RETURN collect(NULL) AS create_var10
                }
                WITH *
                WHERE apoc.util.validatePredicate(NOT ($isAuthenticated = true AND $create_param5 IN $jwt.roles), \\"@neo4j/graphql/FORBIDDEN\\", [0])
                RETURN create_this0
            }
            CALL {
                WITH create_this0
                MATCH (create_this0)<-[create_this1:ACTED_IN]-(create_this2:Actor)
                WHERE apoc.util.validatePredicate(NOT ($isAuthenticated = true AND ($jwt.sub IS NOT NULL AND create_this2.nodeCreatedBy = $jwt.sub)), \\"@neo4j/graphql/FORBIDDEN\\", [0])
                WITH create_this2 { .name } AS create_this2
                RETURN collect(create_this2) AS create_var3
            }
            RETURN collect(create_this0 { .id, actors: create_var3 }) AS data"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"isAuthenticated\\": true,
                \\"jwt\\": {
                    \\"roles\\": [
                        \\"role-A\\",
                        \\"role-B\\",
                        \\"admin\\"
                    ],
                    \\"sub\\": \\"User\\"
                },
                \\"create_param2\\": [
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
                \\"create_param3\\": \\"role-A\\",
                \\"create_param4\\": \\"role-B\\",
                \\"create_param5\\": \\"admin\\",
                \\"resolvedCallbacks\\": {}
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
        const token = createBearerToken(secret, { roles: ["role-A", "role-B", "admin"], sub: "User" });
        const result = await translateQuery(neoSchema, query, { token });

        expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
            "UNWIND $create_param2 AS create_var4
            CALL {
                WITH create_var4
                CREATE (create_this0:Movie)
                SET
                    create_this0.id = create_var4.id
                WITH create_this0, create_var4
                CALL {
                    WITH create_this0, create_var4
                    UNWIND create_var4.actors.create AS create_var5
                    WITH create_var5.node AS create_var6, create_var5.edge AS create_var7, create_this0
                    CREATE (create_this8:Actor)
                    SET
                        create_this8.name = create_var6.name,
                        create_this8.nodeCreatedBy = create_var6.nodeCreatedBy,
                        create_this8.fieldA = create_var6.fieldA,
                        create_this8.fieldB = create_var6.fieldB,
                        create_this8.id = randomUUID()
                    MERGE (create_this0)<-[create_this9:ACTED_IN]-(create_this8)
                    WITH *
                    WHERE (apoc.util.validatePredicate((create_var6.fieldA IS NOT NULL AND NOT ($isAuthenticated = true AND $create_param3 IN $jwt.roles)), \\"@neo4j/graphql/FORBIDDEN\\", [0]) AND apoc.util.validatePredicate((create_var6.fieldB IS NOT NULL AND NOT ($isAuthenticated = true AND $create_param4 IN $jwt.roles)), \\"@neo4j/graphql/FORBIDDEN\\", [0]))
                    RETURN collect(NULL) AS create_var10
                }
                WITH *
                WHERE apoc.util.validatePredicate(NOT ($isAuthenticated = true AND $create_param5 IN $jwt.roles), \\"@neo4j/graphql/FORBIDDEN\\", [0])
                RETURN create_this0
            }
            CALL {
                WITH create_this0
                MATCH (create_this0)<-[create_this1:ACTED_IN]-(create_this2:Actor)
                WHERE apoc.util.validatePredicate(NOT ($isAuthenticated = true AND ($jwt.sub IS NOT NULL AND create_this2.nodeCreatedBy = $jwt.sub)), \\"@neo4j/graphql/FORBIDDEN\\", [0])
                WITH create_this2 { .name } AS create_this2
                RETURN collect(create_this2) AS create_var3
            }
            RETURN collect(create_this0 { .id, actors: create_var3 }) AS data"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"isAuthenticated\\": true,
                \\"jwt\\": {
                    \\"roles\\": [
                        \\"role-A\\",
                        \\"role-B\\",
                        \\"admin\\"
                    ],
                    \\"sub\\": \\"User\\"
                },
                \\"create_param2\\": [
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
                \\"create_param3\\": \\"role-A\\",
                \\"create_param4\\": \\"role-B\\",
                \\"create_param5\\": \\"admin\\",
                \\"resolvedCallbacks\\": {}
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

        const token = createBearerToken(secret, { roles: ["role-A", "role-B", "admin"], sub: "User" });
        const result = await translateQuery(neoSchema, query, { token });

        expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
            "UNWIND $create_param2 AS create_var4
            CALL {
                WITH create_var4
                CREATE (create_this0:Movie)
                SET
                    create_this0.id = create_var4.id
                WITH create_this0, create_var4
                CALL {
                    WITH create_this0, create_var4
                    UNWIND create_var4.actors.create AS create_var5
                    WITH create_var5.node AS create_var6, create_var5.edge AS create_var7, create_this0
                    CREATE (create_this8:Actor)
                    SET
                        create_this8.name = create_var6.name,
                        create_this8.nodeCreatedBy = create_var6.nodeCreatedBy,
                        create_this8.id = randomUUID()
                    MERGE (create_this0)<-[create_this9:ACTED_IN]-(create_this8)
                    RETURN collect(NULL) AS create_var10
                }
                WITH *
                WHERE apoc.util.validatePredicate(NOT ($isAuthenticated = true AND $create_param3 IN $jwt.roles), \\"@neo4j/graphql/FORBIDDEN\\", [0])
                RETURN create_this0
            }
            CALL {
                WITH create_this0
                MATCH (create_this0)<-[create_this1:ACTED_IN]-(create_this2:Actor)
                WHERE apoc.util.validatePredicate(NOT ($isAuthenticated = true AND ($jwt.sub IS NOT NULL AND create_this2.nodeCreatedBy = $jwt.sub)), \\"@neo4j/graphql/FORBIDDEN\\", [0])
                WITH create_this2 { .name } AS create_this2
                RETURN collect(create_this2) AS create_var3
            }
            RETURN collect(create_this0 { .id, actors: create_var3 }) AS data"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"isAuthenticated\\": true,
                \\"jwt\\": {
                    \\"roles\\": [
                        \\"role-A\\",
                        \\"role-B\\",
                        \\"admin\\"
                    ],
                    \\"sub\\": \\"User\\"
                },
                \\"create_param2\\": [
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
                \\"create_param3\\": \\"admin\\",
                \\"resolvedCallbacks\\": {}
            }"
        `);
    });
});
