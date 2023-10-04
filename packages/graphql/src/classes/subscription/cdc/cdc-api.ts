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
import type { Driver } from "neo4j-driver";
import type { CDCEvent, CDCQueryResponse } from "./cdc-types";

export class CDCApi {
    private driver: Driver;
    private token: string = "";

    constructor(driver: Driver) {
        this.driver = driver;
    }

    public async queryEvents(): Promise<CDCEvent[]> {
        if (!this.token) {
            this.token = await this.fetchCurrentToken();
        }

        const tokenLiteral = new Cypher.Literal(this.token);
        const queryProcedure = CDCCypher.query(tokenLiteral).yield("id", "event");

        const events = await this.runProcedure<CDCQueryResponse>(queryProcedure);

        this.updateTokenWithLastEvent(events);
        return events.map((query) => query.event);
    }

    private async fetchCurrentToken(): Promise<string> {
        const currentProcedure = CDCCypher.current();

        const result = await this.runProcedure<{ id: string }>(currentProcedure);
        return result[0]!.id;
    }

    private updateTokenWithLastEvent(events: CDCQueryResponse[]): void {
        const lastEvent = events[events.length - 1];
        if (lastEvent) {
            this.token = lastEvent.id;
        }
    }

    private async runProcedure<T>(procedure: Cypher.Clause): Promise<T[]> {
        const { cypher, params } = procedure.build();

        const result = await this.driver.executeQuery(cypher, params);
        return result.records.map((record) => {
            return record.toObject() as Record<string, any>;
        }) as T[];
    }
}

/** Wrapper of Cypher Builder for CDC */
class CDCCypher {
    static current(): Cypher.Procedure {
        return new Cypher.Procedure<"id">("cdc.current");
    }

    static query(token: Cypher.Expr): Cypher.Procedure {
        return new Cypher.Procedure<"id" | "txId" | "seq" | "metadata" | "event">("cdc.query", [token]);
    }
}
