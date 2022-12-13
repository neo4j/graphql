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

import { Neo4jGraphQLAuthJWTPlugin } from "@neo4j/graphql-plugin-auth";
import type { Driver, Session } from "neo4j-driver";
import type { GraphQLSchema } from "graphql";
import { graphql } from "graphql";
import Neo4j from "../neo4j";
import { Neo4jGraphQL } from "../../../src/classes";
import { createJwtRequest } from "../../utils/create-jwt-request";
import { generateUniqueType, UniqueType } from "../../utils/graphql-types";

describe("cypher", () => {
    let driver: Driver;
    let neo4j: Neo4j;
    let session: Session;

    let movieType: UniqueType;
    let actorType: UniqueType;
    let directorType: UniqueType;
    let memberType: UniqueType;
    let genderType: UniqueType;
    let townType: UniqueType;
    let destinationType: UniqueType;

    const movieTitle1 = "Some movie title";
    const movieTitle2 = "foo";
    const movieTitle3 = "MovieTitle 3";
    const actorName = "An actor's name";
    const directorName = "A director's name";

    beforeAll(async () => {
        neo4j = new Neo4j();
        driver = await neo4j.getDriver();
    });

    beforeEach(async () => {
        session = await neo4j.getSession();
        movieType = generateUniqueType("Movie");
        actorType = generateUniqueType("Actor");
        directorType = generateUniqueType("Director");
        memberType = generateUniqueType("Member");
        genderType = generateUniqueType("Gender");
        townType = generateUniqueType("Town");
        destinationType = generateUniqueType("Destination");
    });

    afterAll(async () => {
        await driver.close();
    });

    describe(`Top level cypher`, () => {
        describe("Query", () => {
            let Movie: UniqueType;
            let Actor: UniqueType;
            let Director: UniqueType;

            beforeEach(() => {
                Movie = generateUniqueType("Movie");
                Actor = generateUniqueType("Actor");
                Director = generateUniqueType("Director");
            });

            test("should query custom query and return relationship data", async () => {
                const session = await neo4j.getSession();

                const movieTitle = generate({
                    charset: "alphabetic",
                });
                const actorName = generate({
                    charset: "alphabetic",
                });

                const typeDefs = `
                    type ${Movie} {
                        title: String!
                        actors: [${Actor}!]! @relationship(type: "ACTED_IN", direction: IN)
                    }

                    type ${Actor} {
                        name: String!
                        movies: [${Movie}!]! @relationship(type: "ACTED_IN", direction: OUT)
                    }

                    type Query {
                        customMovies(title: String!): [${Movie}]
                            @cypher(
                                statement: """
                                MATCH (m:${Movie} {title: $title})
                                RETURN m
                                """
                            )
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
                            CREATE (:${Movie} {title: $title})<-[:ACTED_IN]-(:${Actor} {name: $name})
                        `,
                        {
                            title: movieTitle1,
                            name: actorName,
                        }
                    );

                    const gqlResult = await graphql({
                        schema: await neoSchema.getSchema(),
                        source,
                        contextValue: neo4j.getContextValuesWithBookmarks(session.lastBookmark()),
                        variableValues: { title: movieTitle1 },
                    });

                    expect(gqlResult.errors).toBeFalsy();

                    expect((gqlResult?.data as any).customMovies).toEqual([
                        { title: movieTitle1, actors: [{ name: actorName }] },
                    ]);
                } finally {
                    await session.close();
                }
            });

            test("should query custom query and return relationship data with custom where on field", async () => {
                session = await neo4j.getSession();

                const typeDefs = `
                    type ${Movie} {
                        title: String!
                        actors: [${Actor}!]! @relationship(type: "ACTED_IN", direction: IN)
                    }

                    type ${Actor} {
                        name: String!
                        movies: [${Movie}!]! @relationship(type: "ACTED_IN", direction: OUT)
                    }

                    type Query {
                        customMovies(title: String!): [${Movie}] @cypher(statement: """
                            MATCH (m:${Movie} {title: $title})
                            RETURN m
                        """
                        )
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
                            CREATE (:${Movie} {title: $title})<-[:ACTED_IN]-(:${Actor} {name: $name})
                        `,
                        {
                            title: movieTitle1,
                            name: actorName,
                        }
                    );

                    const gqlResult = await graphql({
                        schema: await neoSchema.getSchema(),
                        source,
                        contextValue: neo4j.getContextValuesWithBookmarks(session.lastBookmark()),
                        variableValues: { title: movieTitle1, name: actorName },
                    });

                    expect(gqlResult.errors).toBeFalsy();

                    expect((gqlResult?.data as any).customMovies).toEqual([
                        { title: movieTitle1, actors: [{ name: actorName }] },
                    ]);
                } finally {
                    await session.close();
                }
            });

            test("should query custom query and return relationship data with auth", async () => {
                session = await neo4j.getSession();

                const typeDefs = `
                    type ${Movie} {
                        title: String!
                        actors: [${Actor}!]! @relationship(type: "ACTED_IN", direction: IN)
                    }

                    type ${Actor} @auth(rules: [{operations: [READ], roles: ["admin"]}]) {
                        name: String!
                        movies: [${Movie}!]! @relationship(type: "ACTED_IN", direction: OUT)
                    }

                    type Query {
                        customMovies(title: String!): [${Movie}] @cypher(statement: """
                            MATCH (m:${Movie} {title: $title})
                            RETURN m
                            """)
                    }
                `;

                const secret = "secret";

                const neoSchema = new Neo4jGraphQL({
                    typeDefs,
                    plugins: {
                        auth: new Neo4jGraphQLAuthJWTPlugin({
                            secret: "secret",
                        }),
                    },
                });

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
                            CREATE (:${Movie} {title: $title})<-[:ACTED_IN]-(:${Actor} {name: $name})
                        `,
                        {
                            title: movieTitle1,
                            name: actorName,
                        }
                    );

                    const req = createJwtRequest(secret);

                    const gqlResult = await graphql({
                        schema: await neoSchema.getSchema(),
                        source,
                        contextValue: neo4j.getContextValuesWithBookmarks(session.lastBookmark(), { req }),
                        variableValues: { title: movieTitle1, name: actorName },
                    });

                    expect((gqlResult.errors as any[])[0].message).toBe("Forbidden");
                } finally {
                    await session.close();
                }
            });

            test("should query multiple nodes and return relationship data", async () => {
                session = await neo4j.getSession();

                const typeDefs = `
                    type ${Movie} {
                        title: String!
                        actors: [${Actor}!]! @relationship(type: "ACTED_IN", direction: IN)
                    }

                    type ${Actor} {
                        name: String!
                        movies: [${Movie}!]! @relationship(type: "ACTED_IN", direction: OUT)
                    }

                    type Query {
                        customMovies(titles: [String!]!): [${Movie}] @cypher(statement: """
                            MATCH (m:${Movie})
                            WHERE m.title in $titles
                            RETURN m
                            """
                            )
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
                            CREATE (:${Movie} {title: $title1})<-[:ACTED_IN]-(a:${Actor} {name: $name})
                            CREATE (:${Movie} {title: $title2})<-[:ACTED_IN]-(a)
                            CREATE (:${Movie} {title: $title3})<-[:ACTED_IN]-(a)
                        `,
                        {
                            title1: movieTitle1,
                            title2: movieTitle2,
                            title3: movieTitle3,
                            name: actorName,
                        }
                    );

                    const gqlResult = await graphql({
                        schema: await neoSchema.getSchema(),
                        source,
                        contextValue: neo4j.getContextValuesWithBookmarks(session.lastBookmark()),
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
                session = await neo4j.getSession();

                const typeDefs = `
                    type ${Movie} {
                        title: String!
                        actors: [${Actor}!]! @relationship(type: "ACTED_IN", direction: IN)
                        directors: [${Director}!]! @relationship(type: "DIRECTED", direction: IN)
                    }

                    type ${Actor} {
                        name: String!
                        movies: [${Movie}!]! @relationship(type: "ACTED_IN", direction: OUT)
                    }

                    type ${Director} {
                        name: String!
                        movies: [${Movie}!]! @relationship(type: "DIRECTED", direction: OUT)
                    }

                    type Query {
                        movie(title: String!): ${Movie}
                            @cypher(
                                statement: """
                                MATCH (m:${Movie})
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
                            CREATE (m:${Movie} {title: $title})<-[:ACTED_IN]-(:${Actor} {name: $actorName})
                            CREATE (m)<-[:DIRECTED]-(:${Director} {name: $directorName})
                        `,
                        {
                            title: movieTitle1,
                            actorName,
                            directorName,
                        }
                    );

                    const gqlResult = await graphql({
                        schema: await neoSchema.getSchema(),
                        source,
                        contextValue: neo4j.getContextValuesWithBookmarks(session.lastBookmark()),
                        variableValues: { title: movieTitle1 },
                    });

                    expect(gqlResult.errors).toBeFalsy();

                    expect(gqlResult?.data?.movie).toEqual({
                        title: movieTitle1,
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

            describe("with experimental columnName", () => {
                test("should query custom query and return relationship data", async () => {
                    const session = await neo4j.getSession();

                    const movieTitle = generate({
                        charset: "alphabetic",
                    });
                    const actorName = generate({
                        charset: "alphabetic",
                    });

                    const typeDefs = `
                        type ${Movie} {
                            title: String!
                            actors: [${Actor}!]! @relationship(type: "ACTED_IN", direction: IN)
                        }
    
                        type ${Actor} {
                            name: String!
                            movies: [${Movie}!]! @relationship(type: "ACTED_IN", direction: OUT)
                        }
    
                        type Query {
                            customMovies(title: String!): [${Movie}]
                                @cypher(
                                    statement: """
                                    MATCH (m:${Movie} {title: $title})
                                    RETURN m
                                    """,
                                    columnName: "m"
                                )
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
                                CREATE (:${Movie} {title: $title})<-[:ACTED_IN]-(:${Actor} {name: $name})
                            `,
                            {
                                title: movieTitle,
                                name: actorName,
                            }
                        );

                        const gqlResult = await graphql({
                            schema: await neoSchema.getSchema(),
                            source,
                            contextValue: neo4j.getContextValuesWithBookmarks(session.lastBookmark()),
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
                    const session = await neo4j.getSession();

                    const movieTitle = generate({
                        charset: "alphabetic",
                    });
                    const actorName = generate({
                        charset: "alphabetic",
                    });

                    const typeDefs = `
                        type ${Movie} {
                            title: String!
                            actors: [${Actor}!]! @relationship(type: "ACTED_IN", direction: IN)
                        }
    
                        type ${Actor} {
                            name: String!
                            movies: [${Movie}!]! @relationship(type: "ACTED_IN", direction: OUT)
                        }
    
                        type Query {
                            customMovies(title: String!): [${Movie}] @cypher(statement: """
                                MATCH (m:${Movie} {title: $title})
                                RETURN m
                            """,
                            columnName: "m"
                            )
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
                                CREATE (:${Movie} {title: $title})<-[:ACTED_IN]-(:${Actor} {name: $name})
                            `,
                            {
                                title: movieTitle,
                                name: actorName,
                            }
                        );

                        const gqlResult = await graphql({
                            schema: await neoSchema.getSchema(),
                            source,
                            contextValue: neo4j.getContextValuesWithBookmarks(session.lastBookmark()),
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
            });
        });

        describe("Mutation", () => {
            let Movie: UniqueType;
            let Actor: UniqueType;

            beforeEach(() => {
                Movie = generateUniqueType("Movie");
                Actor = generateUniqueType("Actor");
            });

            test("should query custom mutation and return relationship data", async () => {
                const session = await neo4j.getSession();

                const typeDefs = `
                    type ${Movie} {
                        title: String!
                        actors: [${Actor}!]! @relationship(type: "ACTED_IN", direction: IN)
                    }

                    type ${Actor} {
                        name: String!
                        movies: [${Movie}!]! @relationship(type: "ACTED_IN", direction: OUT)
                    }

                    type Mutation {
                        customMovies(title: String!): [${Movie}]
                            @cypher(
                                statement: """
                                MATCH (m:${Movie} {title: $title})
                                RETURN m
                                """
                            )
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
                            CREATE (:${Movie} {title: $title})<-[:ACTED_IN]-(:${Actor} {name: $name})
                        `,
                        {
                            title: movieTitle1,
                            name: actorName,
                        }
                    );

                    const gqlResult = await graphql({
                        schema: await neoSchema.getSchema(),
                        source,
                        contextValue: neo4j.getContextValuesWithBookmarks(session.lastBookmark()),
                        variableValues: { title: movieTitle1 },
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
                const session = await neo4j.getSession();

                const movieTitle = generate({
                    charset: "alphabetic",
                });
                const actorName = generate({
                    charset: "alphabetic",
                });

                const typeDefs = `
                    type ${Movie} {
                        title: String!
                        actors: [${Actor}!]! @relationship(type: "ACTED_IN", direction: IN)
                    }

                    type ${Actor} {
                        name: String!
                        movies: [${Movie}!]! @relationship(type: "ACTED_IN", direction: OUT)
                    }

                    type Mutation {
                        customMovies(title: String!): [${Movie}] @cypher(statement: """
                            MATCH (m:${Movie} {title: $title})
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
                            CREATE (:${Movie} {title: $title})<-[:ACTED_IN]-(:${Actor} {name: $name})
                        `,
                        {
                            title: movieTitle,
                            name: actorName,
                        }
                    );

                    const gqlResult = await graphql({
                        schema: await neoSchema.getSchema(),
                        source,
                        contextValue: neo4j.getContextValuesWithBookmarks(session.lastBookmark()),
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
                const session = await neo4j.getSession();

                const movieTitle = generate({
                    charset: "alphabetic",
                });
                const actorName = generate({
                    charset: "alphabetic",
                });

                const typeDefs = `
                    type ${Movie} {
                        title: String!
                        actors: [${Actor}!]! @relationship(type: "ACTED_IN", direction: IN)
                    }

                    type ${Actor} @auth(rules: [{operations: [READ], roles: ["admin"]}]) {
                        name: String!
                        movies: [${Movie}!]! @relationship(type: "ACTED_IN", direction: OUT)
                    }

                    type Mutation {
                        customMovies(title: String!): [${Movie}] @cypher(statement: """
                            MATCH (m:${Movie} {title: $title})
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
                            CREATE (:${Movie} {title: $title})<-[:ACTED_IN]-(:${Actor} {name: $name})
                        `,
                        {
                            title: movieTitle,
                            name: actorName,
                        }
                    );

                    const gqlResult = await graphql({
                        schema: await neoSchema.getSchema(),
                        source,
                        contextValue: neo4j.getContextValuesWithBookmarks(session.lastBookmark()),
                        variableValues: { title: movieTitle },
                    });

                    expect((gqlResult.errors as any[])[0].message).toBe("Forbidden");
                } finally {
                    await session.close();
                }
            });
        });
    });

    describe("Field level cypher", () => {
        // Reproduces https://github.com/neo4j/graphql/issues/444 with default value test
        describe("Null Values", () => {
            let schemaWithDefaultValue: GraphQLSchema;
            let schemaWithMissingValue: GraphQLSchema;

            const testLabel = generateUniqueType("TestLabel");
            const townId = "Some town ID";
            const destinationId = "A destination ID";
            const defaultPreposition = "Some val";
            const testCaseName = "test-case-name";

            const generateTypeDefs = (withDefaultValue: boolean) => `
                type ${destinationType.name} {
                    id: ID!
                    preposition(caseName: String${
                        withDefaultValue ? "= null" : ""
                    }): String! @cypher(statement: "RETURN coalesce($caseName, '${defaultPreposition}')")
                }

                type Query {
                    townDestinationList(id: ID!): [${destinationType.name}] @cypher(statement: """
                        MATCH (town:${townType.name} {id:$id})
                        OPTIONAL MATCH (town)<-[:BELONGS_TO]-(destination:${destinationType.name})
                        RETURN destination
                    """)
                }
            `;

            beforeAll(async () => {
                session = await neo4j.getSession();

                const neoSchemaWithDefaultValue = new Neo4jGraphQL({
                    typeDefs: generateTypeDefs(true),
                });
                const neoSchemaWithMissingValue = new Neo4jGraphQL({
                    typeDefs: generateTypeDefs(false),
                });

                schemaWithDefaultValue = await neoSchemaWithDefaultValue.getSchema();
                schemaWithMissingValue = await neoSchemaWithMissingValue.getSchema();

                await session.run(
                    `
                        CREATE (t:${townType.name}:${testLabel} {id: $townId})
                        MERGE (t)<-[:BELONGS_TO]-(:${destinationType.name}:${testLabel} {id: $destinationId})
                    `,
                    {
                        townId,
                        destinationId,
                    }
                );
                await session.close();
            });

            afterAll(async () => {
                session = await neo4j.getSession();
                await session.run(`MATCH (n:${testLabel}) DETACH DELETE n`);
                await session.close();
            });

            test("should return default value", async () => {
                const source = `
                        query($id: ID!) {
                            townDestinationList(id: $id) {
                                id
                                preposition
                            }
                        }
                `;

                const gqlResult = (schema: GraphQLSchema) =>
                    graphql({
                        schema,
                        source,
                        contextValue: neo4j.getContextValuesWithBookmarks(session.lastBookmark()),
                        variableValues: { id: townId },
                    });

                const expectedTownDestinationList = [{ id: destinationId, preposition: defaultPreposition }];

                // Schema with default value
                const gqlResultWithDefaultValue = await gqlResult(schemaWithDefaultValue);

                expect(gqlResultWithDefaultValue.errors).toBeFalsy();

                expect((gqlResultWithDefaultValue?.data as any).townDestinationList).toEqual(
                    expectedTownDestinationList
                );

                // Schema with missing value
                const gqlResultWithMissingValue = await gqlResult(schemaWithMissingValue);

                expect(gqlResultWithMissingValue.errors).toBeFalsy();

                expect((gqlResultWithMissingValue?.data as any).townDestinationList).toEqual(
                    expectedTownDestinationList
                );
            });

            test("should return test value", async () => {
                const source = `
                        query($id: ID!, $caseName: String) {
                            townDestinationList(id: $id) {
                                id
                                preposition(caseName: $caseName)
                            }
                        }
                    `;

                const gqlResult = (schema: GraphQLSchema) =>
                    graphql({
                        schema,
                        source,
                        contextValue: neo4j.getContextValuesWithBookmarks(session.lastBookmark()),
                        variableValues: { id: townId, caseName: testCaseName },
                    });

                const expectedTownDestinationList = [{ id: destinationId, preposition: testCaseName }];

                // Schema with default value
                const gqlResultWithDefaultValue = await gqlResult(schemaWithDefaultValue);

                expect(gqlResultWithDefaultValue.errors).toBeFalsy();

                expect((gqlResultWithDefaultValue?.data as any).townDestinationList).toEqual(
                    expectedTownDestinationList
                );

                // Schema with missing value
                const gqlResultWithMissingValue = await gqlResult(schemaWithMissingValue);

                expect(gqlResultWithMissingValue.errors).toBeFalsy();

                expect((gqlResultWithMissingValue?.data as any).townDestinationList).toEqual(
                    expectedTownDestinationList
                );
            });
        });

        describe("Union type", () => {
            let schema: GraphQLSchema;
            let postType: UniqueType;
            let movieType2: UniqueType;
            let userType: UniqueType;

            const secret = "secret";

            const testLabel = "testLabel";
            const userId = "1234";

            beforeAll(async () => {
                session = await neo4j.getSession();
                movieType2 = generateUniqueType("Movie");
                postType = generateUniqueType("Post");
                userType = generateUniqueType("User");

                const typeDefs = `
                    union PostMovieUser = ${postType.name} | ${movieType2.name} | ${userType.name}

                    type ${postType.name} {
                        name: String
                    }

                    type ${movieType2.name} {
                        name: String
                    }

                    type ${userType.name} {
                        id: ID @id
                        updates: [PostMovieUser!]!
                            @cypher(
                                statement: """
                                MATCH (this:${userType.name})-[:WROTE]->(wrote:${postType.name})
                                RETURN wrote
                                LIMIT 5
                                """
                            )
                    }
                `;

                const neoSchema = new Neo4jGraphQL({
                    typeDefs,
                    plugins: {
                        auth: new Neo4jGraphQLAuthJWTPlugin({
                            secret,
                        }),
                    },
                });
                schema = await neoSchema.getSchema();

                await session.run(
                    `
                        CREATE (p:${postType.name}:${testLabel} {name: "Postname"})
                        CREATE (m:${movieType2.name}:${testLabel} {name: "Moviename"})
                        CREATE (u:${userType.name}:${testLabel} {id: "${userId}"})
                        CREATE (u)-[:WROTE]->(p)
                        CREATE (u)-[:WATCHED]->(m)
                    `
                );
                await session.close();
            });

            afterAll(async () => {
                session = await neo4j.getSession();
                await session.run(`MATCH (n:${testLabel}) DETACH DELETE n`);
                await session.close();
            });

            test("should return __typename", async () => {
                const source = `
                        query {
                            ${userType.plural} (where: { id: "${userId}" }) {
                                updates {
                                    __typename
                                }
                            }
                        }
                `;

                const req = createJwtRequest(secret, {});
                const gqlResult = await graphql({
                    schema,
                    source,
                    contextValue: neo4j.getContextValues({ req }),
                });

                expect(gqlResult.errors).toBeUndefined();
                expect(gqlResult?.data as any).toEqual({
                    [userType.plural]: [
                        {
                            updates: [
                                {
                                    __typename: postType.name,
                                },
                            ],
                        },
                    ],
                });
            });
        });
    });
});
