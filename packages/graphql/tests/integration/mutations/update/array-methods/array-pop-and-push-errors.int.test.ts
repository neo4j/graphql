/*
 * Copyright (c) "Neo4j"
 * Neo4j Sweden AB [http://neo4j.com]
 */

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
        const typeDefs = /* GraphQL */ `
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

        const update = /* GraphQL */ `
            mutation {
                ${Movie.operations.update} (update: { tags: { push: "xyz" }, moreTags: { pop: 2 } }) {
                    ${Movie.plural} {
                        title
                        tags
                        moreTags
                    }
                }
            }
        `;

        const cypher = `CREATE (m:${Movie} {title:$movieTitle, tags: ["abc"] })`;

        await testHelper.executeCypher(cypher, { movieTitle });

        const gqlResult = await testHelper.executeGraphQL(update);

        expect(gqlResult.errors).toIncludeAllMembers([
            expect.objectContaining({ message: expect.toInclude("moreTags cannot be NULL") }),
        ]);
        expect(gqlResult.data).toBeNull();
    });

    test("should throw an error if not authenticated on field definition", async () => {
        const Movie = testHelper.createUniqueType("Movie");
        const typeDefs = /* GraphQL */ `
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

        const update = /* GraphQL */ `
            mutation {
                ${Movie.operations.update} (update: { tags: { pop: 1 }, moreTags: { push: "new tag" } }) {
                    ${Movie.plural} {
                        title
                        tags
                        moreTags
                    }
                }
            }
        `;

        const cypher = `CREATE (m:${Movie} {title:$movieTitle, tags: ['a', 'b'], moreTags: []})`;

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
                moreTags: [String!]
            }
        `;

        await testHelper.initNeo4jGraphQL({ typeDefs });

        const movieTitle = generate({
            charset: "alphabetic",
        });

        const update = /* GraphQL */ `
            mutation {
                ${Movie.operations.update} (update: { tags: { push: 1 }, moreTags: { pop: 2 } }) {
                    ${Movie.plural} {
                        title
                        tags
                        moreTags
                    }
                }
            }
        `;

        const cypher = `CREATE (m:${Movie} {title:$movieTitle, tags: ["abc"], moreTags: ["this", "that", "them"] })`;

        await testHelper.executeCypher(cypher, { movieTitle });

        const gqlResult = await testHelper.executeGraphQL(update);

        expect(gqlResult.errors).toIncludeAllMembers([
            expect.objectContaining({ message: expect.toInclude("String cannot represent a non string value") }),
        ]);
        expect(gqlResult.data).toBeUndefined();
    });

    test("should throw an error when trying to pop and push from/to a non-existing array on relationship properties", async () => {
        const Movie = testHelper.createUniqueType("Movie");
        const Actor = testHelper.createUniqueType("Actor");

        const typeDefs = /* GraphQL */ `
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
            `CREATE(:${Movie} {title: "The Matrix"})<-[:ACTED_IN { morethings: ["this", "that", "them"] }]-(:${Actor} {id: $id, name: "Keanu"})`,
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
