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

describe("Relationship properties - create", () => {
    let driver: Driver;

    beforeAll(async () => {
        driver = await neo4j();
    });

    afterAll(async () => {
        await driver.close();
    });

    test("should create a node with a relationship that has properties", async () => {
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
        const actorName = generate({ charset: "alphabetic" });
        const screenTime = Math.floor((Math.random() * 1e3) / Math.random());

        const source = `
            mutation($movieTitle: String!, $screenTime: Int!, $actorName: String!) {
                createMovies(
                    input: [
                        {
                            title: $movieTitle
                            actors: {
                                create: [{
                                    properties: { screenTime: $screenTime },
                                    node: { name: $actorName }
                                }]
                            }
                        }
                    ]
                ) {
                    movies {
                        title
                        actorsConnection {
                            edges {
                                screenTime
                                node {
                                    name
                                }
                            }
                        }
                    }
                }
            }
        `;

        const result = await graphql({
            schema: neoSchema.schema,
            source,
            contextValue: { driver },
            variableValues: { movieTitle, actorName, screenTime },
        });
        expect(result.errors).toBeFalsy();
        expect(result.data?.createMovies.movies).toEqual([
            {
                title: movieTitle,
                actorsConnection: { edges: [{ screenTime, node: { name: actorName } }] },
            },
        ]);

        const cypher = `
            MATCH (m:Movie {title: $movieTitle})
                    <-[:ACTED_IN {screenTime: $screenTime}]-
                        (:Actor {name: $actorName})
            RETURN m
        `;

        try {
            const neo4jResult = await session.run(cypher, { movieTitle, screenTime, actorName });
            expect(neo4jResult.records).toHaveLength(1);
        } finally {
            await session.close();
        }
    });

    test("should create a node with a relationship that has properties(with Union)", async () => {
        const typeDefs = gql`
            union Publication = Movie

            type Movie {
                title: String!
            }

            type Actor {
                name: String!
                publications: [Publication!]! @relationship(type: "WROTE", properties: "Wrote", direction: OUT)
            }

            interface Wrote {
                words: Int!
            }
        `;

        const neoSchema = new Neo4jGraphQL({
            typeDefs,
        });

        const session = driver.session();
        const movieTitle = generate({ charset: "alphabetic" });
        const actorName = generate({ charset: "alphabetic" });
        const words = Math.floor((Math.random() * 1e3) / Math.random());

        const source = `
            mutation($actorName: String!, $words: Int!, $movieTitle: String!) {
                createActors(
                    input: [
                        {
                            name: $actorName
                            publications_Movie: {
                                create: [{
                                    properties: { words: $words },
                                    node: { title: $movieTitle }
                                }]
                            }
                        }
                    ]
                ) {
                    actors {
                        name
                        publications {
                            ... on Movie {
                                title
                            }
                        }
                    }
                }
            }
        `;

        const result = await graphql({
            schema: neoSchema.schema,
            source,
            contextValue: { driver },
            variableValues: { movieTitle, actorName, words },
        });
        expect(result.errors).toBeFalsy();
        expect(result.data?.createActors.actors).toEqual([
            {
                name: actorName,
                publications: [{ title: movieTitle }],
            },
        ]);

        const cypher = `
            MATCH (a:Actor {name: $actorName})
                    -[:WROTE {words: $words}]->
                        (:Movie {title: $movieTitle})
            RETURN a
        `;

        try {
            const neo4jResult = await session.run(cypher, { movieTitle, words, actorName });
            expect(neo4jResult.records).toHaveLength(1);
        } finally {
            await session.close();
        }
    });
});
