/*
 * Copyright (c) "Neo4j"
 * Neo4j Sweden AB [http://neo4j.com]
 */

import Cypher from "@neo4j/cypher-builder";
import { EventEmitter } from "events";
import type { Driver, QueryConfig } from "neo4j-driver";
import { Memoize } from "typescript-memoize";
import { APP_ID } from "../../constants";
import type { Neo4jGraphQLSchemaModel } from "../../schema-model/Neo4jGraphQLSchemaModel";
import type { Neo4jGraphQLSubscriptionsEngine, SubscriptionEngineContext } from "../../types";
import { CDCApi } from "./cdc/cdc-api";
import { CDCEventParser } from "./cdc/cdc-event-parser";

export class Neo4jGraphQLSubscriptionsCDCEngine implements Neo4jGraphQLSubscriptionsEngine {
    public events: EventEmitter = new EventEmitter();
    private cdcApi: CDCApi;
    private pollTime: number;

    private _parser: CDCEventParser | undefined;
    private timer: ReturnType<typeof setTimeout> | undefined;
    private closed = false;

    private subscribeToLabels: string[] | undefined;
    private onlyGraphQLEvents: boolean;

    constructor({
        driver,
        pollTime = 1000,
        queryConfig,
        onlyGraphQLEvents = false,
    }: {
        driver: Driver;
        pollTime?: number;
        queryConfig?: QueryConfig;
        onlyGraphQLEvents?: boolean;
    }) {
        this.cdcApi = new CDCApi(driver, queryConfig);
        this.pollTime = pollTime;
        this.onlyGraphQLEvents = onlyGraphQLEvents;
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

    public async init({ schemaModel }: SubscriptionEngineContext): Promise<void> {
        await this.cdcApi.refreshCursor();
        this._parser = new CDCEventParser(schemaModel);
        this.subscribeToLabels = this.getLabelsToFilter(schemaModel);

        schemaModel.concreteEntities.map((e) => Array.from(e.labels));
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
        let txFilter: Cypher.Map | undefined;
        if (this.onlyGraphQLEvents) {
            const appMetadata = new Cypher.Param(APP_ID);
            txFilter = new Cypher.Map({
                app: appMetadata,
            });
        }
        const cdcEvents = await this.cdcApi.queryEvents(this.subscribeToLabels, txFilter);
        for (const cdcEvent of cdcEvents) {
            const parsedEvent = this.parser.parseCDCEvent(cdcEvent);
            if (parsedEvent) {
                this.events.emit(parsedEvent.event, parsedEvent);
            }
        }
    }

    private getLabelsToFilter(schemaModel: Neo4jGraphQLSchemaModel): string[] {
        const uniqueLabels = new Set(schemaModel.concreteEntities.flatMap((e) => Array.from(e.labels)));

        return Array.from(uniqueLabels);
    }
}
