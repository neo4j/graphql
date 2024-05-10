/*
 * Copyright (c) "Neo4j"
 * Neo4j Sweden AB [http://neo4j.com]
 *
 * This file is part of Neo4j.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
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
