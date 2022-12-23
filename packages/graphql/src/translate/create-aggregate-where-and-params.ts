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

import Cypher from "@neo4j/cypher-builder";
import type { Node } from "../classes";
import type { RelationField, Context, GraphQLWhereArg } from "../types";
import { aggregationFieldRegEx, AggregationFieldRegexGroups, whereRegEx } from "./where/utils";
import { createBaseOperation } from "./where/property-operations/create-comparison-operation";
import { NODE_OR_EDGE_KEYS, AGGREGATION_AGGREGATE_COUNT_OPERATORS } from "../constants";
import { getCypherLogicalOperator, isLogicalOperator, LogicalOperator } from "./utils/logical-operators";


type WhereFilter = Record<string | LogicalOperator, any>;

export type AggregateWhereInput = {
    count: number;
    count_LT: number;
    count_LTE: number;
    count_GT: number;
    count_GTE: number;
    node: WhereFilter;
    edge: WhereFilter;
} & WhereFilter;

type AggregateWhereReturn = {
    returnProjections: ("*" | Cypher.ProjectionColumn)[];
    predicates: Cypher.Predicate[];
};

export function aggregatePreComputedWhereFields(
    value: GraphQLWhereArg,
    relationField: RelationField,
    context: Context,
    matchNode: Cypher.Variable
): {
    predicate: Cypher.Predicate | undefined;
    preComputedSubquery: Cypher.Call;
} {
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
    const { returnProjections, predicates } = aggregateWhere(
        value as AggregateWhereInput,
        refNode,
        aggregationTarget,
        cypherRelation
    );
    matchQuery.return(...returnProjections);
    const subquery = new Cypher.Call(matchQuery).innerWith(matchNode);
    return {
        predicate: Cypher.and(...predicates),
        preComputedSubquery: subquery,
    };
}

export function aggregateWhere(
    aggregateWhereInput: AggregateWhereInput,
    refNode: Node,
    aggregationTarget: Cypher.Node,
    cypherRelation: Cypher.Relationship
): AggregateWhereReturn {
    const returnProjections: ("*" | Cypher.ProjectionColumn)[] = [];
    const predicates: Cypher.Predicate[] = [];
    Object.entries(aggregateWhereInput).forEach(([key, value]) => {
        if (AGGREGATION_AGGREGATE_COUNT_OPERATORS.includes(key)) {
            const { returnProjection: innerReturnProjection, predicate: innerPredicate } =
                createCountPredicateAndProjection(aggregationTarget, key, value);
            returnProjections.push(innerReturnProjection);
            predicates.push(innerPredicate);
        } else if (NODE_OR_EDGE_KEYS.includes(key)) {
            const target = key === "edge" ? cypherRelation : aggregationTarget;
            const { returnProjections: innerReturnProjections, predicates: innerPredicates } = aggregateEntityWhere(
                value,
                refNode,
                target
            );
            returnProjections.push(...innerReturnProjections);
            predicates.push(...innerPredicates);
        } else if (isLogicalOperator(key)) {
            const cypherBuilderFunction = getCypherLogicalOperator(key);
            const logicalPredicates: Cypher.Predicate[] = [];
            value =  Array.isArray(value) ? value : [value];
            value.forEach((whereInput) => {
                const { returnProjections: innerReturnProjections, predicates: innerPredicates } = aggregateWhere(
                    whereInput,
                    refNode,
                    aggregationTarget,
                    cypherRelation
                );
                returnProjections.push(...innerReturnProjections);
                logicalPredicates.push(...innerPredicates);
            });
            predicates.push(cypherBuilderFunction(...logicalPredicates));
        }
    });
    return {
        returnProjections,
        predicates,
    };
}

function createCountPredicateAndProjection(
    aggregationTarget: Cypher.Node,
    filterKey: string,
    filterValue: number
): {
    returnProjection: "*" | Cypher.ProjectionColumn;
    predicate: Cypher.Predicate;
} {
    const paramName = new Cypher.Param(filterValue);
    const count = Cypher.count(aggregationTarget);
    const operator = whereRegEx.exec(filterKey)?.groups?.operator || "EQ";
    const operation = createBaseOperation({
        operator,
        property: count,
        param: paramName,
    });
    const operationVar = new Cypher.Variable();
    return {
        returnProjection: [operation, operationVar],
        predicate: Cypher.eq(operationVar, new Cypher.Literal(true)),
    };
}

function aggregateEntityWhere(
    aggregateEntityWhereInput: WhereFilter,
    refNode: Node,
    target: Cypher.Node | Cypher.Relationship
): AggregateWhereReturn {
    const returnProjections: ("*" | Cypher.ProjectionColumn)[] = [];
    const predicates: Cypher.Predicate[] = [];
    Object.entries(aggregateEntityWhereInput).forEach(([key, value]) => {
        if (isLogicalOperator(key)) {
            const cypherBuilderFunction = getCypherLogicalOperator(key);
            const logicalPredicates: Cypher.Predicate[] = [];
            value = Array.isArray(value) ? value : [value];
            value.forEach((whereInput) => {
                const { returnProjections: innerReturnProjections, predicates: innerPredicates } = aggregateEntityWhere(
                    whereInput,
                    refNode,
                    target
                );
                returnProjections.push(...innerReturnProjections);
                logicalPredicates.push(...innerPredicates);
            });
            predicates.push(cypherBuilderFunction(...logicalPredicates));
        } else {
            const operation = createEntityOperation(refNode, target, key, value);
            const operationVar = new Cypher.Variable();
            returnProjections.push([operation, operationVar]);
            predicates.push(Cypher.eq(operationVar, new Cypher.Literal(true)));
        }
    });
    return {
        returnProjections,
        predicates,
    };
}

function createEntityOperation(
    refNode: Node,
    target: Cypher.Node | Cypher.Relationship,
    aggregationInputField: string,
    aggregationInputValue: any
): Cypher.Predicate {
    const paramName = new Cypher.Param(aggregationInputValue);
    const regexResult = aggregationFieldRegEx.exec(aggregationInputField)?.groups as AggregationFieldRegexGroups;
    const { logicalOperator } = regexResult;
    const { fieldName, aggregationOperator } = regexResult;
    const fieldType = refNode.primitiveFields.find((name) => name.fieldName === fieldName)?.typeMeta.name;

    if (fieldType === "String" && aggregationOperator) {
        return createBaseOperation({
            operator: logicalOperator || "EQ",
            property: getAggregateOperation(Cypher.size(target.property(fieldName)), aggregationOperator),
            param: paramName,
        });
    } else if (aggregationOperator) {
        return createBaseOperation({
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
        return Cypher.any(innerVar, collectedProperty, innerOperation);
    }
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
