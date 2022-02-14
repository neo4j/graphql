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
import { graphql, GraphQLSchema } from "graphql";
import { generate } from "randomstring";
import { gql } from "apollo-server";
import neo4j from "../neo4j";
import { Neo4jGraphQL } from "../../../src/classes";

const testLabel = generate({ charset: "alphabetic" });

describe("computed", () => {
    let driver: Driver;

    let schema: GraphQLSchema;

    const typeDefs = gql`
        type Movie {
            id: ID!
            title: String!
            runtime: Int!
            actors: [Actor!]! @relationship(type: "ACTED_IN", direction: IN, properties: "ActedIn")
            numberOfActors: Int!
                @computed(statement: "MATCH (actor:Actor)-[:ACTED_IN]->($$source) RETURN count(actor) AS $$field")
        }
        type Actor {
            id: ID!
            name: String!
            movies: [Movie!]! @relationship(type: "ACTED_IN", direction: OUT, properties: "ActedIn")
            totalScreenTime: Int!
                @computed(
                    statement: """
                    MATCH ($$source)-[r:ACTED_IN]->(:Movie)
                    RETURN sum(r.screenTime) AS $$field
                    """
                )
        }
        interface ActedIn @relationshipProperties {
            screenTime: Int!
        }
    `;

    const movies = [
        {
            id: generate({ charset: "alphabetic" }),
            title: "A",
            runtime: 400,
        },
        {
            id: generate({ charset: "alphabetic" }),
            title: "B",
            runtime: 300,
        },
    ];

    const actors = [
        {
            id: generate({ charset: "alphabetic" }),
            name: `A${generate({ charset: "alphbetic" })}`,
            screenTime: {
                [movies[0].id]: 2,
                [movies[1].id]: 1,
            },
        },
        {
            id: generate({ charset: "alphabetic" }),
            name: `B${generate({ charset: "alphbetic" })}`,
            screenTime: {
                [movies[1].id]: 1,
            },
        },
    ];

    beforeAll(async () => {
        driver = await neo4j();

        schema = await new Neo4jGraphQL({ typeDefs }).getSchema();

        const session = driver.session();
        await session.run(
            `
                    CREATE (m1:Movie:${testLabel}) SET m1 = $movies[0]
                    CREATE (m2:Movie:${testLabel}) SET m2 = $movies[1]

                    CREATE (a1:Actor:${testLabel}) SET a1.id = $actors[0].id, a1.name = $actors[0].name
                    CREATE (a2:Actor:${testLabel}) SET a2.id = $actors[1].id, a2.name = $actors[1].name
                    
                    MERGE (a1)-[:ACTED_IN {screenTime: $actors[0].screenTime[m1.id]}]->(m1)
                    MERGE (a1)-[:ACTED_IN {screenTime: $actors[0].screenTime[m2.id]}]->(m2)<-[:ACTED_IN {screenTime: $actors[1].screenTime[m2.id]}]-(a2)
                `,
            { movies, actors }
        );
    });

    afterAll(async () => {
        const session = driver.session();
        await session.run(`MATCH (n:${testLabel}) DETACH DELETE n`);
        await session.close();
        await driver.close();
    });

    test("on top level", async () => {
        const source = `
                  query ($movieIds: [ID!]!) {
                      movies(where: { id_IN: $movieIds }) {
                          id
                          numberOfActors
                      }
                  }
              `;
        const gqlResult = await graphql({
            schema,
            source,
            contextValue: { driver },
            variableValues: { movieIds: movies.map(({ id }) => id) },
        });

        const gqlMovies = gqlResult.data?.movies as any[];

        expect(gqlResult.errors).toBeUndefined();

        expect(gqlMovies).toHaveLength(2);
        expect(gqlMovies).toContainEqual({ id: movies[0].id, numberOfActors: 1 });
        expect(gqlMovies).toContainEqual({ id: movies[1].id, numberOfActors: 2 });
    });

    test("on deeply nested level", async () => {
        const source = `
                  query ($movieId: ID!, $actorId: ID!) {
                    movies(where: { id: $movieId }) {
                        id
                        actors(where: {id: $actorId}) {
                            id
                            movies(where: { id: $movieId }) {
                                id
                                actors(where: {id: $actorId}) {
                                    id
                                    movies {
                                        id
                                        numberOfActors
                                    }
                                }
                            }
                        }
                    }
                  }
              `;
        const gqlResult = await graphql({
            schema,
            source,
            contextValue: { driver },
            variableValues: { movieId: movies[0].id, actorId: actors[0].id },
        });

        const gqlMovies = gqlResult.data?.movies as any[];

        expect(gqlResult.errors).toBeUndefined();

        expect(gqlMovies).toHaveLength(1);
        expect(gqlMovies[0].actors[0].movies[0].actors[0].movies).toContainEqual({
            id: movies[0].id,
            numberOfActors: 1,
        });
        expect(gqlMovies[0].actors[0].movies[0].actors[0].movies).toContainEqual({
            id: movies[1].id,
            numberOfActors: 2,
        });
    });
});
