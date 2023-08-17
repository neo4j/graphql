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

import type { ResolveTree } from "graphql-parse-resolve-info";
import type { Node, Relationship } from "../../classes";
import type { RelationField, ConnectionField } from "../../types";
import type { Neo4jGraphQLTranslationContext } from "../../types/neo4j-graphql-translation-context";

export enum AggregationType {
    Int = "IntAggregateSelection",
    String = "StringAggregateSelection",
    BigInt = "BigIntAggregateSelection",
    Float = "FloatAggregateSelection",
    Id = "IDAggregateSelection",
    DateTime = "DateTimeAggregateSelection",
}

export function getFieldType(field: ResolveTree): AggregationType | undefined {
    for (const candidateField of Object.values(AggregationType)) {
        if (
            field.fieldsByTypeName[`${candidateField}NonNullable`] ||
            field.fieldsByTypeName[`${candidateField}Nullable`]
        )
            return candidateField;
    }
    return undefined;
}

export function getReferenceNode(
    context: Neo4jGraphQLTranslationContext,
    relationField: RelationField
): Node | undefined {
    return context.nodes.find((x) => x.name === relationField.typeMeta.name);
}

export function getReferenceRelation(
    context: Neo4jGraphQLTranslationContext,
    connectionField: ConnectionField
): Relationship | undefined {
    return context.relationships.find((x) => x.name === connectionField.relationshipTypeName);
}

export function getFieldByName(name: string, fields: Record<string, ResolveTree>): ResolveTree | undefined {
    return Object.values(fields).find((tree) => tree.name === name);
}
