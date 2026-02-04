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

import { GraphQLError } from "graphql";
import { IncomingMessage } from "http";
import { Socket } from "net";
import { generate } from "randomstring";
import { TestHelper } from "../../../../utils/tests-helper";

describe("array-pop-errors", () => {
    const testHelper = new TestHelper();

    beforeEach(() => {});

    afterEach(async () => {
        await testHelper.close();
    });

    test("should throw an error when trying to pop an element from a non-existing array", async () => {
        const Movie = testHelper.createUniqueType("Movie");
        const typeDefs = /* GraphQL */ `
            type ${Movie} @node {
                title: String
                tags: [String!]
            }
        `;

        await testHelper.initNeo4jGraphQL({ typeDefs });

        const movieTitle = generate({
            charset: "alphabetic",
        });

        const update = /* GraphQL */ `
            mutation {
                ${Movie.operations.update} (update: { tags: { pop: 1 } }) {
                    ${Movie.plural} {
                        title
                        tags
                    }
                }
            }
        `;

        // Created deliberately without the tags property.
        const cypher = `
            CREATE (m:${Movie} {title:$movieTitle})
        `;

        await testHelper.executeCypher(cypher, { movieTitle });

        const gqlResult = await testHelper.executeGraphQL(update);

        expect(gqlResult.errors).toIncludeAllMembers([
            expect.objectContaining({ message: expect.toInclude("Property tags cannot be NULL") }),
        ]);
        expect(gqlResult.data).toBeNull();
    });

    test("should throw an error if not authenticated on field definition", async () => {
        const Movie = testHelper.createUniqueType("Movie");
        const typeDefs = /* GraphQL */ `
            type ${Movie} @node {
                title: String
                tags: [String!] @authentication(operations: [UPDATE])
            }
        `;

        await testHelper.initNeo4jGraphQL({
            typeDefs,
            features: { authorization: { key: "secret" } },
        });

        const movieTitle = generate({
            charset: "alphabetic",
        });

        const update = /* GraphQL */ `
            mutation {
                ${Movie.operations.update} (update: { tags: { pop: 1 } }) {
                    ${Movie.plural} {
                        title
                        tags
                    }
                }
            }
        `;

        const cypher = `CREATE (m:${Movie} {title:$movieTitle, tags: ['a', 'b']})`;

        await testHelper.executeCypher(cypher, { movieTitle });

        const token = "not valid token";

        const socket = new Socket({ readable: true });
        const req = new IncomingMessage(socket);
        req.headers.authorization = `Bearer ${token}`;

        const gqlResult = await testHelper.executeGraphQL(update);

        expect(gqlResult.errors).toIncludeAllMembers([
            expect.objectContaining({ message: expect.toInclude("Unauthenticated") }),
        ]);
        expect(gqlResult.data).toBeNull();
    });

    test("should throw an error when input is invalid", async () => {
        const Movie = testHelper.createUniqueType("Movie");
        const typeDefs = /* GraphQL */ `
            type ${Movie} @node {
                title: String
                tags: [String!]
            }
        `;

        await testHelper.initNeo4jGraphQL({ typeDefs });

        const movieTitle = generate({
            charset: "alphabetic",
        });

        const update = /* GraphQL */ `
            mutation {
                ${Movie.operations.update} (update: { tags: { pop: a } }) {
                    ${Movie.plural} {
                        title
                        tags
                    }
                }
            }
        `;

        const cypher = `CREATE (m:${Movie} {title:$movieTitle, tags: ["abc", "xyz"]})`;

        await testHelper.executeCypher(cypher, { movieTitle });

        const gqlResult = await testHelper.executeGraphQL(update);

        expect(gqlResult.errors).toIncludeAllMembers([
            expect.objectContaining({ message: expect.toInclude("Int cannot represent non-integer value") }),
        ]);
        expect(gqlResult.data).toBeUndefined();
    });

    test("should throw an error when performing an ambiguous property update", async () => {
        const Movie = testHelper.createUniqueType("Movie");
        const typeDefs = /* GraphQL */ `
            type ${Movie} @node {
                title: String
                tags: [String!]
            }
        `;

        await testHelper.initNeo4jGraphQL({ typeDefs });

        const movieTitle = generate({
            charset: "alphabetic",
        });

        const update = /* GraphQL */ `
            mutation {
                ${Movie.operations.update} (update: { tags:{ pop: 1, set: [] } }) {
                    ${Movie.plural} {
                        title
                        tags
                    }
                }
            }
        `;

        const cypher = `CREATE (m:${Movie} {title:$movieTitle, tags:["existing value"]})`;

        await testHelper.executeCypher(cypher, { movieTitle });

        const gqlResult = await testHelper.executeGraphQL(update);

        expect(gqlResult.errors).toEqual([
            new GraphQLError(`Conflicting modification of field tags: [[set]], [[pop]] on type ${Movie}`),
        ]);
        expect(gqlResult.data).toBeNull();
    });

    test("should throw an error when performing an ambiguous property update on relationship properties", async () => {
        const initialPay = 100;
        const Movie = testHelper.createUniqueType("Movie");
        const Actor = testHelper.createUniqueType("Actor");
        const typeDefs = /* GraphQL */ `
            type ${Movie.name} @node {
                title: String
                actors: [${Actor.name}!]! @relationship(type: "ACTED_IN", properties: "ActedIn", direction: IN)
            }
            
            type ${Actor.name} @node {
                id: ID!
                name: String!
                actedIn: [${Movie.name}!]! @relationship(type: "ACTED_IN", properties: "ActedIn", direction: OUT)
            }

            type ActedIn @relationshipProperties {
                pay: [Float!]
            }
        `;

        await testHelper.initNeo4jGraphQL({ typeDefs });

        const id = generate({
            charset: "alphabetic",
        });

        const query = /* GraphQL */ `
            mutation Mutation($id: ID, $numberToPop: Int) {
                ${Actor.operations.update}(where: { id: { eq: $id } }, update: {
                    actedIn: [
                        {
                            update: {
                                edge: {
                                    pay: { set: [], pop: $numberToPop }
                                }
                            }
                        }
                    ]
                }) {
                    ${Actor.plural} {
                        name
                        actedIn {
                            title
                        }
                        actedInConnection {
                            edges {
                               properties {
                                 pay
                                }
                            }
                        }
                    }
                }
            }
        `;

        // Create new movie
        await testHelper.executeCypher(
            `CREATE (a:${Movie.name} {title: "The Matrix"}), (b:${Actor.name} {id: $id, name: "Keanu"}) WITH a,b CREATE (a)<-[actedIn: ACTED_IN{ pay: $initialPay }]-(b) RETURN a, actedIn, b`,
            {
                id,
                initialPay: [initialPay],
            }
        );
        // Update movie
        const gqlResult = await testHelper.executeGraphQL(query, {
            variableValues: { id, numberToPop: 1 },
        });

        expect(gqlResult.errors).toEqual([
            new GraphQLError(
                `Conflicting modification of field pay: [[set]], [[pop]] on relationship ${Movie}.actedIn`
            ),
        ]);
        expect(gqlResult.data).toBeNull();
    });

    test("should throw an error when trying to pop from a non-existing array on relationship properties", async () => {
        const Movie = testHelper.createUniqueType("Movie");
        const Actor = testHelper.createUniqueType("Actor");
        const typeDefs = /* GraphQL */ `
            type ${Movie.name} @node {
                title: String
                actors: [${Actor.name}!]! @relationship(type: "ACTED_IN", properties: "ActedIn", direction: IN)
            }

            type ${Actor.name} @node {
                id: ID!
                name: String!
                actedIn: [${Movie.name}!]! @relationship(type: "ACTED_IN", properties: "ActedIn", direction: OUT)
            }

            type ActedIn @relationshipProperties {
                stuffs: [Int!]
            }
        `;

        await testHelper.initNeo4jGraphQL({ typeDefs });

        const id = generate({
            charset: "alphabetic",
        });

        const query = /* GraphQL */ `
            mutation Mutation($id: ID) {
                ${Actor.operations.update}(where: { id: { eq: $id } }, update: {
                    actedIn: [
                        {
                            update: {
                                edge: {
                                    stuffs: { pop: 1 }
                                }
                            }
                        }
                    ]
                }) {
                    ${Actor.plural} {
                        name
                    }
                }
            }
        `;

        await testHelper.executeCypher(
            `CREATE(:${Movie} {title: "The Matrix"})<-[:ACTED_IN]-(:${Actor} {id: $id, name: "Keanu"})`,
            { id }
        );

        const gqlResult = await testHelper.executeGraphQL(query, {
            variableValues: { id },
        });

        expect(gqlResult.errors).toIncludeAllMembers([
            expect.objectContaining({
                message: expect.toInclude("stuffs cannot be NULL"),
            }),
        ]);
        expect(gqlResult.data).toBeNull();
    });
});
