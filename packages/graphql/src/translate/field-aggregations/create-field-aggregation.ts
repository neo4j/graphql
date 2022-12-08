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
import type { Node } from "../../classes";
import type { Context, GraphQLWhereArg } from "../../types";
import { getFieldType, AggregationType, getReferenceNode, getFieldByName, getReferenceRelation } from "./utils";
import * as AggregationSubQueries from "./aggregation-sub-queries";
import { createFieldAggregationAuth } from "./field-aggregations-auth";
import { createMatchWherePattern } from "./aggregation-sub-queries";
import mapToDbProperty from "../../utils/map-to-db-property";
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
}): { matchVar: string; cypher: string; params: Record<string, any> } | undefined {
    const sourceRef = new Cypher.NamedNode(nodeLabel);
    const targetRef = new Cypher.Node();

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
        subqueryNodeAlias: targetRef,
        nodeFields: aggregationFields.node,
    });

    const { predicate, preComputedSubqueries } = createWherePredicate({
        targetElement: targetRef,
        whereInput: (field.args.where as GraphQLWhereArg) || {},
        context,
        element: referenceNode,
    });

    const targetPattern = new Cypher.Relationship({
        source: sourceRef,
        type: relationAggregationField.type,
        target: targetRef,
    });
    if (
        getRelationshipDirection(relationAggregationField, { directed: field.args.directed as boolean | undefined }) ===
        "IN"
    ) {
        targetPattern.reverse();
    }
    const matchWherePattern = createMatchWherePattern(targetPattern, preComputedSubqueries, authData, predicate);
    const projectionMap = new Cypher.Map();

    let returnMatchPattern: Cypher.Clause = new Cypher.RawCypher("");
    const countRef = new Cypher.Variable();
    let countFunction: Cypher.Function | undefined;

    if (aggregationFields.count) {
        countFunction = Cypher.count(sourceRef);
        projectionMap.set({
            count: countRef,
        });
        returnMatchPattern = new Cypher.Call(
            Cypher.concat(matchWherePattern, new Cypher.Return([countFunction, countRef]))
        ).innerWith(sourceRef);
    }
    const nodeFields = aggregationFields.node;
    if (nodeFields) {
        const nodeProjectionMap = new Cypher.Map();

        Object.values(nodeFields).forEach((field) => {
            const dbProperty = mapToDbProperty(referenceNode, field.name);
            const fieldType = getFieldType(field);
            const fieldName = dbProperty || field.name;
            nodeProjectionMap.set(fieldName, new Cypher.RawCypher(fieldName));
            const subquery = getAggregationSubquery({
                matchWherePattern,
                fieldName,
                type: fieldType,
                targetAlias: targetRef,
            });
            returnMatchPattern = Cypher.concat(returnMatchPattern, new Cypher.Call(subquery).innerWith(sourceRef));
        });

        projectionMap.set({ node: nodeProjectionMap });
    }
    const edgeFields = aggregationFields.edge;
    if (edgeFields) {
        const nodeProjectionMap = new Cypher.Map();

        Object.values(edgeFields).forEach((field) => {
            const dbProperty = mapToDbProperty(referenceNode, field.name);
            const fieldType = getFieldType(field);
            const fieldName = dbProperty || field.name;
            nodeProjectionMap.set(fieldName, new Cypher.RawCypher(fieldName));
            const subquery = getAggregationSubquery({
                matchWherePattern,
                fieldName,
                type: fieldType,
                targetAlias: targetPattern,
            });
            returnMatchPattern = Cypher.concat(returnMatchPattern, new Cypher.Call(subquery).innerWith(sourceRef));
        });

        projectionMap.set({ edge: nodeProjectionMap });
    }

    let cypher = "";
    const rawProjection = new Cypher.RawCypher((env) => {
        cypher = returnMatchPattern?.getCypher(env) || "";
        return projectionMap.getCypher(env);
    });

    const result = rawProjection.build(`${nodeLabel}_${field.alias}_`);

    return {
        matchVar: result.cypher,
        cypher,
        params: result.params,
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
