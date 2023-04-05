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

import type { Driver, Session } from "neo4j-driver";
import { graphql } from "graphql";
import Neo4j from "../neo4j";
import { Neo4jGraphQL } from "../../../src";
import { UniqueType } from "../../utils/graphql-types";
import { cleanNodes } from "../../utils/clean-nodes";
import { createJwtRequest } from "../../utils/create-jwt-request";
import { Neo4jGraphQLAuthJWTPlugin } from "../../../../plugins/graphql-plugin-auth/src";

describe("https://github.com/neo4j/graphql/issues/2812", () => {
    let driver: Driver;
    let neo4j: Neo4j;
    let neoSchema: Neo4jGraphQL;
    let session: Session;
    const secret = "secret";

    let Movie: UniqueType;
    let Actor: UniqueType;

    beforeAll(async () => {
        neo4j = new Neo4j();
        driver = await neo4j.getDriver();
    });

    beforeEach(async () => {
        session = await neo4j.getSession();

        Movie = new UniqueType("Movie");
        Actor = new UniqueType("Actor");

        const typeDefs = `
            type ${Actor} @auth(rules: [{ allow: { nodeCreatedBy: "$jwt.sub" } }]) {
                id: ID! @id
                name: String
                nodeCreatedBy: String
                fieldA: String @auth(rules: [{ operations: [CREATE, UPDATE], roles: ["role-A"] }])
                fieldB: String @auth(rules: [{ operations: [CREATE, UPDATE], roles: ["role-B"] }])
                movies: [${Movie}!]! @relationship(type: "ACTED_IN", direction: OUT)
            }
            type ${Movie} @auth(rules: [{ operations: [CREATE, UPDATE], roles: ["admin"] }]) {
                id: ID
                actors: [${Actor}!]! @relationship(type: "ACTED_IN", direction: IN)
            }
        `;

        neoSchema = new Neo4jGraphQL({
            typeDefs,
            driver,
            features: {
                authorization: {
                    key: "secret",
                },
            },
        });
    });

    afterEach(async () => {
        await cleanNodes(session, [Movie, Actor]);
        await session.close();
    });

    afterAll(async () => {
        await driver.close();
    });

    describe("valid roles", () => {
        test("should not raise with auth fields partially included in the input", async () => {
            const query = `
            mutation {
                ${Movie.operations.create}(
                    input: [
                        { id: "1", actors: { create: [{ node: { nodeCreatedBy: "User", name: "actor 1", fieldA: "b" } }] } }
                        { id: "2", actors: { create: [{ node: { nodeCreatedBy: "User", fieldB: "a" } }] } }
                    ]
                ) {
                    ${Movie.plural} {
                        id
                        actors {
                            name
                        }
                    }
                }
            }
        `;
            const req = createJwtRequest(secret, { roles: ["role-A", "role-B", "admin"], sub: "User" });

            const result = await graphql({
                schema: await neoSchema.getSchema(),
                source: query,
                contextValue: neo4j.getContextValues({ req }),
            });
            expect(result.errors).toBeFalsy();
        });

        test("should not raise with auth fields always included in the input", async () => {
            const query = `
            mutation {
                ${Movie.operations.create}(
                    input: [
                        { id: "1", actors: { create: [{ node: { nodeCreatedBy: "User", name: "actor 1", fieldA: "b", fieldB: "a" } }] } }
                        { id: "2", actors: { create: [{ node: { nodeCreatedBy: "User", fieldA: "b", fieldB: "a" } }] } }
                    ]
                ) {
                    ${Movie.plural} {
                        id
                        actors {
                            name
                        }
                    }
                }
            }
        `;
            const req = createJwtRequest(secret, { roles: ["role-A", "role-B", "admin"], sub: "User" });

            const result = await graphql({
                schema: await neoSchema.getSchema(),
                source: query,
                contextValue: neo4j.getContextValues({ req }),
            });
            expect(result.errors).toBeFalsy();
        });

        test("should not raise with auth fields not included in the input", async () => {
            const query = `
            mutation {
                ${Movie.operations.create}(
                    input: [
                        { id: "1", actors: { create: [{ node: { nodeCreatedBy: "User", name: "actor 1"} }] } }
                        { id: "2", actors: { create: [{ node: { nodeCreatedBy: "User" } }] } }
                    ]
                ) {
                    ${Movie.plural} {
                        id
                        actors {
                            name
                        }
                    }
                }
            }
        `;
            const req = createJwtRequest(secret, { roles: ["role-A", "role-B", "admin"], sub: "User" });

            const result = await graphql({
                schema: await neoSchema.getSchema(),
                source: query,
                contextValue: neo4j.getContextValues({ req }),
            });
            expect(result.errors).toBeFalsy();
        });
    });

    describe("invalid roles", () => {
        test("should raise with auth fields partially included in the input", async () => {
            const query = `
            mutation {
                ${Movie.operations.create}(
                    input: [
                        { id: "1", actors: { create: [{ node: { nodeCreatedBy: "User", name: "actor 1", fieldA: "b" } }] } }
                        { id: "2", actors: { create: [{ node: { nodeCreatedBy: "User", fieldB: "a" } }] } }
                    ]
                ) {
                    ${Movie.plural} {
                        id
                        actors {
                            name
                        }
                    }
                }
            }
        `;
            const req = createJwtRequest(secret, { roles: ["admin"], sub: "User" });

            const result = await graphql({
                schema: await neoSchema.getSchema(),
                source: query,
                contextValue: neo4j.getContextValues({ req }),
            });
            expect(result.errors).toBeTruthy();
        });

        test("should raise with auth fields always included in the input", async () => {
            const query = `
            mutation {
                ${Movie.operations.create}(
                    input: [
                        { id: "1", actors: { create: [{ node: { nodeCreatedBy: "User", name: "actor 1", fieldB: "a", fieldA: "b" } }] } }
                        { id: "2", actors: { create: [{ node: { nodeCreatedBy: "User", fieldB: "a", fieldA: "b" } }] } }
                    ]
                ) {
                    ${Movie.plural} {
                        id
                        actors {
                            name
                        }
                    }
                }
            }
        `;
            const req = createJwtRequest(secret, { roles: ["admin"], sub: "User" });

            const result = await graphql({
                schema: await neoSchema.getSchema(),
                source: query,
                contextValue: neo4j.getContextValues({ req }),
            });
            expect(result.errors).toBeTruthy();
        });

        test("should not raise with auth fields not included in the input", async () => {
            const query = `
            mutation {
                ${Movie.operations.create}(
                    input: [
                        { id: "1", actors: { create: [{ node: { nodeCreatedBy: "User", name: "actor 1" } }] } }
                        { id: "2", actors: { create: [{ node: { nodeCreatedBy: "User" } }] } }
                    ]
                ) {
                    ${Movie.plural} {
                        id
                        actors {
                            name
                        }
                    }
                }
            }
        `;
            const req = createJwtRequest(secret, { roles: ["admin"], sub: "User" });

            const result = await graphql({
                schema: await neoSchema.getSchema(),
                source: query,
                contextValue: neo4j.getContextValues({ req }),
            });
            expect(result.errors).toBeFalsy();
        });
    });
});
