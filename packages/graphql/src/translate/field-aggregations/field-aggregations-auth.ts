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
import { AUTH_FORBIDDEN_ERROR } from "../../constants";
import { createAuthPredicates } from "../create-auth-predicates";
import type { Context, PredicateReturn } from "../../types";
import type { Node } from "../../classes";
import Cypher from "@neo4j/cypher-builder";
import { createAuthorizationBeforePredicate } from "../authorization/create-authorization-before-predicate";

export type AggregationAuth = {
    params: Record<string, string>;
    whereQuery: string;
};

export function createFieldAggregationAuth({
    node,
    context,
    subqueryNodeAlias,
    nodeFields,
}: {
    node: Node;
    context: Context;
    subqueryNodeAlias: Cypher.Node;
    nodeFields: Record<string, ResolveTree> | undefined;
}): PredicateReturn | undefined {
    const authPredicates: Cypher.Predicate[] = [];
    let preComputedSubqueries: Cypher.CompositeClause | undefined;

    const authorizationPredicateReturn = createAuthorizationBeforePredicate({
        context,
        variable: subqueryNodeAlias,
        node,
        operations: ["READ"],
    });

    if (authorizationPredicateReturn) {
        const { predicate: authorizationPredicate, preComputedSubqueries: authorizationSubqueries } =
            authorizationPredicateReturn;

        if (authorizationPredicate) {
            authPredicates.push(authorizationPredicate);
        }

        if (authorizationSubqueries && !authorizationSubqueries.empty) {
            preComputedSubqueries = Cypher.concat(preComputedSubqueries, authorizationSubqueries);
        }
    } else {
        // TODO: Authorization - delete for 4.0.0
        const allowAuth = getAllowAuth({ node, context, varName: subqueryNodeAlias });
        if (allowAuth) authPredicates.push(allowAuth);

        const whereAuth = getWhereAuth({ node, context, varName: subqueryNodeAlias });
        if (whereAuth) authPredicates.push(whereAuth);
    }

    const nodeAuth = getFieldAuth({ fields: nodeFields, node, context, varName: subqueryNodeAlias });

    if (nodeAuth) authPredicates.push(nodeAuth);

    return { predicate: Cypher.and(...authPredicates), preComputedSubqueries };
}

// TODO: Authorization - delete for 4.0.0
function getAllowAuth({
    node,
    context,
    varName,
}: {
    node: Node;
    context: Context;
    varName: Cypher.Node;
}): Cypher.Predicate | undefined {
    const allowAuth = createAuthPredicates({
        entity: node,
        operations: "READ",
        context,
        allow: { node, varName },
    });

    if (allowAuth) return Cypher.apoc.util.validatePredicate(Cypher.not(allowAuth), AUTH_FORBIDDEN_ERROR);

    return undefined;
}

// TODO: Authorization - delete for 4.0.0
function getWhereAuth({
    node,
    context,
    varName,
}: {
    node: Node;
    context: Context;
    varName: Cypher.Node;
}): Cypher.Predicate | undefined {
    const allowAuth = createAuthPredicates({
        entity: node,
        operations: "READ",
        context,
        where: { varName, node },
    });

    if (allowAuth) {
        return allowAuth;
    }

    return undefined;
}

function getFieldAuth({
    fields = {},
    node,
    context,
    varName,
}: {
    fields: Record<string, ResolveTree> | undefined;
    node: Node;
    context: Context;
    varName: Cypher.Node;
}): Cypher.Predicate | undefined {
    const authPredicates: Cypher.Predicate[] = [];
    Object.entries(fields).forEach((selection) => {
        const authField = node.authableFields.find((x) => x.fieldName === selection[0]);
        if (authField && authField.auth) {
            const allowAuth = createAuthPredicates({
                entity: authField,
                operations: "READ",
                context,
                allow: { node, varName },
            });

            if (allowAuth) authPredicates.push(allowAuth);
        }
    });

    if (authPredicates.length > 0) {
        return Cypher.apoc.util.validatePredicate(Cypher.not(Cypher.and(...authPredicates)), AUTH_FORBIDDEN_ERROR);
    }
    return undefined;
}
