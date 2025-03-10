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

export const DEPRECATE_IMPLICIT_EQUAL_FILTERS = {
    name: DEPRECATED,
    args: {
        reason: "Please use the explicit _EQ version",
    },
};

export const DEPRECATE_OPTIONS_ARGUMENT = {
    name: DEPRECATED,
    args: {
        reason: "Query options argument is deprecated, please use pagination arguments like limit, offset and sort instead.",
    },
};

export const DEPRECATE_DIRECTED_ARGUMENT = {
    name: DEPRECATED,
    args: {
        reason: "The directed argument is deprecated, and the direction of the field will be configured in the GraphQL server",
    },
};

export const DEPRECATE_IMPLICIT_SET = {
    name: DEPRECATED,
    args: {
        reason: "Please use the explicit _SET field",
    },
};

export const DEPRECATE_CONNECT_OR_CREATE = {
    name: DEPRECATED,
    args: {
        reason: "The connectOrCreate operation is deprecated and will be removed",
    },
};

export const DEPRECATE_OVERWRITE = {
    name: DEPRECATED,
    args: {
        reason: "The overwrite argument is deprecated and will be removed",
    },
};

export const DEPRECATE_ID_AGGREGATION = {
    name: DEPRECATED,
    args: {
        reason: "aggregation of ID fields are deprecated and will be removed",
    },
};

export const DEPRECATE_TYPENAME_IN = {
    name: DEPRECATED,
    args: {
        reason: "The typename_IN filter is deprecated, please use the typename filter instead",
    },
};

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
