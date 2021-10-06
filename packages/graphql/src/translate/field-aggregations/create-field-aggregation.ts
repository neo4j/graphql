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
import { Node, Relationship } from "../../classes";
import { Context, RelationField } from "../../types";
import { generateResultObject, getFieldType, AggregationType, wrapApocRun, getReferenceNode } from "./utils";
import * as AggregationQueryGenerators from "./aggregation-sub-queries";
import { createFieldAggregationAuth, AggregationAuth } from "./field-aggregations-auth";
import { createMatchWherePattern } from "./aggregation-sub-queries";

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

    const nodeFields: Record<string, ResolveTree> | undefined =
        aggregationField.node?.fieldsByTypeName[`${fieldPathBase}AggregateSelection`];
    const edgeFields: Record<string, ResolveTree> | undefined =
        aggregationField.edge?.fieldsByTypeName[`${fieldPathBase}EdgeAggregateSelection`];

    const relationship = (context.neoSchema.relationships.find(
        (x) => x.properties === relationAggregationField.properties
    ) as unknown) as Relationship;

    const authData = createFieldAggregationAuth({
        node: referenceNode,
        context,
        subQueryNodeAlias,
        nodeFields,
        relationship,
    });

    // const datetimeElement = createDatetimeElement({
    //     resolveTree: field,
    //     field: relationAggregationField,
    //     variable: subQueryNodeAlias,
    //     valueOverride: `max(n.${relationAggregationField.fieldName})`,
    // });
    // console.log(datetimeElement);

    const matchWherePattern = createMatchWherePattern(targetPattern, authData);

    return {
        query: generateResultObject({
            count: aggregationField.count
                ? createCountQuery(matchWherePattern, subQueryNodeAlias, authData)
                : undefined,
            node: createAggregationQuery(matchWherePattern, nodeFields, subQueryNodeAlias, authData),
            edge: createAggregationQuery(matchWherePattern, edgeFields, subQueryRelationAlias, authData),
        }),
        params: authData.params,
    };
}

function generateTargetPattern(nodeLabel: string, relationField: RelationField, referenceNode: Node): string {
    const inStr = relationField.direction === "IN" ? "<-" : "-";
    const outStr = relationField.direction === "OUT" ? "->" : "-";
    const nodeOutStr = `(${subQueryNodeAlias}${referenceNode.labelString})`;

    return `(${nodeLabel})${inStr}[${subQueryRelationAlias}:${relationField.type}]${outStr}${nodeOutStr}`;
}

function createCountQuery(matchWherePattern: string, targetAlias: string, auth: AggregationAuth): string {
    const authParams = getAuthApocParams(auth);
    return wrapApocRun(AggregationQueryGenerators.countQuery(matchWherePattern, targetAlias), authParams);
}

function createAggregationQuery(
    matchWherePattern: string,
    fields: Record<string, ResolveTree> | undefined,
    fieldAlias: string,
    auth: AggregationAuth
): string | undefined {
    if (!fields) return undefined;
    const authParams = getAuthApocParams(auth);

    return generateResultObject(
        Object.entries(fields).reduce((acc, [fieldName, field]) => {
            const fieldType = getFieldType(field);
            acc[fieldName] = wrapApocRun(
                getAggregationSubQuery(matchWherePattern, fieldName, fieldType, fieldAlias),
                authParams
            );
            return acc;
        }, {} as Record<string, string>)
    );
}

function getAggregationSubQuery(
    matchWherePattern: string,
    fieldName: string,
    type: AggregationType | undefined,
    targetAlias: string
): string {
    switch (type) {
        case AggregationType.String:
        case AggregationType.Id:
            return AggregationQueryGenerators.stringAggregationQuery(matchWherePattern, fieldName, targetAlias);
        case AggregationType.Int:
        case AggregationType.BigInt:
        case AggregationType.Float:
            return AggregationQueryGenerators.numberAggregationQuery(matchWherePattern, fieldName, targetAlias);
        case AggregationType.DateTime:
            return AggregationQueryGenerators.dateTimeAggregationQuery(matchWherePattern, fieldName, targetAlias);
        default:
            // TODO: take datetime into account
            return AggregationQueryGenerators.defaultAggregationQuery(matchWherePattern, fieldName, targetAlias);
    }
}

function getAuthApocParams(auth: AggregationAuth): Record<string, string> {
    const authParams: Record<string, string> = Object.keys(auth.params).reduce((acc, key) => {
        acc[key] = `$${key}`;
        return acc;
    }, {});
    if (auth.query) authParams.auth = "$auth";
    return authParams;
}
