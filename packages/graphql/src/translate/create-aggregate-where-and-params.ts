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
import type { AggregationFieldRegexGroups } from "./where/utils";
import { aggregationFieldRegEx, whereRegEx } from "./where/utils";
import {
    createBaseOperation,
    createComparisonOperation,
} from "./where/property-operations/create-comparison-operation";
import { NODE_OR_EDGE_KEYS, AGGREGATION_AGGREGATE_COUNT_OPERATORS } from "../constants";
import { isLogicalOperator, getLogicalPredicate } from "./utils/logical-operators";
import mapToDbProperty from "../utils/map-to-db-property";
import { asArray } from "../utils/utils";
import { getCypherRelationshipDirection } from "../utils/get-relationship-direction";

type WhereFilter = Record<string, any>;

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

export function aggregatePreComputedWhereFields({
    value,
    relationField,
    relationship,
    context,
    matchNode,
}: {
    value: GraphQLWhereArg;
    relationField: RelationField;
    relationship: Relationship | undefined;
    context: Context;
    matchNode: Cypher.Variable;
}): PredicateReturn {
    const refNode = context.nodes.find((x) => x.name === relationField.typeMeta.name) as Node;
    const direction = getCypherRelationshipDirection(relationField);
    const aggregationTarget = new Cypher.Node({ labels: refNode.getLabels(context) });

    const cypherRelation = new Cypher.Relationship({
        type: relationField.type,
    });

    const matchPattern = new Cypher.Pattern(matchNode as Cypher.Node)
        .withoutLabels()
        .related(cypherRelation)
        .withDirection(direction)
        .to(aggregationTarget);

    const matchQuery = new Cypher.Match(matchPattern);
    const { returnProjections, predicates } = aggregateWhere(
        value as AggregateWhereInput,
        refNode,
        relationship,
        aggregationTarget,
        cypherRelation,
        context
    );
    matchQuery.return(...returnProjections);

    const subquery = new Cypher.Call(matchQuery).innerWith(matchNode);

    return {
        predicate: Cypher.and(...predicates),
        // Cypher.concat is used because this is passed to createWherePredicate which expects a Cypher.CompositeClause
        preComputedSubqueries: Cypher.concat(subquery),
    };
}

function aggregateWhere(
    aggregateWhereInput: AggregateWhereInput,
    refNode: Node,
    relationship: Relationship | undefined,
    aggregationTarget: Cypher.Node,
    cypherRelation: Cypher.Relationship,
    context: Context
): AggregateWhereReturn {
    const returnProjections: ("*" | Cypher.ProjectionColumn)[] = [];
    const returnPredicates: Cypher.Predicate[] = [];
    Object.entries(aggregateWhereInput).forEach(([key, value]) => {
        if (AGGREGATION_AGGREGATE_COUNT_OPERATORS.includes(key)) {
            const { returnProjection, predicate } = createCountPredicateAndProjection(aggregationTarget, key, value);
            returnProjections.push(returnProjection);
            if (predicate) returnPredicates.push(predicate);
        } else if (NODE_OR_EDGE_KEYS.includes(key)) {
            const target = key === "edge" ? cypherRelation : aggregationTarget;
            const refNodeOrRelation = key === "edge" ? relationship : refNode;
            if (!refNodeOrRelation) throw new Error(`Edge filter ${key} on undefined relationship`);

            const { returnProjections: innerReturnProjections, predicates } = aggregateEntityWhere(
                value,
                refNodeOrRelation,
                target,
                context
            );
            returnProjections.push(...innerReturnProjections);
            returnPredicates.push(...predicates);
        } else if (isLogicalOperator(key)) {
            const logicalPredicates: Cypher.Predicate[] = [];
            asArray(value).forEach((whereInput) => {
                const { returnProjections: innerReturnProjections, predicates } = aggregateWhere(
                    whereInput,
                    refNode,
                    relationship,
                    aggregationTarget,
                    cypherRelation,
                    context
                );
                returnProjections.push(...innerReturnProjections);
                logicalPredicates.push(...predicates);
            });

            const logicalPredicate = getLogicalPredicate(key, logicalPredicates);

            if (logicalPredicate) {
                returnPredicates.push(logicalPredicate);
            }
        }
    });
    return {
        returnProjections,
        predicates: returnPredicates,
    };
}

function createCountPredicateAndProjection(
    aggregationTarget: Cypher.Node,
    filterKey: string,
    filterValue: number
): {
    returnProjection: "*" | Cypher.ProjectionColumn;
    predicate: Cypher.Predicate | undefined;
} {
    const paramName = new Cypher.Param(filterValue);
    const count = Cypher.count(aggregationTarget);
    const operator = whereRegEx.exec(filterKey)?.groups?.operator || "EQ";
    const operation = createBaseOperation({
        operator,
        target: count,
        value: paramName,
    });
    const operationVar = new Cypher.Variable();

    return {
        returnProjection: [operation, operationVar],
        predicate: Cypher.eq(operationVar, new Cypher.Literal(true)),
    };
}

function aggregateEntityWhere(
    aggregateEntityWhereInput: WhereFilter,
    refNodeOrRelation: Node | Relationship,
    target: Cypher.Node | Cypher.Relationship,
    context: Context
): AggregateWhereReturn {
    const returnProjections: ("*" | Cypher.ProjectionColumn)[] = [];
    const predicates: Cypher.Predicate[] = [];
    Object.entries(aggregateEntityWhereInput).forEach(([key, value]) => {
        if (isLogicalOperator(key)) {
            const logicalPredicates: Cypher.Predicate[] = [];
            asArray(value).forEach((whereInput) => {
                const { returnProjections: innerReturnProjections, predicates: innerPredicates } = aggregateEntityWhere(
                    whereInput,
                    refNodeOrRelation,
                    target,
                    context
                );
                returnProjections.push(...innerReturnProjections);
                logicalPredicates.push(...innerPredicates);
            });

            const logicalPredicate = getLogicalPredicate(key, logicalPredicates);

            if (logicalPredicate) {
                predicates.push(logicalPredicate);
            }
        } else {
            const operation = createEntityOperation(refNodeOrRelation, target, key, value);
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
    refNodeOrRelation: Node | Relationship,
    target: Cypher.Node | Cypher.Relationship,
    aggregationInputField: string,
    aggregationInputValue: any
): Cypher.Predicate {
    const paramName = new Cypher.Param(aggregationInputValue);
    const regexResult = aggregationFieldRegEx.exec(aggregationInputField)?.groups as AggregationFieldRegexGroups;
    const { logicalOperator } = regexResult;
    const { fieldName, aggregationOperator } = regexResult;
    const fieldType = refNodeOrRelation?.primitiveFields.find((name) => name.fieldName === fieldName)?.typeMeta.name;

    if (fieldType === "String" && aggregationOperator) {
        return createBaseOperation({
            operator: logicalOperator || "EQ",
            target: getAggregateOperation(Cypher.size(target.property(fieldName)), aggregationOperator),
            value: paramName,
        });
    } else if (aggregationOperator) {
        return createBaseOperation({
            operator: logicalOperator || "EQ",
            target: getAggregateOperation(target.property(fieldName), aggregationOperator),
            value: paramName,
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
    property: Cypher.Property | Cypher.Function,
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
