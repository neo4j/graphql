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

import { graphql } from "graphql";
import { gql } from "graphql-tag";
import type { Driver } from "neo4j-driver";
import { Neo4jGraphQL } from "../../../src/classes";
import Neo4jHelper from "../neo4j";

describe("Connections -> Unions", () => {
    let driver: Driver;
    let neo4j: Neo4jHelper;

    const typeDefs = gql`
        union Publication = Book | Journal

        type Author {
            name: String!
            publications: [Publication!]! @relationship(type: "WROTE", direction: OUT, properties: "Wrote")
        }

        type Book {
            title: String!
            author: [Author!]! @relationship(type: "WROTE", direction: IN, properties: "Wrote")
        }

        type Journal {
            subject: String!
            author: [Author!]! @relationship(type: "WROTE", direction: IN, properties: "Wrote")
        }

        type Wrote @relationshipProperties {
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
        neo4j = new Neo4jHelper();
        driver = await neo4j.getDriver();
        const session = await neo4j.getSession();

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
        } finally {
            await session.close();
        }
    });

    afterAll(async () => {
        const session = await neo4j.getSession();

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
        const session = await neo4j.getSession();

        const neoSchema = new Neo4jGraphQL({ typeDefs, driver });

        const query = `
            query ($authorName: String) {
                authors(where: { name: $authorName }) {
                    name
                    publicationsConnection {
                        edges {
                            properties {
                                words
                            }
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
                schema: await neoSchema.getSchema(),
                source: query,
                contextValue: neo4j.getContextValues(),
                variableValues: {
                    authorName,
                },
            });

            expect(result.errors).toBeFalsy();

            expect(result?.data?.authors).toEqual([
                {
                    name: authorName,
                    publicationsConnection: {
                        edges: expect.toIncludeSameMembers([
                            {
                                properties: { words: book1WordCount },
                                node: {
                                    title: book1Title,
                                },
                            },
                            {
                                properties: { words: book2WordCount },
                                node: {
                                    title: book2Title,
                                },
                            },
                            {
                                properties: { words: journalWordCount },
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
        const session = await neo4j.getSession();

        const neoSchema = new Neo4jGraphQL({ typeDefs, driver });

        const query = `
            query($authorName: String) {
                authors(where: { name: $authorName }) {
                    name
                    publicationsConnection(sort: [{ edge: { words: ASC } }]) {
                        edges {
                            properties {
                                words
                            }
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
                schema: await neoSchema.getSchema(),
                source: query,
                contextValue: neo4j.getContextValues(),
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
                                properties: { words: journalWordCount },
                                node: {
                                    subject: journalSubject,
                                },
                            },
                            {
                                properties: { words: book2WordCount },
                                node: {
                                    title: book2Title,
                                },
                            },
                            {
                                properties: { words: book1WordCount },
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

    test("Projecting node and relationship properties with pagination", async () => {
        const session = await neo4j.getSession();

        const neoSchema = new Neo4jGraphQL({ typeDefs, driver });

        const query = `
            query($authorName: String, $after: String) {
                authors(where: { name: $authorName }) {
                    name
                    publicationsConnection(first: 2, after: $after, sort: [{ edge: { words: ASC } }]) {
                        pageInfo {
                            hasNextPage
                            hasPreviousPage
                            endCursor
                        }
                        edges {
                            properties {
                                words
                            }
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
                schema: await neoSchema.getSchema(),
                source: query,
                contextValue: neo4j.getContextValues(),
                variableValues: {
                    authorName,
                },
            });

            expect(result.errors).toBeFalsy();

            expect(result?.data?.authors).toEqual([
                {
                    name: authorName,
                    publicationsConnection: {
                        pageInfo: {
                            hasNextPage: true,
                            hasPreviousPage: false,
                            endCursor: expect.any(String),
                        },
                        edges: [
                            {
                                properties: { words: journalWordCount },
                                node: {
                                    subject: journalSubject,
                                },
                            },
                            {
                                properties: { words: book2WordCount },
                                node: {
                                    title: book2Title,
                                },
                            },
                        ],
                    },
                },
            ]);

            const nextResult = await graphql({
                schema: await neoSchema.getSchema(),
                source: query,
                contextValue: neo4j.getContextValues(),
                variableValues: {
                    authorName,
                    after: (result.data?.authors as any)[0].publicationsConnection.pageInfo.endCursor,
                },
            });

            expect(nextResult.errors).toBeFalsy();

            expect(nextResult.data?.authors).toEqual([
                {
                    name: authorName,
                    publicationsConnection: {
                        pageInfo: {
                            hasNextPage: false,
                            hasPreviousPage: true,
                            endCursor: expect.any(String),
                        },
                        edges: [
                            {
                                properties: { words: book1WordCount },
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
        const session = await neo4j.getSession();

        const neoSchema = new Neo4jGraphQL({ typeDefs, driver });

        const query = `
            query ($authorName: String) {
                authors(where: { name: $authorName }) {
                    name
                    publicationsConnection {
                        edges {
                            properties {
                                words
                            }
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
                schema: await neoSchema.getSchema(),
                source: query,
                contextValue: neo4j.getContextValues(),
                variableValues: {
                    authorName,
                },
            });

            expect(result.errors).toBeFalsy();

            expect(result?.data?.authors).toEqual([
                {
                    name: authorName,
                    publicationsConnection: {
                        edges: expect.toIncludeSameMembers([
                            {
                                properties: { words: book1WordCount },
                                node: {
                                    title: book1Title,
                                },
                            },
                            {
                                properties: { words: book2WordCount },
                                node: {
                                    title: book2Title,
                                },
                            },
                            {
                                properties: { words: journalWordCount },
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
        const session = await neo4j.getSession();

        const neoSchema = new Neo4jGraphQL({ typeDefs, driver });

        const query = `
            query ($authorName: String, $bookTitle: String) {
                authors(where: { name: $authorName }) {
                    name
                    publicationsConnection(where: { Book: { node: { title: $bookTitle } } }) {
                        edges {
                            properties {
                                words
                            }
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
                schema: await neoSchema.getSchema(),
                source: query,
                contextValue: neo4j.getContextValues(),
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
                                properties: { words: book1WordCount },
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
        const session = await neo4j.getSession();

        const neoSchema = new Neo4jGraphQL({ typeDefs, driver });

        const query = `
            query ($authorName: String, $bookTitle: String) {
                authors(where: { name: $authorName }) {
                    name
                    publicationsConnection(where: { Book: { node: { title_NOT: $bookTitle } } }) {
                        edges {
                            properties {
                                words
                            }
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
                schema: await neoSchema.getSchema(),
                source: query,
                contextValue: neo4j.getContextValues(),
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
                                properties: { words: 30953 },
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
        const session = await neo4j.getSession();

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
                            properties {
                                words
                            }
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
                schema: await neoSchema.getSchema(),
                source: query,
                contextValue: neo4j.getContextValues(),
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
                                properties: { words: book1WordCount },
                                node: {
                                    __typename: "Book",
                                    title: book1Title,
                                },
                            },
                            {
                                properties: { words: journalWordCount },
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
        const session = await neo4j.getSession();

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
                            properties {
                                words
                            }
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
                schema: await neoSchema.getSchema(),
                source: query,
                contextValue: neo4j.getContextValues(),
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
                                properties: { words: book1WordCount },
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
        const session = await neo4j.getSession();

        const neoSchema = new Neo4jGraphQL({ typeDefs, driver });

        const query = `
            query ($authorName: String, $bookWordCount: Int) {
                authors(where: { name: $authorName }) {
                    name
                    publicationsConnection(where: { Book: { edge: { words: $bookWordCount } } }) {
                        edges {
                            properties {
                                words
                            }
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
                schema: await neoSchema.getSchema(),
                source: query,
                contextValue: neo4j.getContextValues(),
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
                                properties: { words: book1WordCount },
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
        const session = await neo4j.getSession();

        const neoSchema = new Neo4jGraphQL({ typeDefs, driver });

        const query = `
            query ($authorName: String, $bookWordCount: Int) {
                authors(where: { name: $authorName }) {
                    name
                    publicationsConnection(where: { Book: { edge: { words_NOT: $bookWordCount } } }) {
                        edges {
                           properties {
                             words
                           }
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
                schema: await neoSchema.getSchema(),
                source: query,
                contextValue: neo4j.getContextValues(),
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
                                properties: { words: book2WordCount },
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
        const session = await neo4j.getSession();

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
                            properties {
                                words
                            }
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
                schema: await neoSchema.getSchema(),
                source: query,
                contextValue: neo4j.getContextValues(),
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
                                properties: { words: book1WordCount },
                                node: {
                                    __typename: "Book",
                                    title: book1Title,
                                },
                            },
                            {
                                properties: { words: journalWordCount },
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
        const session = await neo4j.getSession();

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
                           properties {
                             words
                           }
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
                schema: await neoSchema.getSchema(),
                source: query,
                contextValue: neo4j.getContextValues(),
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
                                properties: { words: book1WordCount },
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
        const session = await neo4j.getSession();

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
                            properties {
                                words
                            }
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
                schema: await neoSchema.getSchema(),
                source: query,
                contextValue: neo4j.getContextValues(),
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
                                properties: { words: book1WordCount },
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
