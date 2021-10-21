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
import { upperFirst } from "graphql-compose";
import { Node, Relationship } from "../../classes";
import { Context, RelationField, GraphQLWhereArg } from "../../types";
import {
    generateResultObject,
    getFieldType,
    AggregationType,
    wrapApocRun,
    getReferenceNode,
    getFieldByName,
    getReferenceRelation,
    serializeParams,
} from "./utils";
import * as AggregationSubQueries from "./aggregation-sub-queries";
import { createFieldAggregationAuth, AggregationAuth } from "./field-aggregations-auth";
import { createMatchWherePattern } from "./aggregation-sub-queries";
import { FieldAggregationSchemaTypes } from "../../schema/field-aggregation-composer";
import mapToDbProperty from "../../utils/map-to-db-property";
import createWhereAndParams from "../create-where-and-params";
import { NestedRecord } from "../../utils/utils";

const subQueryNodeAlias = "n";
const subQueryRelationAlias = "r";

type AggregationFields = {
    count?: ResolveTree;
    node?: Record<string, ResolveTree>;
    edge?: Record<string, ResolveTree>;
};

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

    const connectionField = node.connectionFields.find((x) => {
        return `${relationAggregationField?.fieldName}Connection` === x.fieldName;
    });

    if (!relationAggregationField || !connectionField) return undefined;
    const referenceNode = getReferenceNode(context, relationAggregationField);
    const referenceRelation = getReferenceRelation(context, connectionField);

    if (!referenceNode || !referenceRelation) return undefined;

    const fieldPathBase = `${node.name}${referenceNode.name}${upperFirst(relationAggregationField.fieldName)}`;
    const aggregationFields = getAggregationFields(fieldPathBase, field);
    const authData = createFieldAggregationAuth({
        node: referenceNode,
        context,
        subQueryNodeAlias,
        nodeFields: aggregationFields.node,
    });
    const targetPattern = generateTargetPattern(nodeLabel, relationAggregationField, referenceNode, context);

    const whereInput = (field.args.where as GraphQLWhereArg) || {};

    const [whereQuery, whereParams] = createWhereAndParams({
        whereInput,
        varName: subQueryNodeAlias,
        node: referenceNode,
        context,
        recursing: true,
    });
    const serializedWhereParams = serializeParams(whereParams);
    const matchWherePattern = createMatchWherePattern(targetPattern, authData, whereQuery);

    return {
        query: generateResultObject({
            count: aggregationFields.count
                ? createCountQuery({
                      nodeLabel,
                      matchWherePattern,
                      targetAlias: subQueryNodeAlias,
                      auth: authData,
                      whereParams: serializedWhereParams,
                  })
                : undefined,
            node: createAggregationQuery({
                nodeLabel,
                matchWherePattern,
                fields: aggregationFields.node,
                fieldAlias: subQueryNodeAlias,
                auth: authData,
                graphElement: referenceNode,
                whereParams: serializedWhereParams,
            }),
            edge: createAggregationQuery({
                nodeLabel,
                matchWherePattern,
                fields: aggregationFields.edge,
                fieldAlias: subQueryRelationAlias,
                auth: authData,
                graphElement: referenceRelation,
                whereParams: serializedWhereParams,
            }),
        }),
        params: { ...authData.params, ...whereParams },
    };
}

function getAggregationFields(fieldPathBase: string, field: ResolveTree): AggregationFields {
    const aggregationFields = field.fieldsByTypeName[`${fieldPathBase}${FieldAggregationSchemaTypes.field}`];
    const node: Record<string, ResolveTree> | undefined = getFieldByName("node", aggregationFields)?.fieldsByTypeName[
        `${fieldPathBase}${FieldAggregationSchemaTypes.node}`
    ];

    const edge: Record<string, ResolveTree> | undefined = getFieldByName("edge", aggregationFields)?.fieldsByTypeName[
        `${fieldPathBase}${FieldAggregationSchemaTypes.edge}`
    ];

    const count = getFieldByName("count", aggregationFields);

    return { count, edge, node };
}

function generateTargetPattern(
    nodeLabel: string,
    relationField: RelationField,
    referenceNode: Node,
    context: Context
): string {
    const inStr = relationField.direction === "IN" ? "<-" : "-";
    const outStr = relationField.direction === "OUT" ? "->" : "-";
    const nodeOutStr = `(${subQueryNodeAlias}${referenceNode.getLabelString(context)})`;

    return `(${nodeLabel})${inStr}[${subQueryRelationAlias}:${relationField.type}]${outStr}${nodeOutStr}`;
}

function createCountQuery({
    nodeLabel,
    matchWherePattern,
    targetAlias,
    auth,
    whereParams,
}: {
    nodeLabel: string;
    matchWherePattern: string;
    targetAlias: string;
    auth: AggregationAuth;
    whereParams: NestedRecord<string>;
}): string {
    const authParams = getAuthApocParams(auth);
    return wrapApocRun(AggregationSubQueries.countQuery(matchWherePattern, targetAlias), {
        ...whereParams,
        ...authParams,
        [nodeLabel]: nodeLabel,
    });
}

function createAggregationQuery({
    nodeLabel,
    matchWherePattern,
    fields,
    fieldAlias,
    auth,
    graphElement,
    whereParams,
}: {
    nodeLabel: string;
    matchWherePattern: string;
    fields: Record<string, ResolveTree> | undefined;
    fieldAlias: string;
    auth: AggregationAuth;
    graphElement: Node | Relationship;
    whereParams: NestedRecord<string>;
}): string | undefined {
    if (!fields) return undefined;
    const authParams = getAuthApocParams(auth);

    const fieldsSubQueries = Object.values(fields).reduce((acc, field) => {
        const fieldType = getFieldType(field);
        const dbProperty = mapToDbProperty(graphElement, field.name);

        acc[field.alias] = wrapApocRun(
            getAggregationSubQuery({
                matchWherePattern,
                fieldName: dbProperty || field.name,
                type: fieldType,
                targetAlias: fieldAlias,
            }),
            { ...whereParams, ...authParams, [nodeLabel]: nodeLabel }
        );
        return acc;
    }, {} as Record<string, string>);

    return generateResultObject(fieldsSubQueries);
}

function getAggregationSubQuery({
    matchWherePattern,
    fieldName,
    type,
    targetAlias,
}: {
    matchWherePattern: string;
    fieldName: string;
    type: AggregationType | undefined;
    targetAlias: string;
}): string {
    switch (type) {
        case AggregationType.String:
        case AggregationType.Id:
            return AggregationSubQueries.stringAggregationQuery(matchWherePattern, fieldName, targetAlias);
        case AggregationType.Int:
        case AggregationType.BigInt:
        case AggregationType.Float:
            return AggregationSubQueries.numberAggregationQuery(matchWherePattern, fieldName, targetAlias);
        case AggregationType.DateTime:
            return AggregationSubQueries.dateTimeAggregationQuery(matchWherePattern, fieldName, targetAlias);
        default:
            return AggregationSubQueries.defaultAggregationQuery(matchWherePattern, fieldName, targetAlias);
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
