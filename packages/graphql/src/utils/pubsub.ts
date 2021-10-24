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
import { PubSub } from "graphql-subscriptions";
import Debug from "debug";
import { DEBUG_PUBLISH } from "../constants";

const debug = Debug(DEBUG_PUBLISH);

export class PubSubEventEmitter extends EventEmitter {

    protected anyListeners: ((event: string |  symbol, ...args: any[]) => void)[] = [];

    emit(event: string, ...args: any[]) {
        this.anyListeners.forEach((listener) => {
            try {
                listener(event, ...args);
            } catch (err) {
                debug("Error emitting event %s %s", event, err);
            }
        });

        return super.emit(event, ...args);
    }

    addAnyListener(listener: (event: string | symbol, ...args: any[]) => void) {
        this.anyListeners.push(listener);
        return this;
    }

    removeAnyListener(listener: (...args: any[]) => void) {
        const index = this.anyListeners.indexOf(listener);
        if (index >= 0) {
            this.anyListeners.splice(index, 1);
        }
        return this;
    }

    removeAllListeners(event?: string | symbol | undefined) {
        if (!event) {
            this.anyListeners = [];
        }

        return super.removeAllListeners(event);
    }

    rawAnyListeners() {
        return this.anyListeners;
    }
}

export const localEventEmitter = new PubSubEventEmitter();
export const localPubSub = new PubSub({ eventEmitter: localEventEmitter });
