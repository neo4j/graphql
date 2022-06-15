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

import { Driver, Session } from "neo4j-driver";
import { graphql, GraphQLSchema } from "graphql";
import { gql } from "apollo-server";
import neo4j from "../neo4j";
import { Neo4jGraphQL } from "../../../src/classes";
import { generateUniqueType, UniqueType } from "../../utils/graphql-types";

describe("Connections Alias", () => {
    let driver: Driver;
    let session: Session;
    let schema: GraphQLSchema;

    let typeMovie: UniqueType;
    let typeActor: UniqueType;

    const movieTitle = "Forrest Gump";
    const actorName = "Tom Hanks";
    const screenTime = 120;

    beforeAll(async () => {
        driver = await neo4j();
    });

    beforeEach(async () => {
        typeMovie = generateUniqueType("Movie");
        typeActor = generateUniqueType("Actor");
        session = driver.session();

        const typeDefs = gql`
            type ${typeMovie} {
                title: String!
                actors: [${typeActor}!]! @relationship(type: "ACTED_IN", properties: "ActedIn", direction: IN)
            }

            type ${typeActor} {
                name: String!
                movies: [${typeMovie}!]! @relationship(type: "ACTED_IN", properties: "ActedIn", direction: OUT)
            }

            interface ActedIn {
                screenTime: Int!
            }
        `;

        const neoSchema = new Neo4jGraphQL({ typeDefs });
        schema = await neoSchema.getSchema();
    });

    afterEach(async () => {
        await session.close();
    });

    afterAll(async () => {
        await driver.close();
    });

    test("should allow nested connections", async () => {
        const query = `
            {
                ${typeMovie.plural}(where: { title: "${movieTitle}" }) {
                    title
                    actorsConnection(where: { node: { name: "${actorName}" } }) {
                        edges {
                            screenTime
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

        await session.run(
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

        const result = await graphql({
            schema,
            source: query,
            contextValue: { driver, driverConfig: { bookmarks: session.lastBookmark() } },
        });

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
                ${typeMovie.plural}(where: { title: "${movieTitle}" }) {
                    title
                    actorsConnection(where: { node: { name: "${actorName}" } }) {
                        edges {
                            screenTime
                            node {
                                name
                                moviesConnection(where: { node: { title: "${movieTitle}" } }) {
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

        await session.run(
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

        const result = await graphql({
            schema,
            source: query,
            contextValue: { driver, driverConfig: { bookmarks: session.lastBookmark() } },
        });

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
