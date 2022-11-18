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

import type { AuthOperations, Context, GraphQLWhereArg } from "../types";
import type { Node } from "../classes";
import { createAuthAndParams } from "./create-auth-and-params";
import Cypher from "@neo4j/cypher-builder";
import { createWherePredicate } from "./where/create-where-predicate";
import { SCORE_FIELD } from "../graphql/directives/fulltext";
import { aggregationFieldRegEx, AggregationFieldRegexGroups, whereRegEx, WhereRegexGroups } from "./where/utils";
import { createBaseOperation } from "./where/property-operations/create-comparison-operation";

export function translateTopLevelMatch({
    matchNode,
    node,
    context,
    operation,
}: {
    matchNode: Cypher.Node;
    context: Context;
    node: Node;
    operation: AuthOperations;
}): Cypher.CypherResult {
    const clauses = createMatchClause({ matchNode, node, context, operation });
    const result = Cypher.concat(...clauses).build();
    return result;
}

export function createMatchClause({
    matchNode,
    node,
    context,
    operation,
}: {
    matchNode: Cypher.Node;
    context: Context;
    node: Node;
    operation: AuthOperations;
}): [Cypher.Match | Cypher.db.FullTextQueryNodes, Cypher.With] {
    const { resolveTree } = context;
    const fulltextInput = (resolveTree.args.fulltext || {}) as Record<string, { phrase: string }>;
    const topLevelWith = new Cypher.With("*");
    let matchQuery: Cypher.Match<Cypher.Node> | Cypher.db.FullTextQueryNodes;
    let whereInput = resolveTree.args.where as GraphQLWhereArg | undefined;

    // TODO: removed deprecated fulltext translation
    if (Object.entries(fulltextInput).length) {
        if (Object.entries(fulltextInput).length > 1) {
            throw new Error("Can only call one search at any given time");
        }
        const [indexName, indexInput] = Object.entries(fulltextInput)[0];
        const phraseParam = new Cypher.Param(indexInput.phrase);

        matchQuery = new Cypher.db.FullTextQueryNodes(matchNode, indexName, phraseParam);

        const labelsChecks = node.getLabels(context).map((label) => {
            return Cypher.in(new Cypher.Literal(label), Cypher.labels(matchNode));
        });

        const andChecks = Cypher.and(...labelsChecks);
        if (andChecks) topLevelWith.where(andChecks);
    } else if (context.fulltextIndex) {
        matchQuery = createFulltextMatchClause(matchNode, whereInput, node, context, topLevelWith);
        whereInput = whereInput?.[node.singular];
    } else {
        matchQuery = new Cypher.Match(matchNode);
    }

    if (whereInput) {
        const whereOp = createWherePredicate({
            targetElement: matchNode,
            whereInput,
            context,
            element: node,
        });

        if (whereOp) topLevelWith.where(whereOp);
    }

    const whereAuth = createAuthAndParams({
        operations: operation,
        entity: node,
        context,
        where: { varName: matchNode, node },
    });
    if (whereAuth[0]) {
        const authQuery = new Cypher.RawCypher(() => {
            return whereAuth;
        });

        topLevelWith.where(authQuery);
    }

    return [matchQuery, topLevelWith];
}

