/*
 * Copyright (c) "Neo4j"
 * Neo4j Sweden AB [http://neo4j.com]
 */

import type { ConcreteEntityAdapter } from "../schema-model/entity/model-adapters/ConcreteEntityAdapter";
import type { RelationshipAdapter } from "../schema-model/relationship/model-adapters/RelationshipAdapter";
import { parseMutationField } from "../translate/queryAST/factory/parsers/parse-mutation-field";

export function findConflictingAttributes(
    fields: string[],
    entityOrRel: ConcreteEntityAdapter | RelationshipAdapter
): Set<string> {
    const fieldsByDbName = new Map<string, string[]>();

    for (const rawField of fields) {
        const { fieldName } = parseMutationField(rawField);
        const dbName = entityOrRel.findAttribute(fieldName)?.databaseName;
        if (dbName) {
            const duplicateFields = fieldsByDbName.get(dbName) ?? [];
            duplicateFields.push(rawField);
            fieldsByDbName.set(dbName, duplicateFields);
        }
    }

    const conflictingAttributes = new Set<string>();
    for (const dedupedProps of fieldsByDbName.values()) {
        if (dedupedProps.length > 1) {
            for (const fieldName of dedupedProps) {
                conflictingAttributes.add(fieldName);
            }
        }
    }
    return conflictingAttributes;
}
