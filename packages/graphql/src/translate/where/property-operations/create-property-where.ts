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
    aggregateTargetElement,
    context,
}: {
    key: string;
    value: any;
    element: GraphElement;
    targetElement: Cypher.Variable;
    aggregateTargetElement?: Cypher.Variable;
    context: Context;
}): [Cypher.Clause | undefined, Cypher.Predicate | undefined, Cypher.Variable[] | undefined] {
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
                undefined,
                createGlobalNodeOperation({
                    node,
                    value,
                    targetElement,
                    coalesceValue,
                }),
                undefined,
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
            return aggregatePredicate(value, context, aggregateTargetElement || targetElement, relationField);
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
                aggregateTargetElement,
                operator,
            });
        }

        if (value === null) {
            if (isNot) {
                return [undefined, Cypher.isNotNull(propertyRef), undefined];
            }
            return [undefined, Cypher.isNull(propertyRef), undefined];
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
        return [undefined, Cypher.not(comparisonOp), undefined];
    }
    return [undefined, comparisonOp, undefined];
}

export function aggregatePredicate(
    value: any,
    context: Context,
    matchNode: Cypher.Variable,
    relationField: RelationField
): [Cypher.Clause | undefined, Cypher.Predicate | undefined, Cypher.Variable[] | undefined] {
    if (!value) {
        return [undefined, undefined, undefined];
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
    const {returnVariables, predicates, predicateVariables} = aggregateWhere(
        value,
        refNode,
        aggregationTarget,
        cypherRelation
    );
    matchQuery.return(...returnVariables);
    return [new Cypher.Call(matchQuery).innerWith(matchNode), Cypher.and(...predicates), predicateVariables];
}

type logicalOperator = "AND" | "OR";

type WhereFilter = Record<string | logicalOperator, any>;

type AggregateWhereInput = {
    count: number;
    count_LT: number;
    count_LTE: number;
    count_GT: number;
    count_GTE: number;
    node: WhereFilter;
    edge: WhereFilter;
} & WhereFilter;

type AggregateWhereReturn = {
    returnVariables: ("*" | Cypher.ProjectionColumn)[];
    predicateVariables: Cypher.Variable[];
    predicates: Cypher.Predicate[];
};

// Reducer function that merge an array of AggregateWhereReturn
function aggregateWhereReducer(accumulator: AggregateWhereReturn, current: AggregateWhereReturn)  {
    return {
        returnVariables: [...accumulator.returnVariables, ...(current?.returnVariables || [])],
        predicateVariables: [...accumulator.predicateVariables, ...(current?.predicateVariables || [])],
        predicates: [...accumulator.predicates, ...(current?.predicates || [])],
    };
}

function aggregateWhere(
    aggregateWhereInput: AggregateWhereInput,
    refNode: Node,
    aggregationTarget: Cypher.Node,
    cypherRelation: Cypher.Relationship
): AggregateWhereReturn {
    return Object.entries(aggregateWhereInput)
        .map(([key, value]): AggregateWhereReturn => {
            if (["count", "count_LT", "count_LTE", "count_GT", "count_GTE"].includes(key)) {
                const paramName = new Cypher.Param(value);
                const count = Cypher.count(aggregationTarget);
                const operator = whereRegEx.exec(key)?.groups?.operator || "EQ";
                const operation = createBaseOperation({
                    operator,
                    property: count,
                    param: paramName,
                });
                const operationVar = new Cypher.Variable();
                return {
                    returnVariables: [[operation, operationVar]],
                    predicateVariables: [operationVar],
                    predicates: [Cypher.eq(operationVar, new Cypher.Param(true))],
                };
            } else if (["node", "edge"].includes(key)) {
                const target = key === "edge" ? cypherRelation : aggregationTarget;
                return aggregateEntityWhere(
                    value,
                    refNode,
                    target
                );
            } else if (["AND", "OR"].includes(key)) {
                const logicalOperator = key === "AND" ? Cypher.and : Cypher.or;
                const { returnVariables, predicateVariables, predicates } = value
                    .map((whereInput) => {
                        return aggregateWhere(
                            whereInput,
                            refNode,
                            aggregationTarget,
                            cypherRelation
                        );
                    })
                    .reduce(
                        aggregateWhereReducer,
                        {
                            returnVariables: [],
                            predicateVariables: [],
                            predicates: [],
                        }
                    );

                return {
                    returnVariables,
                    predicateVariables,
                    predicates: [logicalOperator(...predicates)],
                };
            }
            return {
                returnVariables: [],
                predicateVariables: [],
                predicates: [],
            };
        })
        .reduce(
            aggregateWhereReducer,
            {
                returnVariables: [],
                predicateVariables: [],
                predicates: [],
            }
        );
}

function aggregateEntityWhere(
    aggregateEntityWhereInput: WhereFilter,
    refNode: Node,
    target: Cypher.Node | Cypher.Relationship
): AggregateWhereReturn {
    return Object.entries(aggregateEntityWhereInput)
        .map(([key, value]): AggregateWhereReturn => {
            if (["AND", "OR"].includes(key)) {
                const logicalOperator = key === "AND" ? Cypher.and : Cypher.or;
                const { returnVariables, predicateVariables, predicates } = value
                    .map((whereInput) => {
                        return aggregateEntityWhere(
                            whereInput,
                            refNode,
                            target
                        );
                    })
                    .reduce(
                        aggregateWhereReducer,
                        {
                            returnVariables: [],
                            predicateVariables: [],
                            predicates: [],
                        }
                    );
                return {
                    returnVariables,
                    predicateVariables,
                    predicates: [logicalOperator(...predicates)],
                };
            } else {
                const paramName = new Cypher.Param(value);
                const regexResult = aggregationFieldRegEx.exec(key)?.groups as AggregationFieldRegexGroups;
                const { logicalOperator } = regexResult;
                const { fieldName, aggregationOperator } = regexResult;
                const fieldType = refNode.primitiveFields.find((name) => name.fieldName === fieldName)?.typeMeta.name;

                let operation;
                if (fieldType === "String" && aggregationOperator) {
                    operation = createBaseOperation({
                        operator: logicalOperator || "EQ",
                        property: getAggregateOperation(Cypher.size(target.property(fieldName)), aggregationOperator),
                        param: paramName,
                    });
                } else if (aggregationOperator) {
                    operation = createBaseOperation({
                        operator: logicalOperator || "EQ",
                        property: getAggregateOperation(target.property(fieldName), aggregationOperator),
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
                return {
                    returnVariables: [[operation, operationVar]],
                    predicateVariables: [operationVar],
                    predicates: [Cypher.eq(operationVar, new Cypher.Param(true))],
                };
            }
        })
        .reduce(
            (accumulator, current) => {
                return {
                    returnVariables: [...accumulator.returnVariables, ...(current?.returnVariables || [])],
                    predicateVariables: [...accumulator.predicateVariables, ...(current?.predicateVariables || [])],
                    predicates: [...accumulator.predicates, ...(current?.predicates || [])],
                };
            },
            {
                returnVariables: [],
                predicateVariables: [],
                predicates: [],
            }
        );
}

function getAggregateOperation(
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
