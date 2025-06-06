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

import Cypher from "@neo4j/cypher-builder";
import type { Driver, Integer, QueryConfig } from "neo4j-driver";
import { Neo4jError } from "neo4j-driver";
import { errorHasGQLStatus } from "../../../utils/error-has-gql-status";
import type { CDCQueryResponse } from "./cdc-types";

export class CDCApi {
    private driver: Driver;
    private cursor: string = "";
    private queryConfig: QueryConfig | undefined;

    constructor(driver: Driver, queryConfig?: QueryConfig) {
        this.driver = driver;
        this.queryConfig = queryConfig;
    }

    /** Queries events since last call to queryEvents */
    public async queryEvents(labels?: string[], txFilter?: Cypher.Map): Promise<CDCQueryResponse[]> {
        if (!this.cursor) {
            // Resets cursor if it doesn't exists
            await this.refreshCursor();
        }

        const cdcSelectors = this.createQuerySelectors(labels);
        if (txFilter) {
            cdcSelectors.map((selector) => {
                selector.set("txMetadata", txFilter);
            });
        }

        const cdcQueryProcedure = this.createCDCQuery(this.cursor, cdcSelectors);

        try {
            const events = await this.runProcedure<CDCQueryResponse & { currentId: string; eventCount: Integer }>(
                cdcQueryProcedure
            );

            const firstEventOrNull = events[0];
            if (!firstEventOrNull) {
                throw new Error(
                    "No records found on CDC transaction, this is likely a problem with the GraphQL library, please reach support"
                );
            }

            // If no events are returned, update the cursor id wit hthe current change ID to avoid a stale cursor
            if (firstEventOrNull.eventCount.toInt() === 0) {
                this.cursor = firstEventOrNull.currentId;
                return [];
            }

            this.updateChangeIdWithLastEvent(events);
            return events;
        } catch (err) {
            if (err instanceof Neo4jError) {
                // Cursor is stale, needs to be reset
                // Events between this error and the next poll will be lost
                if (
                    errorHasGQLStatus(err, "52N27") ||
                    errorHasGQLStatus(err, "52N28") ||
                    errorHasGQLStatus(err, "52N29") ||
                    errorHasGQLStatus(err, "52N30") ||
                    err.code === "Neo.ClientError.ChangeDataCapture.InvalidIdentifier"
                ) {
                    console.warn(err);
                    await this.refreshCursor();
                    return [];
                }
            }
            throw err;
        }
    }

    public async refreshCursor(): Promise<void> {
        this.cursor = await this.fetchCurrentChangeId();
    }

    private async fetchCurrentChangeId(): Promise<string> {
        const currentProcedure = Cypher.db.cdc.current();

        const result = await this.runProcedure<{ id: string }>(currentProcedure);

        if (result[0] && result[0].id) {
            return result[0].id;
        } else {
            throw new Error("id not available on cdc.current");
        }
    }

    private createCDCQuery(cursor: string, cdcSelectors: Cypher.Map[]): Cypher.Clause {
        const cursorLiteral = new Cypher.Literal(cursor);

        const currentId = new Cypher.NamedVariable("currentId");
        const changeId = new Cypher.NamedVariable("id");
        const event = new Cypher.NamedVariable("event");
        const metadata = new Cypher.NamedVariable("metadata");
        const txId = new Cypher.NamedVariable("txId");
        const seq = new Cypher.NamedVariable("seq");

        return Cypher.utils.concat(
            Cypher.db.cdc.current().yield(["id", currentId]),
            Cypher.db.cdc
                .query(cursorLiteral, cdcSelectors)
                .optional()
                .yield(["id", changeId], "txId", "seq", "event", "metadata")
                .with("*")
                .orderBy([txId, "ASC"], [seq, "ASC"])
                .return(currentId, changeId, event, metadata, [Cypher.count(changeId), "eventCount"])
        );
    }

    private updateChangeIdWithLastEvent(events: CDCQueryResponse[]): void {
        const lastEvent = events[events.length - 1];
        if (lastEvent) {
            this.cursor = lastEvent.id;
        }
    }

    private createQuerySelectors(labels: string[] | undefined): Cypher.Map[] {
        if (labels) {
            return labels.map(
                (l) =>
                    new Cypher.Map({
                        select: new Cypher.Literal("n"),
                        labels: new Cypher.Literal([l]),
                    })
            );
        } else {
            // Filters nodes
            return [
                new Cypher.Map({
                    select: new Cypher.Literal("n"),
                }),
            ];
        }
    }

    private async runProcedure<T>(procedure: Cypher.Clause): Promise<T[]> {
        const { cypher, params } = procedure.build();
        const result = await this.driver.executeQuery(cypher, params, this.queryConfig);
        return result.records.map((record) => {
            return record.toObject() as Record<string, any>;
        }) as T[];
    }
}
