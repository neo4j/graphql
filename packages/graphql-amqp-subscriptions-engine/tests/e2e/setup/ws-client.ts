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
import { EventEmitter } from "events";

export interface WebSocketClient {
    events: Array<any>;

    subscribe(query: string): Promise<void>;
    close(): Promise<void>;
}

export class WebSocketTestClient implements WebSocketClient {
    public events: Array<any> = [];

    private path: string;
    private client: Client;
    private eventEmitter: EventEmitter;

    private eventResolve: (() => void) | undefined;

    constructor(path: string) {
        this.path = path;
        this.client = createClient({
            url: this.path,
            webSocketImpl: ws,
        });
        this.eventEmitter = new EventEmitter();
    }

    public waitForNextEvent(): Promise<any> {
        return new Promise((resolve) => {
            this.eventEmitter.once("event", (data) => {
                resolve(data);
            });
        });
    }

    public async subscribe(query: string): Promise<void> {
        await new Promise<void>((resolve, reject) => {
            this.client.subscribe(
                { query },
                {
                    next: (value) => {
                        if (this.eventResolve) {
                            this.eventResolve();
                            this.eventResolve = undefined;
                        }
                        this.events.push(value.data);
                        this.eventEmitter.emit("event", value.data);
                    },
                    error(err) {
                        reject(err);
                    },
                    complete: () => true,
                }
            );

            this.client.on("connected", () => {
                resolve();
            });

            this.client.on("closed", () => {
                // eslint-disable-next-line @typescript-eslint/no-floating-promises
                this.client.dispose();
            });
        });
    }

    public async close(): Promise<void> {
        if (this.client) await this.client?.dispose();
        this.events = [];
    }
}
