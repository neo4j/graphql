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
import { type Driver } from "neo4j-driver";
import { generate } from "randomstring";
import { createBearerToken } from "../../../utils/create-bearer-token";
import type { UniqueType } from "../../../utils/graphql-types";
import { isMultiDbUnsupportedError } from "../../../utils/is-multi-db-unsupported-error";
import { TestHelper } from "../../../utils/tests-helper";
import { testVectors } from "./shared-vector";

describe("@vector directive - Auth", () => {
    const queryName = "myQueryName";
    const testHelper = new TestHelper();
    const secret = "This is a secret";

    let databaseName: string;
    let driver: Driver;
    let MULTIDB_SUPPORT = true;
    let VECTOR_SUPPORT = true;

    let Movie: UniqueType;
    let Person: UniqueType;

    const movie1 = {
        title: "Some Title",
        released: 2001,
    };
    const movie2 = {
        title: "Another Title",
        released: 2002,
    };
    const person1 = {
        name: "this is a name",
        born: 1984,
        embedding: testVectors[0],
    };
    const person2 = {
        name: "This is a different name",
        born: 1985,
        embedding: testVectors[1],
    };
    const person3 = {
        name: "Another name",
        born: 1986,
        embedding: testVectors[2],
    };

    beforeEach(async () => {
        const dbInfo = await testHelper.getDatabaseInfo();
        // No vector support, so we skip tests
        if (!dbInfo.gte("5.15")) {
            VECTOR_SUPPORT = false;
            await testHelper.close();
            return;
        }

        databaseName = generate({ readable: true, charset: "alphabetic" });
        try {
            await testHelper.createDatabase(databaseName);
            driver = await testHelper.getDriver();
        } catch (e) {
            if (e instanceof Error) {
                if (isMultiDbUnsupportedError(e)) {
                    // No multi-db support, so we skip tests
                    MULTIDB_SUPPORT = false;
                    await testHelper.close();
                    return;
                } else {
                    throw e;
                }
            }
        }

        Movie = testHelper.createUniqueType("Movie");
        Person = testHelper.createUniqueType("Person");

        await testHelper.executeCypher(
            `CREATE VECTOR INDEX ${Person.name}Index
            IF NOT EXISTS FOR (n:${Person.name})
            ON n.embedding
            OPTIONS {
                indexConfig: {
                    \`vector.dimensions\`: 128,
                    \`vector.similarity_function\`: 'cosine'    
                }
            }
            `
        );

        await testHelper.executeCypher(
            `
                CREATE (person1:${Person})-[:ACTED_IN]->(movie1:${Movie})
                CREATE (person1)-[:ACTED_IN]->(movie2:${Movie})
                CREATE (person2:${Person})-[:ACTED_IN]->(movie1)
                CREATE (person3:${Person})-[:ACTED_IN]->(movie2)
                SET person1 = $person1
                SET person2 = $person2
                SET person3 = $person3
                SET movie1 = $movie1
                SET movie2 = $movie2
            `,
            { person1, person2, person3, movie1, movie2 }
        );
    });

    afterEach(async () => {
        if (MULTIDB_SUPPORT && VECTOR_SUPPORT) {
            await testHelper.dropDatabase();
            await testHelper.close();
        }
    });

    test("Works with @authorization filter where when authenticated", async () => {
        // Skip if vector not supported
        if (!VECTOR_SUPPORT) {
            console.log("VECTOR SUPPORT NOT AVAILABLE - SKIPPING");
            return;
        }

        // Skip if multi-db not supported
        if (!MULTIDB_SUPPORT) {
            console.log("MULTIDB_SUPPORT NOT AVAILABLE - SKIPPING");
            return;
        }

        const typeDefs = /* GraphQL */ `
            type ${Person} @vector(indexes: [{ indexName: "${Person}Index", embeddingProperty: "embedding", queryName: "${queryName}" }])
            @authorization(filter: [{ where: { node: { name: "$jwt.name" } } }]) {
                name: String!
                born: Int!
                actedInMovies: [${Movie}!]! @relationship(type: "ACTED_IN", direction: OUT)
            }

            type ${Movie} {
                title: String!
                released: Int!
                actors: [${Person}!]! @relationship(type: "ACTED_IN", direction: IN)
            }
        `;

        const neoSchema = await testHelper.initNeo4jGraphQL({
            typeDefs,
            features: {
                authorization: {
                    key: secret,
                },
            },
        });
        await neoSchema.getSchema();
        await neoSchema.assertIndexesAndConstraints({
            driver,
            sessionConfig: { database: databaseName },
        });

        const query = /* GraphQL */ `
            query($vector: [Float!]) {
                ${queryName}(vector: $vector) {
                    ${Person.operations.connection} {
                        edges {
                            score
                            node {
                                name
                            }
                        }
                    }
                }
            }
        `;

        const token = createBearerToken(secret, { name: person1.name });
        const gqlResult = await testHelper.executeGraphQLWithToken(query, token, {
            variableValues: { vector: testVectors[0] },
        });

        expect(gqlResult.errors).toBeFalsy();
        expect(gqlResult.data).toEqual({
            [queryName]: {
                [Person.operations.connection]: {
                    edges: [
                        {
                            node: {
                                name: "this is a name",
                            },
                            score: 1,
                        },
                    ],
                },
            },
        });
    });

    test("Works with @authorization where when unauthenticated", async () => {
        // Skip if vector not supported
        if (!VECTOR_SUPPORT) {
            console.log("VECTOR SUPPORT NOT AVAILABLE - SKIPPING");
            return;
        }

        // Skip if multi-db not supported
        if (!MULTIDB_SUPPORT) {
            console.log("MULTIDB_SUPPORT NOT AVAILABLE - SKIPPING");
            return;
        }

        const typeDefs = /* GraphQL */ `
            type ${Person} @vector(indexes: [{ indexName: "${Person}Index", embeddingProperty: "embedding", queryName: "${queryName}" }])
            @authorization(filter: [{ where: { node: { name: "$jwt.name" } } }]) {
                name: String!
                born: Int!
                actedInMovies: [${Movie}!]! @relationship(type: "ACTED_IN", direction: OUT)
            }

            type ${Movie} {
                title: String!
                released: Int!
                actors: [${Person}!]! @relationship(type: "ACTED_IN", direction: IN)
            }
        `;

        const neoSchema = await testHelper.initNeo4jGraphQL({
            typeDefs,
            features: {
                authorization: {
                    key: secret,
                },
            },
        });
        await neoSchema.getSchema();
        await neoSchema.assertIndexesAndConstraints({
            driver,
            sessionConfig: { database: databaseName },
        });

        const query = /* GraphQL */ `
            query($vector: [Float!]) {
                ${queryName}(vector: $vector) {
                    ${Person.operations.connection} {
                        edges {
                            score
                            node {
                                name
                            }
                        }
                    }
                }
            }
        `;

        const token = createBearerToken(secret, { name: "Not a name" });
        const gqlResult = await testHelper.executeGraphQLWithToken(query, token, {
            variableValues: { vector: testVectors[0] },
        });

        expect(gqlResult.errors).toBeFalsy();
        // expect(gqlResult.data?.[queryType] as any[]).toBeArrayOfSize(0);
        expect(gqlResult.data).toEqual({
            [queryName]: {
                [Person.operations.connection]: {
                    edges: [],
                },
            },
        });
    });

    test("Works with @authorization 'roles' when authenticated", async () => {
        // Skip if vector not supported
        if (!VECTOR_SUPPORT) {
            console.log("VECTOR SUPPORT NOT AVAILABLE - SKIPPING");
            return;
        }

        // Skip if multi-db not supported
        if (!MULTIDB_SUPPORT) {
            console.log("MULTIDB_SUPPORT NOT AVAILABLE - SKIPPING");
            return;
        }

        const typeDefs = /* GraphQL */ `
            type JWTPayload @jwt {
                roles: [String!]!
            }

            type ${Person} @vector(indexes: [{ indexName: "${Person}Index", embeddingProperty: "embedding", queryName: "${queryName}" }])
            @authorization(validate: [{ where: { jwt: { roles_INCLUDES: "admin" } } }]) {
                name: String!
                born: Int!
                actedInMovies: [${Movie}!]! @relationship(type: "ACTED_IN", direction: OUT)
            }

            type ${Movie} {
                title: String!
                released: Int!
                actors: [${Person}!]! @relationship(type: "ACTED_IN", direction: IN)
            }
        `;

        const neoSchema = await testHelper.initNeo4jGraphQL({
            typeDefs,
            features: {
                authorization: {
                    key: secret,
                },
            },
        });
        await neoSchema.getSchema();
        await neoSchema.assertIndexesAndConstraints({
            driver,
            sessionConfig: { database: databaseName },
        });

        const query = /* GraphQL */ `
            query($vector: [Float!]) {
                ${queryName}(vector: $vector) {
                    ${Person.operations.connection} {
                        edges {
                            score
                            node {
                                name
                            }
                        }
                    }
                }
            }
        `;

        const token = createBearerToken(secret, { roles: ["admin"] });

        const gqlResult = await testHelper.executeGraphQLWithToken(query, token, {
            variableValues: { vector: testVectors[0] },
        });

        expect(gqlResult.errors).toBeFalsy();
        expect(gqlResult.data).toEqual({
            [queryName]: {
                [Person.operations.connection]: {
                    edges: [
                        {
                            node: {
                                name: "this is a name",
                            },
                            score: 1,
                        },
                        {
                            node: {
                                name: "This is a different name",
                            },
                            score: expect.closeTo(0.56),
                        },
                        {
                            node: {
                                name: "Another name",
                            },
                            score: expect.closeTo(0.48),
                        },
                    ],
                },
            },
        });
    });

    test("Works with @authorization roles when unauthenticated", async () => {
        // Skip if vector not supported
        if (!VECTOR_SUPPORT) {
            console.log("VECTOR SUPPORT NOT AVAILABLE - SKIPPING");
            return;
        }

        // Skip if multi-db not supported
        if (!MULTIDB_SUPPORT) {
            console.log("MULTIDB_SUPPORT NOT AVAILABLE - SKIPPING");
            return;
        }

        const typeDefs = /* GraphQL */ `
            type JWTPayload @jwt {
                roles: [String!]!
            }

            type ${Person} @vector(indexes: [{ indexName: "${Person}Index", embeddingProperty: "embedding", queryName: "${queryName}" }])
            @authorization(validate: [{ where: { jwt: { roles_INCLUDES: "admin" } } }]) {
                name: String!
                born: Int!
                actedInMovies: [${Movie}!]! @relationship(type: "ACTED_IN", direction: OUT)
            }

            type ${Movie} {
                title: String!
                released: Int!
                actors: [${Person}!]! @relationship(type: "ACTED_IN", direction: IN)
            }
        `;

        const neoSchema = await testHelper.initNeo4jGraphQL({
            typeDefs,
            features: {
                authorization: {
                    key: secret,
                },
            },
        });
        await neoSchema.getSchema();
        await neoSchema.assertIndexesAndConstraints({
            driver,
            sessionConfig: { database: databaseName },
        });

        const query = /* GraphQL */ `
            query($vector: [Float!]) {
                ${queryName}(vector: $vector) {
                    ${Person.operations.connection} {
                        edges {
                            score
                            node {
                                name
                            }
                        }
                    }
                }
            }
        `;

        const token = createBearerToken(secret, { roles: ["not_admin"] });
        const gqlResult = await testHelper.executeGraphQLWithToken(query, token, {
            variableValues: { vector: testVectors[0] },
        });

        expect(gqlResult.errors).toBeDefined();
        expect((gqlResult.errors as GraphQLError[]).some((el) => el.message.includes("Forbidden"))).toBeTruthy();
        expect(gqlResult.data).toBeNull();
    });

    test("Works with @authorization allow when all match", async () => {
        // Skip if vector not supported
        if (!VECTOR_SUPPORT) {
            console.log("VECTOR SUPPORT NOT AVAILABLE - SKIPPING");
            return;
        }

        // Skip if multi-db not supported
        if (!MULTIDB_SUPPORT) {
            console.log("MULTIDB_SUPPORT NOT AVAILABLE - SKIPPING");
            return;
        }

        const typeDefs = /* GraphQL */ `
            type ${Person} @vector(indexes: [{ indexName: "${Person}Index", embeddingProperty: "embedding", queryName: "${queryName}" }])
            @authorization(validate: [{ when: BEFORE, where: { node: { name: "$jwt.name" } } }]) {
                name: String!
                born: Int!
                actedInMovies: [${Movie}!]! @relationship(type: "ACTED_IN", direction: OUT)
            }

            type ${Movie} {
                title: String!
                released: Int!
                actors: [${Person}!]! @relationship(type: "ACTED_IN", direction: IN)
            }
        `;

        const neoSchema = await testHelper.initNeo4jGraphQL({
            typeDefs,
            features: {
                authorization: {
                    key: secret,
                },
            },
        });
        await neoSchema.getSchema();
        await neoSchema.assertIndexesAndConstraints({
            driver,
            sessionConfig: { database: databaseName },
        });

        const query = /* GraphQL */ `
            query($vector: [Float!]) {
                ${queryName}(vector: $vector, where: { node: { name: "${person2.name}" } }) {
                    ${Person.operations.connection} {
                        edges {
                            score
                            node {
                                name
                            }
                        }
                    } 
                }
            }
        `;

        const token = createBearerToken(secret, { name: person2.name });

        const gqlResult = await testHelper.executeGraphQLWithToken(query, token, {
            variableValues: { vector: testVectors[1] },
        });

        expect(gqlResult.errors).toBeFalsy();
        expect(gqlResult.data).toEqual({
            [queryName]: {
                [Person.operations.connection]: {
                    edges: [
                        {
                            node: {
                                name: "This is a different name",
                            },
                            score: expect.closeTo(1),
                        },
                    ],
                },
            },
        });
    });

    test("Works with @authorization allow when one match", async () => {
        // Skip if vector not supported
        if (!VECTOR_SUPPORT) {
            console.log("VECTOR SUPPORT NOT AVAILABLE - SKIPPING");
            return;
        }

        // Skip if multi-db not supported
        if (!MULTIDB_SUPPORT) {
            console.log("MULTIDB_SUPPORT NOT AVAILABLE - SKIPPING");
            return;
        }

        const typeDefs = /* GraphQL */ `
            type ${Person} @vector(indexes: [{ indexName: "${Person}Index", embeddingProperty: "embedding", queryName: "${queryName}" }])
            @authorization(validate: [{ when: BEFORE, where: { node: { name: "$jwt.name" } } }]) {
                name: String!
                born: Int!
                actedInMovies: [${Movie}!]! @relationship(type: "ACTED_IN", direction: OUT)
            }

            type ${Movie} {
                title: String!
                released: Int!
                actors: [${Person}!]! @relationship(type: "ACTED_IN", direction: IN)
            }
        `;

        const neoSchema = await testHelper.initNeo4jGraphQL({
            typeDefs,
            features: {
                authorization: {
                    key: secret,
                },
            },
        });
        await neoSchema.getSchema();
        await neoSchema.assertIndexesAndConstraints({
            driver,
            sessionConfig: { database: databaseName },
        });

        const query = /* GraphQL */ `
            query($vector: [Float!]) {
                ${queryName}(vector: $vector) {
                    ${Person.operations.connection} {
                        edges {
                            score
                            node {
                                name
                            }
                        }
                    }
                }
            }
        `;

        const token = createBearerToken(secret, { name: person2.name });
        const gqlResult = await testHelper.executeGraphQLWithToken(query, token, {
            variableValues: { vector: testVectors[0] },
        });

        expect(gqlResult.errors).toBeDefined();
        expect((gqlResult.errors as GraphQLError[]).some((el) => el.message.includes("Forbidden"))).toBeTruthy();
        expect(gqlResult.data).toBeNull();
    });

    test("Works with @authorization roles when only READ operation is specified", async () => {
        // Skip if vector not supported
        if (!VECTOR_SUPPORT) {
            console.log("VECTOR SUPPORT NOT AVAILABLE - SKIPPING");
            return;
        }

        // Skip if multi-db not supported
        if (!MULTIDB_SUPPORT) {
            console.log("MULTIDB_SUPPORT NOT AVAILABLE - SKIPPING");
            return;
        }

        const typeDefs = /* GraphQL */ `
            type JWTPayload @jwt {
                roles: [String!]!
            }

            type ${Person} @vector(indexes: [{ indexName: "${Person}Index", embeddingProperty: "embedding", queryName: "${queryName}" }])
            @authorization(validate: [{ operations: [READ], where: { jwt: { roles_INCLUDES: "admin" } } }]) {
                name: String!
                born: Int!
                actedInMovies: [${Movie}!]! @relationship(type: "ACTED_IN", direction: OUT)
            }

            type ${Movie} {
                title: String!
                released: Int!
                actors: [${Person}!]! @relationship(type: "ACTED_IN", direction: IN)
            }
        `;

        const neoSchema = await testHelper.initNeo4jGraphQL({
            typeDefs,
            features: {
                authorization: {
                    key: secret,
                },
            },
        });
        await neoSchema.getSchema();
        await neoSchema.assertIndexesAndConstraints({
            driver,
            sessionConfig: { database: databaseName },
        });

        const query = /* GraphQL */ `
            query($vector: [Float!]) {
                ${queryName}(vector: $vector) {
                    ${Person.operations.connection} {
                        edges {
                            score
                            node {
                                name
                            }
                        }
                    }
                }
            }
        `;

        const token = createBearerToken(secret, { roles: ["not_admin"] });
        const gqlResult = await testHelper.executeGraphQLWithToken(query, token, {
            variableValues: { vector: testVectors[0] },
        });

        expect(gqlResult.errors).toBeDefined();
        expect((gqlResult.errors as GraphQLError[]).some((el) => el.message.includes("Forbidden"))).toBeTruthy();
        expect(gqlResult.data).toBeNull();
    });
});
