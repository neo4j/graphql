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

describe("related", () => {
    describe("approximate @relationship directive", () => {
        let driver: Driver;
        let schema: GraphQLSchema;

        const typeDefs = gql`
            type Movie {
                id: ID!
                title: String!
                runtime: Int!
                actors: [Actor!]! @relationship(type: "ACTED_IN", direction: IN, properties: "ActedIn")
                relatedActors: [Actor!]!
                    @related(
                        statement: """
                        MATCH ($$source)<-[:ACTED_IN]-($$target)
                        RETURN $$target
                        """
                    )
            }
            type Actor {
                id: ID!
                name: String!
                movies: [Movie!]! @relationship(type: "ACTED_IN", direction: OUT, properties: "ActedIn")
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
                query ($movieId: ID!) {
                    movies(where: { id: $movieId }) {
                        id
                        relatedActors {
                          id
                          name
                        }
                    }
                }
            `;
            const gqlResult = await graphql({
                schema,
                source,
                contextValue: { driver },
                variableValues: { movieId: movies[0].id },
            });

            const gqlMovies = gqlResult.data?.movies as any[];

            expect(gqlResult.errors).toBeUndefined();

            expect(gqlMovies).toHaveLength(1);
            expect(gqlMovies[0].id).toBe(movies[0].id);
            expect(gqlMovies[0].relatedActors).toContainEqual({ id: actors[0].id, name: actors[0].name });
        });

        test("on deeply nested level", async () => {
            const source = `
                query ($movieId: ID!) {
                    movies(where: { id: $movieId }) {
                        id
                        relatedActors {
                          id
                          name
                          movies(where: { id: $movieId }) {
                            id
                            title
                            actorsConnection {
                              edges {
                                node {
                                  id
                                  movies(where: { id: $movieId }) {
                                    id
                                    relatedActors {
                                      id
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
            const gqlResult = await graphql({
                schema,
                source,
                contextValue: { driver },
                variableValues: { movieId: movies[0].id },
            });
            console.log(JSON.stringify(gqlResult.data, null, 2));

            const gqlMovies = gqlResult.data?.movies as any[];

            expect(gqlResult.errors).toBeUndefined();

            expect(gqlMovies).toHaveLength(1);
            expect(gqlMovies[0].id).toBe(movies[0].id);
            expect(
                gqlMovies[0].relatedActors[0].movies[0].actorsConnection.edges[0].node.movies[0].relatedActors
            ).toContainEqual({ id: actors[0].id, name: actors[0].name });
        });
    });

    describe("arbitrary relationships", () => {
        let driver: Driver;
        let schema: GraphQLSchema;

        const typeDefs = gql`
            type Object {
                id: ID!
                children: [Object!]! @relationship(type: "CHILDREN", direction: OUT)
                users: [User!]! @relationship(type: "MEMBER_OF", direction: IN)
                allUsersOfChildren: [User!]!
                    @related(
                        statement: """
                        MATCH ($$source)-[:CHILDREN*]->(:Object)<-[:MEMBER_OF]-($$target)
                        RETURN $$target
                        """
                    )
            }

            type User {
                id: ID!
                object: Object! @relationship(type: "MEMBER_OF", direction: OUT)
            }
        `;

        const users = Array(4)
            .fill(null)
            .map(() => ({ id: generate() }));

        const objects = Array(14)
            .fill(null)
            .map(() => ({ id: generate() }));

        const memberships = [
            [users[0], objects[2]],
            [users[1], objects[5]],
            [users[2], objects[6]],
            [users[3], objects[12]],
        ];

        beforeAll(async () => {
            driver = await neo4j();
            schema = await new Neo4jGraphQL({ typeDefs }).getSchema();
            const session = driver.session();
            await session.run(
                `
                CALL {
                    FOREACH(i in range(0, size($users) - 1) | CREATE (:User:${testLabel} {id: $users[i].id}))
                }
                CALL {
                    FOREACH(j in range(0, size($objects) - 1) | CREATE (:Object:${testLabel} {id: $objects[j].id}))
                }
              
                CALL {
                    // Each Object is a child of the previous Object
                    WITH [x in range(0, size($objects) - 2) | [$objects[x].id, $objects[x+1].id]] as ancestors
                    UNWIND ancestors as ancestor
                    MATCH (parent:Object {id: ancestor[0]}), (child:Object {id: ancestor[1]})
                    MERGE (parent)-[:CHILDREN]->(child)
                }
                
                // Create membership relationship as defined in $memberships
                CALL {
                    UNWIND $memberships as membership
                    MATCH (user:User {id: membership[0].id}), (object:Object {id: membership[1].id})
                    MERGE (user)-[:MEMBER_OF]->(object)
                }
            `,
                { users, objects, memberships }
            );
            await session.close();
        });

        afterAll(async () => {
            const session = driver.session();
            await session.run(`MATCH (node:${testLabel}) DETACH DELETE node`);
            await session.close();
            await driver.close();
        });

        test("should query related node", async () => {
            const query = gql`
                query ($objectId: ID!) {
                    objects(where: { id: $objectId }) {
                        id
                        allUsersOfChildren {
                            id
                        }
                    }
                }
            `;

            const gqlResult = await graphql({
                schema,
                source: query.loc!.source,
                contextValue: { driver },
                variableValues: { objectId: objects[0].id },
            });

            expect(gqlResult.errors).toBeUndefined();
            console.log(JSON.stringify(gqlResult.data, null, 2));

            const gqlObject = (gqlResult.data as any)?.objects[0];

            expect(gqlObject).toBeDefined();
            expect(gqlObject).toEqual({
                id: objects[0].id,
                allUsersOfChildren: users,
            });
        });

        test("should query nested related node", async () => {
            const query = gql`
                query ($objectId: ID!) {
                    objects(where: { id: $objectId }) {
                        id
                        children {
                            id
                            users {
                                object {
                                    id
                                    allUsersOfChildren {
                                        id
                                    }
                                }
                            }
                        }
                    }
                }
            `;

            const gqlResult = await graphql({
                schema,
                source: query.loc!.source,
                contextValue: { driver },
                variableValues: { objectId: objects[4].id },
            });

            expect(gqlResult.errors).toBeUndefined();

            const gqlObject = (gqlResult.data as any)?.objects[0];

            expect(gqlObject).toBeDefined();
            expect(gqlObject).toEqual({
                id: objects[4].id,
                children: [
                    {
                        id: objects[5].id,
                        users: [
                            {
                                object: {
                                    id: objects[5].id,
                                    allUsersOfChildren: expect.arrayContaining([users[2], users[3]]),
                                },
                            },
                        ],
                    },
                ],
            });
        });
    });
});
