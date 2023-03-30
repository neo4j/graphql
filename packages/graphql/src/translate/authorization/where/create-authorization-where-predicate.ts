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

import Cypher from "@neo4j/cypher-builder";
import type { Node } from "../../../classes";
import type { AuthorizationWhere } from "../../../schema-model/annotation/AuthorizationAnnotation";
import type { Context, GraphQLWhereArg, PredicateReturn } from "../../../types";
import { asArray } from "../../../utils/utils";
import type { LogicalOperator } from "../../utils/logical-operators";
import { isLogicalOperator, getCypherLogicalOperator } from "../../utils/logical-operators";
import { createWherePredicate } from "../../where/create-where-predicate";
import { createJwtPayloadWherePredicate } from "./create-authorization-jwt-payload-predicate";
import { populateWhereParams } from "../utils/populate-where-params";

export function createAuthorizationWherePredicate({
    where,
    context,
    node,
    target,
}: {
    where: AuthorizationWhere;
    context: Context;
    node: Node;
    target: Cypher.Variable;
}): PredicateReturn {
    const fields = Object.entries(where);
    const predicates: Cypher.Predicate[] = [];
    let subqueries: Cypher.CompositeClause | undefined;

    fields.forEach(([key, value]) => {
        if (isLogicalOperator(key)) {
            const { predicate, preComputedSubqueries } = createNestedPredicate({
                key,
                context,
                value: asArray(value),
                node,
                target,
            });

            if (predicate) {
                predicates.push(predicate);
            }

            if (preComputedSubqueries && !preComputedSubqueries.empty) {
                subqueries = Cypher.concat(subqueries, preComputedSubqueries);
            }

            return;
        }

        if (key === "node") {
            const { predicate, preComputedSubqueries } = createWherePredicate({
                element: node,
                context,
                // This doesn't _have_ to be done like this, we could just populate with the actual values instead of this approach - to discuss with Andres!
                whereInput: populateWhereParams({ where: value, context }),
                targetElement: target,
            });

            if (predicate) {
                predicates.push(predicate);
            }

            if (preComputedSubqueries && !preComputedSubqueries.empty) {
                subqueries = Cypher.concat(subqueries, preComputedSubqueries);
            }

            return;
        }

        if (key === "jwtPayload") {
            const predicate = createJwtPayloadWherePredicate({ where: value, context });

            if (predicate) {
                predicates.push(predicate);
            }

            return;
        }
    });

    // Implicit AND
    return {
        predicate: Cypher.and(...predicates),
        preComputedSubqueries: subqueries,
    };

    // const { predicate: wherePredicate, preComputedSubqueries } = createWherePredicate({
    //     element: node,
    //     context,
    //     whereInput: entity.annotations.authorization!,
    //     targetElement: target,
    // });

    // const jwtPayloadPredicate = createJwtPayloadWherePredicate({ where: where.jwtPayload });

    // let preComputedWhereFieldsResult = "";

    // const whereCypher = new Cypher.RawCypher((env: Cypher.Environment) => {
    //     preComputedWhereFieldsResult = preComputedSubqueries?.getCypher(env) || "";
    //     const cypher = wherePredicate?.getCypher(env) || "";
    //     return [cypher, {}];
    // });

    // const result = whereCypher.build(`${chainStr || ""}${varName}_`);
    // const whereStr = `${!recursing ? "WHERE " : ""}`;

    // return [`${whereStr}${result.cypher}`, preComputedWhereFieldsResult, result.params];
}

function createNestedPredicate({
    key,
    context,
    value,
    node,
    target,
}: {
    key: LogicalOperator;
    context: Context;
    value: Array<GraphQLWhereArg>;
    node: Node;
    target: Cypher.Variable;
}): PredicateReturn {
    const nested: Cypher.Predicate[] = [];
    let subqueries: Cypher.CompositeClause | undefined;

    value.forEach((v) => {
        const { predicate, preComputedSubqueries } = createAuthorizationWherePredicate({
            where: v,
            context,
            node,
            target,
        });

        if (predicate) {
            nested.push(predicate);
        }

        if (preComputedSubqueries && !preComputedSubqueries.empty) {
            subqueries = Cypher.concat(subqueries, preComputedSubqueries);
        }
    });

    const logicalOperator = getCypherLogicalOperator(key);
    return { predicate: logicalOperator(...nested), preComputedSubqueries: subqueries };
}
