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

import ws from "ws";
import type { Client } from "graphql-ws";
import { createClient } from "graphql-ws";
import { EventEmitter } from "stream";

const NEW_EVENT = "NEW_EVENT";

export class WebSocketTestClient {
    public events: Array<unknown> = [];
    public errors: Array<unknown> = [];

    private eventsEmitter: EventEmitter = new EventEmitter();
    private counter = 0;

    private path: string;
    private client: Client;

    constructor(path: string, jwt?: string) {
        this.eventsEmitter.on(NEW_EVENT, () => this.counter++);
        this.path = path;
        this.client = createClient({
            url: this.path,
            webSocketImpl: ws,
            connectionParams: {
                authorization: jwt,
            },
        });
    }

    public waitForNextEvent(): Promise<void> {
        return this.waitForEvents(1);
    }

    public waitForEvents(count = 1): Promise<void> {
        return new Promise<void>((resolve, reject) => {
            if (this.counter >= count) {
                // checking for events that were emitted before `waitForEvents` got the chance to execute
                this.counter -= count;
                return resolve();
            }
            const newEventListener = () => {
                // on new event
                if (this.counter >= count) {
                    this.eventsEmitter.removeListener(NEW_EVENT, newEventListener);
                    clearTimeout(timeout);
                    this.counter -= count;
                    resolve();
                }
            };
            const timeout = setTimeout(() => {
                this.eventsEmitter.removeListener(NEW_EVENT, newEventListener);
                reject("Timed out.");
            }, 500);
            this.eventsEmitter.on(NEW_EVENT, newEventListener);
        });
    }

    public async subscribe(query: string, callback?: jest.Mock): Promise<void> {
        await new Promise<void>((resolve, reject) => {
            this.client.subscribe(
                { query },
                {
                    next: (value) => {
                        this.eventsEmitter.emit(NEW_EVENT, value);
                        if (value.errors) {
                            this.errors = [...this.errors, ...value.errors];
                        } else if (value.data) {
                            this.events.push(value.data);
                        }
                    },
                    error: (err: Array<unknown>) => {
                        this.errors.push(...err);
                        if (callback) {
                            // hack to be able to expect errors on bad subscriptions
                            // bc. resolve() happens before below reject()
                            callback();
                        }
                        reject(err);
                    },
                    complete: () => true,
                }
            );

            this.client.on("connected", () => {
                resolve();
            });

            this.client.on("closed", () => {
                this.eventsEmitter.removeAllListeners();
                // eslint-disable-next-line @typescript-eslint/no-floating-promises
                this.client.dispose();
            });
        });
    }

    public async close(): Promise<void> {
        if (this.client) await this.client?.dispose();
        this.eventsEmitter.removeAllListeners();
        this.events = [];
        this.errors = [];
    }
}
