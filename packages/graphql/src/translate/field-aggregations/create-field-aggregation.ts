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
import { Node } from "../../classes";
import { Context, RelationField } from "../../types";
import { generateResultObject, getFieldType, AggregationType, wrapApocRun, getReferenceNode } from "./utils";
import * as AggregationQueryGenerators from "./aggregation-sub-queries";
import { createFieldAggregationAuth } from "./field-aggregations-auth";

const subQueryNodeAlias = "n";
const subQueryRelationAlias = "r";

export function createFieldAggregation({
    context,
    nodeLabel,
    node,
    field,
}: {
    context: Context;
    nodeLabel: string;
    node: Node;
    field: ResolveTree;
}): { query: string; params: Record<string, any> } | undefined {
    const relationAggregationField = node.relationFields.find((x) => {
        return `${x.fieldName}Aggregate` === field.name;
    });

    if (!relationAggregationField) return undefined;

    const referenceNode = getReferenceNode(context, relationAggregationField);
    if (!referenceNode) return undefined;

    const targetPattern = generateTargetPattern(nodeLabel, relationAggregationField, referenceNode);
    const fieldPathBase = `${node.name}${referenceNode.name}${relationAggregationField.fieldName}`;
    const aggregationField = field.fieldsByTypeName[`${fieldPathBase}AggregationResult`];

    const nodeField: Record<string, ResolveTree> | undefined =
        aggregationField.node?.fieldsByTypeName[`${fieldPathBase}AggregateSelection`];
    const edgeField: Record<string, ResolveTree> | undefined =
        aggregationField.edge?.fieldsByTypeName[`${fieldPathBase}EdgeAggregateSelection`];

    const authData = createFieldAggregationAuth({ node: referenceNode, context, subQueryNodeAlias });

    return {
        query: generateResultObject({
            count: aggregationField.count ? createCountQuery(targetPattern, subQueryNodeAlias, authData) : undefined,
            node: createAggregationQuery(targetPattern, nodeField, subQueryNodeAlias),
            edge: createAggregationQuery(targetPattern, edgeField, subQueryRelationAlias),
        }),
        params: authData.cypherParams,
    };
}

function generateTargetPattern(nodeLabel: string, relationField: RelationField, referenceNode: Node): string {
    const inStr = relationField.direction === "IN" ? "<-" : "-";
    const outStr = relationField.direction === "OUT" ? "->" : "-";
    const nodeOutStr = `(${subQueryNodeAlias}${referenceNode.labelString})`;

    return `(${nodeLabel})${inStr}[${subQueryRelationAlias}:${relationField.type}]${outStr}${nodeOutStr}`;
}

function createCountQuery(targetPattern: string, targetAlias: string, { cypherStrs, cypherParams }): string {
    const authParams: Record<string, string> = Object.keys(cypherParams).reduce((acc, key) => {
        acc[key] = `$${key}`;
        return acc;
    }, {});
    if (cypherStrs.length > 0) authParams.auth = "$auth";
    return wrapApocRun(AggregationQueryGenerators.countQuery(targetPattern, targetAlias, cypherStrs), authParams);
}

function createAggregationQuery(
    targetPattern: string,
    fields: Record<string, ResolveTree> | undefined,
    fieldAlias: string
): string | undefined {
    if (!fields) return undefined;

    return generateResultObject(
        Object.entries(fields).reduce((acc, [fieldName, field]) => {
            const fieldType = getFieldType(field);
            if (fieldType) {
                acc[fieldName] = wrapApocRun(getAggregationSubQuery(targetPattern, fieldName, fieldType, fieldAlias));
            }
            return acc;
        }, {} as Record<string, string>)
    );
}

function getAggregationSubQuery(
    targetPattern: string,
    fieldName: string,
    type: AggregationType,
    targetAlias: string
): string {
    switch (type) {
        case AggregationType.String:
        case AggregationType.Id:
            return AggregationQueryGenerators.stringAggregationQuery(targetPattern, fieldName, targetAlias);
        case AggregationType.Int:
        case AggregationType.BigInt:
        case AggregationType.Float:
            return AggregationQueryGenerators.numberAggregationQuery(targetPattern, fieldName, targetAlias);
        default:
            return AggregationQueryGenerators.defaultAggregationQuery(targetPattern, fieldName, targetAlias);
    }
}
