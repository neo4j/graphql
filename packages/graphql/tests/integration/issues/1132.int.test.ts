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

import { graphql } from "graphql";
import { Driver, Session } from "neo4j-driver";
import { generate } from "randomstring";
import { gql } from "apollo-server";
import { Neo4jGraphQLAuthJWTPlugin } from "@neo4j/graphql-plugin-auth";
import neo4j from "../neo4j";
import { getQuerySource } from "../../utils/get-query-source";
import { generateUniqueType } from "../../utils/graphql-types";
import { Neo4jGraphQL } from "../../../src";
import { createJwtRequest } from "../../utils/create-jwt-request";

describe("https://github.com/neo4j/graphql/issues/1132", () => {
    const secret = "secret";

    let driver: Driver;
    let session: Session;

    beforeAll(async () => {
        driver = await neo4j();
    });

    beforeEach(() => {
        session = driver.session();
    });

    afterAll(async () => {
        await driver.close();
    });

    describe("CONNECT", () => {
        test("should assert that the error is associated with the correct node", async () => {
            const testSource = generateUniqueType("Source");
            const testTarget = generateUniqueType("Target");

            const typeDefs = gql`
                type ${testSource.name} @auth(rules: [{ operations: [CONNECT], allow: { id: "$jwt.sub" } }]) {
                    id: ID!
                    targets: [${testTarget.name}!]! @relationship(type: "HAS_TARGET", direction: OUT)
                }
            
                type ${testTarget.name} {
                    id: ID!
                }
            `;

            const neoGraphql = new Neo4jGraphQL({
                typeDefs,
                driver,
                plugins: {
                    auth: new Neo4jGraphQLAuthJWTPlugin({
                        secret,
                    }),
                },
            });
            const schema = await neoGraphql.getSchema();

            const sourceId = generate({
                charset: "alphabetic",
            });
            const sub = generate({
                charset: "alphabetic",
            });
            const query = gql`
                mutation {
                    ${testSource.operations.update}(where: { id: "${sourceId}" }, connect: { targets: { where: { node: { id: 1 } } } }) {
                        ${testSource.plural} {
                            id
                        }
                    }
                }
            `;

            await session.run(`
                CREATE (:${testSource.name} { id: "${sourceId}" })
            `);

            const req = createJwtRequest(secret, { sub });

            const result = await graphql({
                schema,
                source: getQuerySource(query),
                contextValue: {
                    driver,
                    req,
                },
            });
            expect((result.errors as any[])[0].message).toBe("Forbidden");
        });

        test("should allow user to connect when associated with the correct node", async () => {
            const testSource = generateUniqueType("Source");
            const testTarget = generateUniqueType("Target");

            const typeDefs = gql`
                type ${testSource.name} @auth(rules: [{ operations: [CONNECT], allow: { id: "$jwt.sub" } }]) {
                    id: ID!
                    targets: [${testTarget.name}!]! @relationship(type: "HAS_TARGET", direction: OUT)
                }
            
                type ${testTarget.name} {
                    id: ID!
                }
            `;

            const neoGraphql = new Neo4jGraphQL({
                typeDefs,
                driver,
                plugins: {
                    auth: new Neo4jGraphQLAuthJWTPlugin({
                        secret,
                    }),
                },
            });
            const schema = await neoGraphql.getSchema();

            const sourceId = generate({
                charset: "alphabetic",
            });
            const targetId = generate({
                charset: "alphabetic",
            });
            const query = gql`
                mutation {
                    ${testSource.operations.update}(where: { id: "${sourceId}" }, connect: { targets: { where: { node: { id: "${targetId}" } } } }) {
                        ${testSource.plural} {
                            id
                            targets {
                                id
                            }
                        }
                    }
                }
            `;

            await session.run(`
                CREATE (:${testSource.name} { id: "${sourceId}" })
                CREATE (:${testTarget.name} { id: "${targetId}" })
            `);

            const req = createJwtRequest(secret, { sub: sourceId });

            const result = await graphql({
                schema,
                source: getQuerySource(query),
                contextValue: {
                    driver,
                    req,
                },
            });
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
            const testSource = generateUniqueType("Source");
            const testTarget = generateUniqueType("Target");

            const typeDefs = gql`
                type ${testSource.name} {
                    id: ID!
                    targets: [${testTarget.name}!]! @relationship(type: "HAS_TARGET", direction: OUT)
                }
            
                type ${testTarget.name} @auth(rules: [{ operations: [DISCONNECT], allow: { id: "$jwt.sub" } }]) {
                    id: ID!
                }
            `;

            const neoGraphql = new Neo4jGraphQL({
                typeDefs,
                driver,
                plugins: {
                    auth: new Neo4jGraphQLAuthJWTPlugin({
                        secret,
                    }),
                },
            });
            const schema = await neoGraphql.getSchema();

            const sourceId = generate({
                charset: "alphabetic",
            });
            const targetId = generate({
                charset: "alphabetic",
            });
            const sub = generate({
                charset: "alphabetic",
            });
            const query = gql`
                mutation {
                    ${testSource.operations.update}(where: { id: "${sourceId}" }, disconnect: { targets: { where: { node: { id: "${targetId}" } } } }) {
                        ${testSource.plural} {
                            id
                        }
                    }
                }
            `;

            await session.run(`
                CREATE (:${testSource.name} { id: "${sourceId}" })-[:HAS_TARGET]->(:${testTarget.name} { id: "${targetId}" })
            `);

            const req = createJwtRequest(secret, { sub });

            const result = await graphql({
                schema,
                source: getQuerySource(query),
                contextValue: {
                    driver,
                    req,
                },
            });
            expect((result.errors as any[])[0].message).toBe("Forbidden");
        });

        test("should allow the disconnect when jwt.sub is associated with the correct node", async () => {
            const testSource = generateUniqueType("Source");
            const testTarget = generateUniqueType("Target");

            const typeDefs = gql`
                type ${testSource.name} {
                    id: ID!
                    targets: [${testTarget.name}!]! @relationship(type: "HAS_TARGET", direction: OUT)
                }
            
                type ${testTarget.name} @auth(rules: [{ operations: [DISCONNECT], allow: { id: "$jwt.sub" } }]) {
                    id: ID!
                }
            `;

            const neoGraphql = new Neo4jGraphQL({
                typeDefs,
                driver,
                plugins: {
                    auth: new Neo4jGraphQLAuthJWTPlugin({
                        secret,
                    }),
                },
            });
            const schema = await neoGraphql.getSchema();

            const sourceId = generate({
                charset: "alphabetic",
            });
            const targetId = generate({
                charset: "alphabetic",
            });
            const query = gql`
                mutation {
                    ${testSource.operations.update}(where: { id: "${sourceId}" }, disconnect: { targets: { where: { node: { id: "${targetId}" } } } }) {
                        ${testSource.plural} {
                            id
                            targets {
                                id
                            }
                        }
                    }
                }
            `;

            await session.run(`
                CREATE (:${testSource.name} { id: "${sourceId}" })-[:HAS_TARGET]->(:${testTarget.name} { id: "${targetId}" })
            `);

            const req = createJwtRequest(secret, { sub: targetId });

            const result = await graphql({
                schema,
                source: getQuerySource(query),
                contextValue: {
                    driver,
                    req,
                },
            });
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
