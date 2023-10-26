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
import type { Driver, QueryConfig } from "neo4j-driver";
import { Memoize } from "typescript-memoize";
import type { Neo4jGraphQLSubscriptionsEngine, SubscriptionEngineContext, SubscriptionsEvent } from "../../types";
import { CDCApi } from "./cdc/cdc-api";
import { CDCEventParser } from "./cdc/cdc-event-parser";

export class Neo4jGraphQLSubscriptionsCDCEngine implements Neo4jGraphQLSubscriptionsEngine {
    public events: EventEmitter = new EventEmitter();
    private cdcApi: CDCApi;
    private pollTime: number;

    private _parser: CDCEventParser | undefined;
    private timer: ReturnType<typeof setTimeout> | undefined;
    private closed = false;

    constructor({
        driver,
        pollTime = 1000,
        queryConfig,
    }: {
        driver: Driver;
        pollTime?: number;
        queryConfig?: QueryConfig;
    }) {
        this.cdcApi = new CDCApi(driver, queryConfig);
        this.pollTime = pollTime;
    }

    // This memoize is done to keep typings correct whilst avoiding the performance ir of the throw
    @Memoize()
    private get parser(): CDCEventParser {
        if (!this._parser)
            throw new Error(
                "CDC Event parser not available on SubscriptionEngine. Forgot to call .init on SubscriptionEngine?"
            );
        return this._parser;
    }

    public publish(_eventMeta: SubscriptionsEvent): void | Promise<void> {
        // Disable Default Publishing mechanism
    }

    public async init({ schemaModel }: SubscriptionEngineContext): Promise<void> {
        await this.cdcApi.updateCursor();
        this._parser = new CDCEventParser(schemaModel);
        this.triggerPoll();
    }

    /** Stops CDC polling */
    public close(): void {
        this.closed = true;
        if (this.timer) {
            clearTimeout(this.timer);
            this.timer = undefined;
        }
    }

    private triggerPoll() {
        this.timer = setTimeout(() => {
            if (this.closed) {
                return;
            }
            this.pollEvents()
                .catch((err) => {
                    console.error(err);
                })
                .finally(() => {
                    this.triggerPoll();
                });
        }, this.pollTime);
    }

    private async pollEvents(): Promise<void> {
        const cdcEvents = await this.cdcApi.queryEvents();
        for (const cdcEvent of cdcEvents) {
            const parsedEvent = this.parser.parseCDCEvent(cdcEvent);
            if (parsedEvent) {
                this.events.emit(parsedEvent.event, parsedEvent);
            }
        }
    }
}
