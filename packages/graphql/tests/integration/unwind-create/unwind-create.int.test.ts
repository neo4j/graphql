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

import { int } from "neo4j-driver";
import { generate } from "randomstring";
import { UniqueType } from "../../utils/graphql-types";
import { TestHelper } from "../../utils/tests-helper";

describe("unwind-create", () => {
    const testHelper = new TestHelper();

    beforeEach(() => {});

    afterEach(async () => {
        await testHelper.close();
    });

    test("should create a batch of movies", async () => {
        const Movie = new UniqueType("Movie");

        const typeDefs = `
            type ${Movie} {
                id: ID!
            }
        `;

        await testHelper.initNeo4jGraphQL({ typeDefs });

        const id = generate({
            charset: "alphabetic",
        });

        const id2 = generate({
            charset: "alphabetic",
        });

        const query = `
        mutation($id: ID!, $id2: ID!) {
            ${Movie.operations.create}(input: [{ id: $id }, {id: $id2 }]) {
                ${Movie.plural} {
                    id
                }
            }
          }
        `;

        const gqlResult = await testHelper.executeGraphQL(query, {
            variableValues: { id, id2 },
        });

        expect(gqlResult.errors).toBeFalsy();

        expect(gqlResult?.data?.[Movie.operations.create]?.[Movie.plural]).toEqual(
            expect.arrayContaining([{ id }, { id: id2 }])
        );

        const reFind = await testHelper.executeCypher(
            `
              MATCH (m:${Movie})
              RETURN m
            `,
            {}
        );
        const records = reFind.records.map((record) => record.toObject());
        expect(records).toEqual(
            expect.arrayContaining([
                { m: expect.objectContaining({ properties: { id } }) },
                { m: expect.objectContaining({ properties: { id: id2 } }) },
            ])
        );
    });

    test("should create a batch of movies with nested actors", async () => {
        const Movie = new UniqueType("Movie");
        const Actor = new UniqueType("Actor");

        const typeDefs = `
            type ${Actor} {
                name: String!
            }
            type ${Movie} {
                id: ID!
                actors: [${Actor}!]! @relationship(type: "ACTED_IN", direction: IN)
            }
        `;

        await testHelper.initNeo4jGraphQL({ typeDefs });

        const id = generate({
            charset: "alphabetic",
        });

        const id2 = generate({
            charset: "alphabetic",
        });

        const actor1Name = generate({
            charset: "alphabetic",
        });

        const actor2Name = generate({
            charset: "alphabetic",
        });

        const query = `
        mutation($id: ID!, $id2: ID!, $actor1Name: String!, $actor2Name: String!) {
            ${Movie.operations.create}(input: [
                { id: $id, actors: { create: { node: { name: $actor1Name}} } },
                { id: $id2, actors: { create: { node: { name: $actor2Name}} } }
            ]) {
                ${Movie.plural} {
                    id
                    actors {
                        name
                    }
                }
            }
          }
        `;

        const gqlResult = await testHelper.executeGraphQL(query, {
            variableValues: { id, id2, actor1Name, actor2Name },
        });

        expect(gqlResult.errors).toBeFalsy();

        expect(gqlResult?.data?.[Movie.operations.create]?.[Movie.plural]).toEqual(
            expect.arrayContaining([
                { id, actors: [{ name: actor1Name }] },
                { id: id2, actors: [{ name: actor2Name }] },
            ])
        );

        const reFind = await testHelper.executeCypher(
            `
              MATCH (m:${Movie})<-[:ACTED_IN]-(a:${Actor})
              RETURN m,a
            `,
            {}
        );

        const records = reFind.records.map((record) => record.toObject());
        expect(records).toEqual(
            expect.arrayContaining([
                {
                    m: expect.objectContaining({ properties: { id } }),
                    a: expect.objectContaining({ properties: { name: actor1Name } }),
                },
                {
                    m: expect.objectContaining({ properties: { id: id2 } }),
                    a: expect.objectContaining({ properties: { name: actor2Name } }),
                },
            ])
        );
    });

    test("should create a batch of movies with nested actors with nested movies", async () => {
        const Movie = new UniqueType("Movie");
        const Actor = new UniqueType("Actor");

        const typeDefs = `
            type ${Actor} {
                name: String!
                movies: [${Movie}!]! @relationship(type: "ACTED_IN", direction: OUT)
            }
            type ${Movie} {
                id: ID!
                actors: [${Actor}!]! @relationship(type: "ACTED_IN", direction: IN)
            }
        `;

        await testHelper.initNeo4jGraphQL({ typeDefs });

        const id = generate({
            charset: "alphabetic",
        });

        const id2 = generate({
            charset: "alphabetic",
        });

        const id3 = generate({
            charset: "alphabetic",
        });

        const id4 = generate({
            charset: "alphabetic",
        });

        const actor1Name = generate({
            charset: "alphabetic",
        });

        const actor2Name = generate({
            charset: "alphabetic",
        });

        const query = `
        mutation($id: ID!, $id2: ID!, $id3: ID!, $id4: ID!, $actor1Name: String!, $actor2Name: String!) {
            ${Movie.operations.create}(input: [
                { 
                    id: $id, 
                    actors: { 
                        create: { 
                            node: {                            
                                name: $actor1Name,                            
                                movies: {                            
                                    create: { node: { id: $id3 } }                            
                                }                
                            } 
                        } 
                    }
                },
                { 
                    id: $id2,
                    actors: { 
                        create: {
                            node: {
                                name: $actor2Name,
                                movies: { 
                                    create: { node: { id: $id4 } }
                                } 
                            } 
                        } 
                    } 
                }
            ]) {
                ${Movie.plural} {
                    id
                    actors {
                        name
                    }
                }
            }
          }
        `;

        const gqlResult = await testHelper.executeGraphQL(query, {
            variableValues: { id, id2, id3, id4, actor1Name, actor2Name },
        });

        expect(gqlResult.errors).toBeFalsy();

        expect(gqlResult?.data?.[Movie.operations.create]?.[Movie.plural]).toEqual(
            expect.arrayContaining([
                { id, actors: [{ name: actor1Name }] },
                { id: id2, actors: [{ name: actor2Name }] },
            ])
        );

        const reFind = await testHelper.executeCypher(
            `
              MATCH (m:${Movie})<-[:ACTED_IN]-(a:${Actor})
              RETURN m,a
            `,
            {}
        );

        const records = reFind.records.map((record) => record.toObject());
        expect(records).toEqual(
            expect.arrayContaining([
                {
                    m: expect.objectContaining({ properties: { id } }),
                    a: expect.objectContaining({ properties: { name: actor1Name } }),
                },
                {
                    m: expect.objectContaining({ properties: { id: id2 } }),
                    a: expect.objectContaining({ properties: { name: actor2Name } }),
                },
                {
                    m: expect.objectContaining({ properties: { id: id3 } }),
                    a: expect.objectContaining({ properties: { name: actor1Name } }),
                },
                {
                    m: expect.objectContaining({ properties: { id: id4 } }),
                    a: expect.objectContaining({ properties: { name: actor2Name } }),
                },
            ])
        );
    });

    test("should create a batch of movies with nested actors with edge properties", async () => {
        const Movie = new UniqueType("Movie");
        const Actor = new UniqueType("Actor");

        const typeDefs = `
            type ${Actor} {
                name: String!
            }
            type ${Movie} {
                id: ID!
                actors: [${Actor}!]! @relationship(type: "ACTED_IN", direction: IN, properties: "ActedIn")
            }
        
            type ActedIn @relationshipProperties {
                year: Int
            }
        `;

        await testHelper.initNeo4jGraphQL({ typeDefs });

        const id = generate({
            charset: "alphabetic",
        });

        const id2 = generate({
            charset: "alphabetic",
        });

        const actor1Name = generate({
            charset: "alphabetic",
        });

        const actor2Name = generate({
            charset: "alphabetic",
        });

        const query = `
        mutation($id: ID!, $id2: ID!, $actor1Name: String!, $actor2Name: String!) {
            ${Movie.operations.create}(input: [
                { id: $id, actors: { create: { node: { name: $actor1Name }, edge: { year: 2022 } } } },
                { id: $id2, actors: { create: { node: { name: $actor2Name }, edge: { year: 2021 } } } }
            ]) {
                ${Movie.plural} {
                    id
                    actors {
                        name
                    }
                }
            }
          }
        `;

        const gqlResult = await testHelper.executeGraphQL(query, {
            variableValues: { id, id2, actor1Name, actor2Name },
        });

        expect(gqlResult.errors).toBeFalsy();

        expect(gqlResult?.data?.[Movie.operations.create]?.[Movie.plural]).toEqual(
            expect.arrayContaining([
                { id, actors: [{ name: actor1Name }] },
                { id: id2, actors: [{ name: actor2Name }] },
            ])
        );

        const reFind = await testHelper.executeCypher(
            `
              MATCH (m:${Movie})<-[r:ACTED_IN]-(a:${Actor})
              RETURN m,r,a
            `,
            {}
        );

        const records = reFind.records.map((record) => record.toObject());
        expect(records).toEqual(
            expect.arrayContaining([
                {
                    m: expect.objectContaining({ properties: { id } }),
                    r: expect.objectContaining({ properties: { year: int(2022) } }),
                    a: expect.objectContaining({ properties: { name: actor1Name } }),
                },
                {
                    m: expect.objectContaining({ properties: { id: id2 } }),
                    r: expect.objectContaining({ properties: { year: int(2021) } }),
                    a: expect.objectContaining({ properties: { name: actor2Name } }),
                },
            ])
        );
    });

    test("should create a batch of movies with nested persons using interface", async () => {
        const Movie = new UniqueType("Movie");
        const Actor = new UniqueType("Actor");
        const Modeler = new UniqueType("Modeler");
        const Person = new UniqueType("Person");

        const workedIn = generate({
            charset: "alphabetic",
        });

        const typeDefs = `
            interface ${Person} {
                name: String
            }

            type ${Modeler} implements ${Person} {
                name: String
            }

            type ${Actor} implements ${Person} {
                name: String!
            }

            type ${Movie} {
                id: ID!
                workers: [${Person}!]! @relationship(type: "${workedIn}", direction: IN, properties: "WorkedIn")
            }
        
            type WorkedIn @relationshipProperties {
                year: Int
            }
        `;

        await testHelper.initNeo4jGraphQL({ typeDefs });

        const id = generate({
            charset: "alphabetic",
        });

        const id2 = generate({
            charset: "alphabetic",
        });

        const actorName = generate({
            charset: "alphabetic",
        });

        const modelerName = generate({
            charset: "alphabetic",
        });

        const query = `
        mutation($id: ID!, $id2: ID!, $actorName: String!, $modelerName: String!) {
            ${Movie.operations.create}(input: [
                { id: $id, workers: { create: { node: { ${Actor}: { name: $actorName } }, edge: { year: 2022 } } } },
                { id: $id2, workers: { create: { node: { ${Modeler}: { name: $modelerName } }, edge: { year: 2021 } } } }
            ]) {
                ${Movie.plural} {
                    id
                    workers {
                        name
                    }
                }
            }
          }
        `;

        const gqlResult = await testHelper.executeGraphQL(query, {
            variableValues: { id, id2, actorName, modelerName },
        });

        expect(gqlResult.errors).toBeFalsy();

        expect(gqlResult?.data?.[Movie.operations.create]?.[Movie.plural]).toEqual(
            expect.arrayContaining([
                { id, workers: [{ name: actorName }] },
                { id: id2, workers: [{ name: modelerName }] },
            ])
        );

        const reFind = await testHelper.executeCypher(
            `
              MATCH (m:${Movie})<-[r:${workedIn}]-(a)
              RETURN m,r,a
            `,
            {}
        );

        const records = reFind.records.map((record) => record.toObject());
        expect(records).toEqual(
            expect.arrayContaining([
                {
                    m: expect.objectContaining({ properties: { id } }),
                    r: expect.objectContaining({ properties: { year: int(2022) } }),
                    a: expect.objectContaining({ properties: { name: actorName } }),
                },
                {
                    m: expect.objectContaining({ properties: { id: id2 } }),
                    r: expect.objectContaining({ properties: { year: int(2021) } }),
                    a: expect.objectContaining({ properties: { name: modelerName } }),
                },
            ])
        );
    });

    test("should set properties defined with the directive @alias", async () => {
        const Movie = new UniqueType("Movie");
        const Actor = new UniqueType("Actor");

        const actedIn = generate({
            charset: "alphabetic",
        });

        const typeDefs = `
 
            type ${Actor}  {
                name: String!
                nickname: String @alias(property: "alternativeName")
            }

            type ${Movie} {
                id: ID!
                name: String @alias(property: "title")
                actors: [${Actor}!]! @relationship(type: "${actedIn}", direction: IN, properties: "ActedIn")
            }
        
            type ActedIn @relationshipProperties {
                year: Int
                pay: Int @alias(property: "salary")
            }
        `;

        await testHelper.initNeo4jGraphQL({ typeDefs });

        const id = generate({
            charset: "alphabetic",
        });

        const movieName = "Matrix";

        const id2 = generate({
            charset: "alphabetic",
        });

        const movie2Name = "Matrix 2";

        const actorName = generate({
            charset: "alphabetic",
        });

        const actorNickname = generate({
            charset: "alphabetic",
        });

        const actorPay = 10200;

        const actor2Name = generate({
            charset: "alphabetic",
        });

        const actor2Nickname = generate({
            charset: "alphabetic",
        });
        const actor2Pay = 1232;

        const query = `
        mutation(
            $id: ID!,
            $movieName: String,
            $id2: ID!,
            $movie2Name: String,
            $actorName: String!, 
            $actorNickname: String!, 
            $actorPay: Int, 
            $actor2Name: String!, 
            $actor2Nickname: String!, 
            $actor2Pay: Int
        ) {
            ${Movie.operations.create}(input: [
                { 
                    id: $id,
                    name: $movieName,
                    actors: {
                        create: { node:  { name: $actorName, nickname: $actorNickname }, edge: { year: 2022, pay: $actorPay } } 
                    } 
                },
                { 
                    id: $id2,
                    name: $movie2Name,
                    actors: { 
                        create: { node: { name: $actor2Name, nickname: $actor2Nickname }, edge: { year: 2021, pay: $actor2Pay } } 
                    } 
                }
            ]) {
                ${Movie.plural} {
                    id
                    name
                    actors {
                        name
                        nickname
                    }
                }
            }
          }
        `;

        const gqlResult = await testHelper.executeGraphQL(query, {
            variableValues: {
                id,
                movieName,
                id2,
                movie2Name,
                actorName,
                actorNickname,
                actorPay,
                actor2Name,
                actor2Nickname,
                actor2Pay,
            },
        });

        expect(gqlResult.errors).toBeFalsy();

        expect(gqlResult?.data?.[Movie.operations.create]?.[Movie.plural]).toEqual(
            expect.arrayContaining([
                { id, name: movieName, actors: [{ name: actorName, nickname: actorNickname }] },
                { id: id2, name: movie2Name, actors: [{ name: actor2Name, nickname: actor2Nickname }] },
            ])
        );

        const reFind = await testHelper.executeCypher(
            `
              MATCH (m:${Movie})<-[r:${actedIn}]-(a)
              RETURN m,r,a
            `,
            {}
        );

        const records = reFind.records.map((record) => record.toObject());

        expect(records).toEqual(
            expect.arrayContaining([
                {
                    m: expect.objectContaining({ properties: { id, title: movieName } }),
                    r: expect.objectContaining({ properties: { year: int(2022), salary: int(actorPay) } }),
                    a: expect.objectContaining({ properties: { name: actorName, alternativeName: actorNickname } }),
                },
                {
                    m: expect.objectContaining({ properties: { id: id2, title: movie2Name } }),
                    r: expect.objectContaining({ properties: { year: int(2021), salary: int(actor2Pay) } }),
                    a: expect.objectContaining({
                        properties: { name: actor2Name, alternativeName: actor2Nickname },
                    }),
                },
            ])
        );
    });

    test("should a batch of actors with nested movies and resolve actorsConnection", async () => {
        const Movie = new UniqueType("Movie");
        const Actor = new UniqueType("Actor");

        const typeDefs = `
            type ${Actor} {
                name: String!
                movies: [${Movie}!]! @relationship(type: "ACTED_IN", direction: OUT)
            }

            type ${Movie} {
                title: String!
                actors: [${Actor}!]! @relationship(type: "ACTED_IN", direction: IN)
            }
        `;

        await testHelper.initNeo4jGraphQL({ typeDefs });

        const movieTitle = generate({ charset: "alphabetic" });
        const movie2Title = generate({ charset: "alphabetic" });
        const actorName = generate({ charset: "alphabetic" });
        const actor2Name = generate({ charset: "alphabetic" });

        const query = `
            mutation ($movieTitle: String!, $actorName: String!, $movie2Title: String!, $actor2Name: String!) {
                ${Actor.operations.create}(
                    input: [
                        {
                            name: $actorName
                            movies: { create: { node: { title: $movieTitle } } }
                        },
                        {
                            name: $actor2Name
                            movies: { create: { node: { title: $movie2Title } } }
                        },

                ]) {
                    ${Actor.plural} {
                        name
                        movies {
                            title
                            actorsConnection(where: { node: { name: $actor2Name } }) {
                                totalCount
                                edges {
                                    node {
                                        name
                                    }
                                }
                            }
                        }
                    }
                }
            }
        `;

        const result = await testHelper.executeGraphQL(query, {
            variableValues: { movieTitle, actorName, movie2Title, actor2Name },
        });

        expect(result.errors).toBeFalsy();
        expect(result.data?.[Actor.operations.create]).toEqual({
            [Actor.plural]: expect.arrayContaining([
                {
                    name: actorName,
                    movies: [
                        {
                            title: movieTitle,
                            actorsConnection: {
                                totalCount: 0,
                                edges: [],
                            },
                        },
                    ],
                },
                {
                    name: actor2Name,
                    movies: [
                        {
                            title: movie2Title,
                            actorsConnection: {
                                totalCount: 1,
                                edges: [
                                    {
                                        node: {
                                            name: actor2Name,
                                        },
                                    },
                                ],
                            },
                        },
                    ],
                },
            ]),
        });
    });
});
