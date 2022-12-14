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

import type { Node } from "../../../classes";
import type { Context, GraphQLOptionsArg, GraphQLWhereArg, RelationField } from "../../../types";
import Cypher from "@neo4j/cypher-builder";
import { createWherePredicate } from "../../where/create-where-predicate";
import type { RelationshipDirection } from "../../../utils/get-relationship-direction";
import { createAuthPredicates } from "../../create-auth-and-params";
import { AUTH_FORBIDDEN_ERROR } from "../../../constants";
import { addSortAndLimitOptionsToClause } from "./add-sort-and-limit-to-clause";

export function createProjectionSubquery({
    parentNode,
    whereInput,
    node,
    context,
    alias,
    nestedProjection,
    nestedSubqueries,
    relationField,
    relationshipDirection,
    optionsInput,
    authValidateStrs,
    addSkipAndLimit = true,
    collect = true,
}: {
    parentNode: Cypher.Node;
    whereInput?: GraphQLWhereArg;
    node: Node;
    context: Context;
    alias: string; // TODO: this should be output variable instead
    nestedProjection: string;
    nestedSubqueries: Cypher.Clause[];
    relationField: RelationField;
    relationshipDirection: RelationshipDirection;
    optionsInput: GraphQLOptionsArg;
    authValidateStrs: string[] | undefined;
    addSkipAndLimit?: boolean;
    collect?: boolean;
}): Cypher.Clause {
    const isArray = relationField.typeMeta.array;
    const targetNode = new Cypher.NamedNode(alias, {
        labels: node.getLabels(context),
    });

    const relationship = new Cypher.Relationship({
        source: parentNode,
        target: targetNode,
        type: relationField.type,
    });
    if (relationshipDirection === "IN") {
        relationship.reverse();
    }

    const isUndirected = relationshipDirection === "undirected";
    const pattern = relationship.pattern({ directed: !isUndirected });

    const subqueryMatch = new Cypher.Match(pattern);

    const projection = new Cypher.RawCypher((env) => {
        // TODO: use MapProjection
        return `${targetNode.getCypher(env)} ${nestedProjection}`;
    });

    if (whereInput) {
        const wherePredicate = createWherePredicate({
            element: node,
            context,
            whereInput,
            targetElement: targetNode,
        });
        if (wherePredicate) subqueryMatch.where(wherePredicate);
    }

    const whereAuth = createAuthPredicates({
        entity: node,
        operations: "READ",
        context,
        where: {
            varName: alias,
            node,
        },
    });

    if (whereAuth) {
        subqueryMatch.and(whereAuth);
    }

    const preAuth = createAuthPredicates({
        entity: node,
        operations: "READ",
        context,
        allow: {
            parentNode: node,
            varName: alias,
        },
    });

    if (preAuth) {
        const allowAuth = new Cypher.apoc.ValidatePredicate(Cypher.not(preAuth), AUTH_FORBIDDEN_ERROR);
        subqueryMatch.and(allowAuth);
    }

    if (authValidateStrs?.length) {
        const authValidateStatements = authValidateStrs.map((str) => new Cypher.RawCypher(str));
        const authValidatePredicate = Cypher.and(...authValidateStatements);

        const authStatement = new Cypher.apoc.ValidatePredicate(
            Cypher.not(authValidatePredicate),
            AUTH_FORBIDDEN_ERROR
        );

        subqueryMatch.and(authStatement);
    }

    const returnVariable = new Cypher.NamedVariable(alias);
    const withStatement: Cypher.With = new Cypher.With([projection, returnVariable]); // This only works if nestedProjection is a map
    if (addSkipAndLimit) {
        addSortAndLimitOptionsToClause({
            optionsInput,
            target: returnVariable,
            projectionClause: withStatement,
        });
    }

    let returnProjection: Cypher.Expr = targetNode;
    if (collect) {
        returnProjection = Cypher.collect(targetNode);
        if (!isArray) {
            returnProjection = Cypher.head(returnProjection);
        }
    }

    const returnStatement = new Cypher.Return([returnProjection, returnVariable]);

    const subquery = Cypher.concat(subqueryMatch, ...nestedSubqueries, withStatement, returnStatement);

    return subquery;
}
