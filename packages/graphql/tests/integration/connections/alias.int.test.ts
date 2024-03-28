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
import { generate } from "randomstring";
import type { UniqueType } from "../../utils/graphql-types";
import { TestHelper } from "../../utils/tests-helper";

describe("Connections Alias", () => {
    const testHelper = new TestHelper();

    let typeMovie: UniqueType;
    let typeActor: UniqueType;

    beforeEach(() => {
        typeMovie = testHelper.createUniqueType("Movie");
        typeActor = testHelper.createUniqueType("Actor");
    });

    afterEach(async () => {
        await testHelper.close();
    });

    // using totalCount as the bear minimal selection
    test("should alias top level connection field and return correct totalCount", async () => {
        const typeDefs = gql`
            type ${typeMovie.name} {
                title: String!
                actors: [${typeActor.name}!]! @relationship(type: "ACTED_IN", direction: IN)
            }

            type ${typeActor.name} {
                name: String!
                movies: [${typeMovie.name}!]! @relationship(type: "ACTED_IN", direction: OUT)
            }
        `;

        await testHelper.initNeo4jGraphQL({ typeDefs });

        const movieTitle = generate({
            charset: "alphabetic",
        });

        const query = `
            {
                ${typeMovie.plural}(where: { title: "${movieTitle}" }) {
                    actors: actorsConnection {
                        totalCount
                    }
                }
            }
        `;

        await testHelper.executeCypher(
            `
                    CREATE (m:${typeMovie.name} {title: $movieTitle})
                    CREATE (m)<-[:ACTED_IN]-(:${typeActor.name})
                    CREATE (m)<-[:ACTED_IN]-(:${typeActor.name})
                    CREATE (m)<-[:ACTED_IN]-(:${typeActor.name})
                `,
            {
                movieTitle,
            }
        );

        const result = await testHelper.executeGraphQL(query);

        expect(result.errors).toBeUndefined();

        expect(result.data as any).toEqual({
            [typeMovie.plural]: [{ actors: { totalCount: 3 } }],
        });
    });

    test("should alias totalCount", async () => {
        const typeDefs = gql`
            type ${typeMovie.name} {
                title: String!
                actors: [${typeActor.name}!]! @relationship(type: "ACTED_IN", direction: IN)
            }

            type ${typeActor.name} {
                name: String!
                movies: [${typeMovie.name}!]! @relationship(type: "ACTED_IN", direction: OUT)
            }
        `;

        await testHelper.initNeo4jGraphQL({ typeDefs });

        const movieTitle = generate({
            charset: "alphabetic",
        });

        const query = `
            {
                ${typeMovie.plural}(where: { title: "${movieTitle}" }) {
                    actorsConnection {
                        count: totalCount
                    }
                }
            }
        `;

        await testHelper.executeCypher(
            `
                    CREATE (m:${typeMovie.name} {title: $movieTitle})
                    CREATE (m)<-[:ACTED_IN]-(:${typeActor.name})
                    CREATE (m)<-[:ACTED_IN]-(:${typeActor.name})
                    CREATE (m)<-[:ACTED_IN]-(:${typeActor.name})
                `,
            {
                movieTitle,
            }
        );

        const result = await testHelper.executeGraphQL(query);

        expect(result.errors).toBeUndefined();

        expect(result.data as any).toEqual({
            [typeMovie.plural]: [{ actorsConnection: { count: 3 } }],
        });
    });

    // using hasNextPage as the bear minimal selection
    test("should alias pageInfo top level key", async () => {
        const typeDefs = gql`
            type ${typeMovie.name} {
                title: String!
                actors: [${typeActor.name}!]! @relationship(type: "ACTED_IN", direction: IN)
            }

            type ${typeActor.name} {
                name: String!
                movies: [${typeMovie.name}!]! @relationship(type: "ACTED_IN", direction: OUT)
            }
        `;

        await testHelper.initNeo4jGraphQL({ typeDefs });

        const movieTitle = generate({
            charset: "alphabetic",
        });

        const query = `
            {
                ${typeMovie.plural}(where: { title: "${movieTitle}" }) {
                    actorsConnection {
                        pi:pageInfo {
                            hasNextPage
                        }
                    }
                }
            }
        `;

        await testHelper.executeCypher(
            `
                    CREATE (m:${typeMovie.name} {title: $movieTitle})
                    CREATE (m)<-[:ACTED_IN]-(:${typeActor.name})
                    CREATE (m)<-[:ACTED_IN]-(:${typeActor.name})
                    CREATE (m)<-[:ACTED_IN]-(:${typeActor.name})
                `,
            {
                movieTitle,
            }
        );

        const result = await testHelper.executeGraphQL(query);

        expect(result.errors).toBeUndefined();

        expect(result.data as any).toEqual({
            [typeMovie.plural]: [{ actorsConnection: { pi: { hasNextPage: false } } }],
        });
    });

    test("should alias startCursor", async () => {
        const typeDefs = gql`
            type ${typeMovie.name} {
                title: String!
                actors: [${typeActor.name}!]! @relationship(type: "ACTED_IN", direction: IN)
            }

            type ${typeActor.name} {
                name: String!
                movies: [${typeMovie.name}!]! @relationship(type: "ACTED_IN", direction: OUT)
            }
        `;

        await testHelper.initNeo4jGraphQL({ typeDefs });

        const movieTitle = generate({
            charset: "alphabetic",
        });

        const query = `
            {
                ${typeMovie.plural}(where: { title: "${movieTitle}" }) {
                    actorsConnection {
                        pageInfo {
                            sc:startCursor
                        }
                    }
                }
            }
        `;

        await testHelper.executeCypher(
            `
                    CREATE (m:${typeMovie.name} {title: $movieTitle})
                    CREATE (m)<-[:ACTED_IN]-(:${typeActor.name})
                    CREATE (m)<-[:ACTED_IN]-(:${typeActor.name})
                    CREATE (m)<-[:ACTED_IN]-(:${typeActor.name})
                `,
            {
                movieTitle,
            }
        );

        const result = await testHelper.executeGraphQL(query);

        expect(result.errors).toBeUndefined();

        expect((result.data as any)[typeMovie.plural][0].actorsConnection.pageInfo.sc).toBeDefined();
    });

    test("should alias endCursor", async () => {
        const typeDefs = gql`
            type ${typeMovie.name} {
                title: String!
                actors: [${typeActor.name}!]! @relationship(type: "ACTED_IN", direction: IN)
            }

            type ${typeActor.name} {
                name: String!
                movies: [${typeMovie.name}!]! @relationship(type: "ACTED_IN", direction: OUT)
            }
        `;

        await testHelper.initNeo4jGraphQL({ typeDefs });

        const movieTitle = generate({
            charset: "alphabetic",
        });

        const query = `
            {
                ${typeMovie.plural}(where: { title: "${movieTitle}" }) {
                    actorsConnection {
                        pageInfo {
                            ec:endCursor
                        }
                    }
                }
            }
        `;

        await testHelper.executeCypher(
            `
                    CREATE (m:${typeMovie.name} {title: $movieTitle})
                    CREATE (m)<-[:ACTED_IN]-(:${typeActor.name})
                    CREATE (m)<-[:ACTED_IN]-(:${typeActor.name})
                    CREATE (m)<-[:ACTED_IN]-(:${typeActor.name})
                `,
            {
                movieTitle,
            }
        );

        const result = await testHelper.executeGraphQL(query);

        expect(result.errors).toBeUndefined();

        expect((result.data as any)[typeMovie.plural][0].actorsConnection.pageInfo.ec).toBeDefined();
    });

    test("should alias hasPreviousPage", async () => {
        const typeDefs = gql`
            type ${typeMovie.name} {
                title: String!
                actors: [${typeActor.name}!]! @relationship(type: "ACTED_IN", direction: IN)
            }

            type ${typeActor.name} {
                name: String!
                movies: [${typeMovie.name}!]! @relationship(type: "ACTED_IN", direction: OUT)
            }
        `;

        await testHelper.initNeo4jGraphQL({ typeDefs });

        const movieTitle = generate({
            charset: "alphabetic",
        });

        const query = `
            {
                ${typeMovie.plural}(where: { title: "${movieTitle}" }) {
                    actorsConnection {
                        pageInfo {
                            hPP:hasPreviousPage
                        }
                    }
                }
            }
        `;

        await testHelper.executeCypher(
            `
                    CREATE (m:${typeMovie.name} {title: $movieTitle})
                    CREATE (m)<-[:ACTED_IN]-(:${typeActor.name})
                    CREATE (m)<-[:ACTED_IN]-(:${typeActor.name})
                    CREATE (m)<-[:ACTED_IN]-(:${typeActor.name})
                `,
            {
                movieTitle,
            }
        );

        const result = await testHelper.executeGraphQL(query);

        expect(result.errors).toBeUndefined();

        expect((result.data as any)[typeMovie.plural][0].actorsConnection.pageInfo.hPP).toBeDefined();
    });

    test("should alias hasNextPage", async () => {
        const typeDefs = gql`
            type ${typeMovie.name} {
                title: String!
                actors: [${typeActor.name}!]! @relationship(type: "ACTED_IN", direction: IN)
            }

            type ${typeActor.name} {
                name: String!
                movies: [${typeMovie.name}!]! @relationship(type: "ACTED_IN", direction: OUT)
            }
        `;

        await testHelper.initNeo4jGraphQL({ typeDefs });

        const movieTitle = generate({
            charset: "alphabetic",
        });

        const query = `
            {
                ${typeMovie.plural}(where: { title: "${movieTitle}" }) {
                    actorsConnection(first: 1) {
                        pageInfo {
                            hNP:hasNextPage
                        }
                    }
                }
            }
        `;

        await testHelper.executeCypher(
            `
                    CREATE (m:${typeMovie.name} {title: $movieTitle})
                    CREATE (m)<-[:ACTED_IN]-(:${typeActor.name} {name: randomUUID()})
                    CREATE (m)<-[:ACTED_IN]-(:${typeActor.name} {name: randomUUID()})
                    CREATE (m)<-[:ACTED_IN]-(:${typeActor.name} {name: randomUUID()})
                `,
            {
                movieTitle,
            }
        );

        const result = await testHelper.executeGraphQL(query);

        expect(result.errors).toBeUndefined();

        expect((result.data as any)[typeMovie.plural][0].actorsConnection.pageInfo.hNP).toBeDefined();
    });

    test("should alias the top level edges key", async () => {
        const typeDefs = gql`
            type ${typeMovie.name} {
                title: String!
                actors: [${typeActor.name}!]! @relationship(type: "ACTED_IN", direction: IN)
            }

            type ${typeActor.name} {
                name: String!
                movies: [${typeMovie.name}!]! @relationship(type: "ACTED_IN", direction: OUT)
            }
        `;

        await testHelper.initNeo4jGraphQL({ typeDefs });

        const movieTitle = generate({
            charset: "alphabetic",
        });

        const query = `
            {
                ${typeMovie.plural}(where: { title: "${movieTitle}" }) {
                    actorsConnection(first: 1) {
                        e:edges {
                            cursor
                        }
                    }
                }
            }
        `;

        await testHelper.executeCypher(
            `
                    CREATE (m:${typeMovie.name} {title: $movieTitle})
                    CREATE (m)<-[:ACTED_IN]-(:${typeActor.name} {name: randomUUID()})
                    CREATE (m)<-[:ACTED_IN]-(:${typeActor.name} {name: randomUUID()})
                    CREATE (m)<-[:ACTED_IN]-(:${typeActor.name} {name: randomUUID()})
                `,
            {
                movieTitle,
            }
        );

        const result = await testHelper.executeGraphQL(query);

        expect(result.errors).toBeUndefined();

        expect((result.data as any)[typeMovie.plural][0].actorsConnection.e[0].cursor).toBeDefined();
    });

    test("should alias cursor", async () => {
        const typeDefs = gql`
            type ${typeMovie.name} {
                title: String!
                actors: [${typeActor.name}!]! @relationship(type: "ACTED_IN", direction: IN)
            }

            type ${typeActor.name} {
                name: String!
                movies: [${typeMovie.name}!]! @relationship(type: "ACTED_IN", direction: OUT)
            }
        `;

        await testHelper.initNeo4jGraphQL({ typeDefs });

        const movieTitle = generate({
            charset: "alphabetic",
        });

        const query = `
            {
                ${typeMovie.plural}(where: { title: "${movieTitle}" }) {
                    actorsConnection(first: 1) {
                        edges {
                            c:cursor
                        }
                    }
                }
            }
        `;

        await testHelper.executeCypher(
            `
                    CREATE (m:${typeMovie.name} {title: $movieTitle})
                    CREATE (m)<-[:ACTED_IN]-(:${typeActor.name} {name: randomUUID()})
                    CREATE (m)<-[:ACTED_IN]-(:${typeActor.name} {name: randomUUID()})
                    CREATE (m)<-[:ACTED_IN]-(:${typeActor.name} {name: randomUUID()})
                `,
            {
                movieTitle,
            }
        );

        const result = await testHelper.executeGraphQL(query);

        expect(result.errors).toBeUndefined();

        expect((result.data as any)[typeMovie.plural][0].actorsConnection.edges[0].c).toBeDefined();
    });

    test("should alias the top level node key", async () => {
        const typeDefs = gql`
            type ${typeMovie.name} {
                title: String!
                actors: [${typeActor.name}!]! @relationship(type: "ACTED_IN", direction: IN)
            }

            type ${typeActor.name} {
                name: String!
                movies: [${typeMovie.name}!]! @relationship(type: "ACTED_IN", direction: OUT)
            }
        `;

        await testHelper.initNeo4jGraphQL({ typeDefs });

        const movieTitle = generate({
            charset: "alphabetic",
        });

        const query = `
            {
                ${typeMovie.plural}(where: { title: "${movieTitle}" }) {
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

        await testHelper.executeCypher(
            `
                    CREATE (m:${typeMovie.name} {title: $movieTitle})
                    CREATE (m)<-[:ACTED_IN]-(:${typeActor.name} {name: randomUUID()})
                    CREATE (m)<-[:ACTED_IN]-(:${typeActor.name} {name: randomUUID()})
                    CREATE (m)<-[:ACTED_IN]-(:${typeActor.name} {name: randomUUID()})
                `,
            {
                movieTitle,
            }
        );

        const result = await testHelper.executeGraphQL(query);

        expect(result.errors).toBeUndefined();

        expect((result.data as any)[typeMovie.plural][0].actorsConnection.edges[0].n).toBeDefined();
    });

    test("should alias a property on the node", async () => {
        const typeDefs = gql`
            type ${typeMovie.name} {
                title: String!
                actors: [${typeActor.name}!]! @relationship(type: "ACTED_IN", direction: IN)
            }

            type ${typeActor.name} {
                name: String!
                movies: [${typeMovie.name}!]! @relationship(type: "ACTED_IN", direction: OUT)
            }
        `;

        await testHelper.initNeo4jGraphQL({ typeDefs });

        const movieTitle = generate({
            charset: "alphabetic",
        });

        const query = `
            {
                ${typeMovie.plural}(where: { title: "${movieTitle}" }) {
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

        await testHelper.executeCypher(
            `
                    CREATE (m:${typeMovie.name} {title: $movieTitle})
                    CREATE (m)<-[:ACTED_IN]-(:${typeActor.name} {name: randomUUID()})
                    CREATE (m)<-[:ACTED_IN]-(:${typeActor.name} {name: randomUUID()})
                    CREATE (m)<-[:ACTED_IN]-(:${typeActor.name} {name: randomUUID()})
                `,
            {
                movieTitle,
            }
        );

        const result = await testHelper.executeGraphQL(query);

        expect(result.errors).toBeUndefined();

        expect((result.data as any)[typeMovie.plural][0].actorsConnection.edges[0].node.n).toBeDefined();
    });

    test("should alias a property on the relationship", async () => {
        const typeDefs = gql`
            type ${typeMovie.name} {
                title: String!
                actors: [${typeActor.name}!]! @relationship(type: "ACTED_IN", direction: IN, properties: "ActedIn")
            }

            type ${typeActor.name} {
                name: String!
                movies: [${typeMovie.name}!]! @relationship(type: "ACTED_IN", direction: OUT, properties: "ActedIn")
            }

            type ActedIn @relationshipProperties {
                roles: [String]!
            }
        `;

        await testHelper.initNeo4jGraphQL({ typeDefs });

        const movieTitle = generate({
            charset: "alphabetic",
        });

        const query = `
            {
                ${typeMovie.plural}(where: { title: "${movieTitle}" }) {
                    actorsConnection(first: 1) {
                        edges {
                           r:properties {
                             r:roles
                           }
                        }
                    }
                }
            }
        `;

        await testHelper.executeCypher(
            `
                    CREATE (m:${typeMovie.name} {title: $movieTitle})
                    CREATE (m)<-[:ACTED_IN {roles: [randomUUID()]}]-(:${typeActor.name} {name: randomUUID()})
                    CREATE (m)<-[:ACTED_IN {roles: [randomUUID()]}]-(:${typeActor.name} {name: randomUUID()})
                    CREATE (m)<-[:ACTED_IN {roles: [randomUUID()]}]-(:${typeActor.name} {name: randomUUID()})
                `,
            {
                movieTitle,
            }
        );

        const result = await testHelper.executeGraphQL(query);

        expect(result.errors).toBeUndefined();

        expect((result.data as any)[typeMovie.plural][0].actorsConnection.edges[0].r.r).toBeDefined();
    });

    test("should alias many keys on a connection", async () => {
        const typeDefs = gql`
            type ${typeMovie.name} {
                title: String!
                actors: [${typeActor.name}!]! @relationship(type: "ACTED_IN", direction: IN, properties: "ActedIn")
            }

            type ${typeActor.name} {
                name: String!
            }

            type ActedIn @relationshipProperties {
                roles: [String]!
            }
        `;

        await testHelper.initNeo4jGraphQL({ typeDefs });

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
                ${typeMovie.plural}(where: { title: "${movieTitle}" }) {
                    title
                    connection:actorsConnection {
                        tC:totalCount
                        edges {
                            n:node {
                                n:name
                            }
                           p:properties {
                             r:roles
                           }
                        }
                        page:pageInfo {
                            hNP:hasNextPage
                        }
                    }
                }
            }
        `;

        await testHelper.executeCypher(
            `
                    CREATE (m:${typeMovie.name} {title: $movieTitle})
                    CREATE (m)<-[:ACTED_IN {roles: $roles}]-(:${typeActor.name} {name: $actorName})
                `,
            {
                movieTitle,
                actorName,
                roles,
            }
        );

        const result = await testHelper.executeGraphQL(query);

        expect(result.errors).toBeUndefined();

        expect(result.data as any).toEqual({
            [typeMovie.plural]: [
                {
                    title: movieTitle,
                    connection: {
                        tC: 1,
                        edges: [{ n: { n: actorName }, p: { r: roles } }],
                        page: {
                            hNP: false,
                        },
                    },
                },
            ],
        });
    });

    test("should allow multiple aliases on the same connection", async () => {
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

        await testHelper.initNeo4jGraphQL({ typeDefs });

        const postTitle = generate({ charset: "alphabetic" });

        const flags = [true, true, false];

        const flaggedCount = flags.filter((flag) => flag).length;
        const unflaggedCount = flags.filter((flag) => !flag).length;

        const query = `
            {
                posts(where: { title: "${postTitle}"}) {
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

        await testHelper.executeCypher(
            `
              CREATE (post:Post {title: $postTitle})
              FOREACH(flag in $flags |
                CREATE (:Comment {flag: flag})<-[:HAS_COMMENT]-(post)
              )
          `,
            {
                postTitle,
                flags,
            }
        );

        const result = await testHelper.executeGraphQL(query);

        expect(result.errors).toBeUndefined();

        expect((result.data as any).posts[0].flagged.edges).toContainEqual({ node: { flag: true } });
        expect((result.data as any).posts[0].flagged.edges).toHaveLength(flaggedCount);
        expect((result.data as any).posts[0].unflagged.edges).toContainEqual({ node: { flag: false } });
        expect((result.data as any).posts[0].unflagged.edges).toHaveLength(unflaggedCount);
    });

    test("should allow alias on nested connections", async () => {
        const movieTitle = "The Matrix";
        const actorName = "Keanu Reeves";
        const screenTime = 120;

        const typeDefs = gql`
            type ${typeMovie.name} {
                title: String!
                actors: [${typeActor.name}!]! @relationship(type: "ACTED_IN", properties: "ActedIn", direction: IN)
            }

            type ${typeActor.name} {
                name: String!
                movies: [${typeMovie.name}!]! @relationship(type: "ACTED_IN", properties: "ActedIn", direction: OUT)
            }

            type ActedIn @relationshipProperties {
                screenTime: Int!
            }
        `;

        await testHelper.initNeo4jGraphQL({ typeDefs });

        const query = `
            {
                ${typeMovie.plural}(where: { title: "${movieTitle}" }) {
                    title
                    actorsConnection(where: { node: { name: "${actorName}" } }) {
                        edges {
                            properties {
                                screenTime
                            }
                            node {
                                name
                                b: moviesConnection(where: { node: { title: "${movieTitle}"}}) {
                                    edges {
                                        node {
                                            title
                                            a: actors {
                                                name
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            }
        `;

        await testHelper.executeCypher(
            `
                    CREATE (movie:${typeMovie.name} {title: $movieTitle})
                    CREATE (actor:${typeActor.name} {name: $actorName})
                    CREATE (actor)-[:ACTED_IN {screenTime: $screenTime}]->(movie)
                `,
            {
                movieTitle,
                actorName,
                screenTime,
            }
        );

        const result = await testHelper.executeGraphQL(query);

        expect(result.errors).toBeUndefined();

        expect((result.data as any)[typeMovie.plural][0].actorsConnection.edges[0].node.b).toEqual({
            edges: [
                {
                    node: {
                        title: movieTitle,
                        a: [
                            {
                                name: actorName,
                            },
                        ],
                    },
                },
            ],
        });
    });
});
