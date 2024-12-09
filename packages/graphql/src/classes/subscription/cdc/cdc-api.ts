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
import type { Driver, QueryConfig } from "neo4j-driver";
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
            this.cursor = await this.fetchCurrentChangeId();
        }

        const cursorLiteral = new Cypher.Literal(this.cursor);

        const selectors = this.createQuerySelectors(labels);
        if (txFilter) {
            selectors.map((selector) => {
                selector.set("txMetadata", txFilter);
            });
        }

        const queryProcedure = Cypher.db.cdc.query(cursorLiteral, selectors);

        const events = await this.runProcedure<CDCQueryResponse>(queryProcedure);
        this.updateChangeIdWithLastEvent(events);
        return events;
    }

    public async updateCursor(): Promise<void> {
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
