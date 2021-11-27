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

import { Driver } from "neo4j-driver";
import { graphql } from "graphql";
import { gql } from "apollo-server";
import neo4j from "../neo4j";
import { Neo4jGraphQL } from "../../../src/classes";

describe("Connections -> Unions", () => {
    let driver: Driver;
    let bookmarks: string[];

    const typeDefs = gql`
        union Publication = Book | Journal

        type Author {
            name: String!
            publications: [Publication] @relationship(type: "WROTE", direction: OUT, properties: "Wrote")
        }

        type Book {
            title: String!
            author: [Author!]! @relationship(type: "WROTE", direction: IN, properties: "Wrote")
        }

        type Journal {
            subject: String!
            author: [Author!]! @relationship(type: "WROTE", direction: IN, properties: "Wrote")
        }

        interface Wrote {
            words: Int!
        }
    `;

    const authorName = "Charles Dickens";

    const book1Title = "Oliver Twist";
    const book1WordCount = 167543;

    const book2Title = "A Christmas Carol";
    const book2WordCount = 30953;

    const journalSubject = "Master Humphrey's Clock";
    const journalWordCount = 3413;

    beforeAll(async () => {
        driver = await neo4j();
        const session = driver.session();

        try {
            await session.run(
                `
                    CREATE (author:Author {name: $authorName})
                    CREATE (author)-[:WROTE {words: $book1WordCount}]->(:Book {title: $book1Title})
                    CREATE (author)-[:WROTE {words: $book2WordCount}]->(:Book {title: $book2Title})
                    CREATE (author)-[:WROTE {words: $journalWordCount}]->(:Journal {subject: $journalSubject})
                `,
                {
                    authorName,
                    book1Title,
                    book1WordCount,
                    book2Title,
                    book2WordCount,
                    journalSubject,
                    journalWordCount,
                }
            );
            bookmarks = session.lastBookmark();
        } finally {
            await session.close();
        }
    });

    afterAll(async () => {
        const session = driver.session();

        try {
            await session.run(
                `
                    MATCH (author:Author {name: $authorName})
                    MATCH (book1:Book {title: $book1Title})
                    MATCH (book2:Book {title: $book2Title})
                    MATCH (journal:Journal {subject: $journalSubject})
                    DETACH DELETE author, book1, book2, journal
                `,
                {
                    authorName,
                    book1Title,
                    book2Title,
                    journalSubject,
                }
            );
        } finally {
            await session.close();
        }

        await driver.close();
    });

    test("Projecting node and relationship properties with no arguments", async () => {
        const session = driver.session();

        const neoSchema = new Neo4jGraphQL({ typeDefs, driver });

        const query = `
            query ($authorName: String) {
                authors(where: { name: $authorName }) {
                    name
                    publicationsConnection {
                        edges {
                            words
                            node {
                                ... on Book {
                                    title
                                }
                                ... on Journal {
                                    subject
                                }
                            }
                        }
                    }
                }
            }
        `;

        try {
            await neoSchema.checkNeo4jCompat();

            const result = await graphql({
                schema: neoSchema.schema,
                source: query,
                contextValue: { driver, driverConfig: { bookmarks } },
                variableValues: {
                    authorName,
                },
            });

            expect(result.errors).toBeFalsy();

            expect(result?.data?.authors).toEqual([
                {
                    name: authorName,
                    publicationsConnection: {
                        edges: expect.arrayContaining([
                            {
                                words: book1WordCount,
                                node: {
                                    title: book1Title,
                                },
                            },
                            {
                                words: book2WordCount,
                                node: {
                                    title: book2Title,
                                },
                            },
                            {
                                words: journalWordCount,
                                node: {
                                    subject: journalSubject,
                                },
                            },
                        ]),
                    },
                },
            ]);
        } finally {
            await session.close();
        }
    });

    test("Projecting node and relationship properties with sort argument", async () => {
        const session = driver.session();

        const neoSchema = new Neo4jGraphQL({ typeDefs, driver });

        const query = `
            query($authorName: String) {
                authors(where: { name: $authorName }) {
                    name
                    publicationsConnection(sort: [{ edge: { words: ASC } }]) {
                        edges {
                            words
                            node {
                                ... on Book {
                                    title
                                }
                                ... on Journal {
                                    subject
                                }
                            }
                        }
                    }
                }
            }
        `;

        try {
            await neoSchema.checkNeo4jCompat();

            const result = await graphql({
                schema: neoSchema.schema,
                source: query,
                contextValue: { driver, driverConfig: { bookmarks } },
                variableValues: {
                    authorName,
                },
            });

            expect(result.errors).toBeFalsy();

            expect(result?.data?.authors).toEqual([
                {
                    name: authorName,
                    publicationsConnection: {
                        edges: [
                            {
                                words: journalWordCount,
                                node: {
                                    subject: journalSubject,
                                },
                            },
                            {
                                words: book2WordCount,
                                node: {
                                    title: book2Title,
                                },
                            },
                            {
                                words: book1WordCount,
                                node: {
                                    title: book1Title,
                                },
                            },
                        ],
                    },
                },
            ]);
        } finally {
            await session.close();
        }
    });

    test("Projecting node and relationship properties for one union member with no arguments", async () => {
        const session = driver.session();

        const neoSchema = new Neo4jGraphQL({ typeDefs, driver });

        const query = `
            query ($authorName: String) {
                authors(where: { name: $authorName }) {
                    name
                    publicationsConnection {
                        edges {
                            words
                            node {
                                ... on Book {
                                    title
                                }
                            }
                        }
                    }
                }
            }
        `;

        try {
            await neoSchema.checkNeo4jCompat();

            const result = await graphql({
                schema: neoSchema.schema,
                source: query,
                contextValue: { driver, driverConfig: { bookmarks } },
                variableValues: {
                    authorName,
                },
            });

            expect(result.errors).toBeFalsy();

            expect(result?.data?.authors).toEqual([
                {
                    name: authorName,
                    publicationsConnection: {
                        edges: expect.arrayContaining([
                            {
                                words: book1WordCount,
                                node: {
                                    title: book1Title,
                                },
                            },
                            {
                                words: book2WordCount,
                                node: {
                                    title: book2Title,
                                },
                            },
                            {
                                words: journalWordCount,
                                node: {},
                            },
                        ]),
                    },
                },
            ]);
        } finally {
            await session.close();
        }
    });

    test("With where argument on node with node in database", async () => {
        const session = driver.session();

        const neoSchema = new Neo4jGraphQL({ typeDefs, driver });

        const query = `
            query ($authorName: String, $bookTitle: String) {
                authors(where: { name: $authorName }) {
                    name
                    publicationsConnection(where: { Book: { node: { title: $bookTitle } } }) {
                        edges {
                            words
                            node {
                                ... on Book {
                                    title
                                }
                            }
                        }
                    }
                }
            }
        `;

        try {
            await neoSchema.checkNeo4jCompat();

            const result = await graphql({
                schema: neoSchema.schema,
                source: query,
                contextValue: { driver, driverConfig: { bookmarks } },
                variableValues: {
                    authorName,
                    bookTitle: book1Title,
                },
            });

            expect(result.errors).toBeFalsy();

            expect(result?.data?.authors).toEqual([
                {
                    name: authorName,
                    publicationsConnection: {
                        edges: [
                            {
                                words: book1WordCount,
                                node: {
                                    title: book1Title,
                                },
                            },
                        ],
                    },
                },
            ]);
        } finally {
            await session.close();
        }
    });

    test("With where argument on node with node not in database", async () => {
        const session = driver.session();

        const neoSchema = new Neo4jGraphQL({ typeDefs, driver });

        const query = `
            query ($authorName: String, $bookTitle: String) {
                authors(where: { name: $authorName }) {
                    name
                    publicationsConnection(where: { Book: { node: { title_NOT: $bookTitle } } }) {
                        edges {
                            words
                            node {
                                ... on Book {
                                    title
                                }
                            }
                        }
                    }
                }
            }
        `;

        try {
            await neoSchema.checkNeo4jCompat();

            const result = await graphql({
                schema: neoSchema.schema,
                source: query,
                contextValue: { driver, driverConfig: { bookmarks } },
                variableValues: {
                    authorName,
                    bookTitle: book1Title,
                },
            });

            expect(result.errors).toBeFalsy();

            expect(result?.data?.authors).toEqual([
                {
                    name: authorName,
                    publicationsConnection: {
                        edges: [
                            {
                                node: {
                                    title: "A Christmas Carol",
                                },
                                words: 30953,
                            },
                        ],
                    },
                },
            ]);
        } finally {
            await session.close();
        }
    });

    test("With where argument on all nodes with all in database", async () => {
        const session = driver.session();

        const neoSchema = new Neo4jGraphQL({ typeDefs, driver });

        const query = `
            query ($authorName: String, $bookTitle: String, $journalSubject: String) {
                authors(where: { name: $authorName }) {
                    name
                    publicationsConnection(
                        where: {
                            Book: { node: { title: $bookTitle } }
                            Journal: { node: { subject: $journalSubject } }
                        }
                    ) {
                        totalCount
                        edges {
                            words
                            node {
                                __typename
                                ... on Book {
                                    title
                                }
                                ... on Journal {
                                    subject
                                }
                            }
                        }
                    }
                }
            }
        `;

        try {
            await neoSchema.checkNeo4jCompat();

            const result = await graphql({
                schema: neoSchema.schema,
                source: query,
                contextValue: { driver, driverConfig: { bookmarks } },
                variableValues: {
                    authorName,
                    bookTitle: book1Title,
                    journalSubject,
                },
            });

            expect(result.errors).toBeFalsy();

            expect(result?.data?.authors).toEqual([
                {
                    name: authorName,
                    publicationsConnection: {
                        totalCount: 2,
                        edges: [
                            {
                                words: book1WordCount,
                                node: {
                                    __typename: "Book",
                                    title: book1Title,
                                },
                            },
                            {
                                words: journalWordCount,
                                node: {
                                    __typename: "Journal",
                                    subject: journalSubject,
                                },
                            },
                        ],
                    },
                },
            ]);
        } finally {
            await session.close();
        }
    });

    test("With where argument on all nodes with only one in database", async () => {
        const session = driver.session();

        const neoSchema = new Neo4jGraphQL({ typeDefs, driver });

        const query = `
            query ($authorName: String, $bookTitle: String, $journalSubject: String) {
                authors(where: { name: $authorName }) {
                    name
                    publicationsConnection(
                        where: {
                            Book: { node: { title: $bookTitle } }
                            Journal: { node: { subject_NOT: $journalSubject } }
                        }
                    ) {
                        totalCount
                        edges {
                            words
                            node {
                                __typename
                                ... on Book {
                                    title
                                }
                                ... on Journal {
                                    subject
                                }
                            }
                        }
                    }
                }
            }
        `;

        try {
            await neoSchema.checkNeo4jCompat();

            const result = await graphql({
                schema: neoSchema.schema,
                source: query,
                contextValue: { driver, driverConfig: { bookmarks } },
                variableValues: {
                    authorName,
                    bookTitle: book1Title,
                    journalSubject,
                },
            });

            expect(result.errors).toBeFalsy();

            expect(result?.data?.authors).toEqual([
                {
                    name: authorName,
                    publicationsConnection: {
                        totalCount: 1,
                        edges: [
                            {
                                words: book1WordCount,
                                node: {
                                    __typename: "Book",
                                    title: book1Title,
                                },
                            },
                        ],
                    },
                },
            ]);
        } finally {
            await session.close();
        }
    });

    test("With where argument on relationship with relationship in database", async () => {
        const session = driver.session();

        const neoSchema = new Neo4jGraphQL({ typeDefs, driver });

        const query = `
            query ($authorName: String, $bookWordCount: Int) {
                authors(where: { name: $authorName }) {
                    name
                    publicationsConnection(where: { Book: { edge: { words: $bookWordCount } } }) {
                        edges {
                            words
                            node {
                                ... on Book {
                                    title
                                }
                            }
                        }
                    }
                }
            }
        `;

        try {
            await neoSchema.checkNeo4jCompat();

            const result = await graphql({
                schema: neoSchema.schema,
                source: query,
                contextValue: { driver, driverConfig: { bookmarks } },
                variableValues: {
                    authorName,
                    bookWordCount: book1WordCount,
                },
            });

            expect(result.errors).toBeFalsy();

            expect(result?.data?.authors).toEqual([
                {
                    name: authorName,
                    publicationsConnection: {
                        edges: [
                            {
                                words: book1WordCount,
                                node: {
                                    title: book1Title,
                                },
                            },
                        ],
                    },
                },
            ]);
        } finally {
            await session.close();
        }
    });

    test("With where argument on relationship with relationship not in database", async () => {
        const session = driver.session();

        const neoSchema = new Neo4jGraphQL({ typeDefs, driver });

        const query = `
            query ($authorName: String, $bookWordCount: Int) {
                authors(where: { name: $authorName }) {
                    name
                    publicationsConnection(where: { Book: { edge: { words_NOT: $bookWordCount } } }) {
                        edges {
                            words
                            node {
                                ... on Book {
                                    title
                                }
                            }
                        }
                    }
                }
            }
        `;

        try {
            await neoSchema.checkNeo4jCompat();

            const result = await graphql({
                schema: neoSchema.schema,
                source: query,
                contextValue: { driver, driverConfig: { bookmarks } },
                variableValues: {
                    authorName,
                    bookWordCount: book1WordCount,
                },
            });

            expect(result.errors).toBeFalsy();

            expect(result?.data?.authors).toEqual([
                {
                    name: authorName,
                    publicationsConnection: {
                        edges: [
                            {
                                words: book2WordCount,
                                node: {
                                    title: book2Title,
                                },
                            },
                        ],
                    },
                },
            ]);
        } finally {
            await session.close();
        }
    });

    test("With where argument on all edges with all in database", async () => {
        const session = driver.session();

        const neoSchema = new Neo4jGraphQL({ typeDefs, driver });

        const query = `
            query ($authorName: String, $bookWordCount: Int, $journalWordCount: Int) {
                authors(where: { name: $authorName }) {
                    name
                    publicationsConnection(
                        where: {
                            Book: { edge: { words: $bookWordCount } }
                            Journal: { edge: { words: $journalWordCount } }
                        }
                    ) {
                        totalCount
                        edges {
                            words
                            node {
                                __typename
                                ... on Book {
                                    title
                                }
                                ... on Journal {
                                    subject
                                }
                            }
                        }
                    }
                }
            }
        `;

        try {
            await neoSchema.checkNeo4jCompat();

            const result = await graphql({
                schema: neoSchema.schema,
                source: query,
                contextValue: { driver, driverConfig: { bookmarks } },
                variableValues: {
                    authorName,
                    bookWordCount: book1WordCount,
                    journalWordCount,
                },
            });

            expect(result.errors).toBeFalsy();

            expect(result?.data?.authors).toEqual([
                {
                    name: authorName,
                    publicationsConnection: {
                        totalCount: 2,
                        edges: [
                            {
                                words: book1WordCount,
                                node: {
                                    __typename: "Book",
                                    title: book1Title,
                                },
                            },
                            {
                                words: journalWordCount,
                                node: {
                                    __typename: "Journal",
                                    subject: journalSubject,
                                },
                            },
                        ],
                    },
                },
            ]);
        } finally {
            await session.close();
        }
    });

    test("With where argument on all edges with only one in database", async () => {
        const session = driver.session();

        const neoSchema = new Neo4jGraphQL({ typeDefs, driver });

        const query = `
            query ($authorName: String, $bookWordCount: Int, $journalWordCount: Int) {
                authors(where: { name: $authorName }) {
                    name
                    publicationsConnection(
                        where: {
                            Book: { edge: { words: $bookWordCount } }
                            Journal: { edge: { words_NOT: $journalWordCount } }
                        }
                    ) {
                        totalCount
                        edges {
                            words
                            node {
                                __typename
                                ... on Book {
                                    title
                                }
                                ... on Journal {
                                    subject
                                }
                            }
                        }
                    }
                }
            }
        `;

        try {
            await neoSchema.checkNeo4jCompat();

            const result = await graphql({
                schema: neoSchema.schema,
                source: query,
                contextValue: { driver, driverConfig: { bookmarks } },
                variableValues: {
                    authorName,
                    bookWordCount: book1WordCount,
                    journalWordCount,
                },
            });

            expect(result.errors).toBeFalsy();

            expect(result?.data?.authors).toEqual([
                {
                    name: authorName,
                    publicationsConnection: {
                        totalCount: 1,
                        edges: [
                            {
                                words: book1WordCount,
                                node: {
                                    __typename: "Book",
                                    title: book1Title,
                                },
                            },
                        ],
                    },
                },
            ]);
        } finally {
            await session.close();
        }
    });

    test("With where argument on relationship and node", async () => {
        const session = driver.session();

        const neoSchema = new Neo4jGraphQL({ typeDefs, driver });

        const query = `
            query ($authorName: String, $bookWordCount: Int, $bookTitle: String) {
                authors(where: { name: $authorName }) {
                    name
                    publicationsConnection(
                        where: {
                            Book: {
                                edge: { words: $bookWordCount }
                                node: { title: $bookTitle }
                            }
                        }
                    ) {
                        edges {
                            words
                            node {
                                ... on Book {
                                    title
                                }
                            }
                        }
                    }
                }
            }
        `;

        try {
            await neoSchema.checkNeo4jCompat();

            const result = await graphql({
                schema: neoSchema.schema,
                source: query,
                contextValue: { driver, driverConfig: { bookmarks } },
                variableValues: {
                    authorName,
                    bookWordCount: book1WordCount,
                    bookTitle: book1Title,
                },
            });

            expect(result.errors).toBeFalsy();

            expect(result?.data?.authors).toEqual([
                {
                    name: authorName,
                    publicationsConnection: {
                        edges: [
                            {
                                words: book1WordCount,
                                node: {
                                    title: book1Title,
                                },
                            },
                        ],
                    },
                },
            ]);
        } finally {
            await session.close();
        }
    });
});