function createFulltextMatchClause(
    matchNode: Cypher.Node,
    whereInput: GraphQLWhereArg | undefined,
    node: Node,
    context: Context,
    topLevelWith: Cypher.With
): Cypher.db.FullTextQueryNodes {
    // TODO: remove indexName assignment and undefined check once the name argument has been removed.
    const indexName = context.fulltextIndex.indexName || context.fulltextIndex.name;
    if (indexName === undefined) {
        throw new Error("The name of the fulltext index should be defined using the indexName argument.");
    }
    const phraseParam = new Cypher.Param(context.resolveTree.args.phrase);
    const scoreVar = context.fulltextIndex.scoreVariable;

    const matchQuery = new Cypher.db.FullTextQueryNodes(matchNode, indexName, phraseParam, scoreVar);

    const expectedLabels = node.getLabels(context);
    const labelsChecks = matchNode.hasLabels(...expectedLabels);

    if (whereInput?.[SCORE_FIELD]) {
        if (whereInput[SCORE_FIELD].min || whereInput[SCORE_FIELD].min === 0) {
            const scoreMinOp = Cypher.gte(scoreVar, new Cypher.Param(whereInput[SCORE_FIELD].min));
            if (scoreMinOp) topLevelWith.where(scoreMinOp);
        }
        if (whereInput[SCORE_FIELD].max || whereInput[SCORE_FIELD].max === 0) {
            const scoreMaxOp = Cypher.lte(scoreVar, new Cypher.Param(whereInput[SCORE_FIELD].max));
            if (scoreMaxOp) topLevelWith.where(scoreMaxOp);
        }
    }

    if (labelsChecks) topLevelWith.where(labelsChecks);

    return matchQuery;
}

export function preComputedWhereFields(
    whereInput: any,
    node: Node,
    context: Context,
    matchNode: Cypher.Node,
    topLevelWith: Cypher.With
): Cypher.CompositeClause | undefined {
    if (!whereInput) {
        return;
    }
    let returnClause: Cypher.CompositeClause | undefined;
    Object.entries(whereInput).forEach(([key, value]) => {
        const match = whereRegEx.exec(key);
        if (!match) {
            throw new Error(`Failed to match key in filter: ${key}`);
        }
        const { fieldName, isAggregate } = match?.groups as WhereRegexGroups;
        const relationField = node.relationFields.find((x) => x.fieldName === fieldName);

        if (isAggregate) {
            if (!relationField) throw new Error("Aggregate filters must be on relationship fields");
            const refNode = context.nodes.find((x) => x.name === relationField.typeMeta.name) as Node;
            const direction = relationField.direction;
            const aggregationTarget = new Cypher.Node({ labels: refNode.getLabels(context) });
            const cypherRelation = new Cypher.Relationship({
                source: matchNode,
                target: aggregationTarget,
                type: relationField.type,
            });
            if (direction === "IN") {
                cypherRelation.reverse();
            }

            const matchQuery = new Cypher.Match(cypherRelation);

            const [returnVariables, predicates] = computeRootWhereAggregate(value, refNode, aggregationTarget, cypherRelation);
           
            console.log(predicates);
            topLevelWith.where(Cypher.and(...predicates));
            matchQuery.return(...returnVariables);
            returnClause = Cypher.concat(
                returnClause,
                new Cypher.Call(matchQuery).innerWith(matchNode)
                // new Cypher.With("*")
            );
        }
    });
    return returnClause;
}

function computeRootWhereAggregate(
    value: any,
    refNode: Node,
    aggregationTarget: Cypher.Node,
    cypherRelation: Cypher.Relationship
): [Array<"*" | Cypher.ProjectionColumn>, Cypher.Predicate[]]  {
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
                    const [_returnVariables, _predicates] = computeRootWhereAggregate(elementValue, refNode, aggregationTarget, cypherRelation);
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
            const { fieldName, aggregationOperator, logicalOperator } = aggregationFieldRegEx.exec(innerKey)
                ?.groups as AggregationFieldRegexGroups;
            const fieldType = refNode.primitiveFields.find((name) => name.fieldName === fieldName)?.typeMeta.name;
            let property =
                (fieldType === "String" && logicalOperator !== "EQUAL") ||
                (["AVERAGE", "LONGEST", "SHORTEST"].includes(aggregationOperator || "") && fieldType === "String")
                    ? Cypher.size(target.property(fieldName))
                    : target.property(fieldName);
            property = aggregationOperator ? createAggregateOperation(property, aggregationOperator) : property;

            const operation = createBaseOperation({
                operator: logicalOperator || "EQ",
                property,
                param: paramName,
            });
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
