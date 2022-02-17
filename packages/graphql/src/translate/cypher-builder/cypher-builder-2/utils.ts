import { Param } from "./cypher-builder-references";

export function convertToCypherParams<T>(original: Record<string, T>): Record<string, Param<T>> {
    return Object.entries(original).reduce((acc, [key, value]) => {
        acc[key] = new Param(value);
        return acc;
    }, {});
}
