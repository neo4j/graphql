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
import { generate } from "randomstring";
import neo4j from "../neo4j";
import { Neo4jGraphQL } from "../../../src/classes";

describe("Relationship properties - delete", () => {
    let driver: Driver;

    beforeAll(async () => {
        driver = await neo4j();
    });

    afterAll(async () => {
        await driver.close();
    });

    test("should delete a related node for a relationship that has properties", async () => {
        const typeDefs = gql`
            type Movie {
                title: String!
                actors: [Actor!]! @relationship(type: "ACTED_IN", properties: "ActedIn", direction: IN)
            }

            type Actor {
                name: String!
                movies: [Movie!]! @relationship(type: "ACTED_IN", properties: "ActedIn", direction: OUT)
            }

            interface ActedIn {
                screenTime: Int!
            }
        `;

        const neoSchema = new Neo4jGraphQL({
            typeDefs,
        });

        const session = driver.session();
        const movieTitle = generate({ charset: "alphabetic" });
        const actorName1 = generate({ charset: "alphabetic" });
        const actorName2 = generate({ charset: "alphabetic" });
        const screenTime = Math.floor((Math.random() * 1e3) / Math.random());

        const source = `
            mutation($movieTitle: String!, $actorName1: String!) {
                updateMovies(
                    where: { title: $movieTitle }
                    delete: { actors: { where: { node: { name: $actorName1 } } } }
                ) {
                    movies {
                        title
                        actors {
                            name
                        }
                    }
                }
            }
        `;

        try {
            await session.run(
                `
                    CREATE (m:Movie {title:$movieTitle})
                    CREATE (m)<-[:ACTED_IN {screenTime:$screenTime}]-(:Actor {name:$actorName1})
                    CREATE (m)<-[:ACTED_IN {screenTime:$screenTime}]-(:Actor {name:$actorName2})
                `,
                { movieTitle, screenTime, actorName1, actorName2 }
            );

            const gqlResult = await graphql({
                schema: neoSchema.schema,
                source,
                contextValue: { driver, driverConfig: { bookmarks: session.lastBookmark() } },
                variableValues: { movieTitle, actorName1 },
            });
            expect(gqlResult.errors).toBeFalsy();
            expect(gqlResult.data?.updateMovies.movies).toEqual([
                {
                    title: movieTitle,
                    actors: [{ name: actorName2 }],
                },
            ]);

            const cypher = `
                MATCH (a:Actor {name: $actorName1})
                RETURN a
            `;

            const neo4jResult = await session.run(cypher, { movieTitle, screenTime, actorName1 });
            expect(neo4jResult.records).toHaveLength(0);
        } finally {
            await session.close();
        }
    });

    test("should delete a related node for a relationship that has properties (with Union)", async () => {
        const typeDefs = gql`
            type Movie {
                title: String!
            }

            type Show {
                name: String!
            }

            type Actor {
                name: String!
                actedIn: [ActedInUnion!]!
                    @relationship(type: "ACTED_IN", properties: "ActedInInterface", direction: OUT)
            }

            union ActedInUnion = Movie | Show

            interface ActedInInterface {
                screenTime: Int!
            }
        `;

        const neoSchema = new Neo4jGraphQL({
            typeDefs,
        });

        const session = driver.session();
        const movieTitle = generate({ charset: "alphabetic" });
        const actorName = generate({ charset: "alphabetic" });
        const screenTime = Math.floor((Math.random() * 1e3) / Math.random());

        const source = `
            mutation($screenTime: Int!, $actorName: String!) {
                updateActors(
                    where: { name: $actorName }
                    delete: {
                        actedIn: {
                            Movie: {
                                where: { edge: { screenTime: $screenTime } }
                            }
                        }
                    }
                ) {
                    actors {
                        name
                        actedIn {
                            __typename
                        }
                    }
                }
            }
        `;

        try {
            await session.run(
                `
                    CREATE (:Movie {title:$movieTitle})<-[:ACTED_IN {screenTime:$screenTime}]-(:Actor {name:$actorName})
                `,
                { movieTitle, screenTime, actorName }
            );

            const gqlResult = await graphql({
                schema: neoSchema.schema,
                source,
                contextValue: { driver, driverConfig: { bookmarks: session.lastBookmark() } },
                variableValues: { actorName, screenTime },
            });
            expect(gqlResult.errors).toBeFalsy();
            expect(gqlResult.data?.updateActors.actors).toEqual([
                {
                    name: actorName,
                    actedIn: [],
                },
            ]);

            const cypher = `
                MATCH (m:Movie {title: $movieTitle})
                RETURN m
            `;

            const neo4jResult = await session.run(cypher, { movieTitle });
            expect(neo4jResult.records).toHaveLength(0);
        } finally {
            await session.close();
        }
    });
});
