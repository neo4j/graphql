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
import type { Context } from "../types";
import { createMatchClause } from "./translate-top-level-match";
import Cypher from "@neo4j/cypher-builder";

export function translateResolveReference({
    node,
    context,
    reference,
    cypherFieldAliasMap
}: {
    context: Context;
    node: Node;
    reference: any;
    cypherFieldAliasMap?: any;
}): Cypher.CypherResult {
    const varName = "this";
    const { resolveTree } = context;

    const matchNode = new Cypher.NamedNode(varName, { labels: node.getLabels(context) });

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { __typename, ...where } = reference;

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
        varName: matchNode,
        cypherFieldAliasMap: {}
    });

    const projectionSubqueries = Cypher.concat(...projection.subqueries, ...projection.subqueriesBeforeSort);

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
        connectionPreClauses,
        projectionSubqueries,
        projectionClause
    );

    return readQuery.build(undefined, context.cypherParams ? { cypherParams: context.cypherParams } : {});
}
