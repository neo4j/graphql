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
import { graphql, GraphQLSchema } from "graphql";
import { generate } from "randomstring";
import neo4j from "../neo4j";
import { Neo4jGraphQL } from "../../../src/classes";

const testLabel = generate({ charset: "alphabetic" });
describe("@computed directive", () => {
    let driver: Driver;

    beforeAll(async () => {
        driver = await neo4j();
    });

    afterAll(async () => {
        await driver.close();
    });

    describe("Scalar fields", () => {
        const typeDefs = `
            type User {
                id: ID!
                firstName: String!
                lastName: String!
                fullName: String @computed(from: ["firstName", "lastName"])
            }
        `;

        const user = {
            id: generate(),
            firstName: generate({ charset: "alphabetic" }),
            lastName: generate({ charset: "alphabetic" }),
        };

        let schema: GraphQLSchema;

        const fullName = ({ firstName, lastName }) => `${firstName} ${lastName}`;

        const resolvers = {
            User: { fullName },
        };

        beforeAll(async () => {
            const session = driver.session();

            const neoSchema = new Neo4jGraphQL({ typeDefs, resolvers });
            schema = await neoSchema.getSchema();

            await session.run(
                `
                CREATE (user:User:${testLabel}) SET user = $user
            `,
                { user }
            );
            await session.close();
        });

        afterAll(async () => {
            const session = driver.session();
            await session.run(`MATCH (n:${testLabel}) DETACH DELETE n`);
            await session.close();
        });

        test("removes a field from all but its object type, and resolves with a custom resolver", async () => {
            const source = `
                query Users($userId: ID!) {
                    users(where: { id: $userId }) {
                        id
                        firstName
                        lastName
                        fullName
                    }
                }
            `;

            const gqlResult = await graphql({
                schema,
                source,
                contextValue: { driver },
                variableValues: { userId: user.id },
            });

            expect(gqlResult.errors).toBeFalsy();
            expect((gqlResult.data as any).users[0]).toEqual({
                ...user,
                fullName: fullName(user),
            });
        });

        test("resolves field with custom resolver without required fields in selection set", async () => {
            const source = `
                query Users($userId: ID!) {
                    users(where: { id: $userId }) {
                        id
                        fullName
                    }
                }
            `;

            const gqlResult = await graphql({
                schema,
                source,
                contextValue: { driver },
                variableValues: { userId: user.id },
            });

            expect(gqlResult.errors).toBeFalsy();
            expect((gqlResult.data as any).users[0]).toEqual({
                id: user.id,
                fullName: fullName(user),
            });
        });

        test("resolves field with custom resolver with required field(s) aliased in selection set", async () => {
            const source = `
                query Users($userId: ID!) {
                    users(where: { id: $userId }) {
                        id
                        f: firstName
                        fullName
                    }
                }
            `;

            const gqlResult = await graphql({
                schema,
                source,
                contextValue: { driver },
                variableValues: { userId: user.id },
            });

            expect(gqlResult.errors).toBeFalsy();
            expect((gqlResult.data as any).users[0]).toEqual({
                id: user.id,
                f: user.firstName,
                fullName: fullName(user),
            });
        });
    });

    describe("Cypher fields", () => {
        const user = {
            id: generate(),
            firstName: generate({ charset: "alphabetic" }),
            lastName: generate({ charset: "alphabetic" }),
        };

        const typeDefs = `
            type User {
                id: ID!
                firstName: String! @cypher(statement: "RETURN '${user.firstName}'")
                lastName: String! @cypher(statement: "RETURN '${user.lastName}'")
                fullName: String @computed(from: ["firstName", "lastName"])
            }
        `;

        const fullName = ({ firstName, lastName }) => `${firstName} ${lastName}`;

        const resolvers = {
            User: { fullName },
        };

        let schema: GraphQLSchema;

        beforeAll(async () => {
            const session = driver.session();

            const neoSchema = new Neo4jGraphQL({ typeDefs, resolvers });
            schema = await neoSchema.getSchema();

            await session.run(
                `
                CREATE (user:User:${testLabel}) SET user.id = $userId
            `,
                { userId: user.id }
            );
            await session.close();
        });

        afterAll(async () => {
            const session = driver.session();
            await session.run(`MATCH (n:${testLabel}) DETACH DELETE n`);
            await session.close();
        });

        test("removes a field from all but its object type, and resolves with a custom resolver", async () => {
            const source = `
                query Users($userId: ID!) {
                    users(where: { id: $userId }) {
                        id
                        firstName
                        lastName
                        fullName
                    }
                }
            `;

            const gqlResult = await graphql({
                schema,
                source,
                contextValue: { driver },
                variableValues: { userId: user.id },
            });

            expect(gqlResult.errors).toBeFalsy();
            expect((gqlResult.data as any).users[0]).toEqual({
                ...user,
                fullName: fullName(user),
            });
        });

        test("resolves field with custom resolver without required fields in selection set", async () => {
            const source = `
                query Users($userId: ID!) {
                    users(where: { id: $userId }) {
                        id
                        fullName
                    }
                }
            `;

            const gqlResult = await graphql({
                schema,
                source,
                contextValue: { driver },
                variableValues: { userId: user.id },
            });

            expect(gqlResult.errors).toBeFalsy();
            expect((gqlResult.data as any).users[0]).toEqual({
                id: user.id,
                fullName: fullName(user),
            });
        });

        test("resolves field with custom resolver with required field(s) aliased in selection set", async () => {
            const source = `
                query Users($userId: ID!) {
                    users(where: { id: $userId }) {
                        id
                        f: firstName
                        fullName
                    }
                }
            `;

            const gqlResult = await graphql({
                schema,
                source,
                contextValue: { driver },
                variableValues: { userId: user.id },
            });

            expect(gqlResult.errors).toBeFalsy();
            expect((gqlResult.data as any).users[0]).toEqual({
                id: user.id,
                f: user.firstName,
                fullName: fullName(user),
            });
        });
    });
});
