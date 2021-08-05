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
import faker from "faker";
import { graphql } from "graphql";
import { generate } from "randomstring";
import { gql } from "apollo-server";
import neo4j from "../neo4j";
import { Neo4jGraphQL } from "../../../src/classes";

describe("Connections Alias", () => {
    let driver: Driver;

    beforeAll(async () => {
        driver = await neo4j();
    });

    afterAll(async () => {
        await driver.close();
    });

    // using totalCount as the bear minimal selection
    test("should alias top level connection field and return correct totalCount", async () => {
        const session = driver.session();

        const typeDefs = gql`
            type Movie {
                title: String!
                actors: [Actor!]! @relationship(type: "ACTED_IN", direction: IN)
            }

            type Actor {
                name: String!
                movies: [Movie!]! @relationship(type: "ACTED_IN", direction: OUT)
            }
        `;

        const neoSchema = new Neo4jGraphQL({ typeDefs });

        const movieTitle = generate({
            charset: "alphabetic",
        });

        const query = `
            {
                movies(where: { title: "${movieTitle}" }) {
                    actors: actorsConnection {
                        totalCount
                    }
                }
            }
        `;

        try {
            await session.run(
                `
                    CREATE (m:Movie {title: $movieTitle})
                    CREATE (m)<-[:ACTED_IN]-(:Actor)
                    CREATE (m)<-[:ACTED_IN]-(:Actor)
                    CREATE (m)<-[:ACTED_IN]-(:Actor)
                `,
                {
                    movieTitle,
                }
            );

            const result = await graphql({
                schema: neoSchema.schema,
                source: query,
                contextValue: { driver, driverConfig: { bookmarks: [session.lastBookmark()] } },
            });

            expect(result.errors).toBeUndefined();

            expect(result.data as any).toEqual({
                movies: [{ actors: { totalCount: 3 } }],
            });
        } finally {
            await session.close();
        }
    });

    test("should alias totalCount", async () => {
        const session = driver.session();

        const typeDefs = gql`
            type Movie {
                title: String!
                actors: [Actor!]! @relationship(type: "ACTED_IN", direction: IN)
            }

            type Actor {
                name: String!
                movies: [Movie!]! @relationship(type: "ACTED_IN", direction: OUT)
            }
        `;

        const neoSchema = new Neo4jGraphQL({ typeDefs });

        const movieTitle = generate({
            charset: "alphabetic",
        });

        const query = `
            {
                movies(where: { title: "${movieTitle}" }) {
                    actorsConnection {
                        count: totalCount
                    }
                }
            }
        `;

        try {
            await session.run(
                `
                    CREATE (m:Movie {title: $movieTitle})
                    CREATE (m)<-[:ACTED_IN]-(:Actor)
                    CREATE (m)<-[:ACTED_IN]-(:Actor)
                    CREATE (m)<-[:ACTED_IN]-(:Actor)
                `,
                {
                    movieTitle,
                }
            );

            const result = await graphql({
                schema: neoSchema.schema,
                source: query,
                contextValue: { driver, driverConfig: { bookmarks: [session.lastBookmark()] } },
            });

            expect(result.errors).toBeUndefined();

            expect(result.data as any).toEqual({
                movies: [{ actorsConnection: { count: 3 } }],
            });
        } finally {
            await session.close();
        }
    });

    // using hasNextPage as the bear minimal selection
    test("should alias pageInfo top level key", async () => {
        const session = driver.session();

        const typeDefs = gql`
            type Movie {
                title: String!
                actors: [Actor!]! @relationship(type: "ACTED_IN", direction: IN)
            }

            type Actor {
                name: String!
                movies: [Movie!]! @relationship(type: "ACTED_IN", direction: OUT)
            }
        `;

        const neoSchema = new Neo4jGraphQL({ typeDefs });

        const movieTitle = generate({
            charset: "alphabetic",
        });

        const query = `
            {
                movies(where: { title: "${movieTitle}" }) {
                    actorsConnection {
                        pi:pageInfo {
                            hasNextPage
                        }
                    }
                }
            }
        `;

        try {
            await session.run(
                `
                    CREATE (m:Movie {title: $movieTitle})
                    CREATE (m)<-[:ACTED_IN]-(:Actor)
                    CREATE (m)<-[:ACTED_IN]-(:Actor)
                    CREATE (m)<-[:ACTED_IN]-(:Actor)
                `,
                {
                    movieTitle,
                }
            );

            const result = await graphql({
                schema: neoSchema.schema,
                source: query,
                contextValue: { driver, driverConfig: { bookmarks: [session.lastBookmark()] } },
            });

            expect(result.errors).toBeUndefined();

            expect(result.data as any).toEqual({
                movies: [{ actorsConnection: { pi: { hasNextPage: false } } }],
            });
        } finally {
            await session.close();
        }
    });

    test("should alias startCursor", async () => {
        const session = driver.session();

        const typeDefs = gql`
            type Movie {
                title: String!
                actors: [Actor!]! @relationship(type: "ACTED_IN", direction: IN)
            }

            type Actor {
                name: String!
                movies: [Movie!]! @relationship(type: "ACTED_IN", direction: OUT)
            }
        `;

        const neoSchema = new Neo4jGraphQL({ typeDefs });

        const movieTitle = generate({
            charset: "alphabetic",
        });

        const query = `
            {
                movies(where: { title: "${movieTitle}" }) {
                    actorsConnection {
                        pageInfo {
                            sc:startCursor
                        }
                    }
                }
            }
        `;

        try {
            await session.run(
                `
                    CREATE (m:Movie {title: $movieTitle})
                    CREATE (m)<-[:ACTED_IN]-(:Actor)
                    CREATE (m)<-[:ACTED_IN]-(:Actor)
                    CREATE (m)<-[:ACTED_IN]-(:Actor)
                `,
                {
                    movieTitle,
                }
            );

            const result = await graphql({
                schema: neoSchema.schema,
                source: query,
                contextValue: { driver, driverConfig: { bookmarks: [session.lastBookmark()] } },
            });

            expect(result.errors).toBeUndefined();

            expect((result.data as any).movies[0].actorsConnection.pageInfo.sc).toBeDefined();
        } finally {
            await session.close();
        }
    });

    test("should alias endCursor", async () => {
        const session = driver.session();

        const typeDefs = gql`
            type Movie {
                title: String!
                actors: [Actor!]! @relationship(type: "ACTED_IN", direction: IN)
            }

            type Actor {
                name: String!
                movies: [Movie!]! @relationship(type: "ACTED_IN", direction: OUT)
            }
        `;

        const neoSchema = new Neo4jGraphQL({ typeDefs });

        const movieTitle = generate({
            charset: "alphabetic",
        });

        const query = `
            {
                movies(where: { title: "${movieTitle}" }) {
                    actorsConnection {
                        pageInfo {
                            ec:endCursor
                        }
                    }
                }
            }
        `;

        try {
            await session.run(
                `
                    CREATE (m:Movie {title: $movieTitle})
                    CREATE (m)<-[:ACTED_IN]-(:Actor)
                    CREATE (m)<-[:ACTED_IN]-(:Actor)
                    CREATE (m)<-[:ACTED_IN]-(:Actor)
                `,
                {
                    movieTitle,
                }
            );

            const result = await graphql({
                schema: neoSchema.schema,
                source: query,
                contextValue: { driver, driverConfig: { bookmarks: [session.lastBookmark()] } },
            });

            expect(result.errors).toBeUndefined();

            expect((result.data as any).movies[0].actorsConnection.pageInfo.ec).toBeDefined();
        } finally {
            await session.close();
        }
    });

    test("should alias hasPreviousPage", async () => {
        const session = driver.session();

        const typeDefs = gql`
            type Movie {
                title: String!
                actors: [Actor!]! @relationship(type: "ACTED_IN", direction: IN)
            }

            type Actor {
                name: String!
                movies: [Movie!]! @relationship(type: "ACTED_IN", direction: OUT)
            }
        `;

        const neoSchema = new Neo4jGraphQL({ typeDefs });

        const movieTitle = generate({
            charset: "alphabetic",
        });

        const query = `
            {
                movies(where: { title: "${movieTitle}" }) {
                    actorsConnection {
                        pageInfo {
                            hPP:hasPreviousPage
                        }
                    }
                }
            }
        `;

        try {
            await session.run(
                `
                    CREATE (m:Movie {title: $movieTitle})
                    CREATE (m)<-[:ACTED_IN]-(:Actor)
                    CREATE (m)<-[:ACTED_IN]-(:Actor)
                    CREATE (m)<-[:ACTED_IN]-(:Actor)
                `,
                {
                    movieTitle,
                }
            );

            const result = await graphql({
                schema: neoSchema.schema,
                source: query,
                contextValue: { driver, driverConfig: { bookmarks: [session.lastBookmark()] } },
            });

            expect(result.errors).toBeUndefined();

            expect((result.data as any).movies[0].actorsConnection.pageInfo.hPP).toBeDefined();
        } finally {
            await session.close();
        }
    });

    test("should alias hasNextPage", async () => {
        const session = driver.session();

        const typeDefs = gql`
            type Movie {
                title: String!
                actors: [Actor!]! @relationship(type: "ACTED_IN", direction: IN)
            }

            type Actor {
                name: String!
                movies: [Movie!]! @relationship(type: "ACTED_IN", direction: OUT)
            }
        `;

        const neoSchema = new Neo4jGraphQL({ typeDefs });

        const movieTitle = generate({
            charset: "alphabetic",
        });

        const query = `
            {
                movies(where: { title: "${movieTitle}" }) {
                    actorsConnection(first: 1) {
                        pageInfo {
                            hNP:hasNextPage
                        }
                    }
                }
            }
        `;

        try {
            await session.run(
                `
                    CREATE (m:Movie {title: $movieTitle})
                    CREATE (m)<-[:ACTED_IN]-(:Actor {name: randomUUID()})
                    CREATE (m)<-[:ACTED_IN]-(:Actor {name: randomUUID()})
                    CREATE (m)<-[:ACTED_IN]-(:Actor {name: randomUUID()})
                `,
                {
                    movieTitle,
                }
            );

            const result = await graphql({
                schema: neoSchema.schema,
                source: query,
                contextValue: { driver, driverConfig: { bookmarks: [session.lastBookmark()] } },
            });

            expect(result.errors).toBeUndefined();

            expect((result.data as any).movies[0].actorsConnection.pageInfo.hNP).toBeDefined();
        } finally {
            await session.close();
        }
    });

    test("should alias the top level edges key", async () => {
        const session = driver.session();

        const typeDefs = gql`
            type Movie {
                title: String!
                actors: [Actor!]! @relationship(type: "ACTED_IN", direction: IN)
            }

            type Actor {
                name: String!
                movies: [Movie!]! @relationship(type: "ACTED_IN", direction: OUT)
            }
        `;

        const neoSchema = new Neo4jGraphQL({ typeDefs });

        const movieTitle = generate({
            charset: "alphabetic",
        });

        const query = `
            {
                movies(where: { title: "${movieTitle}" }) {
                    actorsConnection(first: 1) {
                        e:edges {
                            cursor
                        }
                    }
                }
            }
        `;

        try {
            await session.run(
                `
                    CREATE (m:Movie {title: $movieTitle})
                    CREATE (m)<-[:ACTED_IN]-(:Actor {name: randomUUID()})
                    CREATE (m)<-[:ACTED_IN]-(:Actor {name: randomUUID()})
                    CREATE (m)<-[:ACTED_IN]-(:Actor {name: randomUUID()})
                `,
                {
                    movieTitle,
                }
            );

            const result = await graphql({
                schema: neoSchema.schema,
                source: query,
                contextValue: { driver, driverConfig: { bookmarks: [session.lastBookmark()] } },
            });

            expect(result.errors).toBeUndefined();

            expect((result.data as any).movies[0].actorsConnection.e[0].cursor).toBeDefined();
        } finally {
            await session.close();
        }
    });

    test("should alias cursor", async () => {
        const session = driver.session();

        const typeDefs = gql`
            type Movie {
                title: String!
                actors: [Actor!]! @relationship(type: "ACTED_IN", direction: IN)
            }

            type Actor {
                name: String!
                movies: [Movie!]! @relationship(type: "ACTED_IN", direction: OUT)
            }
        `;

        const neoSchema = new Neo4jGraphQL({ typeDefs });

        const movieTitle = generate({
            charset: "alphabetic",
        });

        const query = `
            {
                movies(where: { title: "${movieTitle}" }) {
                    actorsConnection(first: 1) {
                        edges {
                            c:cursor
                        }
                    }
                }
            }
        `;

        try {
            await session.run(
                `
                    CREATE (m:Movie {title: $movieTitle})
                    CREATE (m)<-[:ACTED_IN]-(:Actor {name: randomUUID()})
                    CREATE (m)<-[:ACTED_IN]-(:Actor {name: randomUUID()})
                    CREATE (m)<-[:ACTED_IN]-(:Actor {name: randomUUID()})
                `,
                {
                    movieTitle,
                }
            );

            const result = await graphql({
                schema: neoSchema.schema,
                source: query,
                contextValue: { driver, driverConfig: { bookmarks: [session.lastBookmark()] } },
            });

            expect(result.errors).toBeUndefined();

            expect((result.data as any).movies[0].actorsConnection.edges[0].c).toBeDefined();
        } finally {
            await session.close();
        }
    });

    test("should alias the top level node key", async () => {
        const session = driver.session();

        const typeDefs = gql`
            type Movie {
                title: String!
                actors: [Actor!]! @relationship(type: "ACTED_IN", direction: IN)
            }

            type Actor {
                name: String!
                movies: [Movie!]! @relationship(type: "ACTED_IN", direction: OUT)
            }
        `;

        const neoSchema = new Neo4jGraphQL({ typeDefs });

        const movieTitle = generate({
            charset: "alphabetic",
        });

        const query = `
            {
                movies(where: { title: "${movieTitle}" }) {
                    actorsConnection(first: 1) {
                        edges {
                            n:node {
                                name
                            }
                        }
                    }
                }
            }
        `;

        try {
            await session.run(
                `
                    CREATE (m:Movie {title: $movieTitle})
                    CREATE (m)<-[:ACTED_IN]-(:Actor {name: randomUUID()})
                    CREATE (m)<-[:ACTED_IN]-(:Actor {name: randomUUID()})
                    CREATE (m)<-[:ACTED_IN]-(:Actor {name: randomUUID()})
                `,
                {
                    movieTitle,
                }
            );

            const result = await graphql({
                schema: neoSchema.schema,
                source: query,
                contextValue: { driver, driverConfig: { bookmarks: [session.lastBookmark()] } },
            });

            expect(result.errors).toBeUndefined();

            expect((result.data as any).movies[0].actorsConnection.edges[0].n).toBeDefined();
        } finally {
            await session.close();
        }
    });

    test("should alias a property on the node", async () => {
        const session = driver.session();

        const typeDefs = gql`
            type Movie {
                title: String!
                actors: [Actor!]! @relationship(type: "ACTED_IN", direction: IN)
            }

            type Actor {
                name: String!
                movies: [Movie!]! @relationship(type: "ACTED_IN", direction: OUT)
            }
        `;

        const neoSchema = new Neo4jGraphQL({ typeDefs });

        const movieTitle = generate({
            charset: "alphabetic",
        });

        const query = `
            {
                movies(where: { title: "${movieTitle}" }) {
                    actorsConnection(first: 1) {
                        edges {
                            node {
                                n:name
                            }
                        }
                    }
                }
            }
        `;

        try {
            await session.run(
                `
                    CREATE (m:Movie {title: $movieTitle})
                    CREATE (m)<-[:ACTED_IN]-(:Actor {name: randomUUID()})
                    CREATE (m)<-[:ACTED_IN]-(:Actor {name: randomUUID()})
                    CREATE (m)<-[:ACTED_IN]-(:Actor {name: randomUUID()})
                `,
                {
                    movieTitle,
                }
            );

            const result = await graphql({
                schema: neoSchema.schema,
                source: query,
                contextValue: { driver, driverConfig: { bookmarks: [session.lastBookmark()] } },
            });

            expect(result.errors).toBeUndefined();

            expect((result.data as any).movies[0].actorsConnection.edges[0].node.n).toBeDefined();
        } finally {
            await session.close();
        }
    });

    test("should alias a property on the relationship", async () => {
        const session = driver.session();

        const typeDefs = gql`
            type Movie {
                title: String!
                actors: [Actor!]! @relationship(type: "ACTED_IN", direction: IN, properties: "ActedIn")
            }

            type Actor {
                name: String!
                movies: [Movie!]! @relationship(type: "ACTED_IN", direction: OUT, properties: "ActedIn")
            }

            interface ActedIn {
                roles: [String]!
            }
        `;

        const neoSchema = new Neo4jGraphQL({ typeDefs });

        const movieTitle = generate({
            charset: "alphabetic",
        });

        const query = `
            {
                movies(where: { title: "${movieTitle}" }) {
                    actorsConnection(first: 1) {
                        edges {
                            r:roles
                        }
                    }
                }
            }
        `;

        try {
            await session.run(
                `
                    CREATE (m:Movie {title: $movieTitle})
                    CREATE (m)<-[:ACTED_IN {roles: [randomUUID()]}]-(:Actor {name: randomUUID()})
                    CREATE (m)<-[:ACTED_IN {roles: [randomUUID()]}]-(:Actor {name: randomUUID()})
                    CREATE (m)<-[:ACTED_IN {roles: [randomUUID()]}]-(:Actor {name: randomUUID()})
                `,
                {
                    movieTitle,
                }
            );

            const result = await graphql({
                schema: neoSchema.schema,
                source: query,
                contextValue: { driver, driverConfig: { bookmarks: [session.lastBookmark()] } },
            });

            expect(result.errors).toBeUndefined();

            expect((result.data as any).movies[0].actorsConnection.edges[0].r).toBeDefined();
        } finally {
            await session.close();
        }
    });

    test("should alias many keys on a connection", async () => {
        const session = driver.session();

        const typeDefs = gql`
            type Movie {
                title: String!
                actors: [Actor!]! @relationship(type: "ACTED_IN", direction: IN, properties: "ActedIn")
            }

            type Actor {
                name: String!
            }

            interface ActedIn {
                roles: [String]!
            }
        `;

        const neoSchema = new Neo4jGraphQL({ typeDefs });

        const movieTitle = generate({
            charset: "alphabetic",
        });
        const actorName = generate({
            charset: "alphabetic",
        });
        const roles = [
            generate({
                charset: "alphabetic",
            }),
        ];

        const query = `
            {
                movies(where: { title: "${movieTitle}" }) {
                    title
                    connection:actorsConnection {
                        tC:totalCount
                        edges {
                            n:node {
                                n:name
                            }
                            r:roles
                        }
                        page:pageInfo {
                            hNP:hasNextPage
                        }
                    }
                }
            }
        `;

        try {
            await session.run(
                `
                    CREATE (m:Movie {title: $movieTitle})
                    CREATE (m)<-[:ACTED_IN {roles: $roles}]-(:Actor {name: $actorName})
                `,
                {
                    movieTitle,
                    actorName,
                    roles,
                }
            );

            const result = await graphql({
                schema: neoSchema.schema,
                source: query,
                contextValue: { driver, driverConfig: { bookmarks: [session.lastBookmark()] } },
            });

            expect(result.errors).toBeUndefined();

            expect(result.data as any).toEqual({
                movies: [
                    {
                        title: movieTitle,
                        connection: {
                            tC: 1,
                            edges: [{ n: { n: actorName }, r: roles }],
                            page: {
                                hNP: false,
                            },
                        },
                    },
                ],
            });
        } finally {
            await session.close();
        }
    });

    test("should allow multiple aliases on the same connection", async () => {
        const session = driver.session();

        const typeDefs = gql`
            type Post {
                title: String!
                comments: [Comment!]! @relationship(type: "HAS_COMMENT", direction: OUT)
            }

            type Comment {
                flag: Boolean!
                post: Post! @relationship(type: "HAS_COMMENT", direction: IN)
            }
        `;

        const { schema } = new Neo4jGraphQL({ typeDefs });

        const flags = new Array(faker.random.number({ min: 2, max: 5 })).map(() => faker.random.boolean());

        const flaggedCount = flags.filter((flag) => flag).length;
        const unflaggedCount = flags.filter((flag) => !flag).length;

        const query = `
            {
                posts {
                    flagged: commentsConnection(where: { node: { flag: true } }) {
                        edges {
                            node {
                                flag
                            }
                        }
                    }
                    unflagged: commentsConnection(where: { node: { flag: false } }) {
                        edges {
                            node {
                                flag
                            }
                        }
                    }
                }
            }
        `;

        try {
            await session.run(
                `
              CREATE (post:Post {title: "title"})
              FOREACH(flag in $flags |
                CREATE (:Comment {flag: flag})<-[:HAS_COMMENT]-(post)
              )
          `,
                {
                    flags,
                }
            );

            const result = await graphql({
                schema,
                source: query,
                contextValue: { driver, driverConfig: { bookmarks: [session.lastBookmark()] } },
            });

            expect(result.errors).toBeUndefined();

            expect((result.data as any).posts[0].flagged.edges).toHaveLength(flaggedCount);
            expect((result.data as any).posts[0].unflagged.edges).toHaveLength(unflaggedCount);
        } finally {
            await session.close();
        }
    });
});
