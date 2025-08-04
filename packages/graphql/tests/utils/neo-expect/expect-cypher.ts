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

import type * as neo4j from "neo4j-driver";
import { isNeoInt } from "../../../src/utils/utils";
import type { CypherExecute } from "./neo-expect";
import { NeoExpect } from "./neo-expect";

export class NeoExpectCypher extends NeoExpect {
    private cypher: string;
    private params: Record<string, unknown>;

    constructor(executor: CypherExecute, cypher: string, params: Record<string, unknown> = {}) {
        super(executor);
        this.cypher = cypher;
        this.params = params;
    }

    /** Uses jest.toEqual matcher over the result of the type query */
    public async toEqual(expectation: Record<string, any>[]): Promise<void> {
        const result = await this.executeCypher(this.cypher, this.params);

        const rawResults = result.records.map((r) => r.toObject());
        const parsedResult = this.parseResult(rawResults);

        expect(parsedResult).toEqual(expectation);
    }

    protected parseResult(rawResults: neo4j.RecordShape[]): Record<string, any>[] {
        return rawResults.map((rawObject) => {
            return Object.entries(rawObject).reduce((acc, [key, value]) => {
                if (isNeoInt(value)) {
                    acc[key] = value.toNumber();
                } else {
                    acc[key] = value;
                }

                return acc;
            }, {});
        });
    }
}
