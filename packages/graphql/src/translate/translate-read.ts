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

import { cursorToOffset } from "graphql-relay";
import type { Node } from "../classes";
import createProjectionAndParams from "./create-projection-and-params";
import type { GraphQLOptionsArg, Context, GraphQLWhereArg, CypherFieldReferenceMap } from "../types";
import { createAuthPredicates } from "./create-auth-predicates";
import { AUTH_FORBIDDEN_ERROR } from "../constants";
import { createMatchClause } from "./translate-top-level-match";
import Cypher from "@neo4j/cypher-builder";
import { addSortAndLimitOptionsToClause } from "./projection/subquery/add-sort-and-limit-to-clause";
import { SCORE_FIELD } from "../graphql/directives/fulltext";
import { compileCypher } from "../utils/compile-cypher";

export function translateRead(
    {
        node,
        context,
        isRootConnectionField,
    }: {
        context: Context;
        node: Node;
        isRootConnectionField?: boolean;
    },
    varName = "this"
): Cypher.CypherResult {
    const { resolveTree } = context;
    const matchNode = new Cypher.NamedNode(varName, { labels: node.getLabels(context) });

    const cypherFieldAliasMap: CypherFieldReferenceMap = {};

    const where = resolveTree.args.where as GraphQLWhereArg | undefined;

    let projAuth: Cypher.Clause | undefined;

    const {
        matchClause: topLevelMatch,
        preComputedWhereFieldSubqueries,
        whereClause: topLevelWhereClause,
    } = createMatchClause({
        matchNode,
        node,
        context,
        operation: "READ",
        where,
    });

    const projection = createProjectionAndParams({
        node,
        context,
        resolveTree,
        varName: new Cypher.NamedNode(varName),
        cypherFieldAliasMap,
    });

    if (projection.meta?.authValidatePredicates?.length) {
        projAuth = new Cypher.With("*").where(
            Cypher.apoc.util.validatePredicate(
                Cypher.not(Cypher.and(...projection.meta.authValidatePredicates)),
                AUTH_FORBIDDEN_ERROR
            )
        );
    }

    const authPredicates = createAuthPredicates({
        operations: "READ",
        entity: node,
        context,
        allow: {
            node,
            varName,
        },
    });

    if (authPredicates) {
        (topLevelWhereClause || topLevelMatch).where(
            Cypher.apoc.util.validatePredicate(Cypher.not(authPredicates), AUTH_FORBIDDEN_ERROR)
        );
    }

    const projectionSubqueries = Cypher.concat(...projection.subqueries);
    const projectionSubqueriesBeforeSort = Cypher.concat(...projection.subqueriesBeforeSort);

    let orderClause: Cypher.Clause | Cypher.With | undefined;

    const optionsInput = (resolveTree.args.options || {}) as GraphQLOptionsArg;

    if (context.fulltextIndex) {
        optionsInput.sort = optionsInput.sort?.[node?.singular] || optionsInput.sort;
    }

    if (node.queryOptions) {
        optionsInput.limit = node.queryOptions.getLimit(optionsInput.limit); // TODO: improve this
        resolveTree.args.options = resolveTree.args.options || {};
        (resolveTree.args.options as Record<string, any>).limit = optionsInput.limit;
    }

    const hasOrdering = optionsInput.sort || optionsInput.limit || optionsInput.offset;

    if (hasOrdering) {
        orderClause = new Cypher.With("*");
        addSortAndLimitOptionsToClause({
            optionsInput,
            target: matchNode,
            projectionClause: orderClause as Cypher.With,
            nodeField: node.singular,
            fulltextScoreVariable: context.fulltextIndex?.scoreVariable,
            cypherFields: node.cypherFields,
            cypherFieldAliasMap,
            graphElement: node,
        });
    }

    const projectionExpression = new Cypher.RawCypher((env) => {
        return [`${varName} ${compileCypher(projection.projection, env)}`, projection.params];
    });

    let returnClause = new Cypher.Return([projectionExpression, varName]);

    if (context.fulltextIndex?.scoreVariable) {
        returnClause = new Cypher.Return(
            [projectionExpression, varName],
            [context.fulltextIndex?.scoreVariable, SCORE_FIELD]
        );
    }

    let projectionClause: Cypher.Clause = returnClause; // TODO avoid reassign
    let connectionPreClauses: Cypher.Clause | undefined;

    if (isRootConnectionField) {
        const hasConnectionOrdering = resolveTree.args.first || resolveTree.args.after || resolveTree.args.sort;
        if (hasConnectionOrdering) {
            const afterInput = resolveTree.args.after as string | undefined;
            const offset = afterInput ? cursorToOffset(afterInput) + 1 : undefined;
            orderClause = new Cypher.With("*");
            addSortAndLimitOptionsToClause({
                optionsInput: {
                    sort: resolveTree.args.sort as any,
                    limit: resolveTree.args.first as any,
                    offset,
                },
                target: matchNode,
                projectionClause: orderClause as Cypher.With,
                nodeField: node.singular,
                fulltextScoreVariable: context.fulltextIndex?.scoreVariable,
                cypherFields: node.cypherFields,
                cypherFieldAliasMap,
                graphElement: node,
            });
        }

        // TODO: unify with createConnectionClause
        const edgesVar = new Cypher.NamedVariable("edges");
        const edgeVar = new Cypher.NamedVariable("edge");
        const totalCountVar = new Cypher.NamedVariable("totalCount");

        const withCollect = new Cypher.With([Cypher.collect(matchNode), edgesVar]).with(edgesVar, [
            Cypher.size(edgesVar),
            totalCountVar,
        ]);

        const unwind = new Cypher.Unwind([edgesVar, matchNode]).with(matchNode, totalCountVar);
        connectionPreClauses = Cypher.concat(withCollect, unwind);

        const connectionEdge = new Cypher.Map({
            node: projectionExpression,
        });

        const withTotalCount = new Cypher.With([connectionEdge, edgeVar], totalCountVar, matchNode);
        const returnClause = new Cypher.With([Cypher.collect(edgeVar), edgesVar], totalCountVar).return([
            new Cypher.Map({
                edges: edgesVar,
                totalCount: totalCountVar,
            }),
            matchNode,
        ]);

        projectionClause = Cypher.concat(withTotalCount, returnClause);
    }

    const preComputedWhereFields: Cypher.Clause | undefined =
        preComputedWhereFieldSubqueries && !preComputedWhereFieldSubqueries.empty
            ? Cypher.concat(preComputedWhereFieldSubqueries, topLevelWhereClause)
            : topLevelWhereClause;

    const readQuery = Cypher.concat(
        topLevelMatch,
        preComputedWhereFields,
        projAuth,
        connectionPreClauses,
        projectionSubqueriesBeforeSort,
        orderClause, // Required for performance optimization
        projectionSubqueries,
        projectionClause
    );
    const result = readQuery.build(undefined, context.cypherParams ? { cypherParams: context.cypherParams } : {});

    return result;
}
