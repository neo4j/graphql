import { stringifyObject } from "./stringify-object";
import { escapeQuery } from "./escape-query";

/** Wraps a query inside an apoc call, escaping strings and serializing params */
export function wrapInApocRunFirstColumn(query: string, params: Record<string, string> = {}): string {
    const serializedParams = stringifyObject(params);
    const escapedQuery = escapeQuery(query);
    return `apoc.cypher.runFirstColumn(" ${escapedQuery} ", ${serializedParams})`;
}

export function serializeParamsForApocRun(params: Record<string, any>): Record<string, string> {
    return Object.keys(params).reduce((acc, key) => {
        acc[key] = `$${key}`;
        return acc;
    }, {});
}
