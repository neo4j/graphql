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
import neo4j from "./neo4j";
import { Neo4jGraphQL } from "../../src/classes";

const testLabel = generate({ charset: "alphabetic" });

describe("Relationship - Multiple Types", () => {
    let driver: Driver;

    beforeAll(async () => {
        driver = await neo4j();
    });

    afterAll(async () => {
        const session = driver.session();
        await session.run(`MATCH (node:${testLabel}) DETACH DELETE node`);
        await session.close();
        await driver.close();
    });
    describe("on concrete type", () => {
        const typeDefs = gql`
            type Person {
                id: ID!
                name: String!
            }

            type Movie {
                id: ID!
                title: String!

                people: [Person!]! @relationship(type: "DIRECTED|ACTED_IN", direction: IN)
            }
        `;

        const { schema } = new Neo4jGraphQL({ typeDefs });

        const movie = {
            id: generate(),
            title: generate({ charset: "alphabetic" }),
        };

        const person1 = {
            id: generate(),
            name: generate({ charset: "alphabetic" }),
        };

        const person2 = {
            id: generate(),
            name: generate({ charset: "alphabetic" }),
        };

        const person3 = {
            id: generate(),
            name: generate({ charset: "alphabetic" }),
        };

        beforeAll(async () => {
            const session = driver.session();

            await session.run(
                `
                    CREATE (movie:Movie:${testLabel})
                    SET movie = $movie
                    CREATE (person1:Person:${testLabel})
                    SET person1 = $person1
                    CREATE (person2:Person:${testLabel})
                    SET person2 = $person2
                    CREATE (person3:Person:${testLabel})
                    SET person3 = $person3
                    CREATE (person1)-[:ACTED_IN]->(movie)<-[:ACTED_IN]-(person2)
                    CREATE (person3)-[:DIRECTED]->(movie)
                `,
                { movie, person1, person2, person3 }
            );
            await session.close();
        });

        test("should read a relationship with multiple types", async () => {
            const query = gql`
                query($movieId: ID!) {
                    movies(where: { id: $movieId }) {
                        title
                        people {
                            name
                        }
                        peopleConnection {
                            totalCount
                            edges {
                                node {
                                    name
                                }
                            }
                        }
                    }
                }
            `;

            const graphqlResult = await graphql({
                schema,
                source: query.loc!.source,
                contextValue: { driver },
                variableValues: { movieId: movie.id },
            });
            expect(graphqlResult.errors).toBeUndefined();

            const graphqlMovie: {
                title: string;
                people: Array<{ name: string }>;
                peopleConnection: {
                    totalCount: number;
                    edges: Array<{ node: { name: string } }>;
                };
            } = graphqlResult.data?.movies[0];

            expect(graphqlMovie).toBeDefined();

            expect(graphqlMovie.title).toBe(movie.title);

            expect(graphqlMovie.people).toHaveLength(3);
            expect(graphqlMovie.people).toContainEqual({ name: person1.name });
            expect(graphqlMovie.people).toContainEqual({ name: person2.name });
            expect(graphqlMovie.people).toContainEqual({ name: person3.name });

            expect(graphqlMovie.peopleConnection.totalCount).toBe(3);
            expect(graphqlMovie.peopleConnection.edges).toHaveLength(3);
            expect(graphqlMovie.peopleConnection.edges).toContainEqual({ node: { name: person1.name } });
            expect(graphqlMovie.peopleConnection.edges).toContainEqual({ node: { name: person2.name } });
            expect(graphqlMovie.peopleConnection.edges).toContainEqual({ node: { name: person3.name } });
        });

        test("should filter a relationship with multiple types", async () => {
            const query = gql`
                query($movieId: ID!, $person1Id: ID!, $person2Id: ID!) {
                    movies(where: { id: $movieId }) {
                        title
                        people(where: { id_IN: [$person1Id, $person2Id] }) {
                            name
                        }
                        peopleConnection(where: { node: { id_IN: [$person1Id, $person2Id] } }) {
                            totalCount
                            edges {
                                node {
                                    name
                                }
                            }
                        }
                    }
                }
            `;

            const graphqlResult = await graphql({
                schema,
                source: query.loc!.source,
                contextValue: { driver },
                variableValues: { movieId: movie.id, person1Id: person1.id, person2Id: person2.id },
            });
            expect(graphqlResult.errors).toBeUndefined();

            const graphqlMovie: {
                title: string;
                people: Array<{ name: string }>;
                peopleConnection: {
                    totalCount: number;
                    edges: Array<{ node: { name: string } }>;
                };
            } = graphqlResult.data?.movies[0];

            expect(graphqlMovie).toBeDefined();
            expect(graphqlMovie.title).toBe(movie.title);

            // people

            expect(graphqlMovie.people).toHaveLength(2);
            expect(graphqlMovie.people).toContainEqual({ name: person1.name });
            expect(graphqlMovie.people).toContainEqual({ name: person2.name });

            // peopleConnection

            expect(graphqlMovie.peopleConnection.totalCount).toBe(2);
            expect(graphqlMovie.peopleConnection.edges).toHaveLength(2);
            expect(graphqlMovie.peopleConnection.edges).toContainEqual({ node: { name: person1.name } });
            expect(graphqlMovie.peopleConnection.edges).toContainEqual({ node: { name: person2.name } });
        });

        test("should filter a relationship with multiple types on relationship type", async () => {
            const query = gql`
                query($movieId: ID!) {
                    movies(where: { id: $movieId }) {
                        title
                        actedInPeopleConnection: peopleConnection(where: { edge: { _type: ACTED_IN } }) {
                            totalCount
                            edges {
                                node {
                                    name
                                }
                            }
                        }
                        directedPeopleConnection: peopleConnection(where: { edge: { _type: DIRECTED } }) {
                            totalCount
                            edges {
                                node {
                                    name
                                }
                            }
                        }
                    }
                }
            `;

            const graphqlResult = await graphql({
                schema,
                source: query.loc!.source,
                contextValue: { driver },
                variableValues: { movieId: movie.id },
            });
            expect(graphqlResult.errors).toBeUndefined();

            const graphqlMovie: {
                title: string;
                directedPeopleConnection: {
                    totalCount: number;
                    edges: Array<{ node: { name: string } }>;
                };
                actedInPeopleConnection: {
                    totalCount: number;
                    edges: Array<{ node: { name: string } }>;
                };
            } = graphqlResult.data?.movies[0];

            expect(graphqlMovie).toBeDefined();
            expect(graphqlMovie.title).toBe(movie.title);

            // ACTED_IN

            expect(graphqlMovie.actedInPeopleConnection.totalCount).toBe(2);
            expect(graphqlMovie.actedInPeopleConnection.edges).toHaveLength(2);
            expect(graphqlMovie.actedInPeopleConnection.edges).toContainEqual({ node: { name: person1.name } });
            expect(graphqlMovie.actedInPeopleConnection.edges).toContainEqual({ node: { name: person2.name } });

            // DIRECTED

            expect(graphqlMovie.directedPeopleConnection.totalCount).toBe(1);
            expect(graphqlMovie.directedPeopleConnection.edges).toHaveLength(1);
            expect(graphqlMovie.directedPeopleConnection.edges).toContainEqual({ node: { name: person3.name } });
        });

        test("should update a node through a relationship with multiple types", async () => {
            const mutation = gql`
                mutation($movieId: ID!, $person1Id: ID!, $person1NameUpdate: String!) {
                    updateMovies(
                        where: { id: $movieId }
                        update: {
                            people: {
                                where: { node: { id: $person1Id } }
                                update: { node: { name: $person1NameUpdate } }
                            }
                        }
                    ) {
                        movies {
                            title
                            people(where: { id: $person1Id }) {
                                name
                            }
                        }
                    }
                }
            `;

            const person1NameUpdate = generate({ charset: "alphabetic" });

            // GraphQL

            const graphqlResult = await graphql({
                schema,
                source: mutation.loc!.source,
                contextValue: { driver },
                variableValues: { movieId: movie.id, person1Id: person1.id, person1NameUpdate },
            });
            expect(graphqlResult.errors).toBeUndefined();

            const graphqlMovie: {
                title: string;
                people: Array<{ id: string; name: string }>;
            } = graphqlResult.data?.updateMovies.movies[0];

            expect(graphqlMovie).toBeDefined();
            expect(graphqlMovie.title).toBe(movie.title);
            expect(graphqlMovie.people).toHaveLength(1);
            expect(graphqlMovie.people).toContainEqual({ name: person1NameUpdate });

            // Neo4j

            const session = driver.session();

            const neo4jResult = await session.run(
                `
                    MATCH (person:Person)
                    WHERE person.id = $personId
                    RETURN person { .id, .name } as person
                `,
                { personId: person1.id }
            );

            const neo4jPerson: { id: string; name: string } = neo4jResult.records[0].toObject().person;

            expect(neo4jPerson).toBeDefined();
            expect(neo4jPerson.id).toBe(person1.id);
            expect(neo4jPerson.name).toBe(person1NameUpdate);

            await session.close();
        });

        test("should disconnect a node through a relationship with multiple types", async () => {
            const mutation = gql`
                mutation($movieId: ID!, $person1Id: ID!) {
                    updateMovies(
                        where: { id: $movieId }
                        disconnect: { people: { where: { node: { id: $person1Id } } } }
                    ) {
                        movies {
                            title
                            people {
                                id
                                name
                            }
                        }
                    }
                }
            `;

            // GraphQL

            const graphqlResult = await graphql({
                schema,
                source: mutation.loc!.source,
                contextValue: { driver },
                variableValues: { movieId: movie.id, person1Id: person1.id },
            });
            expect(graphqlResult.errors).toBeUndefined();

            const graphqlMovie: {
                title: string;
                people: Array<{ id: string; name: string }>;
            } = graphqlResult.data?.updateMovies.movies[0];

            expect(graphqlMovie).toBeDefined();
            expect(graphqlMovie.title).toBe(movie.title);
            expect(graphqlMovie.people).toHaveLength(2);
            expect(graphqlMovie.people).toContainEqual(person2);
            expect(graphqlMovie.people).toContainEqual(person3);

            // Neo4j

            const session = driver.session();

            const neo4jResult = await session.run(
                `
                    MATCH (person:Person)-[:ACTED_IN|DIRECTED]->(movie:Movie)
                    WHERE movie.id = $movieId
                    WITH person { .id, .name } as person
                    RETURN collect(person) as people
                `,
                { movieId: movie.id }
            );

            const neo4jPeople: Array<{ id: string; name: string }> = neo4jResult.records[0].toObject().people;

            expect(neo4jPeople).toBeDefined();
            expect(neo4jPeople).toHaveLength(2);
            expect(neo4jPeople).toContainEqual(person2);
            expect(neo4jPeople).toContainEqual(person3);

            await session.close();
        });

        // Passes if only test. Possibly due to bookmarks
        // eslint-disable-next-line jest/no-disabled-tests
        test.skip("should delete a node through a relationship with multiple types", async () => {
            const mutation = gql`
                mutation($movieId: ID!, $person1Id: ID!) {
                    updateMovies(where: { id: $movieId }, delete: { people: { where: { node: { id: $person1Id } } } }) {
                        movies {
                            title
                            people {
                                id
                                name
                            }
                        }
                        info {
                            bookmark
                        }
                    }
                }
            `;

            // GraphQL

            const graphqlResult = await graphql({
                schema,
                source: mutation.loc!.source,
                contextValue: { driver },
                variableValues: { movieId: movie.id, person1Id: person1.id },
            });
            expect(graphqlResult.errors).toBeUndefined();

            console.log(JSON.stringify(graphqlResult, null, 4));

            const graphqlMovie: {
                title: string;
                people: Array<{ id: string; name: string }>;
            } = graphqlResult.data?.updateMovies.movies[0];

            expect(graphqlMovie).toBeDefined();
            expect(graphqlMovie.title).toBe(movie.title);
            expect(graphqlMovie.people).toHaveLength(2);
            expect(graphqlMovie.people).toContainEqual(person2);
            expect(graphqlMovie.people).toContainEqual(person3);

            // Neo4j

            const session = driver.session();
            const neo4jResult = await session.run(
                `
                  MATCH (person:Person:${testLabel})
                  WITH person { .id, .name } as person
                  RETURN collect(person) as people
                `
            );

            const neo4jPeople: Array<{ id: string; name: string }> = neo4jResult.records[0].toObject().people;

            expect(neo4jPeople).toBeDefined();
            expect(neo4jPeople).toHaveLength(2);
            expect(neo4jPeople).toContainEqual(person2);
            expect(neo4jPeople).toContainEqual(person3);

            await session.close();
        });
    });

    describe("on unions", () => {
        const typeDefs = gql`
            type Director {
                id: ID!
                name: String!

                directed: [Movie!]! @relationship(type: "DIRECTED", direction: OUT)
            }

            type Actor {
                id: ID!
                name: String!

                movies: [Movie!]! @relationship(type: "ACTED_IN", direction: OUT)
            }

            union Person = Director | Actor

            type Movie {
                id: ID!
                title: String!

                directors: [Director!]! @relationship(type: "DIRECTED", direction: IN)
                actors: [Actor!]! @relationship(type: "ACTED_IN", direction: IN)

                people: [Person!]! @relationship(type: "DIRECTED|ACTED_IN", direction: IN)
            }
        `;

        const { schema } = new Neo4jGraphQL({ typeDefs });

        const movie = {
            id: generate(),
            title: generate({ charset: "alphabetic" }),
        };
        const actor1 = {
            id: generate(),
            name: generate({ charset: "alphabetic" }),
        };
        const actor2 = {
            id: generate(),
            name: generate({ charset: "alphabetic" }),
        };
        const director = {
            id: generate(),
            name: generate({ charset: "alphabetic" }),
        };

        beforeAll(async () => {
            const session = driver.session();

            await session.run(
                `
            CREATE (movie:Movie:${testLabel})
            SET movie = $movie
            CREATE (actor1:Actor:${testLabel})
            SET actor1 = $actor1
            CREATE (actor2:Actor:${testLabel})
            SET actor2 = $actor2
            CREATE (director:Director:${testLabel})
            SET director = $director
            CREATE (actor1)-[:ACTED_IN]->(movie)<-[:ACTED_IN]-(actor2)
            CREATE (director)-[:DIRECTED]->(movie)
          `,
                { movie, actor1, actor2, director }
            );
            await session.close();
        });

        test("should read a union relationship with multiple types", async () => {
            const query = gql`
                query($movieId: ID!) {
                    movies(where: { id: $movieId }) {
                        title
                        people {
                            ... on Director {
                                name
                            }
                            ... on Actor {
                                name
                            }
                        }
                        peopleConnection {
                            totalCount
                            edges {
                                node {
                                    ... on Director {
                                        name
                                    }
                                    ... on Actor {
                                        name
                                    }
                                }
                            }
                        }
                    }
                }
            `;

            const graphqlResult = await graphql({
                schema,
                source: query.loc!.source,
                contextValue: { driver },
                variableValues: { movieId: movie.id },
            });
            expect(graphqlResult.errors).toBeUndefined();

            const graphqlMovie: {
                title: string;
                people: Array<{ name: string }>;
                peopleConnection: {
                    totalCount: number;
                    edges: Array<{ node: { name: string } }>;
                };
            } = graphqlResult.data?.movies[0];

            expect(graphqlMovie).toBeDefined();

            expect(graphqlMovie.title).toBe(movie.title);

            expect(graphqlMovie.people).toHaveLength(3);
            expect(graphqlMovie.people).toContainEqual({ name: actor1.name });
            expect(graphqlMovie.people).toContainEqual({ name: actor2.name });
            expect(graphqlMovie.people).toContainEqual({ name: director.name });

            expect(graphqlMovie.peopleConnection.totalCount).toBe(3);
            expect(graphqlMovie.peopleConnection.edges).toHaveLength(3);
            expect(graphqlMovie.peopleConnection.edges).toContainEqual({ node: { name: actor1.name } });
            expect(graphqlMovie.peopleConnection.edges).toContainEqual({ node: { name: actor2.name } });
            expect(graphqlMovie.peopleConnection.edges).toContainEqual({ node: { name: director.name } });
        });

        test("should filter a union relationship with multiple types", async () => {
            const query = gql`
                query($movieId: ID!, $directorId: ID!) {
                    movies(where: { id: $movieId }) {
                        title
                        people {
                            ... on Director {
                                name
                            }
                            ... on Actor {
                                name
                            }
                        }
                        peopleConnection {
                            totalCount
                            edges {
                                node {
                                    ... on Director {
                                        name
                                    }
                                    ... on Actor {
                                        name
                                    }
                                }
                            }
                        }
                        directorPeople: people(where: { Director: { id: $directorId } }) {
                            ... on Director {
                                name
                            }
                        }
                        directorPeopleConnection: peopleConnection(where: { Director: { node: { id: $directorId } } }) {
                            totalCount
                            edges {
                                node {
                                    ... on Director {
                                        name
                                    }
                                }
                            }
                        }
                        actorPeople: people(where: { Actor: { id_NOT: null } }) {
                            ... on Actor {
                                name
                            }
                        }
                        actorPeopleConnection: peopleConnection(where: { Actor: { node: { id_NOT: null } } }) {
                            totalCount
                            edges {
                                node {
                                    ... on Actor {
                                        name
                                    }
                                }
                            }
                        }
                    }
                }
            `;

            const graphqlResult = await graphql({
                schema,
                source: query.loc!.source,
                contextValue: { driver },
                variableValues: { movieId: movie.id, directorId: director.id, actor1Id: actor1.id },
            });
            expect(graphqlResult.errors).toBeUndefined();

            const graphqlMovie: {
                title: string;
                people: Array<{ name: string }>;
                directorPeople: Array<{ name: string }>;
                actorPeople: Array<{ name: string }>;
                peopleConnection: {
                    totalCount: number;
                    edges: Array<{ node: { name: string } }>;
                };
                directorPeopleConnection: {
                    totalCount: number;
                    edges: Array<{ node: { name: string } }>;
                };
                actorPeopleConnection: {
                    totalCount: number;
                    edges: Array<{ node: { name: string } }>;
                };
            } = graphqlResult.data?.movies[0];

            expect(graphqlMovie).toBeDefined();
            expect(graphqlMovie.title).toBe(movie.title);

            // people

            expect(graphqlMovie.people).toHaveLength(3);
            expect(graphqlMovie.people).toContainEqual({ name: director.name });
            expect(graphqlMovie.people).toContainEqual({ name: actor1.name });
            expect(graphqlMovie.people).toContainEqual({ name: actor2.name });

            expect(graphqlMovie.directorPeople).toHaveLength(1);
            expect(graphqlMovie.directorPeople).toContainEqual({ name: director.name });

            expect(graphqlMovie.actorPeople).toHaveLength(2);
            expect(graphqlMovie.actorPeople).toContainEqual({ name: actor1.name });
            expect(graphqlMovie.actorPeople).toContainEqual({ name: actor2.name });

            // peopleConnection

            expect(graphqlMovie.peopleConnection.totalCount).toBe(3);
            expect(graphqlMovie.peopleConnection.edges).toHaveLength(3);
            expect(graphqlMovie.peopleConnection.edges).toContainEqual({ node: { name: actor1.name } });
            expect(graphqlMovie.peopleConnection.edges).toContainEqual({ node: { name: actor2.name } });
            expect(graphqlMovie.peopleConnection.edges).toContainEqual({ node: { name: director.name } });

            expect(graphqlMovie.directorPeopleConnection.totalCount).toBe(1);
            expect(graphqlMovie.directorPeopleConnection.edges).toHaveLength(1);
            expect(graphqlMovie.directorPeopleConnection.edges).toContainEqual({ node: { name: director.name } });

            expect(graphqlMovie.actorPeopleConnection.totalCount).toBe(2);
            expect(graphqlMovie.actorPeopleConnection.edges).toHaveLength(2);
            expect(graphqlMovie.actorPeopleConnection.edges).toContainEqual({ node: { name: actor1.name } });
            expect(graphqlMovie.actorPeopleConnection.edges).toContainEqual({ node: { name: actor2.name } });
        });

        test("should update a node through a union relationship with multiple types", async () => {
            const mutation = gql`
                mutation($movieId: ID!, $directorId: ID!, $directorNameUpdate: String!) {
                    updateMovies(
                        where: { id: $movieId }
                        update: {
                            people: {
                                Director: {
                                    where: { node: { id: $directorId } }
                                    update: { node: { name: $directorNameUpdate } }
                                }
                            }
                        }
                    ) {
                        movies {
                            title
                            directors {
                                id
                                name
                            }
                        }
                    }
                }
            `;

            const directorNameUpdate = generate({ charset: "alphabetic" });

            // GraphQL

            const graphqlResult = await graphql({
                schema,
                source: mutation.loc!.source,
                contextValue: { driver },
                variableValues: { movieId: movie.id, directorId: director.id, directorNameUpdate },
            });
            expect(graphqlResult.errors).toBeUndefined();

            const graphqlMovie: {
                title: string;
                directors: { id: string; name: string }[];
            } = graphqlResult.data?.updateMovies.movies[0];

            expect(graphqlMovie).toBeDefined();
            expect(graphqlMovie.title).toBe(movie.title);
            expect(graphqlMovie.directors[0].id).toBe(director.id);
            expect(graphqlMovie.directors[0].name).toBe(directorNameUpdate);

            // Neo4j

            const session = driver.session();

            const neo4jResult = await session.run(
                `
                MATCH (director:Director)
                WHERE director.id = $directorId
                RETURN director { .id, .name } as director
              `,
                { directorId: director.id }
            );

            const neo4jDirector: { id: string; name: string } = neo4jResult.records[0].toObject().director;

            expect(neo4jDirector).toBeDefined();
            expect(neo4jDirector.id).toBe(director.id);
            expect(neo4jDirector.name).toBe(directorNameUpdate);

            await session.close();
        });

        test("should disconnect a node through a union relationship with multiple types", async () => {
            const mutation = gql`
                mutation($movieId: ID!, $actor1Id: ID!) {
                    updateMovies(
                        where: { id: $movieId }
                        disconnect: { people: { Actor: { where: { node: { id: $actor1Id } } } } }
                    ) {
                        movies {
                            title
                            actors {
                                id
                                name
                            }
                        }
                    }
                }
            `;

            // GraphQL

            const graphqlResult = await graphql({
                schema,
                source: mutation.loc!.source,
                contextValue: { driver },
                variableValues: { movieId: movie.id, actor1Id: actor1.id },
            });
            expect(graphqlResult.errors).toBeUndefined();

            const graphqlMovie: {
                title: string;
                actors: Array<{ id: string; name: string }>;
            } = graphqlResult.data?.updateMovies.movies[0];

            expect(graphqlMovie).toBeDefined();
            expect(graphqlMovie.title).toBe(movie.title);
            expect(graphqlMovie.actors).toHaveLength(1);
            expect(graphqlMovie.actors).toContainEqual(actor2);

            // Neo4j

            const session = driver.session();

            const neo4jResult = await session.run(
                `
            MATCH (actor:Actor)-[:ACTED_IN]->(movie:Movie)
            WHERE movie.id = $movieId
            WITH actor { .id, .name } as actor
            RETURN collect(actor) as actors
          `,
                { movieId: movie.id }
            );

            const neo4jActors: Array<{ id: string; name: string }> = neo4jResult.records[0].toObject().actors;

            expect(neo4jActors).toBeDefined();
            expect(neo4jActors).toHaveLength(1);
            expect(neo4jActors).toContainEqual(actor2);

            await session.close();
        });

        // Passes if only test. Possibly due to bookmarks
        // eslint-disable-next-line jest/no-disabled-tests
        test.skip("should delete a node through a union relationship with multiple types", async () => {
            const session = driver.session();
            const mutation = gql`
                mutation($movieId: ID!, $actor1Id: ID!) {
                    updateMovies(
                        where: { id: $movieId }
                        delete: { people: { Actor: { where: { node: { id: $actor1Id } } } } }
                    ) {
                        movies {
                            title
                            actors {
                                id
                                name
                            }
                        }
                    }
                }
            `;

            // GraphQL

            const graphqlResult = await graphql({
                schema,
                source: mutation.loc!.source,
                contextValue: { driver },
                variableValues: { movieId: movie.id, actor1Id: actor1.id },
            });
            expect(graphqlResult.errors).toBeUndefined();

            const graphqlMovie: {
                title: string;
                actors: Array<{ id: string; name: string }>;
            } = graphqlResult.data?.updateMovies.movies[0];

            expect(graphqlMovie).toBeDefined();
            expect(graphqlMovie.title).toBe(movie.title);
            expect(graphqlMovie.actors).toHaveLength(1);
            expect(graphqlMovie.actors).toContainEqual(actor2);

            // Neo4j

            const neo4jResult = await session.run(
                `
            MATCH (actor:Actor:${testLabel})
            WITH actor { .id, .name } as actor
            RETURN collect(actor) as actors
          `
            );

            const neo4jActors: Array<{ id: string; name: string }> = neo4jResult.records[0].toObject().actors;

            expect(neo4jActors).toBeDefined();
            expect(neo4jActors).toHaveLength(1);
            expect(neo4jActors).toContainEqual(actor2);

            await session.close();
        });

        test("should create a movie and people through union field", async () => {
            const mutation = gql`
                mutation(
                    $movieId: ID!
                    $movieTitle: String!
                    $director1Id: ID!
                    $director1Name: String!
                    $director2Id: ID!
                    $director2Name: String!
                    $actor1Id: ID!
                    $actor1Name: String!
                    $actor2Id: ID!
                    $actor2Name: String!
                ) {
                    createMovies(
                        input: {
                            id: $movieId
                            title: $movieTitle
                            people: {
                                Director: {
                                    create: [
                                        { node: { id: $director1Id, name: $director1Name }, edge: { _type: DIRECTED } }
                                        { node: { id: $director2Id, name: $director2Name }, edge: { _type: DIRECTED } }
                                    ]
                                }
                                Actor: {
                                    create: [
                                        { node: { id: $actor1Id, name: $actor1Name }, edge: { _type: ACTED_IN } }
                                        { node: { id: $actor2Id, name: $actor2Name }, edge: { _type: ACTED_IN } }
                                    ]
                                }
                            }
                        }
                    ) {
                        movies {
                            title
                            actors {
                                id
                                name
                            }
                            directors {
                                id
                                name
                            }
                            peopleConnection {
                                totalCount
                                edges {
                                    _type
                                    node {
                                        __typename
                                        ... on Director {
                                            id
                                            name
                                        }
                                        ... on Actor {
                                            id
                                            name
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            `;

            const movieMatrix = {
                id: generate(),
                title: "The Matrix",
            };

            const directorLana = {
                id: generate(),
                name: "Lana Wachowski",
            };

            const directorLily = {
                id: generate(),
                name: "Lily Wachowski",
            };

            const actorReeves = {
                id: generate(),
                name: "Keanu Reeves",
            };

            const actorMoss = {
                id: generate(),
                name: "Carrie-Ann Moss",
            };

            // GraphQL

            const graphqlResult = await graphql({
                schema,
                source: mutation.loc!.source,
                contextValue: { driver },
                variableValues: {
                    movieId: movieMatrix.id,
                    movieTitle: movieMatrix.title,
                    director1Id: directorLana.id,
                    director1Name: directorLana.name,
                    director2Id: directorLily.id,
                    director2Name: directorLily.name,
                    actor1Id: actorReeves.id,
                    actor1Name: actorReeves.name,
                    actor2Id: actorMoss.id,
                    actor2Name: actorMoss.name,
                },
            });
            expect(graphqlResult.errors).toBeUndefined();

            const graphqlMovie: {
                title: string;
                peopleConnection: {
                    totalCount: number;
                    edges: Array<{ _type: string; node: Array<{ __typename: string; id: string; name: string }> }>;
                };
                actors: { id: string; name: string }[];
                directors: { id: string; name: string }[];
            } = graphqlResult.data?.createMovies.movies[0];

            expect(graphqlMovie).toBeDefined();

            expect(graphqlMovie.title).toBe(movieMatrix.title);

            expect(graphqlMovie.actors).toHaveLength(2);
            expect(graphqlMovie.actors).toContainEqual(actorReeves);
            expect(graphqlMovie.actors).toContainEqual(actorMoss);

            expect(graphqlMovie.directors).toHaveLength(2);
            expect(graphqlMovie.directors).toContainEqual(directorLana);
            expect(graphqlMovie.directors).toContainEqual(directorLily);

            expect(graphqlMovie.peopleConnection.totalCount).toBe(4);
            expect(graphqlMovie.peopleConnection.edges).toContainEqual({
                _type: "DIRECTED",
                node: { __typename: "Director", ...directorLana },
            });
            expect(graphqlMovie.peopleConnection.edges).toContainEqual({
                _type: "DIRECTED",
                node: { __typename: "Director", ...directorLily },
            });
            expect(graphqlMovie.peopleConnection.edges).toContainEqual({
                _type: "ACTED_IN",
                node: { __typename: "Actor", ...actorReeves },
            });
            expect(graphqlMovie.peopleConnection.edges).toContainEqual({
                _type: "ACTED_IN",
                node: { __typename: "Actor", ...actorMoss },
            });
        });

        test("should throw error when attempting to create union relationship without edge._type defined", async () => {
            const mutation = gql`
                mutation {
                    createMovies(
                        input: {
                            id: "movieid"
                            title: "movieTitle"
                            people: { Director: { create: [{ node: { id: "directorid", name: "directorname" } }] } }
                        }
                    ) {
                        movies {
                            title
                            actors {
                                id
                                name
                            }
                            directors {
                                id
                                name
                            }
                            peopleConnection {
                                totalCount
                                edges {
                                    _type
                                    node {
                                        __typename
                                        ... on Director {
                                            id
                                            name
                                        }
                                        ... on Actor {
                                            id
                                            name
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            `;

            // GraphQL

            const graphqlResult = await graphql({
                schema,
                source: mutation.loc!.source,
                contextValue: { driver },
            });
            expect(graphqlResult.errors).toBeDefined();
        });
    });
});
