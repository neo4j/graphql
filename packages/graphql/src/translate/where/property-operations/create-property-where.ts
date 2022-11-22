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

import type { Context, RelationField } from "../../../types";
import Cypher from "@neo4j/cypher-builder";
import { GraphElement, Node } from "../../../classes";
import { aggregationFieldRegEx, AggregationFieldRegexGroups, whereRegEx, WhereRegexGroups } from "../utils";
import mapToDbProperty from "../../../utils/map-to-db-property";
import { createGlobalNodeOperation } from "./create-global-node-operation";
// Recursive function

import { createConnectionOperation } from "./create-connection-operation";
import { createBaseOperation, createComparisonOperation } from "./create-comparison-operation";
// Recursive function

import { createRelationshipOperation } from "./create-relationship-operation";

/** Translates a property into its predicate filter */
export function createPropertyWhere({
    key,
    value,
    element,
    targetElement,
    context,
}: {
    key: string;
    value: any;
    element: GraphElement;
    targetElement: Cypher.Variable;
    context: Context;
}): [Cypher.Clause | undefined, Cypher.Predicate | undefined] {
    const fakePrecomputedClause = new Cypher.Call(new Cypher.Return([new Cypher.Literal("1"), new Cypher.Variable()]));
    const match = whereRegEx.exec(key);
    if (!match) {
        throw new Error(`Failed to match key in filter: ${key}`);
    }

    const { prefix, fieldName, isAggregate, operator } = match?.groups as WhereRegexGroups;

    if (!fieldName) {
        throw new Error(`Failed to find field name in filter: ${key}`);
    }

    const isNot = operator?.startsWith("NOT") ?? false;

    const coalesceValue = [...element.primitiveFields, ...element.temporalFields, ...element.enumFields].find(
        (f) => fieldName === f.fieldName
    )?.coalesceValue as string | undefined;

    let dbFieldName = mapToDbProperty(element, fieldName);
    if (prefix) {
        dbFieldName = `${prefix}${dbFieldName}`;
    }

    let propertyRef: Cypher.PropertyRef | Cypher.Function = targetElement.property(dbFieldName);

    if (element instanceof Node) {
        const node = element;
        if (node.isGlobalNode && key === "id") {
            return [
                fakePrecomputedClause,
                createGlobalNodeOperation({
                    node,
                    value,
                    targetElement,
                    coalesceValue,
                }),
            ];
        }

        if (coalesceValue) {
            propertyRef = Cypher.coalesce(
                propertyRef,
                new Cypher.RawCypher(`${coalesceValue}`) // TODO: move into Cypher.literal
            );
        }

        const relationField = node.relationFields.find((x) => x.fieldName === fieldName);

        if (isAggregate) {
            if (!relationField) throw new Error("Aggregate filters must be on relationship fields");

            /*  return createAggregateOperation({
                 relationField,
                 context,
                 value,
                 parentNode: targetElement as Cypher.Node,
             }); */

            return preComputedWhereFields(value, element, context, targetElement, relationField);
        }

        if (relationField) {
            return createRelationshipOperation({
                relationField,
                context,
                parentNode: targetElement as Cypher.Node,
                operator,
                value,
                isNot,
            });
        }

        const connectionField = node.connectionFields.find((x) => x.fieldName === fieldName);
        if (connectionField) {
            return createConnectionOperation({
                value,
                connectionField,
                context,
                parentNode: targetElement as Cypher.Node,
                operator,
            });
        }

        if (value === null) {
            if (isNot) {
                return [fakePrecomputedClause, Cypher.isNotNull(propertyRef)];
            }
            return [fakePrecomputedClause, Cypher.isNull(propertyRef)];
        }
    }
    const pointField = element.pointFields.find((x) => x.fieldName === fieldName);
    const durationField = element.primitiveFields.find(
        (x) => x.fieldName === fieldName && x.typeMeta.name === "Duration"
    );

    const comparisonOp = createComparisonOperation({
        propertyRefOrCoalesce: propertyRef,
        param: new Cypher.Param(value),
        operator,
        durationField,
        pointField,
        neo4jDatabaseInfo: context.neo4jDatabaseInfo,
    });
    if (isNot) {
        return [fakePrecomputedClause, Cypher.not(comparisonOp)];
    }
    return [fakePrecomputedClause, comparisonOp];
}

export function preComputedWhereFields(
    value: any,
    node: Node,
    context: Context,
    matchNode: Cypher.Variable,
    relationField: RelationField
): [Cypher.Clause | undefined, Cypher.Predicate | undefined] {
    if (!value) {
        return [undefined, undefined];
    }
    const refNode = context.nodes.find((x) => x.name === relationField.typeMeta.name) as Node;
    const direction = relationField.direction;
    const aggregationTarget = new Cypher.Node({ labels: refNode.getLabels(context) });
    const cypherRelation = new Cypher.Relationship({
        source: matchNode as Cypher.Node,
        target: aggregationTarget,
        type: relationField.type,
    });
    if (direction === "IN") {
        cypherRelation.reverse();
    }

    const matchQuery = new Cypher.Match(cypherRelation);

    const [returnVariables, predicates] = computeRootWhereAggregate(
        value,
        refNode,
        aggregationTarget,
        cypherRelation
    );
    matchQuery.return(...returnVariables);

    return [new Cypher.Call(matchQuery).innerWith(matchNode), Cypher.and(...predicates)];
}

