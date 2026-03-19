/*
 * Copyright (c) "Neo4j"
 * Neo4j Sweden AB [http://neo4j.com]
 */

import type { ResolveTree } from "graphql-parse-resolve-info";
import { removeDuplicates } from "../../utils/utils";

/** Finds a resolve tree of selection based on field name */
export function getResolveTreeByFieldName({
    fieldName,
    selection,
}: {
    fieldName: string;
    selection: Record<string, ResolveTree>;
}): ResolveTree | undefined {
    return Object.values(selection).find((resolveTree) => resolveTree.name === fieldName);
}

/** Finds an aliased resolve tree of selection based on field name */
export function getAliasedResolveTreeByFieldName({
    fieldName,
    selection,
}: {
    fieldName: string;
    selection: Record<string, ResolveTree>;
}): ResolveTree | undefined {
    return Object.values(selection).find(
        (resolveTree) => resolveTree.name === fieldName && resolveTree.alias !== fieldName
    );
}

/** Generates a field to be used in creating projections */
export function generateResolveTree({
    name,
    alias,
    args = {},
    fieldsByTypeName = {},
}: Pick<ResolveTree, "name"> & Partial<ResolveTree>): Record<string, ResolveTree> {
    return {
        [name]: {
            name,
            alias: alias ?? name,
            args,
            fieldsByTypeName,
        },
    };
}

/** Generates missing fields based on an array of fieldNames */
export function generateMissingOrAliasedFields({
    fieldNames,
    selection,
}: {
    selection: Record<string, ResolveTree>;
    fieldNames: string[];
}): Record<string, ResolveTree> {
    return removeDuplicates(fieldNames).reduce((acc, fieldName) => {
        const exists = getResolveTreeByFieldName({ fieldName, selection });
        const aliased = getAliasedResolveTreeByFieldName({ fieldName, selection });
        if (!exists || aliased) {
            return { ...acc, ...generateResolveTree({ name: fieldName }) };
        }
        return acc;
    }, {});
}
