/*
 * Copyright (c) "Neo4j"
 * Neo4j Sweden AB [http://neo4j.com]
 */

import type { FieldsByTypeName, ResolveTree } from "graphql-parse-resolve-info";
import { deepMerge } from "../../../../utils/deep-merge";
import { asArray } from "../../../../utils/utils";

/**
 * Given a `ResolveTree` or array of `ResolveTree`s and a list of typeNames, return a `FieldsByTypeName` object field with the matched fields.
 */
export function getFieldsByTypeName(
    resolveTree: ResolveTree | ResolveTree[],
    typeNames: string | string[]
): FieldsByTypeName[string] {
    return deepMerge(
        asArray(resolveTree).map((resolveTreeField): FieldsByTypeName[string] => {
            return asArray(typeNames).reduce((acc, typeName): FieldsByTypeName[string] => {
                return { ...acc, ...resolveTreeField?.fieldsByTypeName[typeName] };
            }, {});
        })
    );
}
