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

import { EventEmitter } from "events";
import { Neo4jGraphQLSubscriptionsPlugin, SubscriptionsEvent } from "@neo4j/graphql";
import { AmqpApi } from "./amqp-api";

export class Neo4jGraphQLSubscriptionsRabbitMQ implements Neo4jGraphQLSubscriptionsPlugin {
    public events: EventEmitter;
    private amqpApi: AmqpApi<SubscriptionsEvent>;

    constructor(path: string) {
        this.events = new EventEmitter();
        this.amqpApi = new AmqpApi({ path });
    }

    connect(): Promise<void> {
        return this.amqpApi.connect((message) => {
            this.events.emit(message.event, message);
        });
    }

    publish(eventMeta: SubscriptionsEvent): Promise<void> {
        return this.amqpApi.publish(eventMeta);
    }
}
