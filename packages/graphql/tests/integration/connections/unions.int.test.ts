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

    const bookTitle = "Oliver Twist";
    const bookWordCount = 167543;

    const journalSubject = "Master Humphrey's Clock";
    const journalWordCount = 3413;

    beforeAll(async () => {
        driver = await neo4j();
        const session = driver.session();

        try {
            await session.run(
                `
                    CREATE (author:Author {name: $authorName})
                    CREATE (author)-[:WROTE {words: $bookWordCount}]->(:Book {title: $bookTitle})
                    CREATE (author)-[:WROTE {words: $journalWordCount}]->(:Journal {subject: $journalSubject})
                `,
                {
                    authorName,
                    bookTitle,
                    bookWordCount,
                    journalSubject,
                    journalWordCount,
                }
            );
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
                    MATCH (book:Book {title: $bookTitle})
                    MATCH (journal:Journal {subject: $journalSubject})
                    DETACH DELETE author, book, journal
                `,
                {
                    authorName,
                    bookTitle,
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
                contextValue: { driver, driverConfig: { bookmarks: [session.lastBookmark()] } },
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
                                words: bookWordCount,
                                node: {
                                    title: bookTitle,
                                },
                            },
                            {
                                words: journalWordCount,
                                node: {
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
                contextValue: { driver, driverConfig: { bookmarks: [session.lastBookmark()] } },
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
                                words: bookWordCount,
                                node: {
                                    title: bookTitle,
                                },
                            },
                            {
                                words: journalWordCount,
                                node: {},
                            },
                        ],
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
                contextValue: { driver, driverConfig: { bookmarks: [session.lastBookmark()] } },
                variableValues: {
                    authorName,
                    bookTitle,
                },
            });

            expect(result.errors).toBeFalsy();

            expect(result?.data?.authors).toEqual([
                {
                    name: authorName,
                    publicationsConnection: {
                        edges: [
                            {
                                words: bookWordCount,
                                node: {
                                    title: bookTitle,
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
                contextValue: { driver, driverConfig: { bookmarks: [session.lastBookmark()] } },
                variableValues: {
                    authorName,
                    bookTitle,
                },
            });

            expect(result.errors).toBeFalsy();

            expect(result?.data?.authors).toEqual([
                {
                    name: authorName,
                    publicationsConnection: {
                        edges: [],
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
                contextValue: { driver, driverConfig: { bookmarks: [session.lastBookmark()] } },
                variableValues: {
                    authorName,
                    bookTitle,
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
                                words: bookWordCount,
                                node: {
                                    __typename: "Book",
                                    title: bookTitle,
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
                contextValue: { driver, driverConfig: { bookmarks: [session.lastBookmark()] } },
                variableValues: {
                    authorName,
                    bookTitle,
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
                                words: bookWordCount,
                                node: {
                                    __typename: "Book",
                                    title: bookTitle,
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
                contextValue: { driver, driverConfig: { bookmarks: [session.lastBookmark()] } },
                variableValues: {
                    authorName,
                    bookWordCount,
                },
            });

            expect(result.errors).toBeFalsy();

            expect(result?.data?.authors).toEqual([
                {
                    name: authorName,
                    publicationsConnection: {
                        edges: [
                            {
                                words: bookWordCount,
                                node: {
                                    title: bookTitle,
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
                contextValue: { driver, driverConfig: { bookmarks: [session.lastBookmark()] } },
                variableValues: {
                    authorName,
                    bookWordCount,
                },
            });

            expect(result.errors).toBeFalsy();

            expect(result?.data?.authors).toEqual([
                {
                    name: authorName,
                    publicationsConnection: {
                        edges: [],
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
                contextValue: { driver, driverConfig: { bookmarks: [session.lastBookmark()] } },
                variableValues: {
                    authorName,
                    bookWordCount,
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
                                words: bookWordCount,
                                node: {
                                    __typename: "Book",
                                    title: bookTitle,
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
                contextValue: { driver, driverConfig: { bookmarks: [session.lastBookmark()] } },
                variableValues: {
                    authorName,
                    bookWordCount,
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
                                words: bookWordCount,
                                node: {
                                    __typename: "Book",
                                    title: bookTitle,
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
                contextValue: { driver, driverConfig: { bookmarks: [session.lastBookmark()] } },
                variableValues: {
                    authorName,
                    bookWordCount,
                    bookTitle,
                },
            });

            expect(result.errors).toBeFalsy();

            expect(result?.data?.authors).toEqual([
                {
                    name: authorName,
                    publicationsConnection: {
                        edges: [
                            {
                                words: bookWordCount,
                                node: {
                                    title: bookTitle,
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