function computeRootWhereAggregate(
    value: any,
    refNode: Node,
    aggregationTarget: Cypher.Node,
    cypherRelation: Cypher.Relationship
): [Array<"*" | Cypher.ProjectionColumn>, Cypher.Predicate[]] {
    const returnVariables = [] as Array<"*" | Cypher.ProjectionColumn>;
    const predicates = [] as Cypher.Predicate[];
    Object.entries(value).forEach(([key, value]) => {
        let operation: Cypher.ComparisonOp | undefined;
        if (["count", "count_LT", "count_LTE", "count_GT", "count_GTE"].includes(key)) {
            const paramName = new Cypher.Param(value);
            const count = Cypher.count(aggregationTarget);
            const operator = whereRegEx.exec(key)?.groups?.operator || "EQ";
            operation = createBaseOperation({
                operator,
                property: count,
                param: paramName,
            });
            const operationVar = new Cypher.Variable();
            returnVariables.push([operation, operationVar]);
            predicates.push(Cypher.eq(operationVar, new Cypher.Param(true)));
        } else if (["node", "edge"].includes(key)) {
            const target = key === "edge" ? cypherRelation : aggregationTarget;
            const [_returnVariables, _predicates] = computeFieldAggregateWhere(value, refNode, target);
            returnVariables.push(..._returnVariables);
            predicates.push(..._predicates);
            // const aggregationOperators = ["SHORTEST", "LONGEST", "MIN", "MAX", "SUM"];
        } else if (["AND", "OR"].includes(key)) {
            const binaryOp = key === "AND" ? Cypher.and : Cypher.or;
            const [a, b] = (value as Array<any>).reduce(
                (prev, elementValue) => {
                    const [_returnVariables, _predicates] = computeRootWhereAggregate(
                        elementValue,
                        refNode,
                        aggregationTarget,
                        cypherRelation
                    );
                    prev[0].push(..._returnVariables);
                    prev[1].push(..._predicates);
                    return prev;
                },
                [[], []]
            );
            returnVariables.push(...a);
            predicates.push(binaryOp(...b));
        }
    });
    return [returnVariables, predicates];
}

function computeFieldAggregateWhere(
    value: any,
    refNode: Node,
    target: Cypher.Node | Cypher.Relationship
): [Array<"*" | Cypher.ProjectionColumn>, Cypher.Predicate[]] {
    const returnVariables = [] as Array<"*" | Cypher.ProjectionColumn>;
    const predicates = [] as Cypher.Predicate[];

    Object.entries(value).forEach(([innerKey, innerValue]) => {
        if (["AND", "OR"].includes(innerKey)) {
            const binaryOp = innerKey === "AND" ? Cypher.and : Cypher.or;
            const [a, b] = (innerValue as Array<any>).reduce(
                (prev, elementValue) => {
                    const [_returnVariables, _predicates] = computeFieldAggregateWhere(elementValue, refNode, target);
                    prev[0].push(..._returnVariables);
                    prev[1].push(..._predicates);
                    return prev;
                },
                [[], []]
            );
            returnVariables.push(...a);
            predicates.push(binaryOp(...b));
        } else {
            const paramName = new Cypher.Param(innerValue);
            const regexResult = aggregationFieldRegEx.exec(innerKey)?.groups as AggregationFieldRegexGroups;
            const { logicalOperator } = regexResult;
            const { fieldName, aggregationOperator } = regexResult;
            const fieldType = refNode.primitiveFields.find((name) => name.fieldName === fieldName)?.typeMeta.name;

            let operation;
            if (fieldType === "String" && aggregationOperator) {
                operation = createBaseOperation({
                    operator: logicalOperator || "EQ",
                    property: createAggregateOperation(Cypher.size(target.property(fieldName)), aggregationOperator),
                    param: paramName,
                });
            } else if (aggregationOperator) {
                operation = createBaseOperation({
                    operator: logicalOperator || "EQ",
                    property: createAggregateOperation(target.property(fieldName), aggregationOperator),
                    param: paramName,
                });
            } else {
                const innerVar = new Cypher.Variable();
                const innerOperation = createBaseOperation({
                    operator: logicalOperator || "EQ",
                    property: innerVar,
                    param: paramName,
                });

                const collectedProperty =
                    fieldType === "String" && logicalOperator !== "EQUAL"
                        ? Cypher.collect(Cypher.size(target.property(fieldName)))
                        : Cypher.collect(target.property(fieldName));
                operation = Cypher.any(innerVar, collectedProperty, innerOperation);
            }
            const operationVar = new Cypher.Variable();
            returnVariables.push([operation, operationVar]);
            predicates.push(Cypher.eq(operationVar, new Cypher.Param(true)));
        }
    });
    return [returnVariables, predicates];
}

function createAggregateOperation(
    property: Cypher.PropertyRef | Cypher.Function,
    aggregationOperator: string
): Cypher.Function {
    switch (aggregationOperator) {
        case "AVERAGE":
            return Cypher.avg(property);
        case "MIN":
        case "SHORTEST":
            return Cypher.min(property);
        case "MAX":
        case "LONGEST":
            return Cypher.max(property);
        case "SUM":
            return Cypher.sum(property);
        default:
            throw new Error(`Invalid operator ${aggregationOperator}`);
    }
}
