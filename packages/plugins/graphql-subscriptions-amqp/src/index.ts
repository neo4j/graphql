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

import amqp from "amqplib";
import { EventEmitter } from "events";
import { Neo4jGraphQLSubscriptionsPlugin, SubscriptionsEvent } from "@neo4j/graphql";
import { AmqpApi, ConnectionOptions } from "./amqp-api";

export { ConnectionOptions } from "./amqp-api";

const DEFAULT_EXCHANGE = "neo4j-graphql";

export type Neo4jGraphQLSubscriptionsAMQPConstructorOptions = { exchange?: string };

export class Neo4jGraphQLSubscriptionsAMQP implements Neo4jGraphQLSubscriptionsPlugin {
    public events: EventEmitter;
    private amqpApi: AmqpApi<SubscriptionsEvent>;

    constructor(options: Neo4jGraphQLSubscriptionsAMQPConstructorOptions = {}) {
        this.events = new EventEmitter();
        this.amqpApi = new AmqpApi({ exchange: DEFAULT_EXCHANGE, ...options });
    }

    public async connect(connectionOptions: ConnectionOptions): Promise<amqp.Connection> {
        return this.amqpApi.connect(connectionOptions, (message: SubscriptionsEvent) => {
            this.events.emit(message.event as string, message);
        });
    }

    /* Closes the channel created and unbinds the event emitter */
    public close(): Promise<void> {
        this.events.removeAllListeners();
        return this.amqpApi.close();
    }

    public publish(eventMeta: SubscriptionsEvent): Promise<void> {
        this.amqpApi.publish(eventMeta);
        return Promise.resolve(); // To avoid future breaking changes, we always return a promise
    }
}
