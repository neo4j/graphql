import { Integer } from "neo4j-driver";
import { isNeoInt, isString, NestedRecord } from "../../utils/utils";
import { escapeQuery } from "./utils";
import { AggregationAuth } from "./field-aggregations-auth";

export type FieldRecord = NestedRecord<string | undefined | null | Integer | Array<string | Integer | FieldRecord>>;

/** Wraps a query inside an apoc call, escaping strings and serializing params */
export function wrapApocRun(query: string, params: FieldRecord = {}): string {
    const serializedParams = serializeResultObject(params);
    const escapedQuery = escapeQuery(query);
    return `head(apoc.cypher.runFirstColumn(" ${escapedQuery} ", ${serializedParams}))`;
}

export function serializeResultObject(fields: FieldRecord): string {
    return `{ ${Object.entries(fields)
        .map(([key, value]): string | undefined => {
            if (value === undefined || value === null || value === "") return undefined;

            if (Array.isArray(value)) {
                const array = value
                    .map((x) => {
                        if (typeof x === "object" && !isNeoInt(x)) {
                            return serializeResultObject(x);
                        }
                        return x;
                    })
                    .join(",");
                return `${key}: [${array}]`;
            }
            if (typeof value === "object" && !isNeoInt(value)) {
                return `${key}: ${serializeResultObject(value)}`;
            }
            return `${key}: ${value}`;
        })
        .filter(Boolean)
        .join(", ")} }`;
}

export function getAuthApocParams(auth: AggregationAuth): Record<string, string> {
    const authParams: Record<string, string> = Object.keys(auth.params).reduce((acc, key) => {
        acc[key] = `$${key}`;
        return acc;
    }, {});
    if (auth.query) authParams.auth = "$auth";
    return authParams;
}

export function escapeStringParams(params: FieldRecord): FieldRecord {
    return Object.entries(params).reduce((acc, [key, value]) => {
        acc[key] = escapeStringParam(value);
        return acc;
    }, {});
}

function escapeStringParam(value: FieldRecord[0]): any {
    if (isNeoInt(value)) {
        return value;
    }
    if (isString(value)) {
        return `"${value}"`;
    }
    if (Array.isArray(value)) {
        return value.map((x) => escapeStringParam(x));
    }
    if (value && typeof value === "object") {
        return escapeStringParams(value);
    }
    return value;
}
