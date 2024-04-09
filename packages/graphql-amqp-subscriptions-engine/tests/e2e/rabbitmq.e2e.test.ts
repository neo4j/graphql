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

import type { SubscriptionsEvent } from "@neo4j/graphql";
import type { Neo4jGraphQLAMQPSubscriptionsEngine } from "../../src";
import createEngine from "./setup/engine";
import getRabbitConnectionOptions from "./setup/rabbitmq";

describe("Subscriptions RabbitMQ Integration", () => {
    let engine: Neo4jGraphQLAMQPSubscriptionsEngine;

    beforeEach(async () => {
        const connectionOptions = getRabbitConnectionOptions();
        engine = createEngine(connectionOptions);
        await engine.init();
    });

    afterEach(async () => {
        await engine.close();
    });

    test("Send and receive events to eventEmitter", () => {
        return new Promise<void>((resolve, reject) => {
            const event: SubscriptionsEvent = {
                event: "create",
                properties: {
                    new: {
                        prop: "arthur",
                    },
                    old: undefined,
                },
                id: "2",
                timestamp: 2,
                typename: "test",
            };

            engine.events.on("create", (msg) => {
                try {
                    expect(msg).toEqual(event);
                    resolve();
                } catch (err) {
                    reject(err);
                }
            });

            engine.publish(event).catch((err) => {
                reject(err);
            });
        });
    });
});
