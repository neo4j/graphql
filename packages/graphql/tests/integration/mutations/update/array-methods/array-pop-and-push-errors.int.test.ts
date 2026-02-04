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

import type { GraphQLError } from "graphql";
import { gql } from "graphql-tag";
import { IncomingMessage } from "http";
import { Socket } from "net";
import { generate } from "randomstring";
import { TestHelper } from "../../../../utils/tests-helper";

describe("array-pop-and-push", () => {
    const testHelper = new TestHelper();

    beforeEach(() => {});

    afterEach(async () => {
        await testHelper.close();
    });

    test("should throw an error when trying to pop an element from a non-existing array", async () => {
        const Movie = testHelper.createUniqueType("Movie");
        const typeDefs = gql`
            type ${Movie} @node {
                title: String
                tags: [String!]
                moreTags: [String!]
            }
        `;

        await testHelper.initNeo4jGraphQL({ typeDefs });

        const movieTitle = generate({
            charset: "alphabetic",
        });

        const update = `
            mutation {
                ${Movie.operations.update} (update: { tags_PUSH: "xyz", moreTags_POP: 2 }) {
                    ${Movie.plural} {
                        title
                        tags
                        moreTags
                    }
                }
            }
        `;

        const cypher = `
            CREATE (m:${Movie} {title:$movieTitle, tags: ["abc"] })
        `;

        await testHelper.executeCypher(cypher, { movieTitle });

        const gqlResult = await testHelper.executeGraphQL(update);

        expect(gqlResult.errors).toBeDefined();
        expect(
            (gqlResult.errors as GraphQLError[]).some((el) => el.message.includes("moreTags cannot be NULL"))
        ).toBeTruthy();

        expect(gqlResult.data).toBeNull();
    });

    test("should throw an error if not authenticated on field definition", async () => {
        const Movie = testHelper.createUniqueType("Movie");
        const typeDefs = `
            type ${Movie} @node {
                title: String
                tags: [String!] @authentication(operations: [UPDATE])
                moreTags: [String!]
            }
        `;

        await testHelper.initNeo4jGraphQL({ typeDefs, features: { authorization: { key: "secret" } } });

        const movieTitle = generate({
            charset: "alphabetic",
        });

        const update = `
            mutation {
                ${Movie.operations.update} (update: { tags_POP: 1, moreTags_PUSH: "new tag" }) {
                    ${Movie.plural} {
                        title
                        tags
                        moreTags
                    }
                }
            }
        `;

        const cypher = `
            CREATE (m:${Movie} {title:$movieTitle, tags: ['a', 'b'], moreTags: []})
        `;

        await testHelper.executeCypher(cypher, { movieTitle });

        const token = "not valid token";

        const socket = new Socket({ readable: true });
        const req = new IncomingMessage(socket);
        req.headers.authorization = `Bearer ${token}`;

        const gqlResult = await testHelper.executeGraphQL(update);

        expect(gqlResult.errors).toBeDefined();
        expect((gqlResult.errors as GraphQLError[]).some((el) => el.message.includes("Unauthenticated"))).toBeTruthy();
        expect(gqlResult.data).toBeNull();
    });

    test("should throw an error when input is invalid", async () => {
        const Movie = testHelper.createUniqueType("Movie");
        const typeDefs = gql`
            type ${Movie} @node {
                title: String
                tags: [String!]
                moreTags: [String!]
            }
        `;

        await testHelper.initNeo4jGraphQL({ typeDefs });

        const movieTitle = generate({
            charset: "alphabetic",
        });

        const update = `
            mutation {
                ${Movie.operations.update} (update: { tags_PUSH: 1, moreTags_POP: 2 }) {
                    ${Movie.plural} {
                        title
                        tags
                        moreTags
                    }
                }
            }
        `;

        const cypher = `
            CREATE (m:${Movie} {title:$movieTitle, tags: ["abc"], moreTags: ["this", "that", "them"] })
        `;

        await testHelper.executeCypher(cypher, { movieTitle });

        const gqlResult = await testHelper.executeGraphQL(update);

        expect(gqlResult.errors).toBeDefined();
        expect(
            (gqlResult.errors as GraphQLError[]).some((el) =>
                el.message.includes("String cannot represent a non string value")
            )
        ).toBeTruthy();

        expect(gqlResult.data).toBeUndefined();
    });

    test("should throw an error when trying to pop and push from/to a non-existing array on relationship properties", async () => {
        const Movie = testHelper.createUniqueType("Movie");
        const Actor = testHelper.createUniqueType("Actor");

        const typeDefs = `
            type ${Movie} @node {
                title: String
                actors: [${Actor}!]! @relationship(type: "ACTED_IN", properties: "ActedIn", direction: IN)
            }

            type ${Actor} @node {
                id: ID!
                name: String!
                actedIn: [${Movie}!]! @relationship(type: "ACTED_IN", properties: "ActedIn", direction: OUT)
            }

            type ActedIn @relationshipProperties {
                stuffs: [Int!]
                morethings: [String!]
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
                                    stuffs: { push: 10 }
                                    morethings: { pop: 1 }
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
            `
                CREATE(:${Movie} {title: "The Matrix"})<-[:ACTED_IN { morethings: ["this", "that", "them"] }]-(:${Actor} {id: $id, name: "Keanu"})
            `,
            { id }
        );

        const gqlResult = await testHelper.executeGraphQL(query, {
            variableValues: { id },
        });

        expect(gqlResult.errors).toBeDefined();
        expect(
            (gqlResult.errors as GraphQLError[]).some((el) => el.message.includes("stuffs cannot be NULL"))
        ).toBeTruthy();
        expect(gqlResult.data).toBeNull();
    });
});
