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
import type { Context, RelationField, GraphQLWhereArg } from "../../types";
import {
    getFieldType,
    AggregationType,
    getReferenceNode,
    getFieldByName,
    getReferenceRelation,
    serializeAuthParamsForApocRun,
} from "./utils";
import * as AggregationSubQueries from "./aggregation-sub-queries";
import { createFieldAggregationAuth } from "./field-aggregations-auth";
import { createMatchWherePattern } from "./aggregation-sub-queries";
import mapToDbProperty from "../../utils/map-to-db-property";
import createWhereAndParams from "../where/create-where-and-params";
import { stringifyObject } from "../utils/stringify-object";
import { serializeParamsForApocRun, wrapInApocRunFirstColumn } from "../utils/apoc-run";
import { FieldAggregationSchemaTypes } from "../../schema/aggregations/field-aggregation-composer";
import { upperFirst } from "../../utils/upper-first";
import { getRelationshipDirection } from "../../utils/get-relationship-direction";
import Cypher from "@neo4j/cypher-builder";
import { createWherePredicate } from "../where/create-where-predicate";

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
}):
    | { matchVar: string; cypher: string; params: Record<string, any>; preProjectionAggregation: string | undefined }
    | undefined {
    // TODO use cypher builder nodes/vars
    // const subqueryNodeRef = new Cypher.Node();
    const sourceRef = new Cypher.NamedNode(nodeLabel);
    const targetRef = new Cypher.Node();
    // const subqueryRelationRef = new Cypher.Relationship({})
    // subqueryRelationAlias = `${subqueryRelationAlias}${counter}`;

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
        subqueryNodeAlias: sourceRef,
        nodeFields: aggregationFields.node,
    });

    // const [whereQuery, wherePreComputedWhereFields, whereParams] = createWhereAndParams({
    //     whereInput: (field.args.where as GraphQLWhereArg) || {},
    //     varName: subqueryNodeAlias,
    //     node: referenceNode,
    //     context,
    //     recursing: true,
    //     chainStr: `${nodeLabel}_${field.alias}_${subqueryNodeAlias}`,
    // });

    const { predicate, preComputedSubqueries } = createWherePredicate({
        targetElement: targetRef,
        whereInput: (field.args.where as GraphQLWhereArg) || {},
        context,
        element: referenceNode,
    });

    // const targetPattern = createTargetPattern({
    //     nodeLabel,
    //     relationField: relationAggregationField,
    //     referenceNode,
    //     context,
    //     directed: field.args.directed as boolean | undefined,
    // });

    const targetPattern = new Cypher.Relationship({ source: sourceRef, type: relationAggregationField.type, target: targetRef });
    if (getRelationshipDirection(relationAggregationField, { directed: field.args.directed as boolean | undefined }) === "IN") {
        targetPattern.reverse();
    }
    const matchWherePattern = createMatchWherePattern(targetPattern, preComputedSubqueries, authData, predicate);
    const apocRunParams = {
        // ...serializeParamsForApocRun(whereParams as Record<string, any>),
        ...serializeAuthParamsForApocRun(authData),
    };

    const cypherParams = { ...apocRunParams, ...authData.params };
    const projectionMap = new Cypher.Map();

    let returnMatchPattern: Cypher.Clause | Cypher.RawCypher = new Cypher.RawCypher("");
    const countRef = new Cypher.Variable();
    let countFunction: Cypher.Function | undefined;

    if (aggregationFields.count) {
        returnMatchPattern = matchWherePattern;
        countFunction = Cypher.count(sourceRef);
        projectionMap.set({
            count: countRef,
        });
    }
    const nodeFields = aggregationFields.node;
    if (nodeFields) {
        projectionMap.set({
            node: new Cypher.RawCypher((env) => {
                return [
                    createAggregationQuery({
                        nodeLabel,
                        matchWherePattern,
                        fields: nodeFields,
                        fieldAlias: targetRef,
                        graphElement: referenceNode,
                        params: cypherParams,
                    }).getCypher(env),
                    cypherParams,
                ];
            }),
        });
    }
    const edgeFields = aggregationFields.edge;
    if (edgeFields) {
        projectionMap.set({
            edge: new Cypher.RawCypher((env) => {
                return [
                    createAggregationQuery({
                        nodeLabel,
                        matchWherePattern,
                        fields: edgeFields,
                        fieldAlias: targetPattern,
                        graphElement: referenceRelation,
                        params: cypherParams,
                    }).getCypher(env),
                    cypherParams,
                ];
            }),
        });
    }

    let preProjectionAggregation: string | undefined;
    let cypher = "";

    const rawProjection = new Cypher.RawCypher((env) => {
        if (countFunction) {
            preProjectionAggregation = `${countFunction.getCypher(env)} AS ${countRef.getCypher(env)}`;
        }
        cypher = returnMatchPattern.getCypher(env);
        return [projectionMap.getCypher(env), cypherParams];
    });

    const result = rawProjection.build(`${nodeLabel}_${field.alias}_`);

    return {
        matchVar: result.cypher,
        cypher,
        params: result.params,
        preProjectionAggregation,
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

// function createTargetPattern({
//     nodeLabel,
//     relationField,
//     referenceNode,
//     context,
//     directed,
// }: {
//     nodeLabel: string;
//     relationField: RelationField;
//     referenceNode: Node;
//     context: Context;
//     directed?: boolean;
// }): string {
//     const { inStr, outStr } = getRelationshipDirectionStr(relationField, { directed });
//     const nodeOutStr = `(${subqueryNodeAlias}${referenceNode.getLabelString(context)})`;

//     return `(${nodeLabel})${inStr}[${subqueryRelationAlias}:${relationField.type}]${outStr}${nodeOutStr}`;
// }

function createAggregationQuery({
    nodeLabel,
    matchWherePattern,
    fields,
    fieldAlias,
    graphElement,
    params,
}: {
    nodeLabel: string;
    matchWherePattern: Cypher.Clause;
    fields: Record<string, ResolveTree>;
    fieldAlias: Cypher.Node | Cypher.Relationship;
    graphElement: Node | Relationship;
    params: Record<string, string>;
}): Cypher.RawCypher {
    const fieldsSubQueries = Object.values(fields).reduce((acc, field) => {
        const fieldType = getFieldType(field);
        const dbProperty = mapToDbProperty(graphElement, field.name);

        const aggregationQuery = wrapInApocRunFirstColumn(
            getAggregationSubquery({
                matchWherePattern,
                fieldName: dbProperty || field.name,
                type: fieldType,
                targetAlias: fieldAlias,
            }),
            {
                ...params,
                [nodeLabel]: nodeLabel,
            }
        );
        acc[field.alias] = new Cypher.RawCypher((env) => `head(${aggregationQuery.getCypher(env)})`);
        return acc;
    }, {} as Record<string, Cypher.RawCypher>);

    return stringifyObject(fieldsSubQueries);
}

function getAggregationSubquery({
    matchWherePattern,
    fieldName,
    type,
    targetAlias,
}: {
    matchWherePattern: Cypher.Clause;
    fieldName: string;
    type: AggregationType | undefined;
    targetAlias: Cypher.Node | Cypher.Relationship;
}): Cypher.RawCypher {
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
