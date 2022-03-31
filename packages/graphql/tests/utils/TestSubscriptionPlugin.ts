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
import { SubscriptionsEvent } from "../../src/subscriptions/subscriptions-event";
import { Neo4jGraphQLSubscriptionsPlugin } from "../../src/types";

export class TestSubscriptionsPlugin implements Neo4jGraphQLSubscriptionsPlugin {
    public events = new EventEmitter();

    public eventList: SubscriptionsEvent[] = [];

    // eslint-disable-next-line @typescript-eslint/require-await
    async publish(eventMeta: SubscriptionsEvent): Promise<void> {
        this.eventList.push(eventMeta);
        this.events.emit(eventMeta.event, eventMeta);
    }
}
