import { ResolveTree } from "graphql-parse-resolve-info";

export enum AggregationType {
    Int = "IntAggregateSelection",
    String = "StringAggregateSelection",
    BigInt = "BigIntAggregateSelection",
    Float = "FloatAggregateSelection",
    Id = "IDAggregateSelection",
}

export function generateResultObject(fields: Record<string, string | undefined>): string {
    return `{ ${Object.entries(fields)
        .map(([key, value]: [string, string | undefined]): string | undefined => {
            if (!value) return undefined;
            return `${key}: ${value}`;
        })
        .filter(Boolean)
        .join(", ")} }`;
}

export function getFieldType(field: ResolveTree): AggregationType | undefined {
    if (field.fieldsByTypeName[AggregationType.Int]) return AggregationType.Int;
    if (field.fieldsByTypeName[AggregationType.String]) return AggregationType.String;
    return undefined;
}
