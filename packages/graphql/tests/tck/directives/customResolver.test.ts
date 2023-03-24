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
import type { DocumentNode } from "graphql";
import { Neo4jGraphQL } from "../../../src";
import { createJwtRequest } from "../../utils/create-jwt-request";
import { formatCypher, translateQuery, formatParams } from "../utils/tck-test-utils";

describe("@customResolver directive", () => {
    let typeDefs: DocumentNode;
    let neoSchema: Neo4jGraphQL;

    describe("Require fields on same type", () => {
        beforeAll(() => {
            typeDefs = gql`
                type User {
                    firstName: String!
                    lastName: String!
                    fullName: String! @customResolver(requires: "firstName lastName")
                }
            `;

            const resolvers = {
                User: {
                    fullName: () => "The user's full name",
                },
            };

            neoSchema = new Neo4jGraphQL({
                typeDefs,
                resolvers,
            });
        });

        test("should not fetch required fields if @customResolver field is not selected", async () => {
            const query = gql`
                {
                    users {
                        firstName
                    }
                }
            `;

            const req = createJwtRequest("secret", {});
            const result = await translateQuery(neoSchema, query, {
                req,
            });

            expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
                "MATCH (this:\`User\`)
                RETURN this { .firstName } AS this"
            `);

            expect(formatParams(result.params)).toMatchInlineSnapshot(`"{}"`);
        });

        test("should not over fetch when all required fields are manually selected", async () => {
            const query = gql`
                {
                    users {
                        firstName
                        lastName
                        fullName
                    }
                }
            `;

            const req = createJwtRequest("secret", {});
            const result = await translateQuery(neoSchema, query, {
                req,
            });

            expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
                "MATCH (this:\`User\`)
                RETURN this { .firstName, .lastName, .fullName } AS this"
            `);

            expect(formatParams(result.params)).toMatchInlineSnapshot(`"{}"`);
        });

        test("should not over fetch when some required fields are manually selected", async () => {
            const query = gql`
                {
                    users {
                        firstName
                        fullName
                    }
                }
            `;

            const req = createJwtRequest("secret", {});
            const result = await translateQuery(neoSchema, query, {
                req,
            });

            expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
                "MATCH (this:\`User\`)
                RETURN this { .firstName, .fullName, .lastName } AS this"
            `);

            expect(formatParams(result.params)).toMatchInlineSnapshot(`"{}"`);
        });

        test("should not over fetch when no required fields are manually selected", async () => {
            const query = gql`
                {
                    users {
                        fullName
                    }
                }
            `;

            const req = createJwtRequest("secret", {});
            const result = await translateQuery(neoSchema, query, {
                req,
            });

            expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
                "MATCH (this:\`User\`)
                RETURN this { .fullName, .firstName, .lastName } AS this"
            `);

            expect(formatParams(result.params)).toMatchInlineSnapshot(`"{}"`);
        });
    });

    describe("No required fields", () => {
        beforeAll(() => {
            typeDefs = gql`
                type User {
                    firstName: String!
                    lastName: String!
                    fullName: String! @customResolver
                }
            `;

            const resolvers = {
                User: {
                    fullName: () => "The user's full name",
                },
            };

            neoSchema = new Neo4jGraphQL({
                typeDefs,
                resolvers,
                config: { enableRegex: true },
            });
        });

        test("should not over fetch when other fields are manually selected", async () => {
            const query = gql`
                {
                    users {
                        firstName
                        fullName
                    }
                }
            `;

            const req = createJwtRequest("secret", {});
            const result = await translateQuery(neoSchema, query, {
                req,
            });

            expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
                "MATCH (this:\`User\`)
                RETURN this { .firstName, .fullName } AS this"
            `);

            expect(formatParams(result.params)).toMatchInlineSnapshot(`"{}"`);
        });

        test("should not over fetch when no other fields are manually selected", async () => {
            const query = gql`
                {
                    users {
                        fullName
                    }
                }
            `;

            const req = createJwtRequest("secret", {});
            const result = await translateQuery(neoSchema, query, {
                req,
            });

            expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
                "MATCH (this:\`User\`)
                RETURN this { .fullName } AS this"
            `);

            expect(formatParams(result.params)).toMatchInlineSnapshot(`"{}"`);
        });
    });

    describe("Require fields on nested types", () => {
        beforeAll(() => {
            typeDefs = gql`
                type City {
                    name: String!
                    population: Int
                }

                type Address {
                    street: String!
                    city: City! @relationship(type: "IN_CITY", direction: OUT)
                }

                type User {
                    id: ID!
                    firstName: String!
                    lastName: String!
                    address: Address @relationship(type: "LIVES_AT", direction: OUT)
                    fullName: String
                        @customResolver(requires: "firstName lastName address { city { name population } }")
                }
            `;

            const resolvers = {
                User: {
                    fullName: () => "The user's full name",
                },
            };

            neoSchema = new Neo4jGraphQL({
                typeDefs,
                resolvers,
                config: { enableRegex: true },
            });
        });

        test("should not over fetch when all required fields are manually selected", async () => {
            const query = gql`
                {
                    users {
                        firstName
                        lastName
                        fullName
                        address {
                            city {
                                name
                                population
                            }
                        }
                    }
                }
            `;

            const req = createJwtRequest("secret", {});
            const result = await translateQuery(neoSchema, query, {
                req,
            });

            expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
                "MATCH (this:\`User\`)
                CALL {
                    WITH this
                    MATCH (this)-[this0:\`LIVES_AT\`]->(this1:\`Address\`)
                    CALL {
                        WITH this1
                        MATCH (this1)-[this2:\`IN_CITY\`]->(this3:\`City\`)
                        WITH this3 { .name, .population } AS this3
                        RETURN head(collect(this3)) AS var4
                    }
                    WITH this1 { city: var4 } AS this1
                    RETURN head(collect(this1)) AS var5
                }
                RETURN this { .firstName, .lastName, .fullName, address: var5 } AS this"
            `);

            expect(formatParams(result.params)).toMatchInlineSnapshot(`"{}"`);
        });

        test("should not fetch required fields if @customResolver field is not selected", async () => {
            const query = gql`
                {
                    users {
                        firstName
                    }
                }
            `;

            const req = createJwtRequest("secret", {});
            const result = await translateQuery(neoSchema, query, {
                req,
            });

            expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
                "MATCH (this:\`User\`)
                RETURN this { .firstName } AS this"
            `);

            expect(formatParams(result.params)).toMatchInlineSnapshot(`"{}"`);
        });

        test("should not over fetch when some required fields are manually selected", async () => {
            const query = gql`
                {
                    users {
                        lastName
                        fullName
                        address {
                            city {
                                population
                            }
                        }
                    }
                }
            `;

            const req = createJwtRequest("secret", {});
            const result = await translateQuery(neoSchema, query, {
                req,
            });

            expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
                "MATCH (this:\`User\`)
                CALL {
                    WITH this
                    MATCH (this)-[this0:\`LIVES_AT\`]->(this1:\`Address\`)
                    CALL {
                        WITH this1
                        MATCH (this1)-[this2:\`IN_CITY\`]->(this3:\`City\`)
                        WITH this3 { .population, .name } AS this3
                        RETURN head(collect(this3)) AS var4
                    }
                    WITH this1 { city: var4 } AS this1
                    RETURN head(collect(this1)) AS var5
                }
                RETURN this { .lastName, .fullName, address: var5, .firstName } AS this"
            `);

            expect(formatParams(result.params)).toMatchInlineSnapshot(`"{}"`);
        });

        test("should not over fetch when no required fields are manually selected", async () => {
            const query = gql`
                {
                    users {
                        fullName
                    }
                }
            `;

            const req = createJwtRequest("secret", {});
            const result = await translateQuery(neoSchema, query, {
                req,
            });

            expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
                "MATCH (this:\`User\`)
                CALL {
                    WITH this
                    MATCH (this)-[this0:\`LIVES_AT\`]->(this1:\`Address\`)
                    CALL {
                        WITH this1
                        MATCH (this1)-[this2:\`IN_CITY\`]->(this3:\`City\`)
                        WITH this3 { .name, .population } AS this3
                        RETURN head(collect(this3)) AS var4
                    }
                    WITH this1 { city: var4 } AS this1
                    RETURN head(collect(this1)) AS var5
                }
                RETURN this { .fullName, .firstName, .lastName, address: var5 } AS this"
            `);

            expect(formatParams(result.params)).toMatchInlineSnapshot(`"{}"`);
        });
    });

    describe("Require fields on nested unions", () => {
        beforeAll(() => {
            typeDefs = gql`
                union Publication = Book | Journal

                type Author {
                    name: String!
                    publications: [Publication!]! @relationship(type: "WROTE", direction: OUT)
                    publicationsWithAuthor: [String!]!
                        @customResolver(
                            requires: "name publications { ...on Book { title } ... on Journal { subject } }"
                        )
                }

                type Book {
                    title: String!
                    author: Author! @relationship(type: "WROTE", direction: IN)
                }

                type Journal {
                    subject: String!
                    author: Author! @relationship(type: "WROTE", direction: IN)
                }
            `;

            const resolvers = {
                Author: {
                    publicationsWithAuthor: () => "Some custom resolver",
                },
            };

            neoSchema = new Neo4jGraphQL({
                typeDefs,
                resolvers,
                config: { enableRegex: true },
            });
        });

        test("should not over fetch when all required fields are manually selected", async () => {
            const query = gql`
                {
                    authors {
                        name
                        publicationsWithAuthor
                        publications {
                            ... on Book {
                                title
                            }
                            ... on Journal {
                                subject
                            }
                        }
                    }
                }
            `;

            const req = createJwtRequest("secret", {});
            const result = await translateQuery(neoSchema, query, {
                req,
            });

            expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
                "MATCH (this:\`Author\`)
                CALL {
                    WITH this
                    CALL {
                        WITH *
                        MATCH (this)-[this0:\`WROTE\`]->(this1:\`Book\`)
                        WITH this1 { __resolveType: \\"Book\\", __id: id(this), .title } AS this1
                        RETURN this1 AS var2
                        UNION
                        WITH *
                        MATCH (this)-[this3:\`WROTE\`]->(this4:\`Journal\`)
                        WITH this4 { __resolveType: \\"Journal\\", __id: id(this), .subject } AS this4
                        RETURN this4 AS var2
                    }
                    WITH var2
                    RETURN collect(var2) AS var2
                }
                RETURN this { .name, .publicationsWithAuthor, publications: var2 } AS this"
            `);

            expect(formatParams(result.params)).toMatchInlineSnapshot(`"{}"`);
        });

        test("should not fetch required fields if @customResolver field is not selected", async () => {
            const query = gql`
                {
                    authors {
                        name
                    }
                }
            `;

            const req = createJwtRequest("secret", {});
            const result = await translateQuery(neoSchema, query, {
                req,
            });

            expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
                "MATCH (this:\`Author\`)
                RETURN this { .name } AS this"
            `);

            expect(formatParams(result.params)).toMatchInlineSnapshot(`"{}"`);
        });

        test("should not over fetch when some required fields are manually selected", async () => {
            const query = gql`
                {
                    authors {
                        publicationsWithAuthor
                        publications {
                            ... on Book {
                                title
                            }
                        }
                    }
                }
            `;

            const req = createJwtRequest("secret", {});
            const result = await translateQuery(neoSchema, query, {
                req,
            });

            expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
                "MATCH (this:\`Author\`)
                CALL {
                    WITH this
                    CALL {
                        WITH *
                        MATCH (this)-[this0:\`WROTE\`]->(this1:\`Book\`)
                        WITH this1 { __resolveType: \\"Book\\", __id: id(this), .title } AS this1
                        RETURN this1 AS var2
                        UNION
                        WITH *
                        MATCH (this)-[this3:\`WROTE\`]->(this4:\`Journal\`)
                        WITH this4 { __resolveType: \\"Journal\\", __id: id(this), .subject } AS this4
                        RETURN this4 AS var2
                    }
                    WITH var2
                    RETURN collect(var2) AS var2
                }
                RETURN this { .publicationsWithAuthor, publications: var2, .name } AS this"
            `);

            expect(formatParams(result.params)).toMatchInlineSnapshot(`"{}"`);
        });

        test("should not over fetch when no required fields are manually selected", async () => {
            const query = gql`
                {
                    authors {
                        publicationsWithAuthor
                    }
                }
            `;

            const req = createJwtRequest("secret", {});
            const result = await translateQuery(neoSchema, query, {
                req,
            });

            expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
                "MATCH (this:\`Author\`)
                CALL {
                    WITH this
                    CALL {
                        WITH *
                        MATCH (this)-[this0:\`WROTE\`]->(this1:\`Book\`)
                        WITH this1 { __resolveType: \\"Book\\", __id: id(this), .title } AS this1
                        RETURN this1 AS var2
                        UNION
                        WITH *
                        MATCH (this)-[this3:\`WROTE\`]->(this4:\`Journal\`)
                        WITH this4 { __resolveType: \\"Journal\\", __id: id(this), .subject } AS this4
                        RETURN this4 AS var2
                    }
                    WITH var2
                    RETURN collect(var2) AS var2
                }
                RETURN this { .publicationsWithAuthor, .name, publications: var2 } AS this"
            `);

            expect(formatParams(result.params)).toMatchInlineSnapshot(`"{}"`);
        });
    });

    describe("Require fields on nested interfaces", () => {
        beforeAll(() => {
            typeDefs = gql`
                interface Publication {
                    publicationYear: Int!
                }

                type Author {
                    name: String!
                    publications: [Publication!]! @relationship(type: "WROTE", direction: OUT)
                    publicationsWithAuthor: [String!]!
                        @customResolver(
                            requires: "name publications { publicationYear ...on Book { title } ... on Journal { subject } }"
                        )
                }

                type Book implements Publication {
                    title: String!
                    publicationYear: Int!
                    author: [Author!]! @relationship(type: "WROTE", direction: IN)
                }

                type Journal implements Publication {
                    subject: String!
                    publicationYear: Int!
                    author: [Author!]! @relationship(type: "WROTE", direction: IN)
                }
            `;

            const resolvers = {
                Author: {
                    publicationsWithAuthor: () => "Some custom resolver",
                },
            };

            neoSchema = new Neo4jGraphQL({
                typeDefs,
                resolvers,
                config: { enableRegex: true },
            });
        });

        test("should not over fetch when all required fields are manually selected", async () => {
            const query = gql`
                {
                    authors {
                        name
                        publicationsWithAuthor
                        publications {
                            publicationYear
                            ... on Book {
                                title
                            }
                            ... on Journal {
                                subject
                            }
                        }
                    }
                }
            `;

            const req = createJwtRequest("secret", {});
            const result = await translateQuery(neoSchema, query, {
                req,
            });

            expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
                "MATCH (this:\`Author\`)
                CALL {
                    WITH this
                    CALL {
                        WITH *
                        MATCH (this)-[this0:\`WROTE\`]->(this1:\`Book\`)
                        WITH this1 { __resolveType: \\"Book\\", __id: id(this), .title, .publicationYear } AS this1
                        RETURN this1 AS var2
                        UNION
                        WITH *
                        MATCH (this)-[this3:\`WROTE\`]->(this4:\`Journal\`)
                        WITH this4 { __resolveType: \\"Journal\\", __id: id(this), .subject, .publicationYear } AS this4
                        RETURN this4 AS var2
                    }
                    WITH var2
                    RETURN collect(var2) AS var2
                }
                RETURN this { .name, .publicationsWithAuthor, publications: var2 } AS this"
            `);

            expect(formatParams(result.params)).toMatchInlineSnapshot(`"{}"`);
        });

        test("should not fetch required fields if @customResolver field is not selected", async () => {
            const query = gql`
                {
                    authors {
                        name
                    }
                }
            `;

            const req = createJwtRequest("secret", {});
            const result = await translateQuery(neoSchema, query, {
                req,
            });

            expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
                "MATCH (this:\`Author\`)
                RETURN this { .name } AS this"
            `);

            expect(formatParams(result.params)).toMatchInlineSnapshot(`"{}"`);
        });

        test("should not over fetch when some required fields are manually selected", async () => {
            const query = gql`
                {
                    authors {
                        publicationsWithAuthor
                        publications {
                            ... on Book {
                                title
                            }
                        }
                    }
                }
            `;

            const req = createJwtRequest("secret", {});
            const result = await translateQuery(neoSchema, query, {
                req,
            });

            expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
                "MATCH (this:\`Author\`)
                CALL {
                    WITH this
                    CALL {
                        WITH *
                        MATCH (this)-[this0:\`WROTE\`]->(this1:\`Book\`)
                        WITH this1 { __resolveType: \\"Book\\", __id: id(this), .title, .publicationYear } AS this1
                        RETURN this1 AS var2
                        UNION
                        WITH *
                        MATCH (this)-[this3:\`WROTE\`]->(this4:\`Journal\`)
                        WITH this4 { __resolveType: \\"Journal\\", __id: id(this), .subject, .publicationYear } AS this4
                        RETURN this4 AS var2
                    }
                    WITH var2
                    RETURN collect(var2) AS var2
                }
                RETURN this { .publicationsWithAuthor, publications: var2, .name } AS this"
            `);

            expect(formatParams(result.params)).toMatchInlineSnapshot(`"{}"`);
        });

        test("should not over fetch when no required fields are manually selected", async () => {
            const query = gql`
                {
                    authors {
                        publicationsWithAuthor
                    }
                }
            `;

            const req = createJwtRequest("secret", {});
            const result = await translateQuery(neoSchema, query, {
                req,
            });

            expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
                "MATCH (this:\`Author\`)
                CALL {
                    WITH this
                    CALL {
                        WITH *
                        MATCH (this)-[this0:\`WROTE\`]->(this1:\`Book\`)
                        WITH this1 { __resolveType: \\"Book\\", __id: id(this), .title, .publicationYear } AS this1
                        RETURN this1 AS var2
                        UNION
                        WITH *
                        MATCH (this)-[this3:\`WROTE\`]->(this4:\`Journal\`)
                        WITH this4 { __resolveType: \\"Journal\\", __id: id(this), .subject, .publicationYear } AS this4
                        RETURN this4 AS var2
                    }
                    WITH var2
                    RETURN collect(var2) AS var2
                }
                RETURN this { .publicationsWithAuthor, .name, publications: var2 } AS this"
            `);

            expect(formatParams(result.params)).toMatchInlineSnapshot(`"{}"`);
        });
    });
});
