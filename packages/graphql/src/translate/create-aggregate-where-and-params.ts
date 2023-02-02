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
import type {
    RelationField,
    Context,
    GraphQLWhereArg,
    PredicateReturn,
    ConnectionPredicateData,
    OuterRelationshipData,
} from "../types";
import { aggregationFieldRegEx, AggregationFieldRegexGroups, whereRegEx } from "./where/utils";
import {
    createBaseOperation,
    createComparisonOperation,
} from "./where/property-operations/create-comparison-operation";
import { NODE_OR_EDGE_KEYS, AGGREGATION_AGGREGATE_COUNT_OPERATORS } from "../constants";
import { getCypherLogicalOperator, isLogicalOperator, LogicalOperator } from "./utils/logical-operators";
import mapToDbProperty from "../utils/map-to-db-property";
import { asArray } from "../utils/utils";

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
    innerReturnProjections: ("*" | Cypher.ProjectionColumn)[];
    predicates: Cypher.Predicate[];
    collectingVariables: Cypher.Variable[];
    outerReturnProjections: Cypher.ProjectionColumn[];
};

export function aggregatePreComputedWhereFields({
    value,
    relationField,
    relationship,
    context,
    matchNode,
    outerRelationshipData,
}: {
    value: GraphQLWhereArg;
    relationField: RelationField;
    relationship: Relationship | undefined;
    context: Context;
    matchNode: Cypher.Variable;
    outerRelationshipData: OuterRelationshipData;
}): PredicateReturn {
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
    const { innerReturnProjections, predicates, collectingVariables, outerReturnProjections } = aggregateWhere(
        value as AggregateWhereInput,
        refNode,
        relationship,
        aggregationTarget,
        cypherRelation,
        [...outerRelationshipData.connectionPredicateData].reverse(), // TODO - check this copy doesn't need to be made at a more nested level
        context
    );
    matchQuery.return(...innerReturnProjections);

    const subquery = new Cypher.Call(matchQuery).innerWith(matchNode);

    if (outerRelationshipData.connectionPredicateData.length) {
        outerRelationshipData.connectionPredicateData.forEach((connectionData) =>
            connectionData.collectingVariables.push(...collectingVariables)
        );
        outerRelationshipData.returnClauses.push(...outerReturnProjections);
    }

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
    connectionPredicateData: ConnectionPredicateData[],
    context: Context
): AggregateWhereReturn {
    const resultInnerReturnProjections: ("*" | Cypher.ProjectionColumn)[] = [];
    const resultOuterReturnProjections: Cypher.ProjectionColumn[] = [];
    const resultPredicates: Cypher.Predicate[] = [];
    const resultCollectingVariables: Cypher.Variable[] = [];
    Object.entries(aggregateWhereInput).forEach(([key, value]) => {
        if (AGGREGATION_AGGREGATE_COUNT_OPERATORS.includes(key)) {
            const { innerReturnProjection, predicate, collectingVariable, outerReturnProjection } =
                createCountPredicateAndProjection(aggregationTarget, key, value, connectionPredicateData);
            resultInnerReturnProjections.push(innerReturnProjection);
            resultOuterReturnProjections.push(outerReturnProjection);
            if (predicate) resultPredicates.push(predicate);
            resultCollectingVariables.push(collectingVariable);
        } else if (NODE_OR_EDGE_KEYS.includes(key)) {
            const target = key === "edge" ? cypherRelation : aggregationTarget;
            const refNodeOrRelation = key === "edge" ? relationship : refNode;
            if (!refNodeOrRelation) throw new Error(`Edge filter ${key} on undefined relationship`);

            const { innerReturnProjections, predicates, collectingVariables, outerReturnProjections } =
                aggregateEntityWhere(value, refNodeOrRelation, target, connectionPredicateData, context);
            resultInnerReturnProjections.push(...innerReturnProjections);
            resultOuterReturnProjections.push(...outerReturnProjections);
            resultPredicates.push(...predicates);
            resultCollectingVariables.push(...collectingVariables);
        } else if (isLogicalOperator(key)) {
            const cypherBuilderFunction = getCypherLogicalOperator(key);
            const logicalPredicates: Cypher.Predicate[] = [];
            asArray(value).forEach((whereInput) => {
                const { innerReturnProjections, predicates, collectingVariables, outerReturnProjections } =
                    aggregateWhere(
                        whereInput,
                        refNode,
                        relationship,
                        aggregationTarget,
                        cypherRelation,
                        connectionPredicateData,
                        context
                    );
                resultInnerReturnProjections.push(...innerReturnProjections);
                resultOuterReturnProjections.push(...outerReturnProjections);
                logicalPredicates.push(...predicates);
                resultCollectingVariables.push(...collectingVariables);
            });
            resultPredicates.push(cypherBuilderFunction(...logicalPredicates));
        }
    });
    return {
        innerReturnProjections: resultInnerReturnProjections,
        predicates: resultPredicates,
        collectingVariables: resultCollectingVariables,
        outerReturnProjections: resultOuterReturnProjections,
    };
}

