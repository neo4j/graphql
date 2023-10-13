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

describe("Cypher sort tests", () => {
    let typeDefs: DocumentNode;
    let neoSchema: Neo4jGraphQL;

    beforeAll(() => {
        typeDefs = gql`
            type Movie {
                id: ID
                title: String
                genres: [Genre!]! @relationship(type: "HAS_GENRE", direction: OUT)
                totalGenres: Int!
                    @cypher(
                        statement: """
                        MATCH (this)-[:HAS_GENRE]->(genre:Genre)
                        RETURN count(DISTINCT genre) as result
                        """
                        columnName: "result"
                    )
            }

            type Genre {
                id: ID
                name: String
                totalMovies: Int!
                    @cypher(
                        statement: """
                        MATCH (this)<-[:HAS_GENRE]-(movie:Movie)
                        RETURN count(DISTINCT movie) as result
                        """
                        columnName: "result"
                    )
            }
        `;

        neoSchema = new Neo4jGraphQL({
            typeDefs,
        });
    });

    describe("Simple Sort", () => {
        test("with field in selection set", async () => {
            const query = gql`
                {
                    movies(options: { sort: [{ id: DESC }] }) {
                        id
                        title
                    }
                }
            `;

            const result = await translateQuery(neoSchema, query);

            expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
                "MATCH (this:Movie)
                WITH *
                ORDER BY this.id DESC
                RETURN this { .id, .title } AS this"
            `);

            expect(formatParams(result.params)).toMatchInlineSnapshot(`"{}"`);
        });

        test("with field aliased in selection set", async () => {
            const query = gql`
                {
                    movies(options: { sort: [{ id: DESC }] }) {
                        aliased: id
                        title
                    }
                }
            `;

            const result = await translateQuery(neoSchema, query);

            expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
                "MATCH (this:Movie)
                WITH *
                ORDER BY this.id DESC
                RETURN this { .title, .id, aliased: this.id } AS this"
            `);

            expect(formatParams(result.params)).toMatchInlineSnapshot(`"{}"`);
        });

        test("with field not in selection set", async () => {
            const query = gql`
                {
                    movies(options: { sort: [{ id: DESC }] }) {
                        title
                    }
                }
            `;

            const result = await translateQuery(neoSchema, query);

            expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
                "MATCH (this:Movie)
                WITH *
                ORDER BY this.id DESC
                RETURN this { .title, .id } AS this"
            `);

            expect(formatParams(result.params)).toMatchInlineSnapshot(`"{}"`);
        });
    });

    test("Simple Sort On Cypher Field Without Projection", async () => {
        const query = gql`
            {
                movies(options: { sort: [{ totalGenres: DESC }] }) {
                    title
                }
            }
        `;

        const result = await translateQuery(neoSchema, query);

        expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
            "MATCH (this:Movie)
            CALL {
                WITH this
                CALL {
                    WITH this
                    WITH this AS this
                    MATCH (this)-[:HAS_GENRE]->(genre:Genre)
                    RETURN count(DISTINCT genre) as result
                }
                UNWIND result AS this0
                RETURN head(collect(this0)) AS this0
            }
            WITH *
            ORDER BY this0 DESC
            RETURN this { .title, totalGenres: this0 } AS this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`"{}"`);
    });

    test("Simple Sort On Cypher Field", async () => {
        const query = gql`
            {
                movies(options: { sort: [{ totalGenres: DESC }] }) {
                    totalGenres
                }
            }
        `;

        const result = await translateQuery(neoSchema, query);

        expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
            "MATCH (this:Movie)
            CALL {
                WITH this
                CALL {
                    WITH this
                    WITH this AS this
                    MATCH (this)-[:HAS_GENRE]->(genre:Genre)
                    RETURN count(DISTINCT genre) as result
                }
                UNWIND result AS this0
                RETURN head(collect(this0)) AS this0
            }
            WITH *
            ORDER BY this0 DESC
            RETURN this { totalGenres: this0 } AS this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`"{}"`);
    });

    test("Multi Sort", async () => {
        const query = gql`
            {
                movies(options: { sort: [{ id: DESC }, { title: ASC }] }) {
                    id
                    title
                }
            }
        `;

        const result = await translateQuery(neoSchema, query);

        expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
            "MATCH (this:Movie)
            WITH *
            ORDER BY this.id DESC, this.title ASC
            RETURN this { .id, .title } AS this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`"{}"`);
    });

    test("Sort with offset limit & with other variables", async () => {
        const query = gql`
            query ($title: String, $offset: Int, $limit: Int) {
                movies(
                    options: { sort: [{ id: DESC }, { title: ASC }], offset: $offset, limit: $limit }
                    where: { title: $title }
                ) {
                    id
                    title
                }
            }
        `;

        const result = await translateQuery(neoSchema, query, {
            variableValues: { limit: 2, offset: 1, title: "some title" },
        });

        expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
            "MATCH (this:Movie)
            WHERE this.title = $param0
            WITH *
            ORDER BY this.id DESC, this.title ASC
            SKIP $param1
            LIMIT $param2
            RETURN this { .id, .title } AS this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"param0\\": \\"some title\\",
                \\"param1\\": {
                    \\"low\\": 1,
                    \\"high\\": 0
                },
                \\"param2\\": {
                    \\"low\\": 2,
                    \\"high\\": 0
                }
            }"
        `);
    });

    test("Nested Sort DESC", async () => {
        const query = gql`
            {
                movies {
                    genres(options: { sort: [{ name: DESC }] }) {
                        name
                    }
                }
            }
        `;

        const result = await translateQuery(neoSchema, query);

        expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
            "MATCH (this:Movie)
            CALL {
                WITH this
                MATCH (this)-[this0:HAS_GENRE]->(this1:Genre)
                WITH this1 { .name } AS this1
                ORDER BY this1.name DESC
                RETURN collect(this1) AS var2
            }
            RETURN this { genres: var2 } AS this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`"{}"`);
    });

    test("Nested Sort ASC", async () => {
        const query = gql`
            {
                movies {
                    genres(options: { sort: [{ name: ASC }] }) {
                        name
                    }
                }
            }
        `;

        const result = await translateQuery(neoSchema, query);

        expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
            "MATCH (this:Movie)
            CALL {
                WITH this
                MATCH (this)-[this0:HAS_GENRE]->(this1:Genre)
                WITH this1 { .name } AS this1
                ORDER BY this1.name ASC
                RETURN collect(this1) AS var2
            }
            RETURN this { genres: var2 } AS this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`"{}"`);
    });

    test("Nested Sort On Cypher Field ASC", async () => {
        const query = gql`
            {
                movies {
                    genres(options: { sort: [{ totalMovies: ASC }] }) {
                        name
                        totalMovies
                    }
                }
            }
        `;

        const result = await translateQuery(neoSchema, query);

        expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
            "MATCH (this:Movie)
            CALL {
                WITH this
                MATCH (this)-[this0:HAS_GENRE]->(this1:Genre)
                CALL {
                    WITH this1
                    CALL {
                        WITH this1
                        WITH this1 AS this
                        MATCH (this)<-[:HAS_GENRE]-(movie:Movie)
                        RETURN count(DISTINCT movie) as result
                    }
                    UNWIND result AS this2
                    RETURN head(collect(this2)) AS this2
                }
                WITH this1 { .name, totalMovies: this2 } AS this1
                ORDER BY this1.totalMovies ASC
                RETURN collect(this1) AS var3
            }
            RETURN this { genres: var3 } AS this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`"{}"`);
    });

    test("Sort on Interface top-level", async () => {
        const typeDefs = `
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
                id: ID! @id
            }
            interface MyOtherInterface implements MyInterface {
                id: ID! @id
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
        const neoSchema = new Neo4jGraphQL({
            typeDefs,
            experimental: true,
        });

        const query = gql`
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
            RETURN this
            ORDER BY this.id ASC
            LIMIT $param0"
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

    test("Sort with filter on Interface top-level", async () => {
        const typeDefs = `
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
                id: ID! @id
            }
            interface MyOtherInterface implements MyInterface {
                id: ID! @id
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
        const neoSchema = new Neo4jGraphQL({
            typeDefs,
            experimental: true,
        });

        const query = gql`
            query {
                myInterfaces(
                    where: { _on: { SomeNodeType: { somethingElse_NOT: "test" }, MyOtherImplementationType: {} } }
                    options: { sort: [{ id: ASC }], limit: 10 }
                ) {
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
                WHERE NOT (this0.somethingElse = $param0)
                CALL {
                    WITH this0
                    MATCH (this0)-[this1:HAS_OTHER_NODES]->(this2:OtherNodeType)
                    WITH this2 { .id } AS this2
                    RETURN collect(this2) AS var3
                }
                WITH this0 { .id, .something, .somethingElse, other: var3, __resolveType: \\"SomeNodeType\\", __id: id(this0) } AS this0
                RETURN this0 AS this
                UNION
                MATCH (this4:MyOtherImplementationType)
                WITH this4 { .id, .someField, __resolveType: \\"MyOtherImplementationType\\", __id: id(this4) } AS this4
                RETURN this4 AS this
            }
            RETURN this
            ORDER BY this.id ASC
            LIMIT $param1"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"param0\\": \\"test\\",
                \\"param1\\": {
                    \\"low\\": 10,
                    \\"high\\": 0
                }
            }"
        `);
    });

    test("Sort on Interfaces filtered by _on type", async () => {
        const typeDefs = `
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
                id: ID! @id
            }
            interface MyOtherInterface implements MyInterface {
                id: ID! @id
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
        const neoSchema = new Neo4jGraphQL({
            typeDefs,
            experimental: true,
        });

        const query = gql`
            query {
                myInterfaces(
                    where: { _on: { MyOtherImplementationType: {} } }
                    options: { sort: [{ id: ASC }], limit: 10 }
                ) {
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
                MATCH (this0:MyOtherImplementationType)
                WITH this0 { .id, .someField, __resolveType: \\"MyOtherImplementationType\\", __id: id(this0) } AS this0
                RETURN this0 AS this
            }
            RETURN this
            ORDER BY this.id ASC
            LIMIT $param0"
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
        const typeDefs = `
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
                id: ID! @id
            }
            interface MyOtherInterface implements MyInterface {
                id: ID! @id
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
        const neoSchema = new Neo4jGraphQL({
            typeDefs,
            experimental: true,
        });

        const query = gql`
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
            RETURN this
            ORDER BY this.id ASC
            LIMIT $param1"
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
});
