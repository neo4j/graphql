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
import type { Node, Relationship } from "../classes";
import type { RelationField, Context, GraphQLWhereArg, PredicateReturn } from "../types";
import { aggregationFieldRegEx, AggregationFieldRegexGroups, ListPredicate, whereRegEx } from "./where/utils";
import {
    createBaseOperation,
    createComparisonOperation,
} from "./where/property-operations/create-comparison-operation";
import { NODE_OR_EDGE_KEYS, AGGREGATION_AGGREGATE_COUNT_OPERATORS } from "../constants";
import { getCypherLogicalOperator, isLogicalOperator, LogicalOperator } from "./utils/logical-operators";
import mapToDbProperty from "../utils/map-to-db-property";

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
    returnVariables: Cypher.Variable[];
};

export function aggregatePreComputedWhereFields(
    value: GraphQLWhereArg,
    relationField: RelationField,
    relationship: Relationship | undefined,
    context: Context,
    matchNode: Cypher.Variable,
    listPredicateStr?: ListPredicate
): PredicateReturn {
    const refNode = context.nodes.find((x) => x.name === relationField.typeMeta.name) as Node;
    const direction = relationField.direction;
    const aggregationTarget = new Cypher.Node({ labels: refNode.getLabels(context) });
    const cypherRelation = new Cypher.Relationship({
        source: matchNode as Cypher.Node,
        target: aggregationTarget,
        type: relationField.type,
    });
    let matchPattern = cypherRelation.pattern({ source: { labels: false } });
    if (direction === "IN") {
        cypherRelation.reverse();
        matchPattern = cypherRelation.pattern({ target: { labels: false } });
    }
    const matchQuery = new Cypher.Match(matchPattern);
    const { returnProjections, predicates, returnVariables } = aggregateWhere(
        value as AggregateWhereInput,
        refNode,
        relationship,
        aggregationTarget,
        cypherRelation,
        listPredicateStr,
        context
    );
    matchQuery.return(...returnProjections);
    const subquery = new Cypher.Call(matchQuery).innerWith(matchNode);

    // The return values are needed when performing SOME/NONE/ALL/SINGLE operations as they need to be aggregated to perform comparisons
    if (listPredicateStr) {
        return {
            predicate: Cypher.and(...predicates),
            // Cypher.concat is used because this is passed to createWherePredicate which expects a Cypher.CompositeClause
            preComputedSubqueries: Cypher.concat(subquery),
            requiredVariables: [],
            aggregatingVariables: returnVariables,
        };
    }

    return {
        predicate: Cypher.and(...predicates),
        // Cypher.concat is used because this is passed to createWherePredicate which expects a Cypher.CompositeClause
        preComputedSubqueries: Cypher.concat(subquery),
        requiredVariables: returnVariables,
        aggregatingVariables: [],
    };
}

function aggregateWhere(
    aggregateWhereInput: AggregateWhereInput,
    refNode: Node,
    relationship: Relationship | undefined,
    aggregationTarget: Cypher.Node,
    cypherRelation: Cypher.Relationship,
    listPredicateStr: ListPredicate | undefined,
    context: Context
): AggregateWhereReturn {
    const returnProjections: ("*" | Cypher.ProjectionColumn)[] = [];
    const predicates: Cypher.Predicate[] = [];
    const returnVariables: Cypher.Variable[] = [];
    Object.entries(aggregateWhereInput).forEach(([key, value]) => {
        if (AGGREGATION_AGGREGATE_COUNT_OPERATORS.includes(key)) {
            const {
                returnProjection: innerReturnProjection,
                predicate: innerPredicate,
                returnVariable: innerReturnVariable,
            } = createCountPredicateAndProjection(aggregationTarget, key, value, listPredicateStr);
            returnProjections.push(innerReturnProjection);
            if (innerPredicate) predicates.push(innerPredicate);
            returnVariables.push(innerReturnVariable);
        } else if (NODE_OR_EDGE_KEYS.includes(key)) {
            const target = key === "edge" ? cypherRelation : aggregationTarget;
            const refNodeOrRelation = key === "edge" ? relationship : refNode;
            if (!refNodeOrRelation) throw new Error(`Edge filter ${key} on undefined relationship`);

            const {
                returnProjections: innerReturnProjections,
                predicates: innerPredicates,
                returnVariables: innerReturnVariables,
            } = aggregateEntityWhere(value, refNodeOrRelation, target, listPredicateStr, context);
            returnProjections.push(...innerReturnProjections);
            predicates.push(...innerPredicates);
            returnVariables.push(...innerReturnVariables);
        } else if (isLogicalOperator(key)) {
            const cypherBuilderFunction = getCypherLogicalOperator(key);
            const logicalPredicates: Cypher.Predicate[] = [];
            value = Array.isArray(value) ? value : [value];
            value.forEach((whereInput) => {
                const {
                    returnProjections: innerReturnProjections,
                    predicates: innerPredicates,
                    returnVariables: innerReturnVariables,
                } = aggregateWhere(
                    whereInput,
                    refNode,
                    relationship,
                    aggregationTarget,
                    cypherRelation,
                    listPredicateStr,
                    context
                );
                returnProjections.push(...innerReturnProjections);
                logicalPredicates.push(...innerPredicates);
                returnVariables.push(...innerReturnVariables);
            });
            predicates.push(cypherBuilderFunction(...logicalPredicates));
        }
    });
    return {
        returnProjections,
        predicates,
        returnVariables,
    };
}

