/*
 * Copyright (c) "Neo4j"
 * Neo4j Sweden AB [http://neo4j.com]
 */

import type * as Cypher from "@neo4j/cypher-builder";
import * as neo4j from "neo4j-driver";
import { isNeoInt } from "../../../src/utils/utils";

export type CypherExecute = (query: string, params: Record<string, unknown>) => Promise<neo4j.QueryResult>;

export class NeoAssertionError extends Error {}

export abstract class NeoExpect {
    private executor: CypherExecute;

    constructor(executor: CypherExecute) {
        this.executor = executor;
    }

    protected executeCypher(query: string, params: Record<string, unknown> = {}): Promise<neo4j.QueryResult> {
        return this.executor(query, params);
    }

    /** Parse a column */
    protected parseColumn<T = unknown>(rawResults: neo4j.QueryResult, columnName: Cypher.NamedVariable | string): T[] {
        const columnNameStr = this.getColumnName(columnName);

        return rawResults.records.map((r) => {
            const rawObject = r.toObject()[columnNameStr];
            return this.parseRawValue(rawObject);
        });
    }

    protected executeCypherClause(clause: Cypher.Clause): Promise<neo4j.QueryResult> {
        const { cypher, params } = clause.build();
        return this.executeCypher(cypher, params);
    }

    /** Parses the first element of a column */
    protected parseColumnFirst<T = unknown>(
        rawResults: neo4j.QueryResult,
        columnName: Cypher.NamedVariable | string
    ): T {
        const columnNameStr = this.getColumnName(columnName);
        const rawItem: neo4j.Integer = rawResults.records[0]?.toObject()[columnNameStr];
        return this.parseRawValue(rawItem);
    }

    private getColumnName(columnName: Cypher.NamedVariable | string): string {
        return typeof columnName === "string" ? columnName : columnName.id;
    }

    private parseRawObject(record: neo4j.RecordShape): Record<string, any> {
        return Object.entries(record).reduce((acc, [key, value]) => {
            acc[key] = this.parseRawValue(value);

            return acc;
        }, {});
    }

    private parseRawValue(value: unknown): any {
        if (isNeoInt(value)) {
            if (!value.inSafeRange()) {
                throw new Error("Big Int not supported in neo-expect");
            }
            return value.toNumber();
        }

        if (neo4j.isDateTime(value) || neo4j.isLocalDateTime(value) || neo4j.isDate(value)) {
            return value.toStandardDate();
        }

        if (
            neo4j.isDuration(value) ||
            neo4j.isLocalTime(value) ||
            neo4j.isPoint(value) ||
            neo4j.isNode(value) ||
            neo4j.isRelationship(value) ||
            neo4j.isPath(value) ||
            neo4j.isTime(value)
        ) {
            throw new Error("Type not supported in neo-expect");
        }

        const isObject = typeof value === "object" && !Array.isArray(value) && value !== null;

        if (isObject) {
            return this.parseRawObject(value);
        } else {
            return value;
        }
    }
}
