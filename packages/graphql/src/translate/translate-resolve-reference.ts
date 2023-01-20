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

import type { Node } from "../classes";
import createProjectionAndParams from "./create-projection-and-params";
import type { GraphQLOptionsArg, Context } from "../types";
import { createAuthPredicates } from "./create-auth-and-params";
import { AUTH_FORBIDDEN_ERROR } from "../constants";
import { createMatchClause } from "./translate-top-level-match";
import Cypher from "@neo4j/cypher-builder";

export function translateResolveReference(
    {
        node,
        context,
        reference,
    }: {
        context: Context;
        node: Node;
        reference: any;
    },
    varName = "this"
): Cypher.CypherResult {
    const { resolveTree } = context;
    const matchNode = new Cypher.NamedNode(varName, { labels: node.getLabels(context) });

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { __typename, ...where } = reference;

    let projAuth: Cypher.Clause | undefined;

    console.log(resolveTree.args);

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
        varName,
    });

    if (projection.meta?.authValidateStrs?.length) {
        projAuth = new Cypher.RawCypher(
            `CALL apoc.util.validate(NOT (${projection.meta.authValidateStrs.join(
                " AND "
            )}), "${AUTH_FORBIDDEN_ERROR}", [0])`
        );
    }

    const authPredicates = createAuthPredicates({
        operations: "READ",
        entity: node,
        context,
        allow: {
            parentNode: node,
            varName,
        },
    });

    if (authPredicates) {
        topLevelWhereClause.where(new Cypher.apoc.ValidatePredicate(Cypher.not(authPredicates), AUTH_FORBIDDEN_ERROR));
    }

    const projectionSubqueries = Cypher.concat(...projection.subqueries);
    const projectionSubqueriesBeforeSort = Cypher.concat(...projection.subqueriesBeforeSort);

    const optionsInput = (resolveTree.args.options || {}) as GraphQLOptionsArg;

    if (context.fulltextIndex) {
        optionsInput.sort = optionsInput.sort?.[node?.singular] || optionsInput.sort;
    }

    if (node.queryOptions) {
        optionsInput.limit = node.queryOptions.getLimit(optionsInput.limit); // TODO: improve this
        resolveTree.args.options = resolveTree.args.options || {};
        (resolveTree.args.options as Record<string, any>).limit = optionsInput.limit;
    }

    const projectionExpression = new Cypher.RawCypher(() => {
        return [`${varName} ${projection.projection}`, projection.params];
    });

    const returnClause = new Cypher.Return([projectionExpression, varName]);

    const projectionClause: Cypher.Clause = returnClause; // TODO avoid reassign
    let connectionPreClauses: Cypher.Clause | undefined;

    const preComputedWhereFields =
        preComputedWhereFieldSubqueries && !preComputedWhereFieldSubqueries.empty
            ? Cypher.concat(preComputedWhereFieldSubqueries, topLevelWhereClause)
            : undefined;

    const readQuery = Cypher.concat(
        topLevelMatch,
        preComputedWhereFields,
        projAuth,
        connectionPreClauses,
        projectionSubqueriesBeforeSort,
        projectionSubqueries,
        projectionClause
    );

    return readQuery.build(undefined, context.cypherParams ? { cypherParams: context.cypherParams } : {});
}
