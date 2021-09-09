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

describe("Connections -> Interfaces", () => {
    let driver: Driver;
    let bookmarks: string[];

    const typeDefs = gql`
        interface Production {
            title: String!
        }

        type Movie implements Production {
            title: String!
            runtime: Int!
        }

        type Series implements Production {
            title: String!
            episodes: Int!
        }

        interface ActedIn @relationshipProperties {
            screenTime: Int!
        }

        type Actor {
            name: String!
            actedIn: [Production!]! @relationship(type: "ACTED_IN", direction: OUT, properties: "ActedIn")
        }
    `;

    const actorName = "Jason Momoa";

    const seriesTitle = "Game of Thrones";
    const seriesEpisodes = 73;

    const seriesScreenTime = 858;

    const movieTitle = "Dune";
    const movieRuntime = 155;

    const movieScreenTime = 90;

    beforeAll(async () => {
        driver = await neo4j();
        const session = driver.session();

        try {
            await session.run(
                `
                    CREATE (actor:Actor {name: $actorName})
                    CREATE (actor)-[:ACTED_IN {screenTime: $seriesScreenTime}]->(:Series {title: $seriesTitle, episodes: $seriesEpisodes})
                    CREATE (actor)-[:ACTED_IN {screenTime: $movieScreenTime}]->(:Movie {title: $movieTitle, runtime: $movieRuntime})
                `,
                {
                    actorName,
                    seriesTitle,
                    seriesEpisodes,
                    seriesScreenTime,
                    movieTitle,
                    movieRuntime,
                    movieScreenTime,
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
                    MATCH (actor:Actor {name: $actorName})
                    MATCH (series:Series {title: $seriesTitle})
                    MATCH (movie:Movie {title: $movieTitle})
                    DETACH DELETE actor, series, movie
                `,
                {
                    actorName,
                    seriesTitle,
                    movieTitle,
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
            query Actors($name: String) {
                actors(where: { name: $name }) {
                    name
                    actedInConnection {
                        edges {
                            screenTime
                            node {
                                title
                                ... on Movie {
                                    runtime
                                }
                                ... on Series {
                                    episodes
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
                    name: actorName,
                },
            });

            expect(result.errors).toBeFalsy();

            expect(result?.data?.actors).toEqual([
                {
                    name: actorName,
                    actedInConnection: {
                        edges: [
                            {
                                screenTime: movieScreenTime,
                                node: {
                                    title: movieTitle,
                                    runtime: movieRuntime,
                                },
                            },
                            {
                                screenTime: seriesScreenTime,
                                node: {
                                    title: seriesTitle,
                                    episodes: seriesEpisodes,
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

    // test("Projecting node and relationship properties for one union member with no arguments", async () => {
    //     const session = driver.session();

    //     const neoSchema = new Neo4jGraphQL({ typeDefs, driver });

    //     const query = `
    //         query ($authorName: String) {
    //             authors(where: { name: $authorName }) {
    //                 name
    //                 publicationsConnection {
    //                     edges {
    //                         words
    //                         node {
    //                             ... on Book {
    //                                 title
    //                             }
    //                         }
    //                     }
    //                 }
    //             }
    //         }
    //     `;

    //     try {
    //         await neoSchema.checkNeo4jCompat();

    //         const result = await graphql({
    //             schema: neoSchema.schema,
    //             source: query,
    //             contextValue: { driver, driverConfig: { bookmarks } },
    //             variableValues: {
    //                 authorName,
    //             },
    //         });

    //         expect(result.errors).toBeFalsy();

    //         expect(result?.data?.authors).toEqual([
    //             {
    //                 name: authorName,
    //                 publicationsConnection: {
    //                     edges: [
    //                         {
    //                             words: bookWordCount,
    //                             node: {
    //                                 title: bookTitle,
    //                             },
    //                         },
    //                         {
    //                             words: journalWordCount,
    //                             node: {},
    //                         },
    //                     ],
    //                 },
    //             },
    //         ]);
    //     } finally {
    //         await session.close();
    //     }
    // });

    test("With where argument for shared field on node with node in database", async () => {
        const session = driver.session();

        const neoSchema = new Neo4jGraphQL({ typeDefs, driver });

        const query = `
        query Actors($name: String, $title: String) {
            actors(where: { name: $name }) {
                name
                actedInConnection(where: { node: { title: $title } }) {
                    edges {
                        screenTime
                        node {
                            title
                            ... on Movie {
                                runtime
                            }
                            ... on Series {
                                episodes
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
                    name: actorName,
                    title: movieTitle,
                },
            });

            expect(result.errors).toBeFalsy();

            expect(result?.data?.actors).toEqual([
                {
                    name: actorName,
                    actedInConnection: {
                        edges: [
                            {
                                screenTime: movieScreenTime,
                                node: {
                                    title: movieTitle,
                                    runtime: movieRuntime,
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

    // test("With where argument on node with node not in database", async () => {
    //     const session = driver.session();

    //     const neoSchema = new Neo4jGraphQL({ typeDefs, driver });

    //     const query = `
    //         query ($authorName: String, $bookTitle: String) {
    //             authors(where: { name: $authorName }) {
    //                 name
    //                 publicationsConnection(where: { Book: { node: { title_NOT: $bookTitle } } }) {
    //                     edges {
    //                         words
    //                         node {
    //                             ... on Book {
    //                                 title
    //                             }
    //                         }
    //                     }
    //                 }
    //             }
    //         }
    //     `;

    //     try {
    //         await neoSchema.checkNeo4jCompat();

    //         const result = await graphql({
    //             schema: neoSchema.schema,
    //             source: query,
    //             contextValue: { driver, driverConfig: { bookmarks } },
    //             variableValues: {
    //                 authorName,
    //                 bookTitle,
    //             },
    //         });

    //         expect(result.errors).toBeFalsy();

    //         expect(result?.data?.authors).toEqual([
    //             {
    //                 name: authorName,
    //                 publicationsConnection: {
    //                     edges: [],
    //                 },
    //             },
    //         ]);
    //     } finally {
    //         await session.close();
    //     }
    // });

    // test("With where argument on all nodes with all in database", async () => {
    //     const session = driver.session();

    //     const neoSchema = new Neo4jGraphQL({ typeDefs, driver });

    //     const query = `
    //         query ($authorName: String, $bookTitle: String, $journalSubject: String) {
    //             authors(where: { name: $authorName }) {
    //                 name
    //                 publicationsConnection(
    //                     where: {
    //                         Book: { node: { title: $bookTitle } }
    //                         Journal: { node: { subject: $journalSubject } }
    //                     }
    //                 ) {
    //                     totalCount
    //                     edges {
    //                         words
    //                         node {
    //                             __typename
    //                             ... on Book {
    //                                 title
    //                             }
    //                             ... on Journal {
    //                                 subject
    //                             }
    //                         }
    //                     }
    //                 }
    //             }
    //         }
    //     `;

    //     try {
    //         await neoSchema.checkNeo4jCompat();

    //         const result = await graphql({
    //             schema: neoSchema.schema,
    //             source: query,
    //             contextValue: { driver, driverConfig: { bookmarks } },
    //             variableValues: {
    //                 authorName,
    //                 bookTitle,
    //                 journalSubject,
    //             },
    //         });

    //         expect(result.errors).toBeFalsy();

    //         expect(result?.data?.authors).toEqual([
    //             {
    //                 name: authorName,
    //                 publicationsConnection: {
    //                     totalCount: 2,
    //                     edges: [
    //                         {
    //                             words: bookWordCount,
    //                             node: {
    //                                 __typename: "Book",
    //                                 title: bookTitle,
    //                             },
    //                         },
    //                         {
    //                             words: journalWordCount,
    //                             node: {
    //                                 __typename: "Journal",
    //                                 subject: journalSubject,
    //                             },
    //                         },
    //                     ],
    //                 },
    //             },
    //         ]);
    //     } finally {
    //         await session.close();
    //     }
    // });

    // test("With where argument on all nodes with only one in database", async () => {
    //     const session = driver.session();

    //     const neoSchema = new Neo4jGraphQL({ typeDefs, driver });

    //     const query = `
    //         query ($authorName: String, $bookTitle: String, $journalSubject: String) {
    //             authors(where: { name: $authorName }) {
    //                 name
    //                 publicationsConnection(
    //                     where: {
    //                         Book: { node: { title: $bookTitle } }
    //                         Journal: { node: { subject_NOT: $journalSubject } }
    //                     }
    //                 ) {
    //                     totalCount
    //                     edges {
    //                         words
    //                         node {
    //                             __typename
    //                             ... on Book {
    //                                 title
    //                             }
    //                             ... on Journal {
    //                                 subject
    //                             }
    //                         }
    //                     }
    //                 }
    //             }
    //         }
    //     `;

    //     try {
    //         await neoSchema.checkNeo4jCompat();

    //         const result = await graphql({
    //             schema: neoSchema.schema,
    //             source: query,
    //             contextValue: { driver, driverConfig: { bookmarks } },
    //             variableValues: {
    //                 authorName,
    //                 bookTitle,
    //                 journalSubject,
    //             },
    //         });

    //         expect(result.errors).toBeFalsy();

    //         expect(result?.data?.authors).toEqual([
    //             {
    //                 name: authorName,
    //                 publicationsConnection: {
    //                     totalCount: 1,
    //                     edges: [
    //                         {
    //                             words: bookWordCount,
    //                             node: {
    //                                 __typename: "Book",
    //                                 title: bookTitle,
    //                             },
    //                         },
    //                     ],
    //                 },
    //             },
    //         ]);
    //     } finally {
    //         await session.close();
    //     }
    // });

    // test("With where argument on relationship with relationship in database", async () => {
    //     const session = driver.session();

    //     const neoSchema = new Neo4jGraphQL({ typeDefs, driver });

    //     const query = `
    //         query ($authorName: String, $bookWordCount: Int) {
    //             authors(where: { name: $authorName }) {
    //                 name
    //                 publicationsConnection(where: { Book: { edge: { words: $bookWordCount } } }) {
    //                     edges {
    //                         words
    //                         node {
    //                             ... on Book {
    //                                 title
    //                             }
    //                         }
    //                     }
    //                 }
    //             }
    //         }
    //     `;

    //     try {
    //         await neoSchema.checkNeo4jCompat();

    //         const result = await graphql({
    //             schema: neoSchema.schema,
    //             source: query,
    //             contextValue: { driver, driverConfig: { bookmarks } },
    //             variableValues: {
    //                 authorName,
    //                 bookWordCount,
    //             },
    //         });

    //         expect(result.errors).toBeFalsy();

    //         expect(result?.data?.authors).toEqual([
    //             {
    //                 name: authorName,
    //                 publicationsConnection: {
    //                     edges: [
    //                         {
    //                             words: bookWordCount,
    //                             node: {
    //                                 title: bookTitle,
    //                             },
    //                         },
    //                     ],
    //                 },
    //             },
    //         ]);
    //     } finally {
    //         await session.close();
    //     }
    // });

    // test("With where argument on relationship with relationship not in database", async () => {
    //     const session = driver.session();

    //     const neoSchema = new Neo4jGraphQL({ typeDefs, driver });

    //     const query = `
    //         query ($authorName: String, $bookWordCount: Int) {
    //             authors(where: { name: $authorName }) {
    //                 name
    //                 publicationsConnection(where: { Book: { edge: { words_NOT: $bookWordCount } } }) {
    //                     edges {
    //                         words
    //                         node {
    //                             ... on Book {
    //                                 title
    //                             }
    //                         }
    //                     }
    //                 }
    //             }
    //         }
    //     `;

    //     try {
    //         await neoSchema.checkNeo4jCompat();

    //         const result = await graphql({
    //             schema: neoSchema.schema,
    //             source: query,
    //             contextValue: { driver, driverConfig: { bookmarks } },
    //             variableValues: {
    //                 authorName,
    //                 bookWordCount,
    //             },
    //         });

    //         expect(result.errors).toBeFalsy();

    //         expect(result?.data?.authors).toEqual([
    //             {
    //                 name: authorName,
    //                 publicationsConnection: {
    //                     edges: [],
    //                 },
    //             },
    //         ]);
    //     } finally {
    //         await session.close();
    //     }
    // });

    // test("With where argument on all edges with all in database", async () => {
    //     const session = driver.session();

    //     const neoSchema = new Neo4jGraphQL({ typeDefs, driver });

    //     const query = `
    //         query ($authorName: String, $bookWordCount: Int, $journalWordCount: Int) {
    //             authors(where: { name: $authorName }) {
    //                 name
    //                 publicationsConnection(
    //                     where: {
    //                         Book: { edge: { words: $bookWordCount } }
    //                         Journal: { edge: { words: $journalWordCount } }
    //                     }
    //                 ) {
    //                     totalCount
    //                     edges {
    //                         words
    //                         node {
    //                             __typename
    //                             ... on Book {
    //                                 title
    //                             }
    //                             ... on Journal {
    //                                 subject
    //                             }
    //                         }
    //                     }
    //                 }
    //             }
    //         }
    //     `;

    //     try {
    //         await neoSchema.checkNeo4jCompat();

    //         const result = await graphql({
    //             schema: neoSchema.schema,
    //             source: query,
    //             contextValue: { driver, driverConfig: { bookmarks } },
    //             variableValues: {
    //                 authorName,
    //                 bookWordCount,
    //                 journalWordCount,
    //             },
    //         });

    //         expect(result.errors).toBeFalsy();

    //         expect(result?.data?.authors).toEqual([
    //             {
    //                 name: authorName,
    //                 publicationsConnection: {
    //                     totalCount: 2,
    //                     edges: [
    //                         {
    //                             words: bookWordCount,
    //                             node: {
    //                                 __typename: "Book",
    //                                 title: bookTitle,
    //                             },
    //                         },
    //                         {
    //                             words: journalWordCount,
    //                             node: {
    //                                 __typename: "Journal",
    //                                 subject: journalSubject,
    //                             },
    //                         },
    //                     ],
    //                 },
    //             },
    //         ]);
    //     } finally {
    //         await session.close();
    //     }
    // });

    // test("With where argument on all edges with only one in database", async () => {
    //     const session = driver.session();

    //     const neoSchema = new Neo4jGraphQL({ typeDefs, driver });

    //     const query = `
    //         query ($authorName: String, $bookWordCount: Int, $journalWordCount: Int) {
    //             authors(where: { name: $authorName }) {
    //                 name
    //                 publicationsConnection(
    //                     where: {
    //                         Book: { edge: { words: $bookWordCount } }
    //                         Journal: { edge: { words_NOT: $journalWordCount } }
    //                     }
    //                 ) {
    //                     totalCount
    //                     edges {
    //                         words
    //                         node {
    //                             __typename
    //                             ... on Book {
    //                                 title
    //                             }
    //                             ... on Journal {
    //                                 subject
    //                             }
    //                         }
    //                     }
    //                 }
    //             }
    //         }
    //     `;

    //     try {
    //         await neoSchema.checkNeo4jCompat();

    //         const result = await graphql({
    //             schema: neoSchema.schema,
    //             source: query,
    //             contextValue: { driver, driverConfig: { bookmarks } },
    //             variableValues: {
    //                 authorName,
    //                 bookWordCount,
    //                 journalWordCount,
    //             },
    //         });

    //         expect(result.errors).toBeFalsy();

    //         expect(result?.data?.authors).toEqual([
    //             {
    //                 name: authorName,
    //                 publicationsConnection: {
    //                     totalCount: 1,
    //                     edges: [
    //                         {
    //                             words: bookWordCount,
    //                             node: {
    //                                 __typename: "Book",
    //                                 title: bookTitle,
    //                             },
    //                         },
    //                     ],
    //                 },
    //             },
    //         ]);
    //     } finally {
    //         await session.close();
    //     }
    // });

    // test("With where argument on relationship and node", async () => {
    //     const session = driver.session();

    //     const neoSchema = new Neo4jGraphQL({ typeDefs, driver });

    //     const query = `
    //         query ($authorName: String, $bookWordCount: Int, $bookTitle: String) {
    //             authors(where: { name: $authorName }) {
    //                 name
    //                 publicationsConnection(
    //                     where: {
    //                         Book: {
    //                             edge: { words: $bookWordCount }
    //                             node: { title: $bookTitle }
    //                         }
    //                     }
    //                 ) {
    //                     edges {
    //                         words
    //                         node {
    //                             ... on Book {
    //                                 title
    //                             }
    //                         }
    //                     }
    //                 }
    //             }
    //         }
    //     `;

    //     try {
    //         await neoSchema.checkNeo4jCompat();

    //         const result = await graphql({
    //             schema: neoSchema.schema,
    //             source: query,
    //             contextValue: { driver, driverConfig: { bookmarks } },
    //             variableValues: {
    //                 authorName,
    //                 bookWordCount,
    //                 bookTitle,
    //             },
    //         });

    //         expect(result.errors).toBeFalsy();

    //         expect(result?.data?.authors).toEqual([
    //             {
    //                 name: authorName,
    //                 publicationsConnection: {
    //                     edges: [
    //                         {
    //                             words: bookWordCount,
    //                             node: {
    //                                 title: bookTitle,
    //                             },
    //                         },
    //                     ],
    //                 },
    //             },
    //         ]);
    //     } finally {
    //         await session.close();
    //     }
    // });
});
