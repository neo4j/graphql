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
import Cypher from "@neo4j/cypher-builder";

export function translateRead({
    node,
    context,
    isRootConnectionField,
}: {
    context: Context;
    node: Node;
    isRootConnectionField?: boolean;
}): Cypher.CypherResult {
    const { resolveTree } = context;
    const varName = "this";

    const nodeVarRef = new Cypher.NamedNode(varName);

    let projAuth: Cypher.Clause | undefined;

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
        topLevelMatch.where(new Cypher.apoc.ValidatePredicate(Cypher.not(authPredicates), AUTH_FORBIDDEN_ERROR));
    }

    const projectionSubqueries = Cypher.concat(...projection.subqueries);
    const projectionSubqueriesBeforeSort = Cypher.concat(...projection.subqueriesBeforeSort);

    let withAndOrder: Cypher.Clause | undefined;
    let orderClause: Cypher.Clause | undefined;

    const optionsInput = (resolveTree.args.options || {}) as GraphQLOptionsArg;

    if (node.queryOptions) {
        optionsInput.limit = node.queryOptions.getLimit(optionsInput.limit); // TODO: improve this
    }

    const hasOrdering = optionsInput.sort || optionsInput.limit || optionsInput.offset;

    if (hasOrdering) {
        orderClause = getSortClause({
            context,
            varName,
            node,
        });

        withAndOrder = Cypher.concat(new Cypher.With("*"), orderClause);
    }

    const projectionExpression = new Cypher.RawCypher(() => {
        return [`${varName} ${projection.projection}`, projection.params];
    });

    let projectionClause: Cypher.Clause = new Cypher.Return([projectionExpression, varName]); // TODO: avoid reassign

    let connectionPreClauses: Cypher.Clause | undefined;

    if (isRootConnectionField) {
        // TODO: unify with createConnectionClause
        const edgesVar = new Cypher.NamedVariable("edges");
        const edgeVar = new Cypher.NamedVariable("edge");
        const totalCountVar = new Cypher.NamedVariable("totalCount");

        const withCollect = new Cypher.With([Cypher.collect(nodeVarRef), edgesVar]).with(edgesVar, [
            Cypher.size(edgesVar),
            totalCountVar,
        ]);

        const unwind = new Cypher.Unwind([edgesVar, nodeVarRef]).with(nodeVarRef, totalCountVar);
        connectionPreClauses = Cypher.concat(withCollect, unwind);

        const connectionEdge = new Cypher.Map({
            node: projectionExpression,
        });

        const withTotalCount = new Cypher.With([connectionEdge, edgeVar], totalCountVar, nodeVarRef);
        const connectionClause = getConnectionSortClause({ context, projection, varName });
        const returnClause = new Cypher.With([Cypher.collect(edgeVar), edgesVar], totalCountVar).return([
            new Cypher.Map({
                edges: edgesVar,
                totalCount: totalCountVar,
            }),
            nodeVarRef,
        ]);

        projectionClause = Cypher.concat(withTotalCount, connectionClause, returnClause);
    }

    const readQuery = Cypher.concat(
        topLevelMatch,
        projAuth,
        connectionPreClauses,
        projectionSubqueriesBeforeSort,
        withAndOrder, // Required for performance optimization
        projectionSubqueries,
        projectionClause
    );

    if (!projectionSubqueries.empty && hasOrdering) {
        const postOrder = getSortClause({
            context,
            varName,
            node,
        });

        readQuery.concat(postOrder);
    }

    return readQuery.build(undefined, context.cypherParams ? { cypherParams: context.cypherParams } : {});
}

function getSortClause({ context, varName, node }: { context: Context; varName: string; node: Node }): Cypher.Clause {
    const { resolveTree } = context;
    const optionsInput = (resolveTree.args.options || {}) as GraphQLOptionsArg;

    let limit: number | Integer | undefined = optionsInput.limit;
    if (node.queryOptions) {
        limit = node.queryOptions.getLimit(optionsInput.limit);
    }

    const hasLimit = Boolean(limit) || limit === 0;
    const params = {} as Record<string, any>;
    const hasOffset = Boolean(optionsInput.offset) || optionsInput.offset === 0;

    const sortOffsetLimit: string[] = [];

    if (optionsInput.sort && optionsInput.sort.length) {
        const sortArr = optionsInput.sort.reduce((res: string[], sort: GraphQLSortArg) => {
            return [
                ...res,
                ...Object.entries(sort).map(([field, direction]) => {
                    if (node.cypherFields.some((f) => f.fieldName === field)) {
                        return `${varName}_${field} ${direction}`;
                    }
                    return `${varName}.${field} ${direction}`;
                }),
            ];
        }, []);

        sortOffsetLimit.push(`ORDER BY ${sortArr.join(", ")}`);
    }

    if (hasOffset) {
        params[`${varName}_offset`] = optionsInput.offset;
        sortOffsetLimit.push(`SKIP $${varName}_offset`);
    }

    if (hasLimit) {
        params[`${varName}_limit`] = limit;
        sortOffsetLimit.push(`LIMIT $${varName}_limit`);
    }

    return new Cypher.RawCypher(() => {
        return [sortOffsetLimit.join("\n"), params];
    });
}

function getConnectionSortClause({
    context,
    projection,
    varName,
}: {
    context: Context;
    projection: ProjectionResult;
    varName: string;
}): Cypher.Clause {
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

    return new Cypher.RawCypher(() => {
        return [[sortStr, offsetStr, limitStr].join("\n"), cypherParams];
    });
}