function createCountPredicateAndProjection(
    aggregationTarget: Cypher.Node,
    filterKey: string,
    filterValue: number,
    listPredicateStr?: ListPredicate
): {
    returnProjection: "*" | Cypher.ProjectionColumn;
    predicate: Cypher.Predicate | undefined;
    returnVariable: Cypher.Variable;
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
        predicate: getReturnValuePredicate(operationVar, listPredicateStr),
        returnVariable: operationVar,
    };
}

function aggregateEntityWhere(
    aggregateEntityWhereInput: WhereFilter,
    refNodeOrRelation: Node | Relationship,
    target: Cypher.Node | Cypher.Relationship,
    listPredicateStr: ListPredicate | undefined,
    context: Context
): AggregateWhereReturn {
    const returnProjections: ("*" | Cypher.ProjectionColumn)[] = [];
    const predicates: Cypher.Predicate[] = [];
    const returnVariables: Cypher.Variable[] = [];
    Object.entries(aggregateEntityWhereInput).forEach(([key, value]) => {
        if (isLogicalOperator(key)) {
            const cypherBuilderFunction = getCypherLogicalOperator(key);
            const logicalPredicates: Cypher.Predicate[] = [];
            value = Array.isArray(value) ? value : [value];
            value.forEach((whereInput) => {
                const {
                    returnProjections: innerReturnProjections,
                    predicates: innerPredicates,
                    returnVariables: innerReturnVariables,
                } = aggregateEntityWhere(whereInput, refNodeOrRelation, target, listPredicateStr, context);
                returnProjections.push(...innerReturnProjections);
                logicalPredicates.push(...innerPredicates);
                returnVariables.push(...innerReturnVariables);
            });
            predicates.push(cypherBuilderFunction(...logicalPredicates));
        } else {
            const operation = createEntityOperation(refNodeOrRelation, target, key, value, context);
            const operationVar = new Cypher.Variable();
            returnProjections.push([operation, operationVar]);
            predicates.push(getReturnValuePredicate(operationVar, listPredicateStr));
            returnVariables.push(operationVar);
        }
    });
    return {
        returnProjections,
        predicates,
        returnVariables,
    };
}

function createEntityOperation(
    refNodeOrRelation: Node | Relationship,
    target: Cypher.Node | Cypher.Relationship,
    aggregationInputField: string,
    aggregationInputValue: any,
    context: Context
): Cypher.Predicate {
    const paramName = new Cypher.Param(aggregationInputValue);
    const regexResult = aggregationFieldRegEx.exec(aggregationInputField)?.groups as AggregationFieldRegexGroups;
    const { logicalOperator } = regexResult;
    const { fieldName, aggregationOperator } = regexResult;
    const fieldType = refNodeOrRelation?.primitiveFields.find((name) => name.fieldName === fieldName)?.typeMeta.name;

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

        const pointField = refNodeOrRelation.pointFields.find((x) => x.fieldName === fieldName);
        const durationField = refNodeOrRelation.primitiveFields.find(
            (x) => x.fieldName === fieldName && x.typeMeta.name === "Duration"
        );

        const innerOperation = createComparisonOperation({
            operator: logicalOperator || "EQ",
            propertyRefOrCoalesce: innerVar,
            param: paramName,
            durationField,
            pointField,
            neo4jDatabaseInfo: context.neo4jDatabaseInfo,
        });
        const dbFieldName = mapToDbProperty(refNodeOrRelation, fieldName);
        const collectedProperty =
            fieldType === "String" && logicalOperator !== "EQUAL"
                ? Cypher.collect(Cypher.size(target.property(dbFieldName)))
                : Cypher.collect(target.property(dbFieldName));
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

function getReturnValuePredicate(operationVar: Cypher.Variable, listPredicateStr?: ListPredicate) {
    switch (listPredicateStr) {
        case "all": {
            const listVar = new Cypher.Variable();
            return Cypher.all(listVar, operationVar, Cypher.eq(listVar, new Cypher.Literal(true)));
        }
        case "single": {
            const listVar = new Cypher.Variable();
            return Cypher.single(listVar, operationVar, Cypher.eq(listVar, new Cypher.Literal(true)));
        }
        case "not":
        case "none":
        case "any": {
            return Cypher.in(new Cypher.Literal(true), operationVar);
        }
        default: {
            return Cypher.eq(operationVar, new Cypher.Literal(true));
        }
    }
}
