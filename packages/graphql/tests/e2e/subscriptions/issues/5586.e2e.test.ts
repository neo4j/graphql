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

import supertest from "supertest";
import { Neo4jGraphQLSubscriptionsDefaultEngine } from "../../../../src/classes/subscription/Neo4jGraphQLSubscriptionsDefaultEngine";
import type { UniqueType } from "../../../utils/graphql-types";
import { TestHelper } from "../../../utils/tests-helper";
import type { TestGraphQLServer } from "../../setup/apollo-server";
import { ApolloTestServer } from "../../setup/apollo-server";
import { WebSocketTestClient } from "../../setup/ws-client";

describe("https://github.com/neo4j/graphql/issues/5586", () => {
    const testHelper = new TestHelper();
    let server: TestGraphQLServer;
    let wsClient: WebSocketTestClient;
    let Entity: UniqueType;
    let typeDefs: string;

    beforeEach(async () => {
        Entity = testHelper.createUniqueType("Entity");

        typeDefs = /* GraphQL */ `
            type ${Entity} {
                id: ID! @id @unique
                name: String
            }
        `;

        const neoSchema = await testHelper.initNeo4jGraphQL({
            typeDefs,
            features: {
                subscriptions: new Neo4jGraphQLSubscriptionsDefaultEngine(),
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

        await testHelper.close();
        await server.close();
    });

    test("connect via create subscription sends events both ways", async () => {
        await testHelper.executeCypher(
            `CREATE(:${Entity} {id: "7fab55b1-6cd2-489d-92ca-f4944478d127", name: "original"})`
        );

        await wsClient.subscribe(/* GraphQL */ `
            subscription {
                ${Entity.operations.subscribe.updated}(where: { id_IN: ["7fab55b1-6cd2-489d-92ca-f4944478d127"] }) {
                    ${Entity.operations.subscribe.payload.updated} {
                        id
                        name
                    }
                    event
                    timestamp
                    previousState {
                        id
                        name
                    }
                }
            }
        `);

        await supertest(server.path)
            .post("")
            .send({
                query: /* GraphQL */ `
                    mutation {
                        ${Entity.operations.update}(update: { name: "new" }) {
                            ${Entity.plural} {
                                name
                                id
                            }
                        }
                    }
                `,
            })
            .expect(200);

        await wsClient.waitForEvents(1);

        expect(wsClient.errors).toEqual([]);
        expect(wsClient.events).toHaveLength(1);
        expect(wsClient.events).toIncludeSameMembers([
            {
                [Entity.operations.subscribe.updated]: {
                    event: "UPDATE",
                    previousState: { id: "7fab55b1-6cd2-489d-92ca-f4944478d127", name: "original" },
                    timestamp: expect.toBeNumber(),
                    [Entity.operations.subscribe.payload.updated]: {
                        id: "7fab55b1-6cd2-489d-92ca-f4944478d127",
                        name: "new",
                    },
                },
            },
        ]);
    });
});
