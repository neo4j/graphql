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
import { formatCypher, formatParams, translateQuery } from "../utils/tck-test-utils";

describe("Top-level Interface query pagination (sort and limit)", () => {
    let typeDefs: string;
    let neoSchema: Neo4jGraphQL;

    beforeAll(() => {
        typeDefs = `
            type SomeNodeType implements MyOtherInterface & MyInterface {
                id: ID! @id @unique
                something: String
                somethingElse: String
                other: [OtherNodeType!]! @relationship(type: "HAS_OTHER_NODES", direction: OUT)
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
        });
    });

    test("Sort on Interface top-level", async () => {
        const query = /* GraphQL */ `
            query {
                myInterfaces(options: { sort: [{ id: ASC }], limit: 10 }) {
                    id
                    ... on MyOtherImplementationType {
                        someField
                    }
                    ... on MyOtherInterface {
                        something
                        ... on SomeNodeType {
                            somethingElse
                            other {
                                id
                            }
                        }
                    }
                }
            }
        `;

        const result = await translateQuery(neoSchema, query);

        expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
            "CALL {
                MATCH (this0:SomeNodeType)
                CALL {
                    WITH this0
                    MATCH (this0)-[this1:HAS_OTHER_NODES]->(this2:OtherNodeType)
                    WITH this2 { .id } AS this2
                    RETURN collect(this2) AS var3
                }
                WITH this0 { .id, .something, .somethingElse, other: var3, __resolveType: \\"SomeNodeType\\", __id: id(this0) } AS this0
                RETURN this0 AS this
                UNION
                MATCH (this4:MyImplementationType)
                WITH this4 { .id, __resolveType: \\"MyImplementationType\\", __id: id(this4) } AS this4
                RETURN this4 AS this
                UNION
                MATCH (this5:MyOtherImplementationType)
                WITH this5 { .id, .someField, __resolveType: \\"MyOtherImplementationType\\", __id: id(this5) } AS this5
                RETURN this5 AS this
            }
            WITH this
            ORDER BY this.id ASC
            LIMIT $param0
            RETURN this AS this"
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

    test("Sort on Interface top-level without projecting the sorted field", async () => {
        const query = /* GraphQL */ `
            query {
                myInterfaces(options: { sort: [{ id: ASC }], limit: 10 }) {
                    ... on MyOtherImplementationType {
                        someField
                    }
                    ... on MyOtherInterface {
                        something
                    }
                }
            }
        `;

        const result = await translateQuery(neoSchema, query);

        expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
            "CALL {
                MATCH (this0:SomeNodeType)
                WITH this0 { .something, .id, __resolveType: \\"SomeNodeType\\", __id: id(this0) } AS this0
                RETURN this0 AS this
                UNION
                MATCH (this1:MyImplementationType)
                WITH this1 { .id, __resolveType: \\"MyImplementationType\\", __id: id(this1) } AS this1
                RETURN this1 AS this
                UNION
                MATCH (this2:MyOtherImplementationType)
                WITH this2 { .someField, .id, __resolveType: \\"MyOtherImplementationType\\", __id: id(this2) } AS this2
                RETURN this2 AS this
            }
            WITH this
            ORDER BY this.id ASC
            LIMIT $param0
            RETURN this AS this"
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

    test("Sort on Interfaces top-level + nested", async () => {
        const query = /* GraphQL */ `
            query {
                myInterfaces(options: { sort: [{ id: ASC }], limit: 10 }) {
                    id
                    ... on MyOtherImplementationType {
                        someField
                    }
                    ... on MyOtherInterface {
                        something
                        ... on SomeNodeType {
                            somethingElse
                            other(options: { sort: [{ id: DESC }], limit: 2 }) {
                                id
                            }
                        }
                    }
                }
            }
        `;

        const result = await translateQuery(neoSchema, query);

        expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
            "CALL {
                MATCH (this0:SomeNodeType)
                CALL {
                    WITH this0
                    MATCH (this0)-[this1:HAS_OTHER_NODES]->(this2:OtherNodeType)
                    WITH this2 { .id } AS this2
                    ORDER BY this2.id DESC
                    LIMIT $param0
                    RETURN collect(this2) AS var3
                }
                WITH this0 { .id, .something, .somethingElse, other: var3, __resolveType: \\"SomeNodeType\\", __id: id(this0) } AS this0
                RETURN this0 AS this
                UNION
                MATCH (this4:MyImplementationType)
                WITH this4 { .id, __resolveType: \\"MyImplementationType\\", __id: id(this4) } AS this4
                RETURN this4 AS this
                UNION
                MATCH (this5:MyOtherImplementationType)
                WITH this5 { .id, .someField, __resolveType: \\"MyOtherImplementationType\\", __id: id(this5) } AS this5
                RETURN this5 AS this
            }
            WITH this
            ORDER BY this.id ASC
            LIMIT $param1
            RETURN this AS this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"param0\\": {
                    \\"low\\": 2,
                    \\"high\\": 0
                },
                \\"param1\\": {
                    \\"low\\": 10,
                    \\"high\\": 0
                }
            }"
        `);
    });

    describe("add @limit directive on interface", () => {
        beforeAll(() => {
            typeDefs = typeDefs + `extend interface MyInterface @limit(default: 13, max: 15) `;

            neoSchema = new Neo4jGraphQL({
                typeDefs,
            });
        });

        test("Limit from directive on Interface when interface queried nested", async () => {
            const query = /* GraphQL */ `
                query {
                    someNodeTypes {
                        id
                        other {
                            id
                            interfaceField {
                                id
                            }
                        }
                    }
                }
            `;

            const result = await translateQuery(neoSchema, query);

            expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
                "MATCH (this:SomeNodeType)
                CALL {
                    WITH this
                    MATCH (this)-[this0:HAS_OTHER_NODES]->(this1:OtherNodeType)
                    CALL {
                        WITH this1
                        CALL {
                            WITH *
                            MATCH (this1)-[this2:HAS_INTERFACE_NODES]->(this3:SomeNodeType)
                            WITH this3 { .id, __resolveType: \\"SomeNodeType\\", __id: id(this3) } AS this3
                            RETURN this3 AS var4
                            UNION
                            WITH *
                            MATCH (this1)-[this5:HAS_INTERFACE_NODES]->(this6:MyImplementationType)
                            WITH this6 { .id, __resolveType: \\"MyImplementationType\\", __id: id(this6) } AS this6
                            RETURN this6 AS var4
                            UNION
                            WITH *
                            MATCH (this1)-[this7:HAS_INTERFACE_NODES]->(this8:MyOtherImplementationType)
                            WITH this8 { .id, __resolveType: \\"MyOtherImplementationType\\", __id: id(this8) } AS this8
                            RETURN this8 AS var4
                        }
                        WITH var4
                        LIMIT $param0
                        RETURN head(collect(var4)) AS var4
                    }
                    WITH this1 { .id, interfaceField: var4 } AS this1
                    RETURN collect(this1) AS var9
                }
                RETURN this { .id, other: var9 } AS this"
            `);

            expect(formatParams(result.params)).toMatchInlineSnapshot(`
                "{
                    \\"param0\\": {
                        \\"low\\": 13,
                        \\"high\\": 0
                    }
                }"
            `);
        });
        test("Limit from directive on Interface", async () => {
            const query = /* GraphQL */ `
                query {
                    myInterfaces {
                        id
                        ... on MyOtherImplementationType {
                            someField
                        }
                        ... on MyOtherInterface {
                            something
                            ... on SomeNodeType {
                                somethingElse
                                other {
                                    id
                                }
                            }
                        }
                    }
                }
            `;

            const result = await translateQuery(neoSchema, query);

            expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
                "CALL {
                    MATCH (this0:SomeNodeType)
                    CALL {
                        WITH this0
                        MATCH (this0)-[this1:HAS_OTHER_NODES]->(this2:OtherNodeType)
                        WITH this2 { .id } AS this2
                        RETURN collect(this2) AS var3
                    }
                    WITH this0 { .id, .something, .somethingElse, other: var3, __resolveType: \\"SomeNodeType\\", __id: id(this0) } AS this0
                    RETURN this0 AS this
                    UNION
                    MATCH (this4:MyImplementationType)
                    WITH this4 { .id, __resolveType: \\"MyImplementationType\\", __id: id(this4) } AS this4
                    RETURN this4 AS this
                    UNION
                    MATCH (this5:MyOtherImplementationType)
                    WITH this5 { .id, .someField, __resolveType: \\"MyOtherImplementationType\\", __id: id(this5) } AS this5
                    RETURN this5 AS this
                }
                WITH this
                LIMIT $param0
                RETURN this AS this"
            `);

            expect(formatParams(result.params)).toMatchInlineSnapshot(`
                "{
                    \\"param0\\": {
                        \\"low\\": 13,
                        \\"high\\": 0
                    }
                }"
            `);
        });
        test("Max limit from directive on Interface overwrites the limit argument", async () => {
            const query = /* GraphQL */ `
                query {
                    myInterfaces(options: { limit: 16 }) {
                        id
                        ... on MyOtherImplementationType {
                            someField
                        }
                        ... on MyOtherInterface {
                            something
                            ... on SomeNodeType {
                                somethingElse
                                other {
                                    id
                                }
                            }
                        }
                    }
                }
            `;

            const result = await translateQuery(neoSchema, query);

            expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
                "CALL {
                    MATCH (this0:SomeNodeType)
                    CALL {
                        WITH this0
                        MATCH (this0)-[this1:HAS_OTHER_NODES]->(this2:OtherNodeType)
                        WITH this2 { .id } AS this2
                        RETURN collect(this2) AS var3
                    }
                    WITH this0 { .id, .something, .somethingElse, other: var3, __resolveType: \\"SomeNodeType\\", __id: id(this0) } AS this0
                    RETURN this0 AS this
                    UNION
                    MATCH (this4:MyImplementationType)
                    WITH this4 { .id, __resolveType: \\"MyImplementationType\\", __id: id(this4) } AS this4
                    RETURN this4 AS this
                    UNION
                    MATCH (this5:MyOtherImplementationType)
                    WITH this5 { .id, .someField, __resolveType: \\"MyOtherImplementationType\\", __id: id(this5) } AS this5
                    RETURN this5 AS this
                }
                WITH this
                LIMIT $param0
                RETURN this AS this"
            `);

            expect(formatParams(result.params)).toMatchInlineSnapshot(`
                "{
                    \\"param0\\": {
                        \\"low\\": 15,
                        \\"high\\": 0
                    }
                }"
            `);
        });
        test("Limit argument overwrites default if lower than max", async () => {
            const query = /* GraphQL */ `
                query {
                    myInterfaces(options: { limit: 3 }) {
                        id
                        ... on MyOtherImplementationType {
                            someField
                        }
                        ... on MyOtherInterface {
                            something
                            ... on SomeNodeType {
                                somethingElse
                                other {
                                    id
                                }
                            }
                        }
                    }
                }
            `;

            const result = await translateQuery(neoSchema, query);

            expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
                "CALL {
                    MATCH (this0:SomeNodeType)
                    CALL {
                        WITH this0
                        MATCH (this0)-[this1:HAS_OTHER_NODES]->(this2:OtherNodeType)
                        WITH this2 { .id } AS this2
                        RETURN collect(this2) AS var3
                    }
                    WITH this0 { .id, .something, .somethingElse, other: var3, __resolveType: \\"SomeNodeType\\", __id: id(this0) } AS this0
                    RETURN this0 AS this
                    UNION
                    MATCH (this4:MyImplementationType)
                    WITH this4 { .id, __resolveType: \\"MyImplementationType\\", __id: id(this4) } AS this4
                    RETURN this4 AS this
                    UNION
                    MATCH (this5:MyOtherImplementationType)
                    WITH this5 { .id, .someField, __resolveType: \\"MyOtherImplementationType\\", __id: id(this5) } AS this5
                    RETURN this5 AS this
                }
                WITH this
                LIMIT $param0
                RETURN this AS this"
            `);

            expect(formatParams(result.params)).toMatchInlineSnapshot(`
                "{
                    \\"param0\\": {
                        \\"low\\": 3,
                        \\"high\\": 0
                    }
                }"
            `);
        });
        test("Max limit from directive on Interface overwrites the limit argument - combines with sort", async () => {
            const query = /* GraphQL */ `
                query {
                    myInterfaces(options: { limit: 16, sort: [{ id: ASC }] }) {
                        id
                        ... on MyOtherImplementationType {
                            someField
                        }
                        ... on MyOtherInterface {
                            something
                            ... on SomeNodeType {
                                somethingElse
                                other {
                                    id
                                }
                            }
                        }
                    }
                }
            `;

            const result = await translateQuery(neoSchema, query);

            expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
                "CALL {
                    MATCH (this0:SomeNodeType)
                    CALL {
                        WITH this0
                        MATCH (this0)-[this1:HAS_OTHER_NODES]->(this2:OtherNodeType)
                        WITH this2 { .id } AS this2
                        RETURN collect(this2) AS var3
                    }
                    WITH this0 { .id, .something, .somethingElse, other: var3, __resolveType: \\"SomeNodeType\\", __id: id(this0) } AS this0
                    RETURN this0 AS this
                    UNION
                    MATCH (this4:MyImplementationType)
                    WITH this4 { .id, __resolveType: \\"MyImplementationType\\", __id: id(this4) } AS this4
                    RETURN this4 AS this
                    UNION
                    MATCH (this5:MyOtherImplementationType)
                    WITH this5 { .id, .someField, __resolveType: \\"MyOtherImplementationType\\", __id: id(this5) } AS this5
                    RETURN this5 AS this
                }
                WITH this
                ORDER BY this.id ASC
                LIMIT $param0
                RETURN this AS this"
            `);

            expect(formatParams(result.params)).toMatchInlineSnapshot(`
                "{
                    \\"param0\\": {
                        \\"low\\": 15,
                        \\"high\\": 0
                    }
                }"
            `);
        });
    });
});
