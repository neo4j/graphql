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
import { whereRegEx, WhereRegexGroups } from "./where/utils";
import { AggregateWhereInput, aggregateWhere } from "./create-aggregate-where-and-params";

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
    const { matchClause, withClause } = createMatchClause({ matchNode, node, context, operation });
    const aggregateWhereCall = preComputedWhereFields(
        context.resolveTree.args.where,
        node,
        context,
        matchNode,
        withClause
    );
    const result = Cypher.concat(matchClause, aggregateWhereCall, withClause).build();
    return result;
}

type CreateMatchClauseReturn = {
    matchClause: Cypher.Match | Cypher.db.FullTextQueryNodes;
    withClause: Cypher.With;
};

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
}): CreateMatchClauseReturn {
    const { resolveTree } = context;
    const fulltextInput = (resolveTree.args.fulltext || {}) as Record<string, { phrase: string }>;
    const withClause = new Cypher.With("*");
    let matchClause: Cypher.Match<Cypher.Node> | Cypher.db.FullTextQueryNodes;
    let whereInput = resolveTree.args.where as GraphQLWhereArg | undefined;

    // TODO: removed deprecated fulltext translation
    if (Object.entries(fulltextInput).length) {
        if (Object.entries(fulltextInput).length > 1) {
            throw new Error("Can only call one search at any given time");
        }
        const [indexName, indexInput] = Object.entries(fulltextInput)[0];
        const phraseParam = new Cypher.Param(indexInput.phrase);

        matchClause = new Cypher.db.FullTextQueryNodes(matchNode, indexName, phraseParam);

        const labelsChecks = node.getLabels(context).map((label) => {
            return Cypher.in(new Cypher.Literal(label), Cypher.labels(matchNode));
        });

        const andChecks = Cypher.and(...labelsChecks);
        if (andChecks) withClause.where(andChecks);
    } else if (context.fulltextIndex) {
        matchClause = createFulltextMatchClause(matchNode, whereInput, node, context, withClause);
        whereInput = whereInput?.[node.singular];
    } else {
        matchClause = new Cypher.Match(matchNode);
    }

    if (whereInput) {
        const whereOp = createWherePredicate({
            targetElement: matchNode,
            whereInput,
            context,
            element: node,
            topLevelWhere: true,
        });

        if (whereOp) withClause.where(whereOp);
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

        withClause.where(authQuery);
    }

    return {
        matchClause,
        withClause,
    };
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
    matchNode: Cypher.Variable,
    withClause: Cypher.With
): Cypher.Clause | undefined {
    if (!whereInput) {
        return;
    }
    const precomputedClauses = Object.entries(whereInput).map(([key, value]) => {
        const match = whereRegEx.exec(key);
        if (!match) {
            throw new Error(`Failed to match key in filter: ${key}`);
        }
        const { fieldName, isAggregate } = match?.groups as WhereRegexGroups;
        const relationField = node.relationFields.find((x) => x.fieldName === fieldName);

        if (isAggregate && relationField) {
            if (!value) {
                return;
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
            const { returnVariables, predicates } = aggregateWhere(
                value as AggregateWhereInput,
                refNode,
                aggregationTarget,
                cypherRelation
            );
            matchQuery.return(...returnVariables);
            withClause.where(Cypher.and(...predicates));
            return new Cypher.Call(matchQuery).innerWith(matchNode);
        }
    });
    return Cypher.concat(...precomputedClauses);
}
