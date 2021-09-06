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

import jsonwebtoken from "jsonwebtoken";
import { Driver } from "neo4j-driver";
import { graphql } from "graphql";
import { Socket } from "net";
import { IncomingMessage } from "http";
import { generate } from "randomstring";
import neo4j from "./neo4j";
import { Neo4jGraphQL } from "../../src/classes";

describe("cypher", () => {
    let driver: Driver;

    beforeAll(async () => {
        driver = await neo4j();
    });

    afterAll(async () => {
        await driver.close();
    });

    describe("Top level cypher", () => {
        describe("Query", () => {
            test("should query custom query and return relationship data", async () => {
                const session = driver.session();

                const movieTitle = generate({
                    charset: "alphabetic",
                });
                const actorName = generate({
                    charset: "alphabetic",
                });

                const typeDefs = `
                    type Movie {
                        title: String!
                        actors: [Actor] @relationship(type: "ACTED_IN", direction: IN)
                    }

                    type Actor {
                        name: String!
                        movies: [Movie] @relationship(type: "ACTED_IN", direction: OUT)
                    }

                    type Query {
                        customMovies(title: String!): [Movie] @cypher(statement: """
                            MATCH (m:Movie {title: $title})
                            RETURN m
                        """)
                    }
                `;

                const neoSchema = new Neo4jGraphQL({ typeDefs });

                const source = `
                    query($title: String!) {
                        customMovies(title: $title) {
                            title
                            actors {
                                name
                            }
                        }
                    }
                `;

                try {
                    await session.run(
                        `
                            CREATE (:Movie {title: $title})<-[:ACTED_IN]-(:Actor {name: $name})
                        `,
                        {
                            title: movieTitle,
                            name: actorName,
                        }
                    );

                    const gqlResult = await graphql({
                        schema: neoSchema.schema,
                        source,
                        contextValue: { driver, driverConfig: { bookmarks: session.lastBookmark() } },
                        variableValues: { title: movieTitle },
                    });

                    expect(gqlResult.errors).toBeFalsy();

                    expect((gqlResult?.data as any).customMovies).toEqual([
                        { title: movieTitle, actors: [{ name: actorName }] },
                    ]);
                } finally {
                    await session.close();
                }
            });

            test("should query custom query and return relationship data with custom where on field", async () => {
                const session = driver.session();

                const movieTitle = generate({
                    charset: "alphabetic",
                });
                const actorName = generate({
                    charset: "alphabetic",
                });

                const typeDefs = `
                    type Movie {
                        title: String!
                        actors: [Actor] @relationship(type: "ACTED_IN", direction: IN)
                    }

                    type Actor {
                        name: String!
                        movies: [Movie] @relationship(type: "ACTED_IN", direction: OUT)
                    }

                    type Query {
                        customMovies(title: String!): [Movie] @cypher(statement: """
                            MATCH (m:Movie {title: $title})
                            RETURN m
                        """)
                    }
                `;

                const neoSchema = new Neo4jGraphQL({ typeDefs });

                const source = `
                    query($title: String!, $name: String) {
                        customMovies(title: $title) {
                            title
                            actors(where: {name: $name}) {
                                name
                            }
                        }
                    }
                `;

                try {
                    await session.run(
                        `
                            CREATE (:Movie {title: $title})<-[:ACTED_IN]-(:Actor {name: $name})
                        `,
                        {
                            title: movieTitle,
                            name: actorName,
                        }
                    );

                    const gqlResult = await graphql({
                        schema: neoSchema.schema,
                        source,
                        contextValue: { driver, driverConfig: { bookmarks: session.lastBookmark() } },
                        variableValues: { title: movieTitle, name: actorName },
                    });

                    expect(gqlResult.errors).toBeFalsy();

                    expect((gqlResult?.data as any).customMovies).toEqual([
                        { title: movieTitle, actors: [{ name: actorName }] },
                    ]);
                } finally {
                    await session.close();
                }
            });

            test("should query custom query and return relationship data with auth", async () => {
                const session = driver.session();

                const movieTitle = generate({
                    charset: "alphabetic",
                });
                const actorName = generate({
                    charset: "alphabetic",
                });

                const typeDefs = `
                    type Movie {
                        title: String!
                        actors: [Actor] @relationship(type: "ACTED_IN", direction: IN)
                    }

                    type Actor @auth(rules: [{operations: [READ], roles: ["admin"]}]) {
                        name: String!
                        movies: [Movie] @relationship(type: "ACTED_IN", direction: OUT)
                    }

                    type Query {
                        customMovies(title: String!): [Movie] @cypher(statement: """
                            MATCH (m:Movie {title: $title})
                            RETURN m
                        """)
                    }
                `;

                const secret = "secret";

                const token = jsonwebtoken.sign(
                    {
                        roles: [],
                    },
                    secret
                );

                const neoSchema = new Neo4jGraphQL({ typeDefs, config: { jwt: { secret } } });

                const source = `
                    query($title: String!, $name: String) {
                        customMovies(title: $title) {
                            title
                            actors(where: {name: $name}) {
                                name
                            }
                        }
                    }
                `;

                try {
                    await session.run(
                        `
                            CREATE (:Movie {title: $title})<-[:ACTED_IN]-(:Actor {name: $name})
                        `,
                        {
                            title: movieTitle,
                            name: actorName,
                        }
                    );

                    const socket = new Socket({ readable: true });
                    const req = new IncomingMessage(socket);
                    req.headers.authorization = `Bearer ${token}`;

                    const gqlResult = await graphql({
                        schema: neoSchema.schema,
                        source,
                        contextValue: { driver, req, driverConfig: { bookmarks: session.lastBookmark() } },
                        variableValues: { title: movieTitle, name: actorName },
                    });

                    expect((gqlResult.errors as any[])[0].message).toEqual("Forbidden");
                } finally {
                    await session.close();
                }
            });

            test("should query multiple nodes and return relationship data", async () => {
                const session = driver.session();

                const movieTitle1 = generate({
                    charset: "alphabetic",
                });
                const movieTitle2 = generate({
                    charset: "alphabetic",
                });
                const movieTitle3 = generate({
                    charset: "alphabetic",
                });

                const actorName = generate({
                    charset: "alphabetic",
                });

                const typeDefs = `
                    type Movie {
                        title: String!
                        actors: [Actor] @relationship(type: "ACTED_IN", direction: IN)
                    }

                    type Actor {
                        name: String!
                        movies: [Movie] @relationship(type: "ACTED_IN", direction: OUT)
                    }

                    type Query {
                        customMovies(titles: [String!]!): [Movie] @cypher(statement: """
                            MATCH (m:Movie)
                            WHERE m.title in $titles
                            RETURN m
                        """)
                    }
                `;

                const neoSchema = new Neo4jGraphQL({ typeDefs });

                const source = `
                    query($titles: [String!]!) {
                        customMovies(titles: $titles) {
                            title
                            actors {
                                name
                            }
                        }
                    }
                `;

                try {
                    await session.run(
                        `
                            CREATE (:Movie {title: $title1})<-[:ACTED_IN]-(a:Actor {name: $name})
                            CREATE (:Movie {title: $title2})<-[:ACTED_IN]-(a)
                            CREATE (:Movie {title: $title3})<-[:ACTED_IN]-(a)
                        `,
                        {
                            title1: movieTitle1,
                            title2: movieTitle2,
                            title3: movieTitle3,
                            name: actorName,
                        }
                    );

                    const gqlResult = await graphql({
                        schema: neoSchema.schema,
                        source,
                        contextValue: { driver, driverConfig: { bookmarks: session.lastBookmark() } },
                        variableValues: { titles: [movieTitle1, movieTitle2, movieTitle3] },
                    });

                    expect(gqlResult.errors).toBeFalsy();

                    expect((gqlResult?.data as any).customMovies).toHaveLength(3);
                    expect((gqlResult?.data as any).customMovies).toContainEqual({
                        title: movieTitle1,
                        actors: [{ name: actorName }],
                    });
                    expect((gqlResult?.data as any).customMovies).toContainEqual({
                        title: movieTitle2,
                        actors: [{ name: actorName }],
                    });
                    expect((gqlResult?.data as any).customMovies).toContainEqual({
                        title: movieTitle3,
                        actors: [{ name: actorName }],
                    });
                } finally {
                    await session.close();
                }
            });

            test("should query multiple connection fields on a type", async () => {
                const session = driver.session();

                const title = generate({
                    charset: "alphabetic",
                });

                const actorName = generate({
                    charset: "alphabetic",
                });
                const directorName = generate({
                    charset: "alphabetic",
                });

                const typeDefs = `
                    type Movie {
                        title: String!
                        actors: [Actor] @relationship(type: "ACTED_IN", direction: IN)
                        directors: [Director] @relationship(type: "DIRECTED", direction: IN)
                    }

                    type Actor {
                        name: String!
                        movies: [Movie] @relationship(type: "ACTED_IN", direction: OUT)
                    }

                    type Director {
                        name: String!
                        movies: [Movie] @relationship(type: "DIRECTED", direction: OUT)
                    }

                    type Query {
                        movie(title: String!): Movie
                            @cypher(
                                statement: """
                                MATCH (m:Movie)
                                WHERE m.title = $title
                                RETURN m
                                """
                            )
                    }
                `;

                const neoSchema = new Neo4jGraphQL({ typeDefs });

                const source = `
                    query($title: String!) {
                        movie(title: $title) {
                            title
                            actorsConnection {
                                edges {
                                    node {
                                        name
                                    }
                                }
                            }
                            directorsConnection {
                                edges {
                                    node {
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
                            CREATE (m:Movie {title: $title})<-[:ACTED_IN]-(:Actor {name: $actorName})
                            CREATE (m)<-[:DIRECTED]-(:Director {name: $directorName})
                        `,
                        {
                            title,
                            actorName,
                            directorName,
                        }
                    );

                    const gqlResult = await graphql({
                        schema: neoSchema.schema,
                        source,
                        contextValue: { driver, driverConfig: { bookmarks: session.lastBookmark() } },
                        variableValues: { title },
                    });

                    expect(gqlResult.errors).toBeFalsy();

                    expect(gqlResult?.data?.movie).toEqual({
                        title,
                        actorsConnection: {
                            edges: [{ node: { name: actorName } }],
                        },
                        directorsConnection: {
                            edges: [{ node: { name: directorName } }],
                        },
                    });
                } finally {
                    await session.close();
                }
            });
        });

        describe("Mutation", () => {
            test("should query custom mutation and return relationship data", async () => {
                const session = driver.session();

                const movieTitle = generate({
                    charset: "alphabetic",
                });
                const actorName = generate({
                    charset: "alphabetic",
                });

                const typeDefs = `
                    type Movie {
                        title: String!
                        actors: [Actor] @relationship(type: "ACTED_IN", direction: IN)
                    }

                    type Actor {
                        name: String!
                        movies: [Movie] @relationship(type: "ACTED_IN", direction: OUT)
                    }

                    type Mutation {
                        customMovies(title: String!): [Movie] @cypher(statement: """
                            MATCH (m:Movie {title: $title})
                            RETURN m
                        """)
                    }
                `;

                const neoSchema = new Neo4jGraphQL({ typeDefs });

                const source = `
                    mutation($title: String!) {
                        customMovies(title: $title) {
                            title
                            actors {
                                name
                            }
                        }
                    }
                `;

                try {
                    await session.run(
                        `
                            CREATE (:Movie {title: $title})<-[:ACTED_IN]-(:Actor {name: $name})
                        `,
                        {
                            title: movieTitle,
                            name: actorName,
                        }
                    );

                    const gqlResult = await graphql({
                        schema: neoSchema.schema,
                        source,
                        contextValue: { driver, driverConfig: { bookmarks: session.lastBookmark() } },
                        variableValues: { title: movieTitle },
                    });

                    expect(gqlResult.errors).toBeFalsy();

                    expect((gqlResult?.data as any).customMovies).toEqual([
                        { title: movieTitle, actors: [{ name: actorName }] },
                    ]);
                } finally {
                    await session.close();
                }
            });

            test("should query custom mutation and return relationship data with custom where on field", async () => {
                const session = driver.session();

                const movieTitle = generate({
                    charset: "alphabetic",
                });
                const actorName = generate({
                    charset: "alphabetic",
                });

                const typeDefs = `
                    type Movie {
                        title: String!
                        actors: [Actor] @relationship(type: "ACTED_IN", direction: IN)
                    }

                    type Actor {
                        name: String!
                        movies: [Movie] @relationship(type: "ACTED_IN", direction: OUT)
                    }

                    type Mutation {
                        customMovies(title: String!): [Movie] @cypher(statement: """
                            MATCH (m:Movie {title: $title})
                            RETURN m
                        """)
                    }
                `;

                const neoSchema = new Neo4jGraphQL({ typeDefs });

                const source = `
                    mutation($title: String!, $name: String) {
                        customMovies(title: $title) {
                            title
                            actors(where: {name: $name}) {
                                name
                            }
                        }
                    }
                `;

                try {
                    await session.run(
                        `
                            CREATE (:Movie {title: $title})<-[:ACTED_IN]-(:Actor {name: $name})
                        `,
                        {
                            title: movieTitle,
                            name: actorName,
                        }
                    );

                    const gqlResult = await graphql({
                        schema: neoSchema.schema,
                        source,
                        contextValue: { driver, driverConfig: { bookmarks: session.lastBookmark() } },
                        variableValues: { title: movieTitle },
                    });

                    expect(gqlResult.errors).toBeFalsy();

                    expect((gqlResult?.data as any).customMovies).toEqual([
                        { title: movieTitle, actors: [{ name: actorName }] },
                    ]);
                } finally {
                    await session.close();
                }
            });

            test("should query custom mutation and return relationship data with auth", async () => {
                const session = driver.session();

                const movieTitle = generate({
                    charset: "alphabetic",
                });
                const actorName = generate({
                    charset: "alphabetic",
                });

                const typeDefs = `
                    type Movie {
                        title: String!
                        actors: [Actor] @relationship(type: "ACTED_IN", direction: IN)
                    }

                    type Actor @auth(rules: [{operations: [READ], roles: ["admin"]}]) {
                        name: String!
                        movies: [Movie] @relationship(type: "ACTED_IN", direction: OUT)
                    }

                    type Mutation {
                        customMovies(title: String!): [Movie] @cypher(statement: """
                            MATCH (m:Movie {title: $title})
                            RETURN m
                        """)
                    }
                `;

                const neoSchema = new Neo4jGraphQL({ typeDefs });

                const source = `
                    mutation($title: String!, $name: String) {
                        customMovies(title: $title) {
                            title
                            actors(where: {name: $name}) {
                                name
                            }
                        }
                    }
                `;

                try {
                    await session.run(
                        `
                            CREATE (:Movie {title: $title})<-[:ACTED_IN]-(:Actor {name: $name})
                        `,
                        {
                            title: movieTitle,
                            name: actorName,
                        }
                    );

                    const gqlResult = await graphql({
                        schema: neoSchema.schema,
                        source,
                        contextValue: { driver, driverConfig: { bookmarks: session.lastBookmark() } },
                        variableValues: { title: movieTitle },
                    });

                    expect((gqlResult.errors as any[])[0].message).toEqual("Forbidden");
                } finally {
                    await session.close();
                }
            });
        });

        describe("Issues", () => {
            // https://github.com/neo4j/graphql/issues/227
            test("227", async () => {
                const session = driver.session();

                const memberId = generate({
                    charset: "alphabetic",
                });
                const gender = generate({
                    charset: "alphabetic",
                });
                const townId = generate({
                    charset: "alphabetic",
                });

                const typeDefs = `
                    type Member {
                        id: ID!
                        gender: Gender @relationship(type: "HAS_GENDER", direction: OUT)
                    }

                    type Gender {
                        gender: String!
                    }

                    type Query {
                        townMemberList(id: ID!): [Member] @cypher(statement: """
                            MATCH (town:Town {id:$id})
                            OPTIONAL MATCH (town)<-[:BELONGS_TO]-(member:Member)
                            RETURN member
                        """)
                    }
                `;

                const neoSchema = new Neo4jGraphQL({ typeDefs });

                const source = `
                    query($id: ID!) {
                        townMemberList(id: $id) {
                          id
                          gender {
                            gender
                          }
                        }
                    }
                `;

                try {
                    await session.run(
                        `
                            CREATE (t:Town {id: $townId})
                            MERGE (t)<-[:BELONGS_TO]-(m:Member {id: $memberId})
                            MERGE (m)-[:HAS_GENDER]->(:Gender {gender: $gender})
                        `,
                        {
                            memberId,
                            gender,
                            townId,
                        }
                    );

                    const gqlResult = await graphql({
                        schema: neoSchema.schema,
                        source,
                        contextValue: { driver, driverConfig: { bookmarks: session.lastBookmark() } },
                        variableValues: { id: townId },
                    });

                    expect(gqlResult.errors).toBeFalsy();

                    expect((gqlResult?.data as any).townMemberList).toEqual([{ id: memberId, gender: { gender } }]);
                } finally {
                    await session.close();
                }
            });
        });
    });
});
