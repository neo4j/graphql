/*
 * Copyright (c) "Neo4j"
 * Neo4j Sweden AB [http://neo4j.com]
 */

import { gql } from "graphql-tag";
import type { UniqueType } from "../../utils/graphql-types";
import { TestHelper } from "../../utils/tests-helper";

describe.only("ALE", () => {
    const testHelper = new TestHelper();
    test("should allow nested connections", async () => {
        const typeDefs = gql`
            type Movie @node {
                title: String!
                #@authorization(filter: [{ where: { node: { title: { eq: "$jwt.sub" } } } }])
                released: Int!
                actors: [Person!]! @relationship(type: "ACTED_IN", properties: "ActedInMovie", direction: IN)
            }
            type Person @node {
                name: String!
                born: Int!
                actedIn: [Movie!]! @relationship(type: "ACTED_IN", properties: "ActedInMovie", direction: OUT)
                directed: [Movie!]! @relationship(type: "DIRECTED", direction: OUT)
            }

            type ActedInMovie @relationshipProperties {
                roles: [String!]!
                role: String!
            }
        `;
        await testHelper.initNeo4jGraphQL({ typeDefs });
        await testHelper.executeCypher(`CREATE (movie:Movie {title: "test title", released: 2020})`);
        const query = `
            {
                moviesConnection(first: 2) {
                    edges {
                        node {
                            title
                        }
                        cursor
                    }
                    pageInfo {
                        hasNextPage
                        endCursor
                    }
                }
            }
        `;

        const result = await testHelper.executeGraphQL(query);

        console.log(JSON.stringify(result.data, null, 2));
        await testHelper.close();
    });
});

describe("Connections Alias", () => {
    const testHelper = new TestHelper();

    let typeMovie: UniqueType;
    let typeActor: UniqueType;

    const movieTitle = "Forrest Gump";
    const actorName = "Tom Hanks";
    const screenTime = 120;

    beforeEach(async () => {
        typeMovie = testHelper.createUniqueType("Movie");
        typeActor = testHelper.createUniqueType("Actor");

        const typeDefs = gql`
            type ${typeMovie} @node {
                title: String!
                actors: [${typeActor}!]! @relationship(type: "ACTED_IN", properties: "ActedIn", direction: IN)
            }

            type ${typeActor} @node {
                name: String!
                movies: [${typeMovie}!]! @relationship(type: "ACTED_IN", properties: "ActedIn", direction: OUT)
            }

            type ActedIn @relationshipProperties {
                screenTime: Int!
            }
        `;

        await testHelper.initNeo4jGraphQL({ typeDefs });
    });

    afterEach(async () => {
        await testHelper.close();
    });

    test("should allow nested connections", async () => {
        const query = `
            {
                ${typeMovie.plural}(where: { title_EQ: "${movieTitle}" }) {
                    title
                    actorsConnection(where: { node: { name_EQ: "${actorName}" } }) {
                        edges {
                            properties { 
                                screenTime
                            }
                            node {
                                name
                                moviesConnection {
                                    edges {
                                        node {
                                            title
                                            actors {
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
                    CREATE (movie:${typeMovie} {title: $movieTitle})
                    CREATE (actor:${typeActor} {name: $actorName})
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

        expect((result.data as any)[typeMovie.plural][0].actorsConnection.edges[0].node.moviesConnection).toEqual({
            edges: [
                {
                    node: {
                        title: movieTitle,
                        actors: [
                            {
                                name: actorName,
                            },
                        ],
                    },
                },
            ],
        });
    });

    test("should allow where clause on nested connections", async () => {
        const query = `
            {
                ${typeMovie.plural}(where: { title_EQ: "${movieTitle}" }) {
                    title
                    actorsConnection(where: { node: { name_EQ: "${actorName}" } }) {
                        edges {
                            properties {
                                screenTime
                            }
                            node {
                                name
                                moviesConnection(where: { node: { title_EQ: "${movieTitle}" } }) {
                                    edges {
                                        node {
                                            title
                                            actors {
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
                CREATE (movie:${typeMovie} {title: $movieTitle})
                CREATE (actor:${typeActor} {name: $actorName})
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

        expect((result.data as any)[typeMovie.plural][0].actorsConnection.edges[0].node.moviesConnection).toEqual({
            edges: [
                {
                    node: {
                        title: movieTitle,
                        actors: [
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
