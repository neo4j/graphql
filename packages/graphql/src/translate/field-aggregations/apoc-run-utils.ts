import { escapeQuery } from "./utils";
import { AggregationAuth } from "./field-aggregations-auth";

/** Wraps a query inside an apoc call, escaping strings and serializing params */
export function wrapApocRun(query: string, params: Record<string, string> = {}): string {
    const serializedParams = serializeObject(params);
    const escapedQuery = escapeQuery(query);
    return `head(apoc.cypher.runFirstColumn(" ${escapedQuery} ", ${serializedParams}))`;
}

export function serializeObject(fields: Record<string, string | undefined | null>): string {
    return `{ ${Object.entries(fields)
        .map(([key, value]): string | undefined => {
            if (value === undefined || value === null || value === "") return undefined;
            return `${key}: ${value}`;
        })
        .filter(Boolean)
        .join(", ")} }`;
}

export function serializeAuthParamsForApocRun(auth: AggregationAuth): Record<string, string> {
    const authParams = serializeParamsForApocRun(auth.params);
    if (auth.query) authParams.auth = "$auth";
    return authParams;
}

export function serializeParamsForApocRun(params: Record<string, any>): Record<string, string> {
    return Object.keys(params).reduce((acc, key) => {
        acc[key] = `$${key}`;
        return acc;
    }, {});
}
