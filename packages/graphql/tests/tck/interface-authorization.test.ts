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
import { Neo4jGraphQL } from "../../src";
import { formatCypher, translateQuery, formatParams } from "./utils/tck-test-utils";
import { createBearerToken } from "../utils/create-bearer-token";

describe("Interface top level operations with authorization", () => {
    const secret = "secret";
    let typeDefs: DocumentNode;
    let neoSchema: Neo4jGraphQL;

    beforeEach(() => {
        typeDefs = gql`
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
            experimental: true,
        });
    });
    test("Read interface (interface target of a relationship)", async () => {
        const query = gql`
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
            RETURN this"
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
        const query = gql`
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
            RETURN this"
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
        const query = gql`
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
            RETURN this"
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
        const query = gql`
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
            RETURN this"
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
        const query = gql`
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
            RETURN this"
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
        const query = gql`
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
            RETURN this"
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
        const query = gql`
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
            RETURN this"
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

    test("Read interface with filters", async () => {
        const query = gql`
            {
                myOtherInterfaces(where: { _on: { SomeNodeType: { other: { id: "2" } } } }) {
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
                OPTIONAL MATCH (this0)-[:HAS_OTHER_NODES]->(this1:OtherNodeType)
                WITH *, count(this1) AS otherCount
                WITH *
                WHERE ((otherCount <> 0 AND this1.id = $param0) AND apoc.util.validatePredicate(NOT ($isAuthenticated = true AND ($jwt.jwtAllowedNamesExample IS NOT NULL AND this0.id = $jwt.jwtAllowedNamesExample) AND ($jwt.roles IS NOT NULL AND $param3 IN $jwt.roles)), \\"@neo4j/graphql/FORBIDDEN\\", [0]))
                CALL {
                    WITH this0
                    MATCH (this0)-[this2:HAS_OTHER_NODES]->(this3:OtherNodeType)
                    WITH this3 { .id } AS this3
                    RETURN head(collect(this3)) AS var4
                }
                WITH this0 { .id, other: var4, __resolveType: \\"SomeNodeType\\", __id: id(this0) } AS this0
                RETURN this0 AS this
            }
            RETURN this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"param0\\": \\"2\\",
                \\"isAuthenticated\\": true,
                \\"jwt\\": {
                    \\"roles\\": [],
                    \\"jwtAllowedNamesExample\\": \\"Horror\\"
                },
                \\"param3\\": \\"admin\\"
            }"
        `);
    });

    test("Read interface with filters (interface target of a relationship)", async () => {
        const query = gql`
            {
                myInterfaces(
                    where: {
                        _on: {
                            SomeNodeType: { somethingElse_NOT: "test" }
                            MyOtherImplementationType: { someField: "bla" }
                        }
                    }
                ) {
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
                WHERE (NOT (this0.somethingElse = $param0) AND apoc.util.validatePredicate(NOT ($isAuthenticated = true AND ($jwt.jwtAllowedNamesExample IS NOT NULL AND this0.id = $jwt.jwtAllowedNamesExample) AND ($jwt.roles IS NOT NULL AND $param3 IN $jwt.roles)), \\"@neo4j/graphql/FORBIDDEN\\", [0]))
                WITH this0 { .id, .something, .somethingElse, __resolveType: \\"SomeNodeType\\", __id: id(this0) } AS this0
                RETURN this0 AS this
                UNION
                MATCH (this1:MyOtherImplementationType)
                WHERE this1.someField = $param4
                WITH this1 { .id, .someField, __resolveType: \\"MyOtherImplementationType\\", __id: id(this1) } AS this1
                RETURN this1 AS this
            }
            RETURN this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"param0\\": \\"test\\",
                \\"isAuthenticated\\": true,
                \\"jwt\\": {
                    \\"roles\\": [],
                    \\"jwtAllowedNamesExample\\": \\"Horror\\"
                },
                \\"param3\\": \\"admin\\",
                \\"param4\\": \\"bla\\"
            }"
        `);
    });

    test("Type filtering using onType", async () => {
        const query = gql`
            {
                myInterfaces(where: { _on: { MyOtherImplementationType: {} } }) {
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
                MATCH (this0:MyOtherImplementationType)
                WITH this0 { .id, .someField, __resolveType: \\"MyOtherImplementationType\\", __id: id(this0) } AS this0
                RETURN this0 AS this
            }
            RETURN this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`"{}"`);
    });

    test("Filter overriding using onType", async () => {
        const query = gql`
            {
                myInterfaces(
                    where: { id_STARTS_WITH: "4", _on: { MyOtherImplementationType: { id_STARTS_WITH: "1" } } }
                ) {
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
                WHERE (this0.id STARTS WITH $param0 AND apoc.util.validatePredicate(NOT ($isAuthenticated = true AND ($jwt.jwtAllowedNamesExample IS NOT NULL AND this0.id = $jwt.jwtAllowedNamesExample) AND ($jwt.roles IS NOT NULL AND $param3 IN $jwt.roles)), \\"@neo4j/graphql/FORBIDDEN\\", [0]))
                WITH this0 { .id, __resolveType: \\"SomeNodeType\\", __id: id(this0) } AS this0
                RETURN this0 AS this
                UNION
                MATCH (this1:MyImplementationType)
                WHERE (this1.id STARTS WITH $param4 AND apoc.util.validatePredicate(NOT ($isAuthenticated = true AND ($jwt.groups IS NOT NULL AND $param5 IN $jwt.groups)), \\"@neo4j/graphql/FORBIDDEN\\", [0]))
                WITH this1 { .id, __resolveType: \\"MyImplementationType\\", __id: id(this1) } AS this1
                RETURN this1 AS this
                UNION
                MATCH (this2:MyOtherImplementationType)
                WHERE this2.id STARTS WITH $param6
                WITH this2 { .id, .someField, __resolveType: \\"MyOtherImplementationType\\", __id: id(this2) } AS this2
                RETURN this2 AS this
            }
            RETURN this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"param0\\": \\"4\\",
                \\"isAuthenticated\\": true,
                \\"jwt\\": {
                    \\"roles\\": [],
                    \\"jwtAllowedNamesExample\\": \\"Horror\\"
                },
                \\"param3\\": \\"admin\\",
                \\"param4\\": \\"4\\",
                \\"param5\\": \\"a\\",
                \\"param6\\": \\"1\\"
            }"
        `);
    });
});
