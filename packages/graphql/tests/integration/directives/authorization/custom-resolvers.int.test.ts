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

import type { Driver } from "neo4j-driver";
import { graphql } from "graphql";
import { generate } from "randomstring";
import Neo4j from "../../neo4j";
import { Neo4jGraphQL } from "../../../../src/classes";
import { createBearerToken } from "../../../utils/create-bearer-token";

describe("auth/custom-resolvers", () => {
    let driver: Driver;
    let neo4j: Neo4j;
    const secret = "secret";

    beforeAll(async () => {
        neo4j = new Neo4j();
        driver = await neo4j.getDriver();
    });

    afterAll(async () => {
        await driver.close();
    });

    describe("auth-injection", () => {
        test("should inject auth in context of custom Query", async () => {
            const typeDefs = `
                type User {
                    id: ID
                }

                type Query {
                    me: User
                }
            `;

            const userId = generate({
                charset: "alphabetic",
            });

            const query = `
                {
                    me {
                        id
                    }
                }
            `;

            const neoSchema = new Neo4jGraphQL({
                typeDefs,
                resolvers: {
                    Query: {
                        me: (_, __, ctx) => ({ id: ctx.jwt.sub }),
                    },
                },
                features: {
                    authorization: {
                        key: secret,
                    },
                },
            });

            const token = createBearerToken(secret, { sub: userId });

            const gqlResult = await graphql({
                schema: await neoSchema.getSchema(),
                source: query,
                contextValue: neo4j.getContextValues({ token }),
            });

            expect(gqlResult.errors).toBeUndefined();
            expect((gqlResult.data as any).me.id).toEqual(userId);
        });

        test("should inject auth in context of custom Mutation", async () => {
            const typeDefs = `
                type User {
                    id: ID
                }

                type Mutation {
                    me: User
                }
            `;

            const userId = generate({
                charset: "alphabetic",
            });

            const query = `
                mutation {
                    me {
                        id
                    }
                }
            `;

            const neoSchema = new Neo4jGraphQL({
                typeDefs,
                resolvers: { Mutation: { me: (_, __, ctx) => ({ id: ctx.jwt.sub }) } },
                features: {
                    authorization: {
                        key: secret,
                    },
                },
            });

            const token = createBearerToken(secret, { sub: userId });

            const gqlResult = await graphql({
                schema: await neoSchema.getSchema(),
                source: query,
                contextValue: neo4j.getContextValues({ token }),
            });

            expect(gqlResult.errors).toBeUndefined();
            expect((gqlResult.data as any).me.id).toEqual(userId);
        });

        test("should inject auth in context of custom Field resolver", async () => {
            const typeDefs = `
                type User {
                    customId: ID
                }

                type Query {
                    me: User
                }
            `;

            const userId = generate({
                charset: "alphabetic",
            });

            const query = `
                {
                    me {
                        customId
                    }
                }
            `;

            const neoSchema = new Neo4jGraphQL({
                typeDefs,
                resolvers: {
                    Query: { me: () => ({}) },
                    User: { customId: (_, __, ctx) => ctx.jwt.sub },
                },
                features: {
                    authorization: {
                        key: secret,
                    },
                },
            });

            const token = createBearerToken(secret, { sub: userId });

            const gqlResult = await graphql({
                schema: await neoSchema.getSchema(),
                source: query,
                contextValue: neo4j.getContextValues({ token }),
            });

            expect(gqlResult.errors).toBeUndefined();
            expect((gqlResult.data as any).me.customId).toEqual(userId);
        });

        test("should inject auth in context of custom Query when decoded JWT passed in", async () => {
            const typeDefs = `
                type User {
                    id: ID
                }

                type Query {
                    me: User
                }
            `;

            const userId = generate({
                charset: "alphabetic",
            });

            const query = `
                {
                    me {
                        id
                    }
                }
            `;

            const jwt = {
                sub: userId,
                name: "John Doe",
                iat: 1516239022,
            };

            const neoSchema = new Neo4jGraphQL({
                typeDefs,
                resolvers: {
                    Query: {
                        me: (_, __, ctx) => ({ id: ctx.jwt.sub }),
                    },
                },
            });

            const gqlResult = await graphql({
                schema: await neoSchema.getSchema(),
                source: query,
                contextValue: neo4j.getContextValues({ jwt }),
            });

            expect(gqlResult.errors).toBeUndefined();
            expect((gqlResult.data as any).me.id).toEqual(userId);
        });
    });
});
