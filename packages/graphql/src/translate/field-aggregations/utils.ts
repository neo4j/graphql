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

import { ResolveTree } from "graphql-parse-resolve-info";
import { Integer } from "neo4j-driver";
import { Node, Relationship } from "../../classes";
import { Context, RelationField, ConnectionField } from "../../types";
import { isNeoInt, isString, NestedRecord } from "../../utils/utils";

export enum AggregationType {
    Int = "IntAggregateSelection",
    String = "StringAggregateSelection",
    BigInt = "BigIntAggregateSelection",
    Float = "FloatAggregateSelection",
    Id = "IDAggregateSelection",
    DateTime = "DateTimeAggregateSelection",
}

type FieldRecord = NestedRecord<string | undefined | null | Integer | FieldRecord[]>;

export function generateResultObject(fields: FieldRecord): string {
    return `{ ${Object.entries(fields)
        .map(([key, value]): string | undefined => {
            if (value === undefined || value === null || value === "") return undefined;
            if (isNeoInt(value)) {
                return `${key}: ${value}`;
            }
            if (Array.isArray(value)) {
                const array2 = value
                    .map((x) => {
                        if (typeof x === "object" && !isNeoInt(x)) {
                            return generateResultObject(x);
                        }
                        return x;
                    })
                    .join(",");
                return `${key}: [${array2}]`;
            }
            if (typeof value === "object") {
                return `${key}: ${generateResultObject(value)}`;
            }
            return `${key}: ${value}`;
        })
        .filter(Boolean)
        .join(", ")} }`;
}

export function serializeParams(params: FieldRecord): NestedRecord<string> {
    return Object.entries(params).reduce((acc, [key, value]) => {
        acc[key] = serializeParam(value);
        return acc;
    }, {});
}

// TODO: improve types
function serializeParam(
    value: FieldRecord[0]
): NestedRecord<string | Integer> | string | Integer | undefined | Array<any> {
    if (isNeoInt(value)) {
        return value;
    }
    if (isString(value)) {
        return `"${value}"`;
    }
    if (Array.isArray(value)) {
        return value.map((x) => serializeParam(x));
    }
    if (typeof value === "object") {
        return serializeParams(value as any);
    }
    if (value) {
        return value;
    }
    return undefined;
}

export function getFieldType(field: ResolveTree): AggregationType | undefined {
    for (const candidateField of Object.values(AggregationType)) {
        if (field.fieldsByTypeName[candidateField]) return candidateField;
    }
    return undefined;
}

/** Wraps a query inside an apoc call, correctly escaping strings and params */
export function wrapApocRun(query: string, extraParams: NestedRecord<string | Integer> = {}): string {
    const params = generateResultObject(extraParams);
    const escapedQuery = escapeQuery(query);
    return `head(apoc.cypher.runFirstColumn(" ${escapedQuery} ", ${params}))`;
}

export function getReferenceNode(context: Context, relationField: RelationField): Node | undefined {
    return context.neoSchema.nodes.find((x) => x.name === relationField.typeMeta.name);
}

export function getReferenceRelation(context: Context, connectionField: ConnectionField): Relationship | undefined {
    return context.neoSchema.relationships.find((x) => x.name === connectionField.relationshipTypeName);
}

export function escapeQuery(query: string): string {
    return query.replace(/("|')/g, "\\$1");
}

export function getFieldByName(name: string, fields: Record<string, ResolveTree>): ResolveTree | undefined {
    return Object.values(fields).find((tree) => {
        return tree.name === name;
    });
}
