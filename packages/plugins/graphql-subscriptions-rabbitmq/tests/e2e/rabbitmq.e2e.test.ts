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

import { SubscriptionsEvent } from "@neo4j/graphql";
import { Neo4jGraphQLSubscriptionsRabbitMQ } from "../../src";
import { AmqpConnection } from "../../src/amqp-api";
import config from "./config";

describe("Subscriptions RabbitMQ Integration", () => {
    let plugin: Neo4jGraphQLSubscriptionsRabbitMQ;
    let amqpConnection: AmqpConnection;

    beforeEach(async () => {
        plugin = new Neo4jGraphQLSubscriptionsRabbitMQ({
            exchange: config.rabbitmq.exchange,
        });
        amqpConnection = await plugin.connect({
            hostname: config.rabbitmq.hostname,
            username: config.rabbitmq.user,
            password: config.rabbitmq.password,
        });
    });

    afterEach(async () => {
        if (plugin) await plugin.close();
        if (amqpConnection) await amqpConnection.close();
    });

    test("Send and receive events to eventEmitter", (done) => {
        const event: SubscriptionsEvent = {
            event: "create",
            properties: {
                new: {
                    prop: "arthur",
                },
                old: undefined,
            },
            id: 2,
            timestamp: 2,
            typename: "test",
        };

        plugin.events.on("create", (msg) => {
            try {
                expect(msg).toEqual(event);
                done();
            } catch (err) {
                done(err);
            }
        });

        plugin.publish(event).catch((err) => {
            done(err);
        });
    });
});
