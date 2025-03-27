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

import { DEPRECATED } from "../constants";
import type { ConcreteEntityAdapter } from "../schema-model/entity/model-adapters/ConcreteEntityAdapter";
import type { InterfaceEntityAdapter } from "../schema-model/entity/model-adapters/InterfaceEntityAdapter";
import type { RelationshipAdapter } from "../schema-model/relationship/model-adapters/RelationshipAdapter";
import type { RelationshipDeclarationAdapter } from "../schema-model/relationship/model-adapters/RelationshipDeclarationAdapter";

// TODO: Add constant deprecations here

export function DEPRECATE_SET_MUTATION(name: string) {
    return {
        name: DEPRECATED,
        args: {
            reason: `Please use the generic mutation '${name}: { set: ... } }' instead.`,
        },
    };
}

export function DEPRECATE_ARRAY_MUTATIONS(name: string, operation: "push" | "pop") {
    return {
        name: DEPRECATED,
        args: {
            reason: `Please use the generic mutation '${name}: { ${operation}: ... } }' instead.`,
        },
    };
}

export function DEPRECATE_MATH_MUTATIONS(name: string, operation: string) {
    return {
        name: DEPRECATED,
        args: {
            reason: `Please use the relevant generic mutation '${name}: { ${operation}: ... } }' instead.`,
        },
    };
}

export function DEPRECATE_AGGREGATION_FILTERS(name: string, aggregationOperation: string, operator: string) {
    let newOperator = operator.toLowerCase();
    if (newOperator === "equal") {
        newOperator = "eq";
    }

    return {
        name: DEPRECATED,
        args: {
            reason: `Please use the relevant generic filter '${name}: { ${aggregationOperation}: { ${newOperator}: ... } } }' instead.`,
        },
    };
}

export function DEPRECATE_AGGREGATION(entity: ConcreteEntityAdapter | InterfaceEntityAdapter) {
    return {
        name: DEPRECATED,
        args: {
            reason: `Please use the explicit field "aggregate" inside "${entity.operations.rootTypeFieldNames.connection}" instead`,
        },
    };
}

export function DEPRECATE_NESTED_AGGREGATION(relationship: RelationshipAdapter | RelationshipDeclarationAdapter) {
    return {
        name: DEPRECATED,
        args: {
            reason: `Please use field "aggregate" inside "${relationship.operations.connectionFieldName}" instead`,
        },
    };
}

export function DEPRECATE_UPDATE_WHERE(
    relationship: RelationshipAdapter | RelationshipDeclarationAdapter,
    ifUnionMemberEntity?: ConcreteEntityAdapter
) {
    return {
        name: DEPRECATED,
        args: {
            reason: `Please use field "where" inside "${relationship.operations.getUpdateConnectionInputTypename(ifUnionMemberEntity)}" instead`,
        },
    };
}
