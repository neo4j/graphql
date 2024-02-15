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

describe("Interface top level operations", () => {
    const secret = "secret";
    let typeDefs: string;
    let neoSchema: Neo4jGraphQL;

    beforeEach(() => {
        typeDefs = /* GraphQL */ `
            type SomeNodeType implements MyOtherInterface & MyInterface {
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

            type MyImplementationType implements MyInterface {
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
                WITH this0 { .id, __resolveType: \\"SomeNodeType\\", __id: id(this0) } AS this0
                RETURN this0 AS this
                UNION
                MATCH (this1:MyImplementationType)
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

        expect(formatParams(result.params)).toMatchInlineSnapshot(`"{}"`);
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
                WITH this0 { .id, __resolveType: \\"SomeNodeType\\", __id: id(this0) } AS this0
                RETURN this0 AS this
                UNION
                MATCH (this1:MyImplementationType)
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

        expect(formatParams(result.params)).toMatchInlineSnapshot(`"{}"`);
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
                WITH this0 { .id, .something, __resolveType: \\"SomeNodeType\\", __id: id(this0) } AS this0
                RETURN this0 AS this
                UNION
                MATCH (this1:MyImplementationType)
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

        expect(formatParams(result.params)).toMatchInlineSnapshot(`"{}"`);
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
                WITH this0 { .id, .something, .somethingElse, __resolveType: \\"SomeNodeType\\", __id: id(this0) } AS this0
                RETURN this0 AS this
                UNION
                MATCH (this1:MyImplementationType)
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

        expect(formatParams(result.params)).toMatchInlineSnapshot(`"{}"`);
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

        expect(formatParams(result.params)).toMatchInlineSnapshot(`"{}"`);
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
                WHERE this0.id STARTS WITH $param0
                WITH this0 { .id, __resolveType: \\"SomeNodeType\\", __id: id(this0) } AS this0
                RETURN this0 AS this
            }
            WITH this
            RETURN this AS this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"param0\\": \\"1\\"
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
                WHERE this0.id STARTS WITH $param0
                WITH this0 { .id, __resolveType: \\"SomeNodeType\\", __id: id(this0) } AS this0
                RETURN this0 AS this
            }
            WITH this
            RETURN this AS this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"param0\\": \\"4\\"
            }"
        `);
    });
});
