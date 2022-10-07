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

import type { ResolveTree } from "graphql-parse-resolve-info";
import { asArray, removeDuplicates } from "../utils/utils";
import type { Context, GraphQLOptionsArg, InterfaceWhereArg, RelationField } from "../types";
import { filterInterfaceNodes } from "../utils/filter-interface-nodes";
import { createAuthPredicates } from "./create-auth-and-params";

import createProjectionAndParams from "./create-projection-and-params";
import { getRelationshipDirection } from "../utils/get-relationship-direction";
import * as Cypher from "./cypher-builder/CypherBuilder";
import { addSortAndLimitOptionsToClause } from "./projection/subquery/add-sort-and-limit-to-clause";
import { compileCypherIfExists } from "./cypher-builder/utils/utils";
import type { Node } from "../classes";
import { createWherePredicate } from "./where/create-where-predicate";
import { AUTH_FORBIDDEN_ERROR } from "../constants";

export default function createInterfaceProjectionAndParams({
    resolveTree,
    field,
    context,
    nodeVariable,
    withVars,
}: {
    resolveTree: ResolveTree;
    field: RelationField;
    context: Context;
    nodeVariable: string;
    withVars?: string[];
}): Cypher.Clause {
    const fullWithVars = removeDuplicates([...asArray(withVars), nodeVariable]);
    const parentNode = new Cypher.NamedNode(nodeVariable);
    const whereInput = resolveTree.args.where as InterfaceWhereArg;
    const returnVariable = `${nodeVariable}_${field.fieldName}`;

    const referenceNodes = context.nodes.filter(
        (node) => field.interface?.implementations?.includes(node.name) && filterInterfaceNodes({ node, whereInput })
    );

    const subqueries = referenceNodes.map((refNode) => {
        return createInterfaceSubquery({
            refNode,
            nodeVariable,
            field,
            resolveTree,
            context,
            parentNode,
            fullWithVars,
        });
    });

    const optionsInput = resolveTree.args.options as GraphQLOptionsArg | undefined;
    let withClause: Cypher.With | undefined;
    if (optionsInput) {
        withClause = new Cypher.With("*");
        addSortAndLimitOptionsToClause({
            optionsInput,
            projectionClause: withClause,
            target: new Cypher.NamedNode(returnVariable),
        });
    }

    const unionClause = new Cypher.Union(...subqueries);
    const call = new Cypher.Call(unionClause);

    return new Cypher.RawCypher((env) => {
        const subqueryStr = call.getCypher(env);
        const withStr = compileCypherIfExists(withClause, env, { suffix: "\n" });

        let interfaceProjection = [`WITH ${fullWithVars.join(", ")}`, subqueryStr];
        if (field.typeMeta.array) {
            interfaceProjection = [
                `WITH *`,
                "CALL {",
                ...interfaceProjection,
                `${withStr}RETURN collect(${returnVariable}) AS ${returnVariable}`,
                "}",
            ];
        }

        return interfaceProjection.join("\n");
    });
}

function createInterfaceSubquery({
    refNode,
    nodeVariable,
    field,
    resolveTree,
    context,
    parentNode,
    fullWithVars,
}: {
    refNode: Node;
    nodeVariable: string;
    field: RelationField;
    resolveTree: ResolveTree;
    context: Context;
    parentNode: Cypher.Node;
    fullWithVars: string[];
}): Cypher.Clause {
    const whereInput = resolveTree.args.where as InterfaceWhereArg;

    const param = `${nodeVariable}_${refNode.name}`;
    const relatedNode = new Cypher.NamedNode(param, {
        labels: [refNode.name], // NOTE: should this be labels?
    });

    const relationshipRef = new Cypher.Relationship({
        source: parentNode,
        target: relatedNode,
        type: field.type,
    });

    const direction = getRelationshipDirection(field, resolveTree.args);
    const pattern = relationshipRef.pattern({
        source: {
            labels: false,
        },
        directed: direction !== "undirected",
    });

    if (direction === "IN") pattern.reverse();

    const withClause = new Cypher.With(...fullWithVars.map((f) => new Cypher.NamedVariable(f)));
    const matchQuery = new Cypher.Match(pattern);

    const authAllowPredicate = createAuthPredicates({
        entity: refNode,
        operations: "READ",
        allow: {
            parentNode: refNode,
            varName: relatedNode,
        },
        context,
    });
    if (authAllowPredicate) {
        const apocValidateClause = new Cypher.apoc.ValidatePredicate(
            Cypher.not(authAllowPredicate),
            AUTH_FORBIDDEN_ERROR
        );
        matchQuery.where(apocValidateClause);
    }

    if (resolveTree.args.where) {
        const whereInput2 = {
            ...Object.entries(whereInput).reduce((args, [k, v]) => {
                if (k !== "_on") {
                    return { ...args, [k]: v };
                }

                return args;
            }, {}),
            ...(whereInput?._on?.[refNode.name] || {}),
        };

        const wherePredicate = createWherePredicate({
            whereInput: whereInput2,
            context,
            targetElement: relatedNode,
            element: refNode,
        });

        if (wherePredicate) {
            matchQuery.where(wherePredicate);
        }
    }

    const whereAuthPredicate = createAuthPredicates({
        entity: refNode,
        operations: "READ",
        where: {
            node: refNode,
            varName: relatedNode,
        },
        context,
    });
    if (whereAuthPredicate) {
        matchQuery.where(whereAuthPredicate);
    }

    const {
        projection: projectionStr,
        subqueries: projectionSubQueries,
        subqueriesBeforeSort,
    } = createProjectionAndParams({
        resolveTree,
        node: refNode,
        context,
        varName: param,
        literalElements: true,
        resolveType: true,
    });

    const projectionSubqueryClause = Cypher.concat(...subqueriesBeforeSort, ...projectionSubQueries);

    const returnClause = new Cypher.Return([new Cypher.RawCypher(projectionStr), `${nodeVariable}_${field.fieldName}`]);

    return Cypher.concat(withClause, matchQuery, projectionSubqueryClause, returnClause);
}
