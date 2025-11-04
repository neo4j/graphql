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
import type { UniqueType } from "../utils/graphql-types";
import { TestHelper } from "../utils/tests-helper";

describe("update", () => {
    const testHelper = new TestHelper();
    let Movie: UniqueType;
    let Actor: UniqueType;
    let Person: UniqueType;
    let Product: UniqueType;
    let Photo: UniqueType;
    let Color: UniqueType;
    let Series: UniqueType;

    beforeEach(() => {
        Movie = testHelper.createUniqueType("Movie");
        Actor = testHelper.createUniqueType("Actor");
        Person = testHelper.createUniqueType("Person");
        Product = testHelper.createUniqueType("Product");
        Photo = testHelper.createUniqueType("Photo");
        Color = testHelper.createUniqueType("Color");
        Series = testHelper.createUniqueType("Series");
    });

    afterEach(async () => {
        await testHelper.close();
    });

    test("should update no movies where predicate yields false", async () => {
        const typeDefs = `
            type ${Movie} {
                id: ID!
                name: String
            }
        `;

        await testHelper.initNeo4jGraphQL({ typeDefs });

        const id = generate({
            charset: "alphabetic",
        });

        const updatedName = generate({
            charset: "alphabetic",
        });

        const query = `
        mutation($id: ID, $name: String) {
            ${Movie.operations.update}(where: { id: $id }, update: {name: $name}) {
                ${Movie.plural} {
                    id
                    name
                }
            }
          }
        `;

        const gqlResult = await testHelper.executeGraphQL(query, {
            variableValues: { id, name: updatedName },
        });

        expect(gqlResult.errors).toBeFalsy();

        expect(gqlResult?.data?.[Movie.operations.update]).toEqual({ [Movie.plural]: [] });
    });

    test("should update a single movie", async () => {
        const typeDefs = `
            type ${Movie} {
                id: ID!
                name: String
            }
        `;

        await testHelper.initNeo4jGraphQL({ typeDefs });

        const id = generate({
            charset: "alphabetic",
        });

        const initialName = generate({
            charset: "alphabetic",
        });

        const updatedName = generate({
            charset: "alphabetic",
        });

        const query = `
        mutation($id: ID, $name: String) {
            ${Movie.operations.update}(where: { id: $id }, update: {name: $name}) {
                ${Movie.plural} {
                    id
                    name
                }
            }
          }
        `;

        await testHelper.executeCypher(
            `
                CREATE (:${Movie} {id: $id, name: $initialName})
            `,
            {
                id,
                initialName,
            }
        );

        const gqlResult = await testHelper.executeGraphQL(query, {
            variableValues: { id, name: updatedName },
        });

        expect(gqlResult.errors).toBeFalsy();

        expect(gqlResult?.data?.[Movie.operations.update]).toEqual({ [Movie.plural]: [{ id, name: updatedName }] });
    });
    test("should connect through interface relationship", async () => {
        const typeDefs = gql`
            type ${Movie} implements Production @subscription(events: []) {
                title: String!
                id: ID @unique
                director: [Creature!]! @relationship(type: "DIRECTED", direction: IN)
            }

            type ${Series} implements Production {
                title: String!
                episode: Int!
                id: ID @unique
                director: [Creature!]! @relationship(type: "DIRECTED", direction: IN)
            }

            interface Production {
                id: ID
                director: [Creature!]! @declareRelationship
            }

            type ${Person} implements Creature {
                id: ID
                movies: Production! @relationship(type: "DIRECTED", direction: OUT)
            }

            interface Creature {
                id: ID
                movies: Production! @declareRelationship
            }
        `;

        await testHelper.initNeo4jGraphQL({
            typeDefs,
            features: {
                subscriptions: true,
            },
        });
        const query = `
        mutation {
            ${Movie.operations.update}(
                where: { id: "1" }, 
                connect: { director: { 
                    where: { node: {id: "2"} }, 
                    connect: { movies: {
                        where: { node: {id: "3"} }, 
                        connect: { director: {
                            where: { node: {id: "4"} }, 
                            connect: { movies: {
                                where: { node: { id: "5" } }
                            } }
                        } }
                    } } 
                } }) {
                ${Movie.plural} {
                    id
                    title
                }
            }
          }
        `;

        await testHelper.executeCypher(
            `
                CREATE (:${Movie} {id: "1", title: "Movie1"})
                CREATE (:${Movie} {id: "3", title: "Movie3"})
                CREATE (:${Movie} {id: "5", title: "Movie5"})
                CREATE (p1:${Person} {id: "2"})
                CREATE (p2:${Person} {id: "4"})
                CREATE (s:${Series} {id: "10", title: "Series1", episode: 20})
                MERGE (p1)-[:DIRECTED]->(s)
                MERGE (p2)-[:DIRECTED]->(s)
            `
        );

        const gqlResult = await testHelper.executeGraphQL(query);

        expect(gqlResult.errors).toBeFalsy();

        const cypherResult = await testHelper.executeCypher(
            `
                    MATCH (p:${Person} {id: "4"})-[:DIRECTED]->(m:${Movie} {id: "5"}) RETURN p, m
                `
        );

        expect(cypherResult.records).toHaveLength(1);

        expect(gqlResult?.data?.[Movie.operations.update]).toEqual({
            [Movie.plural]: [{ id: "1", title: "Movie1" }],
        });
    });

    test("should update a movie when matching on relationship property", async () => {
        const typeDefs = `
            type ${Actor} {
                name: String
                movies: [${Movie}!]! @relationship(type: "ACTED_IN", direction: OUT)
            }

            type ${Movie} {
                id: ID
                actors: [${Actor}!]! @relationship(type: "ACTED_IN", direction: IN)
            }
        `;

        await testHelper.initNeo4jGraphQL({ typeDefs });

        const initialMovieId = generate({
            charset: "alphabetic",
        });

        const updatedMovieId = generate({
            charset: "alphabetic",
        });

        const actorName = generate({
            charset: "alphabetic",
        });

        const query = `
        mutation($updatedMovieId: ID, $actorName: String) {
            ${Movie.operations.update}(
              where: { actorsConnection: { node: { name: $actorName } } },
              update: {
                id: $updatedMovieId
              }
          ) {
              ${Movie.plural} {
                id
                actors {
                    name
                }
              }
            }
          }
        `;

        await testHelper.executeCypher(
            `
                CREATE (m:${Movie} {id: $initialMovieId})<-[:ACTED_IN]-(a:${Actor} {name: $actorName})
            `,
            {
                initialMovieId,
                actorName,
            }
        );

        const gqlResult = await testHelper.executeGraphQL(query, {
            variableValues: { updatedMovieId, actorName },
        });

        expect(gqlResult.errors).toBeFalsy();

        expect(gqlResult?.data?.[Movie.operations.update]).toEqual({
            [Movie.plural]: [{ id: updatedMovieId, actors: [{ name: actorName }] }],
        });
    });

    test("should update 2 movies", async () => {
        const typeDefs = `
            type ${Movie} {
                id: ID!
                name: String
            }
        `;

        await testHelper.initNeo4jGraphQL({ typeDefs });

        const id1 = generate({
            charset: "alphabetic",
        });

        const id2 = generate({
            charset: "alphabetic",
        });

        const updatedName = "Beer";

        const query = `
        mutation($id1: ID, $id2: ID, $name: String) {
            ${Movie.operations.update}(where: { OR: [{id: $id1}, {id: $id2}] }, update: {name: $name}) {
                ${Movie.plural} {
                    id
                    name
                }
            }
          }
        `;

        await testHelper.executeCypher(
            `
                CREATE (:${Movie} {id: $id1})
                CREATE (:${Movie} {id: $id2})
            `,
            {
                id1,
                id2,
            }
        );

        const gqlResult = await testHelper.executeGraphQL(query, {
            variableValues: { id1, id2, name: updatedName },
        });

        expect(gqlResult.errors).toBeFalsy();

        expect((gqlResult?.data as any)?.[Movie.operations.update][Movie.plural] as any[]).toHaveLength(2);

        ((gqlResult?.data as any)?.[Movie.operations.update][Movie.plural] as any[]).forEach((movie) => {
            expect([id1, id2]).toContain(movie.id);
            expect(movie.name).toEqual(updatedName);
        });
    });

    test("should update nested actors from a movie", async () => {
        const typeDefs = `
            type ${Actor} {
                name: String
                movies: [${Movie}!]! @relationship(type: "ACTED_IN", direction: OUT)
            }

            type ${Movie} {
                id: ID
                actors: [${Actor}!]! @relationship(type: "ACTED_IN", direction: IN)
            }
        `;

        await testHelper.initNeo4jGraphQL({ typeDefs });

        const movieId = generate({
            charset: "alphabetic",
        });

        const initialName = generate({
            charset: "alphabetic",
        });

        const updatedName = generate({
            charset: "alphabetic",
        });

        const query = `
        mutation($movieId: ID, $initialName: String, $updatedName: String) {
            ${Movie.operations.update}(
              where: { id: $movieId },
              update: {
                actors: [{
                  where: { node: { name: $initialName } },
                  update: { node: { name: $updatedName } }
                }]
              }
          ) {
              ${Movie.plural} {
                id
                actors {
                    name
                }
              }
            }
          }
        `;

        await testHelper.executeCypher(
            `
                CREATE (m:${Movie} {id: $movieId})
                CREATE (a:${Actor} {name: $initialName})
                MERGE (a)-[:ACTED_IN]->(m)
            `,
            {
                movieId,
                initialName,
            }
        );

        const gqlResult = await testHelper.executeGraphQL(query, {
            variableValues: { movieId, updatedName, initialName },
        });

        expect(gqlResult.errors).toBeFalsy();

        expect(gqlResult?.data?.[Movie.operations.update]).toEqual({
            [Movie.plural]: [{ id: movieId, actors: [{ name: updatedName }] }],
        });
    });

    test("should delete a nested actor from a movie abc", async () => {
        const typeDefs = gql`
            type ${Actor} {
                name: String
                movies: [${Movie}!]! @relationship(type: "ACTED_IN", direction: OUT)
            }

            type ${Movie} {
                id: ID
                actors: [${Actor}!]! @relationship(type: "ACTED_IN", direction: IN)
            }
        `;

        await testHelper.initNeo4jGraphQL({ typeDefs });

        const id = generate({
            charset: "alphabetic",
        });

        const actorName1 = generate({
            charset: "alphabetic",
        });
        const actorName2 = generate({
            charset: "alphabetic",
        });

        const mutation = `
            mutation($id: ID, $actorName1: String) {
                ${Movie.operations.update}(where: { id: $id }, delete: { actors: { where: { node: { name: $actorName1 } } } }) {
                    ${Movie.plural} {
                        id
                        actors {
                            name
                        }
                    }
                }
            }
        `;

        await testHelper.executeCypher(
            `
                CREATE (m:${Movie} {id: $id})
                CREATE (a1:${Actor} {name: $actorName1})
                CREATE (a2:${Actor} {name: $actorName2})
                MERGE (a1)-[:ACTED_IN]->(m)
                MERGE (a2)-[:ACTED_IN]->(m)
            `,
            {
                id,
                actorName1,
                actorName2,
            }
        );

        const gqlResult = await testHelper.executeGraphQL(mutation, {
            variableValues: { id, actorName1 },
        });

        expect(gqlResult.errors).toBeFalsy();

        expect(gqlResult?.data?.[Movie.operations.update]).toEqual({
            [Movie.plural]: [{ id, actors: [{ name: actorName2 }] }],
        });
    });

    test("should delete a nested actor from a movie within an update block", async () => {
        const typeDefs = gql`
            type ${Actor} {
                name: String
                movies: [${Movie}!]! @relationship(type: "ACTED_IN", direction: OUT)
            }

            type ${Movie} {
                id: ID
                actors: [${Actor}!]! @relationship(type: "ACTED_IN", direction: IN)
            }
        `;

        await testHelper.initNeo4jGraphQL({ typeDefs });

        const id = generate({
            charset: "alphabetic",
        });

        const actorName1 = generate({
            charset: "alphabetic",
        });
        const actorName2 = generate({
            charset: "alphabetic",
        });

        const mutation = `
            mutation($id: ID, $actorName1: String) {
                ${Movie.operations.update}(where: { id: $id }, update: { actors: { delete: { where: { node: { name: $actorName1 } } } } }) {
                    ${Movie.plural} {
                        id
                        actors {
                            name
                        }
                    }
                }
            }
        `;

        await testHelper.executeCypher(
            `
                CREATE (m:${Movie} {id: $id})
                CREATE (a1:${Actor} {name: $actorName1})
                CREATE (a2:${Actor} {name: $actorName2})
                MERGE (a1)-[:ACTED_IN]->(m)
                MERGE (a2)-[:ACTED_IN]->(m)
            `,
            {
                id,
                actorName1,
                actorName2,
            }
        );

        const gqlResult = await testHelper.executeGraphQL(mutation, {
            variableValues: { id, actorName1 },
        });

        expect(gqlResult.errors).toBeFalsy();

        expect(gqlResult?.data?.[Movie.operations.update]).toEqual({
            [Movie.plural]: [{ id, actors: [{ name: actorName2 }] }],
        });
    });

    test("should delete a nested actor and one of their nested movies, within an update block abc", async () => {
        const typeDefs = gql`
            type ${Actor} {
                name: String
                movies: [${Movie}!]! @relationship(type: "ACTED_IN", direction: OUT)
            }

            type ${Movie} {
                id: ID
                actors: [${Actor}!]! @relationship(type: "ACTED_IN", direction: IN)
            }
        `;

        await testHelper.initNeo4jGraphQL({ typeDefs });

        const movieId1 = generate({
            charset: "alphabetic",
        });

        const movieId2 = generate({
            charset: "alphabetic",
        });

        const actorName1 = generate({
            charset: "alphabetic",
        });

        const actorName2 = generate({
            charset: "alphabetic",
        });

        const mutation = `
            mutation($movieId1: ID, $actorName1: String, $movieId2: ID) {
                ${Movie.operations.update}(
                    where: { id: $movieId1 }
                    update: {
                        actors: { delete: { where: { node: { name: $actorName1 } }, delete: { movies: { where: { node: { id: $movieId2 } } } } } }
                    }
                ) {
                    ${Movie.plural} {
                        id
                        actors {
                            name
                        }
                    }
                }
            }
        `;

        await testHelper.executeCypher(
            `
                CREATE (m1:${Movie} {id: $movieId1})
                CREATE (m2:${Movie} {id: $movieId2})

                CREATE (a1:${Actor} {name: $actorName1})
                CREATE (a2:${Actor} {name: $actorName2})

                MERGE (a1)-[:ACTED_IN]->(m1)
                MERGE (a1)-[:ACTED_IN]->(m2)

                MERGE (a2)-[:ACTED_IN]->(m1)
                MERGE (a2)-[:ACTED_IN]->(m2)
            `,
            {
                movieId1,
                actorName1,
                actorName2,
                movieId2,
            }
        );

        const gqlResult = await testHelper.executeGraphQL(mutation, {
            variableValues: { movieId1, actorName1, movieId2 },
        });

        expect(gqlResult.errors).toBeFalsy();

        expect(gqlResult?.data?.[Movie.operations.update]).toEqual({
            [Movie.plural]: [{ id: movieId1, actors: [{ name: actorName2 }] }],
        });

        const movie2 = await testHelper.executeCypher(
            `
              MATCH (m:${Movie} {id: $id})
              RETURN m
            `,
            { id: movieId2 }
        );

        expect(movie2.records).toHaveLength(0);
    });

    test("should delete multiple nested actors from a movie", async () => {
        const typeDefs = gql`
            type ${Actor} {
                name: String
                movies: [${Movie}!]! @relationship(type: "ACTED_IN", direction: OUT)
            }

            type ${Movie} {
                id: ID
                actors: [${Actor}!]! @relationship(type: "ACTED_IN", direction: IN)
            }
        `;

        await testHelper.initNeo4jGraphQL({ typeDefs });

        const id = generate({
            charset: "alphabetic",
        });

        const name1 = generate({
            charset: "alphabetic",
        });

        const name2 = generate({
            charset: "alphabetic",
        });

        const name3 = generate({
            charset: "alphabetic",
        });

        const mutation = `
            mutation($id: ID, $name1: String, $name3: String) {
                ${Movie.operations.update}(
                    where: { id: $id }
                    delete: { actors: [{ where: { node: { name: $name1 } } }, { where: { node: { name: $name3 } } }] }
                ) {
                    ${Movie.plural} {
                        id
                        actors {
                            name
                        }
                    }
                }
            }
        `;

        await testHelper.executeCypher(
            `
                CREATE (m:${Movie} {id: $id})
                CREATE (a1:${Actor} {name: $name1})
                CREATE (a2:${Actor} {name: $name2})
                CREATE (a3:${Actor} {name: $name3})
                MERGE (a1)-[:ACTED_IN]->(m)
                MERGE (a2)-[:ACTED_IN]->(m)
                MERGE (a3)-[:ACTED_IN]->(m)
            `,
            {
                id,
                name1,
                name2,
                name3,
            }
        );

        const gqlResult = await testHelper.executeGraphQL(mutation, {
            variableValues: { id, name1, name3 },
        });

        expect(gqlResult.errors).toBeFalsy();

        expect(gqlResult?.data?.[Movie.operations.update]).toEqual({
            [Movie.plural]: [{ id, actors: [{ name: name2 }] }],
        });
    });

    test("should update nested actors from a move then update the movie from the nested actors", async () => {
        const typeDefs = `
            type ${Actor} {
              name: String
              movies: [${Movie}!]! @relationship(type: "ACTED_IN", direction: OUT)
            }

            type ${Movie} {
              id: ID
              title: String
              actors: [${Actor}!]! @relationship(type: "ACTED_IN", direction: IN)
            }
        `;

        await testHelper.initNeo4jGraphQL({ typeDefs });

        const movieId = generate({
            charset: "alphabetic",
        });

        const query = `
        mutation {
            ${Movie.operations.update}(
              where: { id: "${movieId}" }
              update: {
                actors: [{
                  where: { node: { name: "old actor name" } }
                  update: {
                    node: {
                        name: "new actor name"
                        movies: [{
                            where: { node: { title: "old movie title" } }
                            update: { node: { title: "new movie title" } }
                        }]
                    }
                  }
                }]
              }
            ) {
                ${Movie.plural} {
                    id
                    title
                    actors {
                        name
                    }
                }
            }
          }
        `;

        await testHelper.executeCypher(
            `
            CREATE (:${Movie} {id: $movieId, title: "old movie title"})<-[:ACTED_IN]-(:${Actor} {name: "old actor name"})
        `,
            {
                movieId,
            }
        );

        const gqlResult = await testHelper.executeGraphQL(query);

        expect(gqlResult.errors).toBeFalsy();

        expect(gqlResult?.data?.[Movie.operations.update]).toEqual({
            [Movie.plural]: [{ id: movieId, title: "new movie title", actors: [{ name: "new actor name" }] }],
        });
    });

    test("should connect a single movie to a actor", async () => {
        const typeDefs = `
            type ${Actor} {
                id: ID
                movies: [${Movie}!]! @relationship(type: "ACTED_IN", direction: OUT)
            }

            type ${Movie} {
                id: ID
                actors: [${Actor}!]! @relationship(type: "ACTED_IN", direction: IN)
            }
        `;

        await testHelper.initNeo4jGraphQL({ typeDefs });

        const movieId = generate({
            charset: "alphabetic",
        });

        const actorId = generate({
            charset: "alphabetic",
        });

        const query = `
        mutation {
            ${Movie.operations.update}(where: { id: "${movieId}" }, connect: {actors: [{where: {node:{id: "${actorId}"}}}]}) {
                ${Movie.plural} {
                    id
                    actors {
                        id
                    }
                }
            }
          }
        `;

        await testHelper.executeCypher(
            `
                CREATE (:${Movie} {id: $movieId})
                CREATE (:${Actor} {id: $actorId})
            `,
            {
                movieId,
                actorId,
            }
        );

        const gqlResult = await testHelper.executeGraphQL(query);

        expect(gqlResult.errors).toBeFalsy();

        expect(gqlResult?.data?.[Movie.operations.update]).toEqual({
            [Movie.plural]: [{ id: movieId, actors: [{ id: actorId }] }],
        });
    });

    test("should connect a single movie to a actor based on a connection predicate", async () => {
        const typeDefs = `
            type ${Actor} {
                id: ID
                movies: [${Movie}!]! @relationship(type: "ACTED_IN", direction: OUT)
                series: [${Series}!]! @relationship(type: "ACTED_IN", direction: OUT)
            }

            type ${Movie} {
                id: ID
                actors: [${Actor}!]! @relationship(type: "ACTED_IN", direction: IN)
            }

            type ${Series} {
                id: ID
                actors: [${Actor}!]! @relationship(type: "ACTED_IN", direction: IN)
            }
        `;

        await testHelper.initNeo4jGraphQL({ typeDefs });

        const movieId = generate({
            charset: "alphabetic",
        });

        const actorId = generate({
            charset: "alphabetic",
        });

        const seriesId = generate({
            charset: "alphabetic",
        });

        const query = `
            mutation($movieId: ID, $seriesId: ID) {
                ${Movie.operations.update}(
                    where: { id: $movieId }
                    connect: { actors: [{ where: { node: { seriesConnection: { node: { id: $seriesId } } } } }] }
                ) {
                    ${Movie.plural} {
                        id
                        actors {
                            id
                        }
                    }
                }
            }
        `;

        await testHelper.executeCypher(
            `
                CREATE (:${Movie} {id: $movieId})
                CREATE (:${Actor} {id: $actorId})-[:ACTED_IN]->(:${Series} {id: $seriesId})
            `,
            {
                movieId,
                actorId,
                seriesId,
            }
        );

        const gqlResult = await testHelper.executeGraphQL(query, {
            variableValues: { movieId, seriesId },
        });

        expect(gqlResult.errors).toBeFalsy();

        expect(gqlResult?.data?.[Movie.operations.update]).toEqual({
            [Movie.plural]: [{ id: movieId, actors: [{ id: actorId }] }],
        });
    });

    test("should disconnect an actor from a movie", async () => {
        const typeDefs = `
            type ${Actor} {
                id: ID
                movies: [${Movie}!]! @relationship(type: "ACTED_IN", direction: OUT)
            }

            type ${Movie} {
                id: ID
                actors: [${Actor}!]! @relationship(type: "ACTED_IN", direction: IN)
            }
        `;

        await testHelper.initNeo4jGraphQL({ typeDefs });

        const movieId = generate({
            charset: "alphabetic",
        });

        const actorId1 = generate({
            charset: "alphabetic",
        });
        const actorId2 = generate({
            charset: "alphabetic",
        });

        const query = `
        mutation {
            ${Movie.operations.update}(where: { id: "${movieId}" }, disconnect: {actors: [{where: { node: { id: "${actorId1}"}}}]}) {
                ${Movie.plural} {
                    id
                    actors {
                        id
                    }
                }
            }
          }
        `;

        await testHelper.executeCypher(
            `
                CREATE (m:${Movie} {id: $movieId})
                CREATE (a1:${Actor} {id: $actorId1})
                CREATE (a2:${Actor} {id: $actorId2})
                MERGE (m)<-[:ACTED_IN]-(a1)
                MERGE (m)<-[:ACTED_IN]-(a2)
            `,
            {
                movieId,
                actorId1,
                actorId2,
            }
        );

        const gqlResult = await testHelper.executeGraphQL(query);

        expect(gqlResult.errors).toBeFalsy();

        expect(gqlResult?.data?.[Movie.operations.update]).toEqual({
            [Movie.plural]: [{ id: movieId, actors: [{ id: actorId2 }] }],
        });
    });

    test("should disconnect a color from a photo through a product", async () => {
        const typeDefs = `
            type ${Product} {
                id: ID
                photos: [${Photo}!]! @relationship(type: "HAS_PHOTO", direction: OUT)
            }

            type ${Color} {
                id: ID
            }

            type ${Photo} {
                id: ID
                color: ${Color} @relationship(type: "OF_COLOR", direction: OUT)
            }
        `;

        await testHelper.initNeo4jGraphQL({ typeDefs });

        const productId = generate({
            charset: "alphabetic",
        });

        const photoId = generate({
            charset: "alphabetic",
        });

        const colorId = generate({
            charset: "alphabetic",
        });

        const query = `
        mutation {
            ${Product.operations.update}(
              where: { id: "${productId}" }
              update: {
                photos: [{
                  where: { node: { id: "${photoId}" } }
                  update: {
                      node: {
                        color: { disconnect: { where: { node: { id: "${colorId}" } } } }
                      }
                  }
                }]
              }
            ){
                ${Product.plural} {
                    id
                    photos {
                        id
                        color {
                            id
                        }
                    }
                }
            }
          }
        `;

        await testHelper.executeCypher(
            `
                CREATE (p:${Product} {id: $productId})
                CREATE (photo:${Photo} {id: $photoId})
                CREATE (color:${Color} {id: $colorId})
                MERGE (p)-[:HAS_PHOTO]->(photo)-[:OF_COLOR]->(color)

            `,
            {
                productId,
                photoId,
                colorId,
            }
        );

        const gqlResult = await testHelper.executeGraphQL(query);

        expect(gqlResult.errors).toBeFalsy();

        expect(gqlResult?.data?.[Product.operations.update]).toEqual({
            [Product.plural]: [{ id: productId, photos: [{ id: photoId, color: null }] }],
        });
    });

    test("should update the colors of a product to light versions", async () => {
        const typeDefs = `
          type ${Product} {
             id: ID
             name: String
             photos: [${Photo}!]! @relationship(type: "HAS_PHOTO", direction: OUT)
           }


           type ${Color} {
             name: String
             id: ID
           }

           type ${Photo} {
             id: ID
             name: String
             color: ${Color}! @relationship(type: "OF_COLOR", direction: OUT)
           }
        `;

        await testHelper.initNeo4jGraphQL({ typeDefs });

        const productId = generate({
            charset: "alphabetic",
        });

        const photo0Id = generate({
            charset: "alphabetic",
        });

        const photo0Color0Id = generate({
            charset: "alphabetic",
        });

        const photo0Color1Id = generate({
            charset: "alphabetic",
        });

        const photo1Id = generate({
            charset: "alphabetic",
        });

        const photo1Color0Id = generate({
            charset: "alphabetic",
        });

        const photo1Color1Id = generate({
            charset: "alphabetic",
        });

        const query = `
            mutation {
                ${Product.operations.update}(
                  where: { id: "${productId}" }
                  update: {
                    photos: [
                      {
                        where: { node: { name: "Green Photo", id: "${photo0Id}" } }
                        update: {
                            node: {
                                name: "Light Green Photo"
                                color: {
                                    connect: { where: { node: { name: "Light Green", id: "${photo0Color1Id}" } } }
                                    disconnect: { where: { node: { name: "Green", id: "${photo0Color0Id}" } } }
                                }
                            }
                        }
                      }
                      {
                        where: { node: { name: "Yellow Photo", id: "${photo1Id}" } }
                        update: {
                            node: {
                                name: "Light Yellow Photo"
                                color: {
                                    connect: { where: { node: { name: "Light Yellow", id: "${photo1Color1Id}" } } }
                                    disconnect: { where: { node: { name: "Yellow", id: "${photo1Color0Id}" } } }
                                }
                            }
                        }
                      }
                    ]
                  }
                ) {
                    ${Product.plural} {
                        id
                        photos {
                            id
                            name
                            color {
                            id
                            name
                            }
                        }
                    }
                }
              }
        `;

        await testHelper.executeCypher(
            `
                    CREATE (product:${Product} {name: "Pringles", id: $productId})
                    CREATE (photo0:${Photo} {id: $photo0Id, name: "Green Photo"})
                    CREATE (photo0_color0:${Color} {id: $photo0_color0Id, name: "Green"})
                    CREATE (photo0_color1:${Color} {id: $photo0_color1Id, name: "Light Green"})
                    CREATE (photo1:${Photo} {id: $photo1Id, name: "Yellow Photo"})
                    CREATE (photo1_color0:${Color} {id: $photo1_color0Id, name: "Yellow"})
                    CREATE (photo1_color1:${Color} {id: $photo1_color1Id, name: "Light Yellow"})
                    MERGE (product)-[:HAS_PHOTO]->(photo0)
                    MERGE (photo0)-[:OF_COLOR]->(photo0_color0)
                    MERGE (product)-[:HAS_PHOTO]->(photo1)
                    MERGE (photo1)-[:OF_COLOR]->(photo1_color0)


            `,
            {
                productId,
                photo0Id,
                photo0_color0Id: photo0Color0Id,
                photo0_color1Id: photo0Color1Id,
                photo1Id,
                photo1_color0Id: photo1Color0Id,
                photo1_color1Id: photo1Color1Id,
            }
        );

        const gqlResult = await testHelper.executeGraphQL(query);

        expect(gqlResult.errors).toBeFalsy();

        expect((gqlResult?.data as any)?.[Product.operations.update][Product.plural] as any[]).toHaveLength(1);

        const { photos } = ((gqlResult?.data as any)?.[Product.operations.update][Product.plural] as any[])[0];

        const greenPhoto = photos.find((x) => x.id === photo0Id);

        expect(greenPhoto).toMatchObject({
            id: photo0Id,
            name: "Light Green Photo",
            color: { id: photo0Color1Id, name: "Light Green" },
        });

        const yellowPhoto = photos.find((x) => x.id === photo1Id);

        expect(yellowPhoto).toMatchObject({
            id: photo1Id,
            name: "Light Yellow Photo",
            color: { id: photo1Color1Id, name: "Light Yellow" },
        });
    });

    test("should update a Product via creating a new Photo and creating a new Color (via field level update)", async () => {
        const typeDefs = `
          type ${Product} {
             id: ID
             name: String
             photos: [${Photo}!]! @relationship(type: "HAS_PHOTO", direction: OUT)
           }


           type ${Color} {
             name: String
             id: ID
           }

           type ${Photo} {
             id: ID
             name: String
             color: ${Color}! @relationship(type: "OF_COLOR", direction: OUT)
           }
        `;

        await testHelper.initNeo4jGraphQL({ typeDefs });

        const productId = generate({
            charset: "alphabetic",
        });

        const photoId = generate({
            charset: "alphabetic",
        });

        const colorId = generate({
            charset: "alphabetic",
        });

        const query = `
            mutation {
                ${Product.operations.update}(
                  where: { id: "${productId}" }
                  update: {
                      photos: [{
                          create: [{
                            node: {
                                id: "${photoId}",
                                name: "Green Photo",
                                color: {
                                    create: {
                                        node: {
                                            id: "${colorId}",
                                            name: "Green"
                                        }
                                    }
                                }
                            }
                         }]
                      }]
                  }
                ) {
                    ${Product.plural} {
                        id
                        photos {
                          id
                          name
                          color {
                            id
                            name
                          }
                        }
                    }
                }
              }
        `;

        await testHelper.executeCypher(
            `
                    CREATE (product:${Product} {name: "Pringles", id: $productId})
            `,
            {
                productId,
            }
        );

        const gqlResult = await testHelper.executeGraphQL(query);

        expect(gqlResult.errors).toBeFalsy();

        expect(((gqlResult?.data as any)?.[Product.operations.update][Product.plural] as any[])[0]).toMatchObject({
            id: productId,
            photos: [{ id: photoId, name: "Green Photo", color: { id: colorId, name: "Green" } }],
        });
    });

    test("should update a Product via creating a new Photo and creating a new Color (via top level create)", async () => {
        const typeDefs = `
          type ${Product} {
             id: ID
             name: String
             photos: [${Photo}!]! @relationship(type: "HAS_PHOTO", direction: OUT)
           }


           type ${Color} {
             name: String
             id: ID
           }

           type ${Photo} {
             id: ID
             name: String
             color: ${Color}! @relationship(type: "OF_COLOR", direction: OUT)
           }
        `;

        await testHelper.initNeo4jGraphQL({ typeDefs });

        const productId = generate({
            charset: "alphabetic",
        });

        const photoId = generate({
            charset: "alphabetic",
        });

        const colorId = generate({
            charset: "alphabetic",
        });

        const query = `
            mutation {
                ${Product.operations.update}(
                  where: { id: "${productId}" }
                  create: {
                    photos: [{
                      node: {
                        id: "${photoId}",
                        name: "Green Photo",
                        color: {
                            create: {
                              node: {
                                id: "${colorId}",
                                name: "Green"
                              }
                            }
                        }
                      }
                    }]
                  }
                ) {
                    ${Product.plural} {
                        id
                        photos {
                            id
                            name
                            color {
                                id
                                name
                            }
                        }
                    }
                }
              }
        `;

        await testHelper.executeCypher(
            `
                    CREATE (product:${Product} {name: "Pringles", id: $productId})
            `,
            {
                productId,
            }
        );

        const gqlResult = await testHelper.executeGraphQL(query);

        expect(gqlResult.errors).toBeFalsy();

        expect(((gqlResult?.data as any)?.[Product.operations.update][Product.plural] as any[])[0]).toMatchObject({
            id: productId,
            photos: [{ id: photoId, name: "Green Photo", color: { id: colorId, name: "Green" } }],
        });
    });
});
