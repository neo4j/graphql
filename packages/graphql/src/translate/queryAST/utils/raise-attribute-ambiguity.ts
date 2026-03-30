/*
 * Copyright (c) "Neo4j"
 * Neo4j Sweden AB [http://neo4j.com]
 */

import { Neo4jGraphQLError } from "../../../classes";
import type { ConcreteEntityAdapter } from "../../../schema-model/entity/model-adapters/ConcreteEntityAdapter";
import { RelationshipAdapter } from "../../../schema-model/relationship/model-adapters/RelationshipAdapter";
import { findConflictingAttributes } from "../../../utils/find-conflicting-properties";
import { isConcreteEntity } from "./is-concrete-entity";

// Schema Model version of findConflictingProperties
export function raiseAttributeAmbiguity(
    properties: Set<string> | Array<string>,
    entityOrRel?: ConcreteEntityAdapter | RelationshipAdapter
): void {
    if (!entityOrRel) {
        return;
    }
    const hash = {};
    properties.forEach((property) => {
        if (isConcreteEntity(entityOrRel) && entityOrRel.relationships.get(property)) {
            return;
        }
        const dbName = entityOrRel.findAttribute(property)?.databaseName;
        if (dbName === undefined) {
            throw new Error(
                `Transpile Error: Impossible to translate property ${property} on entity ${entityOrRel.name}`
            );
        }
        if (hash[dbName]) {
            throw new Neo4jGraphQLError(
                `Conflicting modification of ${[hash[dbName], property].map((n) => `[[${n}]]`).join(", ")} on type ${
                    entityOrRel.name
                }`
            );
        }
        hash[dbName] = property;
    });
}

// Schema Model version of assertNonAmbiguousUpdate
export function raiseAttributeAmbiguityForUpdate(
    properties: Array<string>,
    entityOrRel?: ConcreteEntityAdapter | RelationshipAdapter
): void {
    if (!entityOrRel) {
        return;
    }

    const conflictingAttributes = findConflictingAttributes(properties, entityOrRel);
    if (conflictingAttributes.size > 0) {
        const conflictingAttributesString = Array.from(conflictingAttributes).map((attribute) => `[[${attribute}]]`);
        //This will only throw on the first conflicting attribute through

        const typeName =
            entityOrRel instanceof RelationshipAdapter
                ? `${entityOrRel.source.name}.${entityOrRel.name}`
                : `${entityOrRel.name}`;
        throw new Neo4jGraphQLError(
            `Conflicting modification of ${conflictingAttributesString.join(", ")} on type ${typeName}`
        );
    }
}
