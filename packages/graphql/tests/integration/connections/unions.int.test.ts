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

    beforeAll(async () => {
        driver = await neo4j();
        const session = driver.session();

        try {
            await session.run(
                "CREATE (:Author { name: 'Charles Dickens' })-[:WROTE { words: 167543 }]->(:Book { title: 'Oliver Twist'})"
            );
            await session.run(
                `MATCH (a:Author) WHERE a.name = 'Charles Dickens' CREATE (a)-[:WROTE { words: 3413 }]->(:Journal { subject: "Master Humphrey's Clock" })`
            );
        } finally {
            await session.close();
        }
    });

    afterAll(async () => {
        const session = driver.session();

        try {
            await session.run("MATCH (a:Author) WHERE a.name = 'Charles Dickens' DETACH DELETE a");
            await session.run("MATCH (b:Book) WHERE b.title = 'Oliver Twist' DETACH DELETE b");
            await session.run(`MATCH (j:Journal) WHERE j.subject = "Master Humphrey's Clock" DETACH DELETE j`);
        } finally {
            await session.close();
        }

        await driver.close();
    });

    test("Projecting node and relationship properties with no arguments", async () => {
        const session = driver.session();

        const neoSchema = new Neo4jGraphQL({ typeDefs, driver });

        const query = `
            query {
                authors(where: { name: "Charles Dickens" }) {
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
            });

            expect(result.errors).toBeFalsy();

            expect(result?.data?.authors).toEqual([
                {
                    name: "Charles Dickens",
                    publicationsConnection: {
                        edges: [
                            {
                                words: 167543,
                                node: {
                                    title: "Oliver Twist",
                                },
                            },
                            {
                                words: 3413,
                                node: {
                                    subject: "Master Humphrey's Clock",
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
            query {
                authors(where: { name: "Charles Dickens" }) {
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
            });

            expect(result.errors).toBeFalsy();

            expect(result?.data?.authors).toEqual([
                {
                    name: "Charles Dickens",
                    publicationsConnection: {
                        edges: [
                            {
                                words: 167543,
                                node: {
                                    title: "Oliver Twist",
                                },
                            },
                            {
                                words: 3413,
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

    test("With where argument on node", async () => {
        const session = driver.session();

        const neoSchema = new Neo4jGraphQL({ typeDefs, driver });

        const query = `
        query {
            authors(where: { name: "Charles Dickens" }) {
                name
                publicationsConnection(where: { Book: { node: { title: "Oliver Twist" } } }) {
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
            });

            expect(result.errors).toBeFalsy();

            expect(result?.data?.authors).toEqual([
                {
                    name: "Charles Dickens",
                    publicationsConnection: {
                        edges: [
                            {
                                words: 167543,
                                node: {
                                    title: "Oliver Twist",
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

    test("With where argument on relationship", async () => {
        const session = driver.session();

        const neoSchema = new Neo4jGraphQL({ typeDefs, driver });

        const query = `
        query {
            authors(where: { name: "Charles Dickens" }) {
                name
                publicationsConnection(where: { Book: { relationship: { words: 167543 } } }) {
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
            });

            expect(result.errors).toBeFalsy();

            expect(result?.data?.authors).toEqual([
                {
                    name: "Charles Dickens",
                    publicationsConnection: {
                        edges: [
                            {
                                words: 167543,
                                node: {
                                    title: "Oliver Twist",
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
        query {
            authors(where: { name: "Charles Dickens" }) {
                name
                publicationsConnection(where: { Book: { relationship: { words: 167543 }, node: { title: "Oliver Twist" } } }) {
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
            });

            expect(result.errors).toBeFalsy();

            expect(result?.data?.authors).toEqual([
                {
                    name: "Charles Dickens",
                    publicationsConnection: {
                        edges: [
                            {
                                words: 167543,
                                node: {
                                    title: "Oliver Twist",
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
