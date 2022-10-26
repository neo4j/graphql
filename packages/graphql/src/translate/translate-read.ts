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

import type { Integer } from "neo4j-driver";
import { int } from "neo4j-driver";
import { cursorToOffset } from "graphql-relay";
import type { Node } from "../classes";
import createProjectionAndParams, { ProjectionResult } from "./create-projection-and-params";
import type { GraphQLOptionsArg, GraphQLSortArg, Context } from "../types";
import { createAuthPredicates } from "./create-auth-and-params";
import { AUTH_FORBIDDEN_ERROR } from "../constants";
import { createMatchClause } from "./translate-top-level-match";
import * as CypherBuilder from "./cypher-builder/CypherBuilder";
import { addSortAndLimitOptionsToClause } from "./projection/subquery/add-sort-and-limit-to-clause";


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
): CypherBuilder.CypherResult {
    const { resolveTree } = context;
    const nodeVarRef = new CypherBuilder.NamedNode(varName);

    let projAuth: CypherBuilder.Clause | undefined;

    const topLevelMatch = createMatchClause({
        node,
        context,
        varName,
        operation: "READ",
    });

    const projection = createProjectionAndParams({
        node,
        context,
        resolveTree,
        varName,
    });

    if (projection.meta?.authValidateStrs?.length) {
        projAuth = new CypherBuilder.RawCypher(
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
        topLevelMatch.where(
            new CypherBuilder.apoc.ValidatePredicate(CypherBuilder.not(authPredicates), AUTH_FORBIDDEN_ERROR)
        );
    }

    const projectionSubqueries = CypherBuilder.concat(...projection.subqueries);
    const projectionSubqueriesBeforeSort = CypherBuilder.concat(...projection.subqueriesBeforeSort);

    let orderClause: CypherBuilder.Clause | undefined;

    const optionsInput = (resolveTree.args.options || {}) as GraphQLOptionsArg;

    if (node.queryOptions) {
        optionsInput.limit = node.queryOptions.getLimit(optionsInput.limit); // TODO: improve this
        resolveTree.args.options = resolveTree.args.options || {};
        (resolveTree.args.options as Record<string, any>).limit = optionsInput.limit;
    }

    const hasOrdering = optionsInput.sort || optionsInput.limit || optionsInput.offset;

    // May be needed for performance
    // if (hasOrdering) {
    //     orderClause = getSortClause({
    //         projectionClause: new CypherBuilder.With("*"),
    //         target: nodeVarRef,
    //         context,
    //         varName,
    //         node,
    //     });
    // }

    const projectionExpression = new CypherBuilder.RawCypher(() => {
        return [`${varName} ${projection.projection}`, projection.params];
    });

    let returnClause = new CypherBuilder.Return([projectionExpression, varName]);

    if (context.fulltextIndex?.scoreVariable) {
        returnClause = new CypherBuilder.Return(
            [projectionExpression, varName],
            [context.fulltextIndex?.scoreVariable, "score"]
        );
    }

    if (hasOrdering) {
        addSortAndLimitOptionsToClause(
            { optionsInput, target: nodeVarRef, projectionClause: returnClause },
            node,
            context
        );
    }

    let projectionClause: CypherBuilder.Clause = returnClause; // TODO avoid reassign
    let connectionPreClauses: CypherBuilder.Clause | undefined;

    if (isRootConnectionField) {
        // TODO: unify with createConnectionClause
        const edgesVar = new CypherBuilder.NamedVariable("edges");
        const edgeVar = new CypherBuilder.NamedVariable("edge");
        const totalCountVar = new CypherBuilder.NamedVariable("totalCount");

        const withCollect = new CypherBuilder.With([CypherBuilder.collect(nodeVarRef), edgesVar]).with(edgesVar, [
            CypherBuilder.size(edgesVar),
            totalCountVar,
        ]);

        const unwind = new CypherBuilder.Unwind([edgesVar, nodeVarRef]).with(nodeVarRef, totalCountVar);
        connectionPreClauses = CypherBuilder.concat(withCollect, unwind);

        const connectionEdge = new CypherBuilder.Map({
            node: projectionExpression,
        });

        const withTotalCount = new CypherBuilder.With([connectionEdge, edgeVar], totalCountVar, nodeVarRef);
        const connectionClause = getConnectionSortClause({ context, projection, varName });
        const returnClause = new CypherBuilder.With([CypherBuilder.collect(edgeVar), edgesVar], totalCountVar).return([
            new CypherBuilder.Map({
                edges: edgesVar,
                totalCount: totalCountVar,
            }),
            nodeVarRef,
        ]);

        if (!projectionSubqueries.empty && hasOrdering) {
            addSortAndLimitOptionsToClause(
                { optionsInput, target: nodeVarRef, projectionClause: returnClause },
                node,
                context
            );
        }

        projectionClause = CypherBuilder.concat(withTotalCount, connectionClause, returnClause);
    }

    const readQuery = CypherBuilder.concat(
        topLevelMatch,
        projAuth,
        connectionPreClauses,
        projectionSubqueriesBeforeSort,
        orderClause, // Required for performance optimization
        projectionSubqueries,
        projectionClause
    );

    return readQuery.build(undefined, context.cypherParams ? { cypherParams: context.cypherParams } : {});
}

function getConnectionSortClause({
    context,
    projection,
    varName,
}: {
    context: Context;
    projection: ProjectionResult;
    varName: string;
}): CypherBuilder.Clause {
    const { resolveTree } = context;

    const afterInput = resolveTree.args.after as string | undefined;
    const firstInput = resolveTree.args.first as Integer | number | undefined;
    const sortInput = resolveTree.args.sort as GraphQLSortArg[];

    const cypherParams = {} as Record<string, any>;

    const hasAfter = Boolean(afterInput);
    const hasFirst = Boolean(firstInput);
    const hasSort = Boolean(sortInput && sortInput.length);

    const sortCypherFields = projection.meta?.cypherSortFields ?? [];

    let sortStr = "";
    if (hasSort) {
        const sortArr = sortInput.reduce((res: string[], sort: GraphQLSortArg) => {
            return [
                ...res,
                ...Object.entries(sort).map(([field, direction]) => {
                    // if the sort arg is a cypher field, substitaute "edges" for varName
                    const varOrEdgeName = sortCypherFields.find((x) => x === field) ? "edge.node" : varName;
                    return `${varOrEdgeName}.${field} ${direction}`;
                }),
            ];
        }, []);

        sortStr = `ORDER BY ${sortArr.join(", ")}`;
    }

    let offsetStr = "";
    if (hasAfter && typeof afterInput === "string") {
        const offset = cursorToOffset(afterInput) + 1;
        if (offset && offset !== 0) {
            offsetStr = `SKIP $${varName}_offset`;
            cypherParams[`${varName}_offset`] = int(offset);
        }
    }

    let limitStr = "";
    if (hasFirst) {
        limitStr = `LIMIT $${varName}_limit`;
        cypherParams[`${varName}_limit`] = firstInput;
    }

    return new CypherBuilder.RawCypher(() => {
        return [[sortStr, offsetStr, limitStr].join("\n"), cypherParams];
    });
}
