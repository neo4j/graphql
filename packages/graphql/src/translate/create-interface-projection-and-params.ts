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
import { getCypherRelationshipDirection } from "../utils/get-relationship-direction";
import Cypher from "@neo4j/cypher-builder";
import { addSortAndLimitOptionsToClause } from "./projection/subquery/add-sort-and-limit-to-clause";
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
        const target = new Cypher.NamedNode(returnVariable);
        addSortAndLimitOptionsToClause({
            optionsInput,
            projectionClause: withClause,
            target,
        });
    }

    const unionClause = new Cypher.Union(...subqueries);
    const call = new Cypher.Call(unionClause);

    return new Cypher.RawCypher((env) => {
        const subqueryStr = call.getCypher(env);

        const withStr = withClause ? `${withClause.getCypher(env)}\n` : "";

        let interfaceProjection = [`WITH *`, subqueryStr];
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
        labels: refNode.getLabels(context),
    });

    const relationshipRef = new Cypher.Relationship({
        type: field.type,
    });
    const direction = getCypherRelationshipDirection(field, resolveTree.args);
    const pattern = new Cypher.Pattern(parentNode).related(relationshipRef).withDirection(direction).to(relatedNode);

    const withClause = new Cypher.With(...fullWithVars.map((f) => new Cypher.NamedVariable(f)));
    const matchQuery = new Cypher.Match(pattern);
    const predicates: Cypher.Predicate[] = [];

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
        predicates.push(apocValidateClause);
    }

    let preComputedWhereFieldSubqueries: Cypher.CompositeClause | undefined;

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

        const { predicate: wherePredicate, preComputedSubqueries } = createWherePredicate({
            whereInput: whereInput2,
            context,
            targetElement: relatedNode,
            element: refNode,
        });

        if (wherePredicate) {
            predicates.push(wherePredicate);
        }
        preComputedWhereFieldSubqueries = preComputedSubqueries;
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
        predicates.push(whereAuthPredicate);
    }

    const {
        projection,
        subqueries: projectionSubQueries,
        subqueriesBeforeSort,
    } = createProjectionAndParams({
        resolveTree,
        node: refNode,
        context,
        varName: new Cypher.NamedNode(param),
        literalElements: true,
        resolveType: true,
    });

    const projectionSubqueryClause = Cypher.concat(...subqueriesBeforeSort, ...projectionSubQueries);

    const returnClause = new Cypher.Return([projection, `${nodeVariable}_${field.fieldName}`]);

    if (preComputedWhereFieldSubqueries && preComputedWhereFieldSubqueries?.empty) {
        const preComputedWhereFieldsWith = new Cypher.With("*");
        preComputedWhereFieldsWith.where(Cypher.and(...predicates));
        return Cypher.concat(
            withClause,
            matchQuery,
            preComputedWhereFieldSubqueries,
            preComputedWhereFieldsWith,
            projectionSubqueryClause,
            returnClause
        );
    }

    matchQuery.where(Cypher.and(...predicates));

    return Cypher.concat(withClause, matchQuery, projectionSubqueryClause, returnClause);
}
