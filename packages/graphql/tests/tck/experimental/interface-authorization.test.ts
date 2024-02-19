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

import type { DocumentNode } from "graphql";
import { Neo4jGraphQL } from "../../../src";
import { createBearerToken } from "../../utils/create-bearer-token";
import { formatCypher, formatParams, translateQuery } from "../utils/tck-test-utils";

describe("Interface top level operations with authorization", () => {
    const secret = "secret";
    let typeDefs: string;
    let neoSchema: Neo4jGraphQL;

    beforeEach(() => {
        typeDefs = /* GraphQL */ `
            type JWT @jwt {
                roles: [String]
                groups: [String]
            }
            type SomeNodeType implements MyOtherInterface & MyInterface
                @authorization(
                    validate: [
                        {
                            when: [BEFORE]
                            operations: [READ]
                            where: { node: { id: "$jwt.jwtAllowedNamesExample" }, jwt: { roles_INCLUDES: "admin" } }
                        }
                    ]
                ) {
                id: ID! @id @unique
                something: String
                somethingElse: String
                other: OtherNodeType! @relationship(type: "HAS_OTHER_NODES", direction: OUT)
            }
            type OtherNodeType {
                id: ID! @id @unique
                interfaceField: MyInterface! @relationship(type: "HAS_INTERFACE_NODES", direction: OUT)
            }
            interface MyInterface {
                id: ID!
            }
            interface MyOtherInterface implements MyInterface {
                id: ID!
                something: String
            }

            type MyImplementationType implements MyInterface
                @authorization(validate: [{ operations: [READ], where: { jwt: { groups_INCLUDES: "a" } } }]) {
                id: ID! @id @unique
            }

            type MyOtherImplementationType implements MyInterface {
                id: ID! @id @unique
                someField: String
            }
        `;

        neoSchema = new Neo4jGraphQL({
            typeDefs,
            features: { authorization: { key: secret } },
        });
    });
    test("Read interface (interface target of a relationship)", async () => {
        const query = /* GraphQL */ `
            {
                myInterfaces {
                    id
                }
            }
        `;

        const token = createBearerToken("secret", { jwtAllowedNamesExample: "Horror" });
        const result = await translateQuery(neoSchema, query, { token });

        expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
            "CALL {
                MATCH (this0:SomeNodeType)
                WHERE apoc.util.validatePredicate(NOT ($isAuthenticated = true AND ($jwt.jwtAllowedNamesExample IS NOT NULL AND this0.id = $jwt.jwtAllowedNamesExample) AND ($jwt.roles IS NOT NULL AND $param2 IN $jwt.roles)), \\"@neo4j/graphql/FORBIDDEN\\", [0])
                WITH this0 { .id, __resolveType: \\"SomeNodeType\\", __id: id(this0) } AS this0
                RETURN this0 AS this
                UNION
                MATCH (this1:MyImplementationType)
                WHERE apoc.util.validatePredicate(NOT ($isAuthenticated = true AND ($jwt.groups IS NOT NULL AND $param3 IN $jwt.groups)), \\"@neo4j/graphql/FORBIDDEN\\", [0])
                WITH this1 { .id, __resolveType: \\"MyImplementationType\\", __id: id(this1) } AS this1
                RETURN this1 AS this
                UNION
                MATCH (this2:MyOtherImplementationType)
                WITH this2 { .id, __resolveType: \\"MyOtherImplementationType\\", __id: id(this2) } AS this2
                RETURN this2 AS this
            }
            WITH this
            RETURN this AS this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"isAuthenticated\\": true,
                \\"jwt\\": {
                    \\"roles\\": [],
                    \\"jwtAllowedNamesExample\\": \\"Horror\\"
                },
                \\"param2\\": \\"admin\\",
                \\"param3\\": \\"a\\"
            }"
        `);
    });

    test("Read interface (interface target of a relationship) with implementation projection", async () => {
        const query = /* GraphQL */ `
            {
                myInterfaces {
                    id
                    ... on MyOtherImplementationType {
                        someField
                    }
                }
            }
        `;

        const token = createBearerToken("secret", { jwtAllowedNamesExample: "Horror" });
        const result = await translateQuery(neoSchema, query, { token });

        expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
            "CALL {
                MATCH (this0:SomeNodeType)
                WHERE apoc.util.validatePredicate(NOT ($isAuthenticated = true AND ($jwt.jwtAllowedNamesExample IS NOT NULL AND this0.id = $jwt.jwtAllowedNamesExample) AND ($jwt.roles IS NOT NULL AND $param2 IN $jwt.roles)), \\"@neo4j/graphql/FORBIDDEN\\", [0])
                WITH this0 { .id, __resolveType: \\"SomeNodeType\\", __id: id(this0) } AS this0
                RETURN this0 AS this
                UNION
                MATCH (this1:MyImplementationType)
                WHERE apoc.util.validatePredicate(NOT ($isAuthenticated = true AND ($jwt.groups IS NOT NULL AND $param3 IN $jwt.groups)), \\"@neo4j/graphql/FORBIDDEN\\", [0])
                WITH this1 { .id, __resolveType: \\"MyImplementationType\\", __id: id(this1) } AS this1
                RETURN this1 AS this
                UNION
                MATCH (this2:MyOtherImplementationType)
                WITH this2 { .id, .someField, __resolveType: \\"MyOtherImplementationType\\", __id: id(this2) } AS this2
                RETURN this2 AS this
            }
            WITH this
            RETURN this AS this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"isAuthenticated\\": true,
                \\"jwt\\": {
                    \\"roles\\": [],
                    \\"jwtAllowedNamesExample\\": \\"Horror\\"
                },
                \\"param2\\": \\"admin\\",
                \\"param3\\": \\"a\\"
            }"
        `);
    });

    test("Read interface (interface target of a relationship) with interface implementation projection", async () => {
        const query = /* GraphQL */ `
            {
                myInterfaces {
                    id
                    ... on MyOtherImplementationType {
                        someField
                    }
                    ... on MyOtherInterface {
                        something
                    }
                }
            }
        `;

        const token = createBearerToken("secret", { jwtAllowedNamesExample: "Horror" });
        const result = await translateQuery(neoSchema, query, { token });

        expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
            "CALL {
                MATCH (this0:SomeNodeType)
                WHERE apoc.util.validatePredicate(NOT ($isAuthenticated = true AND ($jwt.jwtAllowedNamesExample IS NOT NULL AND this0.id = $jwt.jwtAllowedNamesExample) AND ($jwt.roles IS NOT NULL AND $param2 IN $jwt.roles)), \\"@neo4j/graphql/FORBIDDEN\\", [0])
                WITH this0 { .id, .something, __resolveType: \\"SomeNodeType\\", __id: id(this0) } AS this0
                RETURN this0 AS this
                UNION
                MATCH (this1:MyImplementationType)
                WHERE apoc.util.validatePredicate(NOT ($isAuthenticated = true AND ($jwt.groups IS NOT NULL AND $param3 IN $jwt.groups)), \\"@neo4j/graphql/FORBIDDEN\\", [0])
                WITH this1 { .id, __resolveType: \\"MyImplementationType\\", __id: id(this1) } AS this1
                RETURN this1 AS this
                UNION
                MATCH (this2:MyOtherImplementationType)
                WITH this2 { .id, .someField, __resolveType: \\"MyOtherImplementationType\\", __id: id(this2) } AS this2
                RETURN this2 AS this
            }
            WITH this
            RETURN this AS this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"isAuthenticated\\": true,
                \\"jwt\\": {
                    \\"roles\\": [],
                    \\"jwtAllowedNamesExample\\": \\"Horror\\"
                },
                \\"param2\\": \\"admin\\",
                \\"param3\\": \\"a\\"
            }"
        `);
    });
    test("Read interface (interface target of a relationship) with interface implementation and implementation of it projection", async () => {
        const query = /* GraphQL */ `
            {
                myInterfaces {
                    id
                    ... on MyOtherImplementationType {
                        someField
                    }
                    ... on MyOtherInterface {
                        something
                        ... on SomeNodeType {
                            somethingElse
                        }
                    }
                }
            }
        `;

        const token = createBearerToken("secret", { jwtAllowedNamesExample: "Horror" });
        const result = await translateQuery(neoSchema, query, { token });

        expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
            "CALL {
                MATCH (this0:SomeNodeType)
                WHERE apoc.util.validatePredicate(NOT ($isAuthenticated = true AND ($jwt.jwtAllowedNamesExample IS NOT NULL AND this0.id = $jwt.jwtAllowedNamesExample) AND ($jwt.roles IS NOT NULL AND $param2 IN $jwt.roles)), \\"@neo4j/graphql/FORBIDDEN\\", [0])
                WITH this0 { .id, .something, .somethingElse, __resolveType: \\"SomeNodeType\\", __id: id(this0) } AS this0
                RETURN this0 AS this
                UNION
                MATCH (this1:MyImplementationType)
                WHERE apoc.util.validatePredicate(NOT ($isAuthenticated = true AND ($jwt.groups IS NOT NULL AND $param3 IN $jwt.groups)), \\"@neo4j/graphql/FORBIDDEN\\", [0])
                WITH this1 { .id, __resolveType: \\"MyImplementationType\\", __id: id(this1) } AS this1
                RETURN this1 AS this
                UNION
                MATCH (this2:MyOtherImplementationType)
                WITH this2 { .id, .someField, __resolveType: \\"MyOtherImplementationType\\", __id: id(this2) } AS this2
                RETURN this2 AS this
            }
            WITH this
            RETURN this AS this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"isAuthenticated\\": true,
                \\"jwt\\": {
                    \\"roles\\": [],
                    \\"jwtAllowedNamesExample\\": \\"Horror\\"
                },
                \\"param2\\": \\"admin\\",
                \\"param3\\": \\"a\\"
            }"
        `);
    });

    test("Read interface", async () => {
        const query = /* GraphQL */ `
            {
                myOtherInterfaces {
                    id
                    ... on SomeNodeType {
                        id
                        other {
                            id
                        }
                    }
                }
            }
        `;

        const token = createBearerToken("secret", { jwtAllowedNamesExample: "Horror" });
        const result = await translateQuery(neoSchema, query, { token });

        expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
            "CALL {
                MATCH (this0:SomeNodeType)
                WHERE apoc.util.validatePredicate(NOT ($isAuthenticated = true AND ($jwt.jwtAllowedNamesExample IS NOT NULL AND this0.id = $jwt.jwtAllowedNamesExample) AND ($jwt.roles IS NOT NULL AND $param2 IN $jwt.roles)), \\"@neo4j/graphql/FORBIDDEN\\", [0])
                CALL {
                    WITH this0
                    MATCH (this0)-[this1:HAS_OTHER_NODES]->(this2:OtherNodeType)
                    WITH this2 { .id } AS this2
                    RETURN head(collect(this2)) AS var3
                }
                WITH this0 { .id, other: var3, __resolveType: \\"SomeNodeType\\", __id: id(this0) } AS this0
                RETURN this0 AS this
            }
            WITH this
            RETURN this AS this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"isAuthenticated\\": true,
                \\"jwt\\": {
                    \\"roles\\": [],
                    \\"jwtAllowedNamesExample\\": \\"Horror\\"
                },
                \\"param2\\": \\"admin\\"
            }"
        `);
    });

    test("Read interface with shared filters", async () => {
        const query = /* GraphQL */ `
            {
                myOtherInterfaces(where: { id_STARTS_WITH: "1" }) {
                    id
                }
            }
        `;

        const token = createBearerToken("secret", { jwtAllowedNamesExample: "Horror" });
        const result = await translateQuery(neoSchema, query, { token });

        expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
            "CALL {
                MATCH (this0:SomeNodeType)
                WHERE (this0.id STARTS WITH $param0 AND apoc.util.validatePredicate(NOT ($isAuthenticated = true AND ($jwt.jwtAllowedNamesExample IS NOT NULL AND this0.id = $jwt.jwtAllowedNamesExample) AND ($jwt.roles IS NOT NULL AND $param3 IN $jwt.roles)), \\"@neo4j/graphql/FORBIDDEN\\", [0]))
                WITH this0 { .id, __resolveType: \\"SomeNodeType\\", __id: id(this0) } AS this0
                RETURN this0 AS this
            }
            WITH this
            RETURN this AS this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"param0\\": \\"1\\",
                \\"isAuthenticated\\": true,
                \\"jwt\\": {
                    \\"roles\\": [],
                    \\"jwtAllowedNamesExample\\": \\"Horror\\"
                },
                \\"param3\\": \\"admin\\"
            }"
        `);
    });

    test("Read interface with shared filters and concrete projection", async () => {
        const query = /* GraphQL */ `
            {
                myOtherInterfaces(where: { id_STARTS_WITH: "4" }) {
                    id
                    ... on SomeNodeType {
                        id
                    }
                }
            }
        `;

        const token = createBearerToken("secret", { jwtAllowedNamesExample: "Horror" });
        const result = await translateQuery(neoSchema, query, { token });

        expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
            "CALL {
                MATCH (this0:SomeNodeType)
                WHERE (this0.id STARTS WITH $param0 AND apoc.util.validatePredicate(NOT ($isAuthenticated = true AND ($jwt.jwtAllowedNamesExample IS NOT NULL AND this0.id = $jwt.jwtAllowedNamesExample) AND ($jwt.roles IS NOT NULL AND $param3 IN $jwt.roles)), \\"@neo4j/graphql/FORBIDDEN\\", [0]))
                WITH this0 { .id, __resolveType: \\"SomeNodeType\\", __id: id(this0) } AS this0
                RETURN this0 AS this
            }
            WITH this
            RETURN this AS this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"param0\\": \\"4\\",
                \\"isAuthenticated\\": true,
                \\"jwt\\": {
                    \\"roles\\": [],
                    \\"jwtAllowedNamesExample\\": \\"Horror\\"
                },
                \\"param3\\": \\"admin\\"
            }"
        `);
    });
});
