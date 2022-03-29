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
import supertest, { Response } from "supertest";
import { Neo4jGraphQL } from "../../../src/classes";
import { generateUniqueType } from "../../utils/graphql-types";
import { ApolloTestServer, TestGraphQLServer } from "../setup/apollo-server";
import { TestSubscriptionsPlugin } from "../../utils/TestSubscriptionPlugin";
import { WebSocketClient, WebSocketTestClient } from "../setup/ws-client";
import neo4j from "../../integration/neo4j";

describe("Update Subscription", () => {
    let driver: Driver;

    const typeMovie = generateUniqueType("Movie");

    let server: TestGraphQLServer;
    let wsClient: WebSocketClient;

    beforeAll(async () => {
        const typeDefs = `
         type ${typeMovie} {
             title: String
         }
         `;

        driver = await neo4j();

        const neoSchema = new Neo4jGraphQL({
            typeDefs,
            driver,
            plugins: {
                subscriptions: new TestSubscriptionsPlugin(),
            } as any,
        });

        server = new ApolloTestServer(neoSchema);
        await server.start();
        wsClient = new WebSocketTestClient(server.wsPath);
    });

    afterAll(async () => {
        await server.close();
        await driver.close();
        await wsClient.close();
    });

    test("update subscription", async () => {
        const session = driver.session();
        try{
            await session.run(`CREATE (:${typeMovie.name} {title: "my-title"})`);
        } finally {
            await session.close();
        }
        await wsClient.subscribe(`
                            subscription {
                                ${typeMovie.operations.subscribe.updated} {
                                    ${typeMovie.operations.subscribe.payload.updated} {
                                        title
                                    }
                                    previousState {
                                        title
                                    }
                                }
                            }
                            `);

        await updateMovie("my-title", "movie2");
        await updateMovie("movie2", "movie3");

        expect(wsClient.events).toEqual([
            {
                [typeMovie.operations.subscribe.updated]: {
                    previousState: {title: "my-title"},
                    [typeMovie.operations.subscribe.payload.updated]: { title: "movie2" },
                },
            },
            {
                [typeMovie.operations.subscribe.updated]: {
                    previousState: {title: "movie2"},
                    [typeMovie.operations.subscribe.payload.updated]: { title: "movie3" },
                },
            },
        ]);
    });

    async function updateMovie(title1: string, title2: string): Promise<Response> {
        const result = await supertest(server.path)
            .post("")
            .send({
                query: `
                    mutation {
                        ${typeMovie.operations.update}(where: {title: "${title1}"}, update: { title: "${title2}" }) {
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
