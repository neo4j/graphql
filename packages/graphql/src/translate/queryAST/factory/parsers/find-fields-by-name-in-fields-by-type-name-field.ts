/*
 * Copyright (c) "Neo4j"
 * Neo4j Sweden AB [http://neo4j.com]
 */

import type { FieldsByTypeName, ResolveTree } from "graphql-parse-resolve-info";
/**
 *  Given a `FieldsByTypeName` object field and a field name to search, return an array of `ResolveTree`s with the matched fields.
 **/
export function findFieldsByNameInFieldsByTypeNameField(
    fieldsByTypeNameField: FieldsByTypeName[string],
    fieldName: string
): ResolveTree[] {
    return Object.values(fieldsByTypeNameField).filter((resolveTreeField) => resolveTreeField.name === fieldName);
}
