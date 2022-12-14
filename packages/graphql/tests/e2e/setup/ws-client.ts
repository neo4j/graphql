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

export class WebSocketTestClient {
    public events: Array<unknown> = [];
    public errors: Array<unknown> = [];

    private path: string;
    private client: Client;

    private onEvent: (() => void) | undefined;

    constructor(path: string, jwt?: string) {
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
        if (this.onEvent) {
            return Promise.reject(new Error("Cannot wait for multiple events"));
        }
        return new Promise<void>((resolve) => {
            this.onEvent = resolve;
        });
    }

    public async subscribe(query: string, callback?: jest.Mock): Promise<void> {
        await new Promise<void>((resolve, reject) => {
            this.client.subscribe(
                { query },
                {
                    next: (value) => {
                        if (value.errors) this.errors = [...this.errors, ...value.errors];
                        else if (value.data) this.events.push(value.data);
                        if (this.onEvent) {
                            this.onEvent();
                            this.onEvent = undefined;
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
                // eslint-disable-next-line @typescript-eslint/no-floating-promises
                this.client.dispose();
            });
        });
    }

    public async close(): Promise<void> {
        if (this.client) await this.client?.dispose();
        this.events = [];
        this.errors = [];
    }
}
