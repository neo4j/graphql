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

import { generate } from "randomstring";
import type { UniqueType } from "../utils/graphql-types";
import { TestHelper } from "../utils/tests-helper";

describe("find", () => {
    const testHelper = new TestHelper();
    let Movie: UniqueType;
    let Actor: UniqueType;
    let User: UniqueType;

    beforeEach(() => {
        Movie = testHelper.createUniqueType("Movie");
        Actor = testHelper.createUniqueType("Actor");
        User = testHelper.createUniqueType("User");
    });

    afterEach(async () => {
        await testHelper.close();
    });

    test("should find Movie by id", async () => {
        const typeDefs = `
            type ${Actor} {
                name: String
                movies: [${Movie}!]! @relationship(type: "ACTED_IN", direction: IN)
            }

            type ${Movie} {
                id: ID!
                title: String!
                actors: [${Actor}!]! @relationship(type: "ACTED_IN", direction: OUT)
            }
        `;

        const neoSchema = await testHelper.initNeo4jGraphQL({ typeDefs });

        const id = generate({
            charset: "alphabetic",
        });

        const query = `
            query($id: ID){
                ${Movie.plural}(where: {id: $id}){
                    id
                }
            }
        `;

        await neoSchema.checkNeo4jCompat();

        await testHelper.executeCypher(`CREATE (:${Movie} {id: $id}), (:${Movie} {id: $id}), (:${Movie} {id: $id})`, {
            id,
        });

        const result = await testHelper.executeGraphQL(query, {
            variableValues: { id },
        });

        expect(result.errors).toBeFalsy();

        expect(result?.data?.[Movie.plural]).toEqual([{ id }, { id }, { id }]);
    });

    test("should find Move by id and limit", async () => {
        const typeDefs = `
            type ${Actor} {
                name: String
                movies: [${Movie}!]! @relationship(type: "ACTED_IN", direction: IN)
            }

            type ${Movie} {
                id: ID!
                title: String!
                actors: [${Actor}!]! @relationship(type: "ACTED_IN", direction: OUT)
            }
        `;

        await testHelper.initNeo4jGraphQL({ typeDefs });

        const id = generate({
            charset: "alphabetic",
        });

        const query = `
            query($id: ID){
                ${Movie.plural}(where: {id: $id}, options: {limit: 2}){
                    id
                }
            }
        `;

        await testHelper.executeCypher(
            `
              CREATE (:${Movie} {id: $id}), (:${Movie} {id: $id}), (:${Movie} {id: $id})
            `,
            { id }
        );

        const result = await testHelper.executeGraphQL(query, {
            variableValues: { id },
        });

        expect(result.errors).toBeFalsy();

        expect(result?.data?.[Movie.plural]).toEqual([{ id }, { id }]);
    });

    test("should find Movie IN ids", async () => {
        const typeDefs = `
            type ${Actor} {
                name: String
                movies: [${Movie}!]! @relationship(type: "ACTED_IN", direction: IN)
            }

            type ${Movie} {
                id: ID!
                title: String!
                actors: [${Actor}!]! @relationship(type: "ACTED_IN", direction: OUT)
            }
        `;

        const id1 = generate({
            charset: "alphabetic",
        });
        const id2 = generate({
            charset: "alphabetic",
        });
        const id3 = generate({
            charset: "alphabetic",
        });

        await testHelper.initNeo4jGraphQL({ typeDefs });

        const query = `
            query($ids: [ID!]){
                ${Movie.plural}(where: {id_IN: $ids}){
                    id
                }
            }
        `;

        await testHelper.executeCypher(
            `
              CREATE (:${Movie} {id: $id1}), (:${Movie} {id: $id2}), (:${Movie} {id: $id3})
            `,
            { id1, id2, id3 }
        );

        const result = await testHelper.executeGraphQL(query, {
            variableValues: { ids: [id1, id2, id3] },
        });

        expect(result.errors).toBeFalsy();

        (result?.data as any)?.[Movie.plural].forEach((e: { id: string }) => {
            expect([id1, id2, id3].includes(e.id)).toBeTruthy();
        });
    });

    test("should find Movie IN ids with one other param", async () => {
        const typeDefs = `
            type ${Actor} {
                name: String
                movies: [${Movie}!]! @relationship(type: "ACTED_IN", direction: IN)
            }

            type ${Movie} {
                id: ID!
                title: String!
                actors: [${Actor}!]! @relationship(type: "ACTED_IN", direction: OUT)
            }
        `;

        await testHelper.initNeo4jGraphQL({ typeDefs });

        const id1 = generate({
            charset: "alphabetic",
        });
        const id2 = generate({
            charset: "alphabetic",
        });
        const id3 = generate({
            charset: "alphabetic",
        });
        const title = generate({
            charset: "alphabetic",
        });

        const query = `
            query($ids: [ID!], $title: String){
                ${Movie.plural}(where: {id_IN: $ids, title: $title}){
                    id
                    title
                }
            }
        `;

        await testHelper.executeCypher(
            `
                CREATE (:${User} {id: $id1, title: $title}), (:${User} {id: $id2, title: $title}), (:${User} {id: $id3, title: $title})
                `,
            { id1, id2, id3, title }
        );

        const result = await testHelper.executeGraphQL(query, {
            variableValues: { ids: [id1, id2, id3], title },
        });

        expect(result.errors).toBeFalsy();

        (result?.data as any)?.[Movie.plural].forEach((e: { id: string; title: string }) => {
            expect([id1, id2, id3].includes(e.id)).toBeTruthy();
            expect(e.title).toEqual(title);
        });
    });

    test("should find Movie IN id and many Movie.actor IN id", async () => {
        const typeDefs = `
            type ${Actor} {
                id: ID!
                movies: [${Movie}!]! @relationship(type: "ACTED_IN", direction: IN)
            }

            type ${Movie} {
                id: ID!
                actors: [${Actor}!]! @relationship(type: "ACTED_IN", direction: OUT)
            }
        `;

        await testHelper.initNeo4jGraphQL({ typeDefs });

        const movieId1 = generate({
            charset: "alphabetic",
        });
        const movieId2 = generate({
            charset: "alphabetic",
        });
        const movieId3 = generate({
            charset: "alphabetic",
        });

        const actorId1 = generate({
            charset: "alphabetic",
        });
        const actorId2 = generate({
            charset: "alphabetic",
        });
        const actorId3 = generate({
            charset: "alphabetic",
        });

        const query = `
            query($movieIds: [ID!], $actorIds: [ID!]){
                ${Movie.plural}(where: {id_IN: $movieIds}){
                    id
                    actors(where: {id_IN: $actorIds}){
                        id
                        movies {
                            id
                            actors {
                                id
                            }
                        }
                    }
                }
            }
        `;

        await testHelper.executeCypher(
            `
                CREATE (:${Movie} {id: $movieId1})-[:ACTED_IN]->(:${Actor} {id: $actorId1}),
                       (:${Movie} {id: $movieId2})-[:ACTED_IN]->(:${Actor} {id: $actorId2}),
                       (:${Movie} {id: $movieId3})-[:ACTED_IN]->(:${Actor} {id: $actorId3})
                `,
            {
                movieId1,
                movieId2,
                movieId3,
                actorId1,
                actorId2,
                actorId3,
            }
        );

        const result = await testHelper.executeGraphQL(query, {
            variableValues: {
                movieIds: [movieId1, movieId2, movieId3],
                actorIds: [actorId1, actorId2, actorId3],
            },
        });

        expect(result.errors).toBeFalsy();

        (result?.data as any)?.[Movie.plural].forEach(
            (movie: { id: string; title: string; actors: { id: string }[] }) => {
                expect([movieId1, movieId2, movieId3].includes(movie.id)).toBeTruthy();

                let expected: any;

                switch (movie.id) {
                    case movieId1:
                        expected = [
                            {
                                id: actorId1,
                                movies: [
                                    {
                                        id: movieId1,
                                        actors: [{ id: actorId1 }],
                                    },
                                ],
                            },
                        ];
                        break;
                    case movieId2:
                        expected = [
                            {
                                id: actorId2,
                                movies: [
                                    {
                                        id: movieId2,
                                        actors: [{ id: actorId2 }],
                                    },
                                ],
                            },
                        ];
                        break;
                    case movieId3:
                        expected = [
                            {
                                id: actorId3,
                                movies: [
                                    {
                                        id: movieId3,
                                        actors: [{ id: actorId3 }],
                                    },
                                ],
                            },
                        ];
                        break;
                    default:
                        throw new Error("Fail");
                }

                expect(movie.actors).toEqual(expected);
            }
        );
    });

    test("should find Movie and populate nested cypher query", async () => {
        const typeDefs = `
            type ${Actor} {
                id: ID
            }

            type ${Movie} {
                id: ID!
                actors(actorIds: [ID!]): [${Actor}!]! @cypher(
                   statement:  """
                   MATCH (a:${Actor})
                   WHERE a.id IN $actorIds
                   RETURN a
                   """,
                   columnName: "a"
                )
            }
        `;

        await testHelper.initNeo4jGraphQL({ typeDefs });

        const movieId1 = generate({
            charset: "alphabetic",
        });
        const movieId2 = generate({
            charset: "alphabetic",
        });
        const movieId3 = generate({
            charset: "alphabetic",
        });

        const actorId1 = generate({
            charset: "alphabetic",
        });
        const actorId2 = generate({
            charset: "alphabetic",
        });
        const actorId3 = generate({
            charset: "alphabetic",
        });

        const query = `
            query($movieIds: [ID!], $actorIds: [ID!]){
                ${Movie.plural}(where: {id_IN: $movieIds}){
                    id
                    actors(actorIds: $actorIds) {
                        id
                    }
                }
            }
        `;

        await testHelper.executeCypher(
            `
                CREATE (:${Movie} {id: $movieId1}),
                       (:${Movie} {id: $movieId2}),
                       (:${Movie} {id: $movieId3}),
                       (:${Actor} {id: $actorId1}),
                       (:${Actor} {id: $actorId2}),
                       (:${Actor} {id: $actorId3})
            `,
            {
                movieId1,
                movieId2,
                movieId3,
                actorId1,
                actorId2,
                actorId3,
            }
        );

        const result = await testHelper.executeGraphQL(query, {
            variableValues: { movieIds: [movieId1, movieId2, movieId3], actorIds: [actorId1, actorId2, actorId3] },
        });

        expect(result.errors).toBeFalsy();

        (result?.data as any)?.[Movie.plural].forEach((movie: { id: string; actors: { id: string }[] }) => {
            expect([movieId1, movieId2, movieId3].includes(movie.id)).toBeTruthy();

            movie.actors.forEach((actor) => {
                expect([actorId1, actorId2, actorId3].includes(actor.id)).toBeTruthy();
            });
        });
    });

    test("should use OR and find Movie by id or title", async () => {
        const typeDefs = `
            type ${Actor} {
                name: String
                movies: [${Movie}!]! @relationship(type: "ACTED_IN", direction: IN)
            }

            type ${Movie} {
                id: ID!
                title: String!
                actors: [${Actor}!]! @relationship(type: "ACTED_IN", direction: OUT)
                mainActor: ${Actor}! @relationship(type: "MAIN_ACTOR", direction: OUT)
            }
        `;

        await testHelper.initNeo4jGraphQL({ typeDefs });

        const id = generate({
            charset: "alphabetic",
        });

        const title = generate({
            charset: "alphabetic",
        });

        const query = `
            query($movieWhere: ${Movie}Where){
                ${Movie.plural}(where: $movieWhere){
                    id
                    title
                }
            }
        `;

        await testHelper.executeCypher(
            `
              CREATE (:${Movie} {id: $id, title: $title})
            `,
            { id, title }
        );

        const result = await testHelper.executeGraphQL(query, {
            variableValues: { movieWhere: { OR: [{ title, id }] } },
        });

        expect(result.errors).toBeFalsy();

        expect(result?.data?.[Movie.plural]).toEqual([{ id, title }]);
    });
});
