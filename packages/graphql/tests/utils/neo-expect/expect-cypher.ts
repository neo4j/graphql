/*
 * Copyright (c) "Neo4j"
 * Neo4j Sweden AB [http://neo4j.com]
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
