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
                config: { enableRegex: true },
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
                    MATCH (this)-[this0:LIVES_AT]->(this_address:\`Address\`)
                    CALL {
                        WITH this_address
                        MATCH (this_address)-[this1:IN_CITY]->(this_address_city:\`City\`)
                        WITH this_address_city { .name, .population } AS this_address_city
                        RETURN head(collect(this_address_city)) AS this_address_city
                    }
                    WITH this_address { city: this_address_city } AS this_address
                    RETURN head(collect(this_address)) AS this_address
                }
                RETURN this { .firstName, .lastName, .fullName, address: this_address } AS this"
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
                    MATCH (this)-[this0:LIVES_AT]->(this_address:\`Address\`)
                    CALL {
                        WITH this_address
                        MATCH (this_address)-[this1:IN_CITY]->(this_address_city:\`City\`)
                        WITH this_address_city { .population, .name } AS this_address_city
                        RETURN head(collect(this_address_city)) AS this_address_city
                    }
                    WITH this_address { city: this_address_city } AS this_address
                    RETURN head(collect(this_address)) AS this_address
                }
                RETURN this { .lastName, .fullName, address: this_address, .firstName } AS this"
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
                    MATCH (this)-[this0:LIVES_AT]->(this_address:\`Address\`)
                    CALL {
                        WITH this_address
                        MATCH (this_address)-[this1:IN_CITY]->(this_address_city:\`City\`)
                        WITH this_address_city { .name, .population } AS this_address_city
                        RETURN head(collect(this_address_city)) AS this_address_city
                    }
                    WITH this_address { city: this_address_city } AS this_address
                    RETURN head(collect(this_address)) AS this_address
                }
                RETURN this { .fullName, .firstName, .lastName, address: this_address } AS this"
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
                        MATCH (this)-[this0:WROTE]->(this_publications:\`Book\`)
                        WITH this_publications  { __resolveType: \\"Book\\",  .title } AS this_publications
                        RETURN this_publications AS this_publications
                        UNION
                        WITH *
                        MATCH (this)-[this1:WROTE]->(this_publications:\`Journal\`)
                        WITH this_publications  { __resolveType: \\"Journal\\",  .subject } AS this_publications
                        RETURN this_publications AS this_publications
                    }
                    WITH this_publications
                    RETURN collect(this_publications) AS this_publications
                }
                RETURN this { .name, .publicationsWithAuthor, publications: this_publications } AS this"
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
                        MATCH (this)-[this0:WROTE]->(this_publications:\`Book\`)
                        WITH this_publications  { __resolveType: \\"Book\\",  .title } AS this_publications
                        RETURN this_publications AS this_publications
                        UNION
                        WITH *
                        MATCH (this)-[this1:WROTE]->(this_publications:\`Journal\`)
                        WITH this_publications  { __resolveType: \\"Journal\\",  .subject } AS this_publications
                        RETURN this_publications AS this_publications
                    }
                    WITH this_publications
                    RETURN collect(this_publications) AS this_publications
                }
                RETURN this { .publicationsWithAuthor, publications: this_publications, .name } AS this"
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
                        MATCH (this)-[this0:WROTE]->(this_publications:\`Book\`)
                        WITH this_publications  { __resolveType: \\"Book\\",  .title } AS this_publications
                        RETURN this_publications AS this_publications
                        UNION
                        WITH *
                        MATCH (this)-[this1:WROTE]->(this_publications:\`Journal\`)
                        WITH this_publications  { __resolveType: \\"Journal\\",  .subject } AS this_publications
                        RETURN this_publications AS this_publications
                    }
                    WITH this_publications
                    RETURN collect(this_publications) AS this_publications
                }
                RETURN this { .publicationsWithAuthor, .name, publications: this_publications } AS this"
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
                WITH *
                CALL {
                WITH *
                CALL {
                    WITH this
                    MATCH (this)-[this0:WROTE]->(this_Book:\`Book\`)
                    RETURN { __resolveType: \\"Book\\", title: this_Book.title, publicationYear: this_Book.publicationYear } AS this_publications
                    UNION
                    WITH this
                    MATCH (this)-[this1:WROTE]->(this_Journal:\`Journal\`)
                    RETURN { __resolveType: \\"Journal\\", subject: this_Journal.subject, publicationYear: this_Journal.publicationYear } AS this_publications
                }
                RETURN collect(this_publications) AS this_publications
                }
                RETURN this { .name, .publicationsWithAuthor, publications: this_publications } AS this"
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
                WITH *
                CALL {
                WITH *
                CALL {
                    WITH this
                    MATCH (this)-[this0:WROTE]->(this_Book:\`Book\`)
                    RETURN { __resolveType: \\"Book\\", title: this_Book.title, publicationYear: this_Book.publicationYear } AS this_publications
                    UNION
                    WITH this
                    MATCH (this)-[this1:WROTE]->(this_Journal:\`Journal\`)
                    RETURN { __resolveType: \\"Journal\\", subject: this_Journal.subject, publicationYear: this_Journal.publicationYear } AS this_publications
                }
                RETURN collect(this_publications) AS this_publications
                }
                RETURN this { .publicationsWithAuthor, publications: this_publications, .name } AS this"
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
                WITH *
                CALL {
                WITH *
                CALL {
                    WITH this
                    MATCH (this)-[this0:WROTE]->(this_Book:\`Book\`)
                    RETURN { __resolveType: \\"Book\\", title: this_Book.title, publicationYear: this_Book.publicationYear } AS this_publications
                    UNION
                    WITH this
                    MATCH (this)-[this1:WROTE]->(this_Journal:\`Journal\`)
                    RETURN { __resolveType: \\"Journal\\", subject: this_Journal.subject, publicationYear: this_Journal.publicationYear } AS this_publications
                }
                RETURN collect(this_publications) AS this_publications
                }
                RETURN this { .publicationsWithAuthor, .name, publications: this_publications } AS this"
            `);

            expect(formatParams(result.params)).toMatchInlineSnapshot(`"{}"`);
        });
    });
});
