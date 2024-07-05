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

import type { AttributeAdapter } from "../../schema-model/attribute/model-adapters/AttributeAdapter";
import type { FilterOperator, RelationshipWhereOperator } from "../../translate/queryAST/ast/filters/Filter";

// TODO: remove Adapter dependency in v6
export function getFilterOperator(attribute: AttributeAdapter, operator: string): FilterOperator | undefined {
    if (attribute.typeHelper.isString() || attribute.typeHelper.isID()) {
        return getStringOperator(operator);
    }

    if (attribute.typeHelper.isBoolean()) {
        return getBooleanOperator(operator);
    }

    if (attribute.typeHelper.isNumeric() || attribute.typeHelper.isTemporal()) {
        return getNumberOperator(operator);
    }

    if (attribute.typeHelper.isSpatial()) {
        return getSpatialOperator(operator);
    }
}

function getSpatialOperator(operator: string): FilterOperator | undefined {
    // TODO: avoid this mapping
    const spatialOperator = {
        equals: "EQ",
        in: "IN",
        lt: "LT",
        lte: "LTE",
        gt: "GT",
        gte: "GTE",
        distance: "DISTANCE",
    };

    return spatialOperator[operator];
}

function getStringOperator(operator: string): FilterOperator | undefined {
    // TODO: avoid this mapping
    const stringOperatorMap = {
        equals: "EQ",
        in: "IN",
        matches: "MATCHES",
        contains: "CONTAINS",
        startsWith: "STARTS_WITH",
        endsWith: "ENDS_WITH",
    } as const;

    return stringOperatorMap[operator];
}

function getNumberOperator(operator: string): FilterOperator | undefined {
    // TODO: avoid this mapping
    const numberOperatorMap = {
        equals: "EQ",
        in: "IN",
        lt: "LT",
        lte: "LTE",
        gt: "GT",
        gte: "GTE",
    } as const;

    return numberOperatorMap[operator];
}

function getBooleanOperator(operator: string): FilterOperator | undefined {
    // TODO: avoid this mapping
    const numberOperatorMap = {
        equals: "EQ",
    } as const;

    return numberOperatorMap[operator];
}

export function getRelationshipOperator(operator: string): RelationshipWhereOperator {
    const relationshipOperatorMap = {
        all: "ALL",
        none: "NONE",
        single: "SINGLE",
        some: "SOME",
    } as const;

    return relationshipOperatorMap[operator];
}
