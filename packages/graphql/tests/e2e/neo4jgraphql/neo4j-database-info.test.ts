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
import type { Response } from "supertest";
import supertest from "supertest";
import { Neo4jDatabaseInfo, Neo4jGraphQL } from "../../../src/";
import { UniqueType } from "../../utils/graphql-types";
import type { TestGraphQLServer } from "../setup/apollo-server";
import { ApolloTestServer } from "../setup/apollo-server";
import Neo4j from "../setup/neo4j";

describe("Create with specific neo4jDatabaseInfo set correctly", () => {
    let neo4j: Neo4j;
    let driver: Driver;

    const typeMovie = new UniqueType("Movie");

    let server: TestGraphQLServer;

    beforeAll(async () => {
        const typeDefs = `
         type ${typeMovie} {
             title: String
         }
         `;

        neo4j = new Neo4j();
        driver = await neo4j.getDriver();

        const neoSchema = new Neo4jGraphQL({
            typeDefs,
            driver,
            config: {
                driverConfig: {
                    database: neo4j.getIntegrationDatabaseName(),
                },
            },
        });

        // eslint-disable-next-line @typescript-eslint/require-await
        server = new ApolloTestServer(neoSchema, async () => ({
            neo4jDatabaseInfo: new Neo4jDatabaseInfo("4.2.1"),
        }));
        await server.start();
    });

    afterAll(async () => {
        await server.close();
        await driver.close();
    });

    test("simple mutation", async () => {
        const result = await createMovie("dsa");

        console.log(result.body);

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
    let neo4j: Neo4j;
    let driver: Driver;

    const typeMovie = new UniqueType("Movie");

    let server: TestGraphQLServer;

    beforeAll(async () => {
        const typeDefs = `
         type ${typeMovie} {
             title: String
         }
         `;

        neo4j = new Neo4j();
        driver = await neo4j.getDriver();

        const neoSchema = new Neo4jGraphQL({
            typeDefs,
            driver,
            config: {
                driverConfig: {
                    database: neo4j.getIntegrationDatabaseName(),
                },
            },
        });

        // eslint-disable-next-line @typescript-eslint/require-await
        server = new ApolloTestServer(neoSchema, async () => ({
            neo4jDatabaseInfo: new Neo4jDatabaseInfo("this_seems_not_valid"),
        }));
        await server.start();
    });

    afterAll(async () => {
        await server.close();
        await driver.close();
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
