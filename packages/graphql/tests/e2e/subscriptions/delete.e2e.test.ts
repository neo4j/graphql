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
import { Neo4jGraphQLSubscriptionsCDCEngine } from "../../../src/classes/subscription/Neo4jGraphQLSubscriptionsCDCEngine";
import { Neo4jGraphQLSubscriptionsDefaultEngine } from "../../../src/classes/subscription/Neo4jGraphQLSubscriptionsDefaultEngine";
import type { Neo4jGraphQLSubscriptionsEngine } from "../../../src/types";
import type { UniqueType } from "../../utils/graphql-types";
import { TestHelper } from "../../utils/tests-helper";
import type { TestGraphQLServer } from "../setup/apollo-server";
import { ApolloTestServer } from "../setup/apollo-server";
import { WebSocketTestClient } from "../setup/ws-client";

describe.each([
    {
        name: "Neo4jGraphQLSubscriptionsDefaultEngine",
        engine: (_driver: Driver, _db: string) => new Neo4jGraphQLSubscriptionsDefaultEngine(),
    },
    {
        name: "Neo4jGraphQLSubscriptionsCDCEngine",
        engine: (driver: Driver, db: string) =>
            new Neo4jGraphQLSubscriptionsCDCEngine({
                driver,
                pollTime: 100,
                queryConfig: {
                    database: db,
                },
            }),
    },
])("$name Delete Subscription", ({ engine }) => {
    const testHelper = new TestHelper({ cdc: true });
    let server: TestGraphQLServer;
    let wsClient: WebSocketTestClient;
    let typeMovie: UniqueType;
    let typeActor: UniqueType;
    let subscriptionEngine: Neo4jGraphQLSubscriptionsEngine;

    beforeEach(async () => {
        typeMovie = testHelper.createUniqueType("Movie");
        typeActor = testHelper.createUniqueType("Actor");
        const typeDefs = `
        type ${typeMovie} {
            title: String
            actors: [${typeActor}]
        }
        type ${typeActor} @subscription(events: []) {
           name: String
        }`;

        const driver = await testHelper.getDriver();
        subscriptionEngine = engine(driver, testHelper.database);

        const neoSchema = await testHelper.initNeo4jGraphQL({
            typeDefs,
            features: {
                subscriptions: subscriptionEngine,
            },
        });

        // eslint-disable-next-line @typescript-eslint/require-await
        server = new ApolloTestServer(neoSchema, async ({ req }) => ({
            sessionConfig: {
                database: testHelper.database,
            },
            token: req.headers.authorization,
        }));
        await server.start();

        wsClient = new WebSocketTestClient(server.wsPath);
    });

    afterEach(async () => {
        await wsClient.close();
        subscriptionEngine.close();
        await server.close();
        await testHelper.close();
    });

    test("delete subscription", async () => {
        await wsClient.subscribe(`
            subscription {
                ${typeMovie.operations.subscribe.deleted} {
                    ${typeMovie.operations.subscribe.payload.deleted} {
                        title
                    }
                    event
                    timestamp
                }
            }
        `);

        await createMovie("movie1");
        await createMovie("movie2");

        await deleteMovie("movie1");
        await deleteMovie("movie2");

        await wsClient.waitForEvents(2);

        expect(wsClient.errors).toEqual([]);
        expect(wsClient.events).toEqual([
            {
                [typeMovie.operations.subscribe.deleted]: {
                    [typeMovie.operations.subscribe.payload.deleted]: { title: "movie1" },
                    event: "DELETE",
                    timestamp: expect.any(Number),
                },
            },
            {
                [typeMovie.operations.subscribe.deleted]: {
                    [typeMovie.operations.subscribe.payload.deleted]: { title: "movie2" },
                    event: "DELETE",
                    timestamp: expect.any(Number),
                },
            },
        ]);
    });
    test("delete subscription with where", async () => {
        await wsClient.subscribe(`
            subscription {
                ${typeMovie.operations.subscribe.deleted}(where: { title: "movie3" }) {
                    ${typeMovie.operations.subscribe.payload.deleted} {
                        title
                    }
                }
            }
        `);

        await createMovie("movie3");
        await createMovie("movie4");

        await deleteMovie("movie3");
        await deleteMovie("movie4");

        await wsClient.waitForEvents(1);

        expect(wsClient.errors).toEqual([]);
        expect(wsClient.events).toEqual([
            {
                [typeMovie.operations.subscribe.deleted]: {
                    [typeMovie.operations.subscribe.payload.deleted]: { title: "movie3" },
                },
            },
        ]);
    });

    test("delete subscription on excluded type", async () => {
        const onReturnError = jest.fn();
        await wsClient.subscribe(
            `
            subscription {
                ${typeActor.operations.subscribe.deleted}(where: { name: "Keanu" }) {
                    ${typeActor.operations.subscribe.payload.deleted} {
                        name
                    }
                }
            }
        `,
            onReturnError
        );
        await createActor("Keanu");
        await deleteActor("Keanu");
        expect(onReturnError).toHaveBeenCalled();
        expect(wsClient.events).toEqual([]);
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
    async function createActor(name: string): Promise<Response> {
        const result = await supertest(server.path)
            .post("")
            .send({
                query: `
                    mutation {
                        ${typeActor.operations.create}(input: [{ name: "${name}" }]) {
                            ${typeActor.plural} {
                                name
                            }
                        }
                    }
                `,
            })
            .expect(200);
        return result;
    }
    async function deleteMovie(title: string): Promise<Response> {
        const result = await supertest(server.path)
            .post("")
            .send({
                query: `
                    mutation {
                        ${typeMovie.operations.delete}(where: { title: "${title}" }) {
                            nodesDeleted
                        }
                    }
                `,
            })
            .expect(200);
        return result;
    }
    async function deleteActor(name: string): Promise<Response> {
        const result = await supertest(server.path)
            .post("")
            .send({
                query: `
                        mutation {
                            ${typeActor.operations.update}(where: { name: "${name}" }) {
                                ${typeActor.plural} {
                                    name
                                }
                            }
                        }
                    `,
            })
            .expect(200);
        return result;
    }
});
