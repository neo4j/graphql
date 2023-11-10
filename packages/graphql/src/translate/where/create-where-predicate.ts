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

import type { GraphQLWhereArg } from "../../types";
import Cypher from "@neo4j/cypher-builder";
import type { Neo4jGraphQLTranslationContext } from "../../types/neo4j-graphql-translation-context";
import type { EntityAdapter } from "../../schema-model/entity/EntityAdapter";
import { QueryASTEnv, QueryASTContext } from "../queryAST/ast/QueryASTContext";
import { QueryASTFactory } from "../queryAST/factory/QueryASTFactory";
import { wrapSubqueriesInCypherCalls } from "../queryAST/utils/wrap-subquery-in-calls";
import type { RelationshipAdapter } from "../../schema-model/relationship/model-adapters/RelationshipAdapter";

export function createWherePredicate({
    targetElement,
    whereInput,
    context,
    entity,
}: {
    targetElement: Cypher.Variable;
    whereInput: GraphQLWhereArg;
    context: Neo4jGraphQLTranslationContext;
    entity: EntityAdapter;
}): {
    predicate: Cypher.Predicate | undefined;
    extraSelections?: (Cypher.Match | Cypher.With)[];
    preComputedSubqueries?: Cypher.CompositeClause | undefined;
} {
    const factory = new QueryASTFactory(context.schemaModel);
    const queryASTEnv = new QueryASTEnv();

    const queryASTContext = new QueryASTContext({
        target: targetElement as Cypher.Node,
        env: queryASTEnv,
        neo4jGraphQLContext: context,
    });

    const filters = factory.filterFactory.createNodeFilters(entity, whereInput);

    const subqueries = wrapSubqueriesInCypherCalls(queryASTContext, filters, [targetElement]);
    const predicates = filters.map((f) => f.getPredicate(queryASTContext));
    const extraSelections = filters.flatMap((f) => f.getSelection(queryASTContext));

    const preComputedSubqueries = [...extraSelections, ...subqueries];

    return {
        predicate: Cypher.and(...predicates),
        preComputedSubqueries: Cypher.concat(...preComputedSubqueries),
    };
}

export function createWhereRelPredicate({
    targetElement,
    relationshipVariable,
    whereInput,
    context,
    rel,
}: {
    targetElement: Cypher.Variable;
    relationshipVariable: Cypher.Variable;
    whereInput: GraphQLWhereArg;
    context: Neo4jGraphQLTranslationContext;
    rel: RelationshipAdapter;
}): {
    predicate: Cypher.Predicate | undefined;
    extraSelections?: (Cypher.Match | Cypher.With)[];
    preComputedSubqueries?: Cypher.CompositeClause | undefined;
} {
    const factory = new QueryASTFactory(context.schemaModel);
    const queryASTEnv = new QueryASTEnv();

    const queryASTContext = new QueryASTContext({
        target: targetElement as Cypher.Node,
        relationship: relationshipVariable as Cypher.Relationship,
        env: queryASTEnv,
        neo4jGraphQLContext: context,
    });

    const filters = factory.filterFactory.createEdgeFilters(rel, whereInput);

    const subqueries = wrapSubqueriesInCypherCalls(queryASTContext, filters, [targetElement]);
    const predicates = filters.map((f) => f.getPredicate(queryASTContext));
    const extraSelections = filters.flatMap((f) => f.getSelection(queryASTContext));

    const preComputedSubqueries = [...extraSelections, ...subqueries];

    return {
        predicate: Cypher.and(...predicates),
        preComputedSubqueries: Cypher.concat(...preComputedSubqueries),
    };
}
/* 
function print(node: QueryASTNode): string {
    const resultLines = getTreeLines(node);
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
 */
