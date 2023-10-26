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

import type { GraphQLWhereArg, PredicateReturn } from "../../types";
import type { GraphElement } from "../../classes";
import Cypher from "@neo4j/cypher-builder";
// Recursive function
import { createPropertyWhere } from "./property-operations/create-property-where";
import type { LogicalOperator } from "../utils/logical-operators";
import { isLogicalOperator, getLogicalPredicate } from "../utils/logical-operators";
import { asArray, filterTruthy } from "../../utils/utils";
import type { Neo4jGraphQLTranslationContext } from "../../types/neo4j-graphql-translation-context";
import { QueryASTFactory } from "../queryAST/factory/QueryASTFactory";
import { FilterFactory } from "../queryAST/factory/FilterFactory";
import { QueryASTEnv, QueryASTContext } from "../queryAST/ast/QueryASTContext";
import { wrapSubqueriesInCypherCalls } from "../queryAST/utils/wrap-subquery-in-calls";
import Debug from "debug";
import { DEBUG_TRANSLATE } from "../../constants";
import type { QueryASTNode } from "../queryAST/ast/QueryASTNode";
import type { EntityAdapter } from "../../schema-model/entity/EntityAdapter";
const debug = Debug(DEBUG_TRANSLATE);

/** Translate a target node and GraphQL input into a Cypher operation or valid where expression */
// Previous implementation TODO remove it after the new implementation support useExistsExpr, checkParameterExistence
export function createWherePredicateLegacy({
    targetElement,
    whereInput,
    context,
    element,
    useExistExpr = true,
    checkParameterExistence,
}: {
    targetElement: Cypher.Variable;
    whereInput: GraphQLWhereArg;
    context: Neo4jGraphQLTranslationContext;
    element: GraphElement;
    useExistExpr?: boolean;
    checkParameterExistence?: boolean;
}): PredicateReturn {
    const whereFields = Object.entries(whereInput);
    const predicates: Cypher.Predicate[] = [];
    let subqueries: Cypher.CompositeClause | undefined;
    whereFields.forEach(([key, value]) => {
        if (isLogicalOperator(key)) {
            const { predicate, preComputedSubqueries } = createNestedPredicateLegacy({
                key: key,
                element,
                targetElement,
                context,
                value: asArray(value),
                useExistExpr,
                checkParameterExistence,
            });
            if (predicate) {
                predicates.push(predicate);
                if (preComputedSubqueries && !preComputedSubqueries.empty)
                    subqueries = Cypher.concat(subqueries, preComputedSubqueries);
            }
            return;
        }
        const { predicate, preComputedSubqueries } = createPropertyWhere({
            key,
            value,
            element,
            targetElement,
            context,
            useExistExpr,
            checkParameterExistence,
        });
        if (predicate) {
            predicates.push(predicate);
            if (preComputedSubqueries && !preComputedSubqueries.empty)
                subqueries = Cypher.concat(subqueries, preComputedSubqueries);
            return;
        }
    });
    // Implicit AND
    return {
        predicate: Cypher.and(...predicates),
        preComputedSubqueries: subqueries,
    };
}

function createNestedPredicateLegacy({
    key,
    element,
    targetElement,
    context,
    value,
    useExistExpr,
    checkParameterExistence,
}: {
    key: LogicalOperator;
    element: GraphElement;
    targetElement: Cypher.Variable;
    context: Neo4jGraphQLTranslationContext;
    value: Array<GraphQLWhereArg>;
    useExistExpr?: boolean;
    checkParameterExistence?: boolean;
}): PredicateReturn {
    const nested: Cypher.Predicate[] = [];
    let subqueries: Cypher.CompositeClause | undefined;

    value.forEach((v) => {
        const { predicate, preComputedSubqueries } = createWherePredicateLegacy({
            whereInput: v,
            element,
            targetElement,
            context,
            useExistExpr,
            checkParameterExistence,
        });
        if (predicate) {
            nested.push(predicate);
        }
        if (preComputedSubqueries && !preComputedSubqueries.empty)
            subqueries = Cypher.concat(subqueries, preComputedSubqueries);
    });
    const logicalPredicate = getLogicalPredicate(key, filterTruthy(nested));
    return { predicate: logicalPredicate, preComputedSubqueries: subqueries };
}

export function acreateWherePredicateNew({
    targetElement,
    whereInput,
    context,
    entity,
    useExistExpr = true,
    checkParameterExistence,
}: {
    targetElement: Cypher.Variable;
    whereInput: GraphQLWhereArg;
    context: Neo4jGraphQLTranslationContext;
    entity: EntityAdapter;
    useExistExpr?: boolean;
    checkParameterExistence?: boolean;
}): {
    predicate: Cypher.Predicate | undefined;
    extraSelections?: (Cypher.Match | Cypher.With)[];
    preComputedSubqueries?: Cypher.CompositeClause | undefined;
} {
    if (!useExistExpr) {
        throw new Error("Predicate without Exists is not supported yet using the new implementation");
    }

    if (checkParameterExistence) {
        throw new Error("Parameter existence is not supported yet using the new implementation");
    }
    const factory = new QueryASTFactory(context.schemaModel);
    const filterFactory = new FilterFactory(factory);
    const queryASTEnv = new QueryASTEnv();

    const queryASTContext = new QueryASTContext({
        target: targetElement as Cypher.Node,
        env: queryASTEnv,
        neo4jGraphQLContext: context,
    });

    const filters = filterFactory.createNodeFilters(entity, whereInput);

    filters.forEach((p) => {
        debug(print(p));
    });

    const subqueries = wrapSubqueriesInCypherCalls(queryASTContext, filters, [targetElement]);
    const predicates = filters.map((f) => f.getPredicate(queryASTContext));
    const extraSelections = filters.flatMap((f) => f.getSelection(queryASTContext));

    const preComputedSubqueries = [...extraSelections, ...subqueries];
    return {
        predicate: Cypher.and(...predicates),
        preComputedSubqueries: Cypher.concat(...preComputedSubqueries),
    };
}

// debug helper remove it
function print(treeNode: QueryASTNode) {
    const resultLines = getTreeLines(treeNode);
    return resultLines.join("\n");
}

function getTreeLines(treeNode: QueryASTNode, depth: number = 0): string[] {
    const nodeName = treeNode.print();
    const resultLines: string[] = [];

    if (depth === 0) {
        resultLines.push(`${nodeName}`);
    } else if (depth === 1) {
        resultLines.push(`|${"────".repeat(depth)} ${nodeName}`);
    } else {
        resultLines.push(`|${"    ".repeat(depth - 1)} |──── ${nodeName}`);
    }

    const children = treeNode.getChildren();
    if (children.length > 0) {
        children.forEach((curr) => {
            const childLines = getTreeLines(curr, depth + 1);
            resultLines.push(...childLines);
        });
    }

    return resultLines;
}
