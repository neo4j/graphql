/*
 * Copyright (c) "Neo4j"
 * Neo4j Sweden AB [http://neo4j.com]
 */

import type { RelationshipNestedOperationsOption } from "../../constants";
import { ConcreteEntityAdapter } from "../../schema-model/entity/model-adapters/ConcreteEntityAdapter";
import type { InterfaceEntityAdapter } from "../../schema-model/entity/model-adapters/InterfaceEntityAdapter";
import type { RelationshipAdapter } from "../../schema-model/relationship/model-adapters/RelationshipAdapter";
import type { RelationshipDeclarationAdapter } from "../../schema-model/relationship/model-adapters/RelationshipDeclarationAdapter";
import type { Neo4jFeaturesSettings } from "../../types";

export function relationshipTargetHasRelationshipWithNestedOperation(
    target: ConcreteEntityAdapter | InterfaceEntityAdapter,
    nestedOperation: RelationshipNestedOperationsOption
): boolean {
    if (target instanceof ConcreteEntityAdapter) {
        return Array.from(target.relationships.values()).some((rel: RelationshipAdapter) =>
            rel.nestedOperations.has(nestedOperation)
        );
    }
    return Array.from(target.relationshipDeclarations.values()).some((rel: RelationshipDeclarationAdapter) =>
        rel.nestedOperations.has(nestedOperation)
    );
}

type DeprecationOptions = Exclude<Neo4jFeaturesSettings["excludeDeprecatedFields"], undefined>;

/** Returns true if the "excludeDeprecatedFields" flag is not set in the features option of Neo4jGraphQL for the chosen deprecation type */
export function shouldAddDeprecatedFields(
    features: Neo4jFeaturesSettings | undefined,
    deprecation: keyof DeprecationOptions
): boolean {
    return !features?.excludeDeprecatedFields?.[deprecation];
}
