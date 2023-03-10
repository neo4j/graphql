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
import type { CypherRelationshipDirection } from "../../../utils/get-relationship-direction";
import { createAuthPredicates } from "../../create-auth-and-params";
import { AUTH_FORBIDDEN_ERROR } from "../../../constants";
import { addSortAndLimitOptionsToClause } from "./add-sort-and-limit-to-clause";

export function createProjectionSubquery({
    parentNode,
    whereInput,
    node,
    context,
    subqueryReturnAlias,
    nestedProjection,
    nestedSubqueries,
    targetNode,
    relationField,
    relationshipDirection,
    optionsInput,
    authValidatePredicates,
    addSkipAndLimit = true,
    collect = true,
}: {
    parentNode: Cypher.Node;
    whereInput?: GraphQLWhereArg;
    node: Node;
    context: Context;
    nestedProjection: Cypher.Expr;
    nestedSubqueries: Cypher.Clause[];
    targetNode: Cypher.Node;
    subqueryReturnAlias: Cypher.Variable;
    relationField: RelationField;
    relationshipDirection: CypherRelationshipDirection;
    optionsInput: GraphQLOptionsArg;
    authValidatePredicates: Cypher.Predicate[] | undefined;
    addSkipAndLimit?: boolean;
    collect?: boolean;
}): Cypher.Clause {
    const isArray = relationField.typeMeta.array;

    const relationship = new Cypher.Relationship({
        type: relationField.type,
    });
    const pattern = new Cypher.Pattern(parentNode)
        .withoutLabels()
        .related(relationship)
        .withDirection(relationshipDirection)
        .to(targetNode);

    const subqueryMatch = new Cypher.Match(pattern);
    const predicates: Cypher.Predicate[] = [];

    const projection = new Cypher.RawCypher((env) => {
        // TODO: use MapProjection
        return `${targetNode.getCypher(env)} ${nestedProjection.getCypher(env)}`;
    });

    let preComputedWhereFieldSubqueries: Cypher.CompositeClause | undefined;

    if (whereInput) {
        const { predicate: wherePredicate, preComputedSubqueries } = createWherePredicate({
            element: node,
            context,
            whereInput,
            targetElement: targetNode,
        });
        if (wherePredicate) predicates.push(wherePredicate);
        preComputedWhereFieldSubqueries = preComputedSubqueries;
    }

    const whereAuth = createAuthPredicates({
        entity: node,
        operations: "READ",
        context,
        where: {
            varName: targetNode,
            node,
        },
    });

    if (whereAuth) {
        predicates.push(whereAuth);
    }

    const preAuth = createAuthPredicates({
        entity: node,
        operations: "READ",
        context,
        allow: {
            parentNode: node,
            varName: targetNode,
        },
    });

    if (preAuth) {
        const allowAuth = new Cypher.apoc.ValidatePredicate(Cypher.not(preAuth), AUTH_FORBIDDEN_ERROR);
        predicates.push(allowAuth);
    }

    if (authValidatePredicates?.length) {
        const authValidatePredicate = Cypher.and(...authValidatePredicates);

        const authStatement = new Cypher.apoc.ValidatePredicate(
            Cypher.not(authValidatePredicate),
            AUTH_FORBIDDEN_ERROR
        );

        predicates.push(authStatement);
    }

    const withStatement: Cypher.With = new Cypher.With([projection, targetNode]); // This only works if nestedProjection is a map
    if (addSkipAndLimit) {
        addSortAndLimitOptionsToClause({
            optionsInput,
            target: targetNode,
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

    const returnStatement = new Cypher.Return([returnProjection, subqueryReturnAlias]);

    if (preComputedWhereFieldSubqueries && !preComputedWhereFieldSubqueries.empty) {
        const preComputedSubqueryWith = new Cypher.With("*");
        preComputedSubqueryWith.where(Cypher.and(...predicates));
        return Cypher.concat(
            subqueryMatch,
            preComputedWhereFieldSubqueries,
            preComputedSubqueryWith,
            ...nestedSubqueries,
            withStatement,
            returnStatement
        );
    }

    subqueryMatch.where(Cypher.and(...predicates));

    return Cypher.concat(subqueryMatch, ...nestedSubqueries, withStatement, returnStatement);
}
