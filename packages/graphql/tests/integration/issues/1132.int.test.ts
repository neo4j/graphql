/*
 * Copyright (c) "Neo4j"
 * Neo4j Sweden AB [http://neo4j.com]
 */

import { gql } from "graphql-tag";
import { generate } from "randomstring";
import { createBearerToken } from "../../utils/create-bearer-token";
import { TestHelper } from "../../utils/tests-helper";

describe("https://github.com/neo4j/graphql/issues/1132", () => {
    const secret = "secret";

    const testHelper = new TestHelper();

    afterEach(async () => {
        await testHelper.close();
    });

    describe("CONNECT", () => {
        test("should allow user to connect when associated with the correct node", async () => {
            const testSource = testHelper.createUniqueType("Source");
            const testTarget = testHelper.createUniqueType("Target");

            const typeDefs = gql`
                type ${testSource.name} @authorization(validate: [{ when: BEFORE, operations: [CREATE_RELATIONSHIP], where: { node: { id_EQ: "$jwt.sub" } } }]) @node {
                    id: ID!
                    targets: [${testTarget.name}!]! @relationship(type: "HAS_TARGET", direction: OUT)
                }
            
                type ${testTarget.name} @node {
                    id: ID!
                }
            `;

            await testHelper.initNeo4jGraphQL({
                typeDefs,
                features: {
                    authorization: {
                        key: secret,
                    },
                },
            });

            const sourceId = generate({
                charset: "alphabetic",
            });
            const targetId = generate({
                charset: "alphabetic",
            });
            const query = `
                mutation {
                    ${testSource.operations.update}(where: { id_EQ: "${sourceId}" }, update: { targets: { connect: { where: { node: { id_EQ: "${targetId}" } } } } }) {
                        ${testSource.plural} {
                            id
                            targets {
                                id
                            }
                        }
                    }
                }
            `;

            await testHelper.executeCypher(`
                CREATE (:${testSource.name} { id: "${sourceId}" })
                CREATE (:${testTarget.name} { id: "${targetId}" })
            `);

            const token = createBearerToken(secret, { sub: sourceId });

            const result = await testHelper.executeGraphQLWithToken(query, token);
            expect(result.errors).toBeUndefined();
            expect(result.data as any).toEqual({
                [testSource.operations.update]: {
                    [testSource.plural]: [
                        {
                            id: sourceId,
                            targets: [{ id: targetId }],
                        },
                    ],
                },
            });
        });
    });

    describe("DISCONNECT", () => {
        test("should assert that the error is associated with the correct node", async () => {
            const testSource = testHelper.createUniqueType("Source");
            const testTarget = testHelper.createUniqueType("Target");

            const typeDefs = gql`
                type ${testSource.name} @node {
                    id: ID!
                    targets: [${testTarget.name}!]! @relationship(type: "HAS_TARGET", direction: OUT)
                }
            
                type ${testTarget.name} @authorization(validate: [{ when: BEFORE, operations: [DELETE_RELATIONSHIP], where: { node: { id_EQ: "$jwt.sub" } } }]) @node {
                    id: ID!
                }
            `;

            await testHelper.initNeo4jGraphQL({
                typeDefs,
                features: {
                    authorization: {
                        key: secret,
                    },
                },
            });

            const sourceId = generate({
                charset: "alphabetic",
            });
            const targetId = generate({
                charset: "alphabetic",
            });
            const sub = generate({
                charset: "alphabetic",
            });
            const query = `
                mutation {
                    ${testSource.operations.update}(where: { id_EQ: "${sourceId}" }, update: { targets: { disconnect: { where: { node: { id_EQ: "${targetId}" } } } } }) {
                        ${testSource.plural} {
                            id
                        }
                    }
                }
            `;

            await testHelper.executeCypher(`
                CREATE (:${testSource.name} { id: "${sourceId}" })-[:HAS_TARGET]->(:${testTarget.name} { id: "${targetId}" })
            `);

            const token = createBearerToken(secret, { sub });

            const result = await testHelper.executeGraphQLWithToken(query, token);
            expect((result.errors as any[])[0].message).toBe("Forbidden");
        });

        test("should allow the disconnect when jwt.sub is associated with the correct node", async () => {
            const testSource = testHelper.createUniqueType("Source");
            const testTarget = testHelper.createUniqueType("Target");

            const typeDefs = gql`
                type ${testSource.name} @node {
                    id: ID!
                    targets: [${testTarget.name}!]! @relationship(type: "HAS_TARGET", direction: OUT)
                }
            
                type ${testTarget.name} @authorization(validate: [{ when: BEFORE, operations: [DELETE_RELATIONSHIP], where: { node: { id_EQ: "$jwt.sub" } } }]) @node {
                    id: ID!
                }
            `;

            await testHelper.initNeo4jGraphQL({
                typeDefs,
                features: {
                    authorization: {
                        key: secret,
                    },
                },
            });

            const sourceId = generate({
                charset: "alphabetic",
            });
            const targetId = generate({
                charset: "alphabetic",
            });
            const query = `
                mutation {
                    ${testSource.operations.update}(where: { id_EQ: "${sourceId}" }, update: { targets: { disconnect: { where: { node: { id_EQ: "${targetId}" } } } } }) {
                        ${testSource.plural} {
                            id
                            targets {
                                id
                            }
                        }
                    }
                }
            `;

            await testHelper.executeCypher(`
                CREATE (:${testSource.name} { id: "${sourceId}" })-[:HAS_TARGET]->(:${testTarget.name} { id: "${targetId}" })
            `);

            const token = createBearerToken(secret, { sub: targetId });

            const result = await testHelper.executeGraphQLWithToken(query, token);
            expect(result.errors).toBeUndefined();
            expect(result.data as any).toEqual({
                [testSource.operations.update]: {
                    [testSource.plural]: [
                        {
                            id: sourceId,
                            targets: [],
                        },
                    ],
                },
            });
        });
    });
});