function createCountPredicateAndProjection(
    aggregationTarget: Cypher.Node,
    filterKey: string,
    filterValue: number,
    connectionPredicateData: ConnectionPredicateData[]
): {
    innerReturnProjection: "*" | Cypher.ProjectionColumn;
    predicate: Cypher.Predicate | undefined;
    collectingVariable: Cypher.Variable;
    outerReturnProjection: Cypher.ProjectionColumn;
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
        innerReturnProjection: [operation, operationVar],
        outerReturnProjection: [getReturnValuePredicate(operationVar, connectionPredicateData), operationVar],
        collectingVariable: operationVar,
        predicate: Cypher.eq(operationVar, new Cypher.Literal(true)),
    };
}

function aggregateEntityWhere(
    aggregateEntityWhereInput: WhereFilter,
    refNodeOrRelation: Node | Relationship,
    target: Cypher.Node | Cypher.Relationship,
    connectionPredicateData: ConnectionPredicateData[],
    context: Context
): AggregateWhereReturn {
    const resultInnerReturnProjections: ("*" | Cypher.ProjectionColumn)[] = [];
    const resultOuterReturnProjections: Cypher.ProjectionColumn[] = [];
    const resultPredicates: Cypher.Predicate[] = [];
    const resultCollectingVariables: Cypher.Variable[] = [];
    Object.entries(aggregateEntityWhereInput).forEach(([key, value]) => {
        if (isLogicalOperator(key)) {
            const cypherBuilderFunction = getCypherLogicalOperator(key);
            const logicalPredicates: Cypher.Predicate[] = [];
            asArray(value).forEach((whereInput) => {
                const {
                    innerReturnProjections: innerReturnProjections,
                    predicates: innerPredicates,
                    collectingVariables: innerCollectingVariables,
                } = aggregateEntityWhere(whereInput, refNodeOrRelation, target, connectionPredicateData, context);
                resultInnerReturnProjections.push(...innerReturnProjections);
                resultOuterReturnProjections.push(...resultOuterReturnProjections);
                logicalPredicates.push(...innerPredicates);
                resultCollectingVariables.push(...innerCollectingVariables);
            });
            resultPredicates.push(cypherBuilderFunction(...logicalPredicates));
        } else {
            const operation = createEntityOperation(refNodeOrRelation, target, key, value, context);
            const operationVar = new Cypher.Variable();
            resultInnerReturnProjections.push([operation, operationVar]);
            resultOuterReturnProjections.push([
                getReturnValuePredicate(operationVar, connectionPredicateData),
                operationVar,
            ]);
            resultPredicates.push(Cypher.eq(operationVar, new Cypher.Literal(true)));
            resultCollectingVariables.push(operationVar);
        }
    });
    return {
        innerReturnProjections: resultInnerReturnProjections,
        predicates: resultPredicates,
        collectingVariables: resultCollectingVariables,
        outerReturnProjections: resultOuterReturnProjections,
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

function getReturnValuePredicate(
    operationVar: Cypher.Variable,
    outerConnectionPredicateData: ConnectionPredicateData[]
) {
    const relData = outerConnectionPredicateData.pop();
    const listVar = new Cypher.Variable();
    switch (relData?.listPredicateType) {
        case "all": {
            return Cypher.all(listVar, operationVar, getReturnValuePredicate(listVar, outerConnectionPredicateData));
        }
        case "single": {
            return Cypher.single(listVar, operationVar, getReturnValuePredicate(listVar, outerConnectionPredicateData));
        }
        case "not":
        case "none":
        case "any": {
            return Cypher.any(listVar, operationVar, getReturnValuePredicate(listVar, outerConnectionPredicateData));
        }
        default: {
            return Cypher.eq(operationVar, new Cypher.Literal(true));
        }
    }
}
