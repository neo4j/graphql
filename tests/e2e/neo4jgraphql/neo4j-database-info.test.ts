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

import type { Response } from "supertest";
import supertest from "supertest";
import { Neo4jDatabaseInfo } from "../../../src/classes";
import { TestHelper } from "../../utils/tests-helper";
import type { TestGraphQLServer } from "../setup/apollo-server";
import { ApolloTestServer } from "../setup/apollo-server";

describe("Create with specific neo4jDatabaseInfo set correctly", () => {
    const testHelper = new TestHelper();

    const typeMovie = testHelper.createUniqueType("Movie");

    let server: TestGraphQLServer;

    beforeAll(async () => {
        const typeDefs = `
         type ${typeMovie} {
             title: String
         }
         `;

        const neoSchema = await testHelper.initNeo4jGraphQL({
            typeDefs,
        });

        // eslint-disable-next-line @typescript-eslint/require-await
        server = new ApolloTestServer(neoSchema, async () => ({
            neo4jDatabaseInfo: new Neo4jDatabaseInfo("4.2.1"),
        }));
        await server.start();
    });

    afterAll(async () => {
        await testHelper.close();
        await server.close();
    });

    test("simple mutation", async () => {
        const result = await createMovie("dsa");

        expect(result.body).toEqual({
            data: { [typeMovie.operations.create]: { [typeMovie.plural]: [{ title: "dsa" }] } },
        });
    });

    async function createMovie(title: string): Promise<Response> {
        const result = await supertest(server.path)
            .post("")
            .send({
                query: `
                    mutation {
                        ${typeMovie.operations.create}(input: [{ title: "${title}" }]) {
                            ${typeMovie.plural} {
                                title
                            }
                        }
                    }
                `,
            })
            .expect(200);
        return result;
    }
});

describe("Create with specific neo4jDatabaseInfo set incorrectly", () => {
    const testHelper = new TestHelper();

    const typeMovie = testHelper.createUniqueType("Movie");

    let server: TestGraphQLServer;

    beforeAll(async () => {
        const typeDefs = `
         type ${typeMovie} {
             title: String
         }
         `;

        const neoSchema = await testHelper.initNeo4jGraphQL({
            typeDefs,
        });

        // eslint-disable-next-line @typescript-eslint/require-await
        server = new ApolloTestServer(neoSchema, async () => ({
            neo4jDatabaseInfo: new Neo4jDatabaseInfo("this_seems_not_valid"),
        }));
        await server.start();
    });

    afterAll(async () => {
        await testHelper.close();
        await server.close();
    });

    test("simple mutation", async () => {
        const result = await createMovie("dsa");

        expect(result.body.errors[0].message).toBe(
            "Context creation failed: Could not coerce provided version this_seems_not_valid"
        );
    });

    async function createMovie(title: string): Promise<Response> {
        const result = await supertest(server.path)
            .post("")
            .send({
                query: `
                    mutation {
                        ${typeMovie.operations.create}(input: [{ title: "${title}" }]) {
                            ${typeMovie.plural} {
                                title
                            }
                        }
                    }
                `,
            })
            .expect(500);
        return result;
    }
});
