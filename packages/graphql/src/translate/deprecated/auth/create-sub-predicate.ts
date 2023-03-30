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
import type { Context } from "../../../types";
import type { AuthRule } from "../../../types/deprecated/auth/auth-rule";
import type { BaseAuthRule } from "../../../types/deprecated/auth/base-auth-rule";
import { PREDICATE_JOINS } from "../../../utils/join-predicates";
import { getOrCreateCypherNode } from "../../utils/get-or-create-cypher-variable";
import { createAuthPredicate } from "./create-auth-predicate";
import { createAuthenticatedPredicate } from "./create-authenticated-predicate";
import { createRolesPredicate } from "./create-roles-predicate";
import type { Rule } from "./types";

export function createSubPredicate({
    authRule,
    skipRoles,
    skipIsAuthenticated,
    allow,
    context,
    bind,
    where,
}: {
    authRule: AuthRule | BaseAuthRule;
    skipRoles?: boolean;
    skipIsAuthenticated?: boolean;
    allow?: Rule;
    context: Context;
    bind?: Rule;
    where?: Rule;
}): Cypher.Predicate | undefined {
    const thisPredicates: Cypher.Predicate[] = [];
    const authParam = new Cypher.NamedParam("auth");

    if (!skipRoles && authRule.roles) {
        const rolesPredicate = createRolesPredicate(authRule.roles, authParam.property("roles"));
        thisPredicates.push(rolesPredicate);
    }

    if (!skipIsAuthenticated && (authRule.isAuthenticated === true || authRule.isAuthenticated === false)) {
        const authenticatedPredicate = createAuthenticatedPredicate(
            authRule.isAuthenticated,
            authParam.property("isAuthenticated")
        );
        thisPredicates.push(authenticatedPredicate);
    }

    if (allow && authRule.allow) {
        const nodeRef = getOrCreateCypherNode(allow.varName);
        const allowAndParams = createAuthPredicate({
            context,
            node: allow.node,
            nodeRef,
            rule: authRule,
            kind: "allow",
        });
        if (allowAndParams) {
            thisPredicates.push(allowAndParams);
        }
    }

    PREDICATE_JOINS.forEach((key) => {
        const value = authRule[key];

        if (!value) {
            return;
        }

        const predicates: Cypher.Predicate[] = [];

        value.forEach((v) => {
            const predicate = createSubPredicate({
                authRule: v,
                skipRoles,
                skipIsAuthenticated,
                allow,
                context,
                bind,
                where,
            });

            if (!predicate) {
                return;
            }

            predicates.push(predicate);
        });

        let joinedPredicate: Cypher.Predicate | undefined;
        if (key === "AND") {
            joinedPredicate = Cypher.and(...predicates);
        } else if (key === "OR") {
            joinedPredicate = Cypher.or(...predicates);
        }
        if (joinedPredicate) {
            thisPredicates.push(joinedPredicate);
        }
    });

    if (where && authRule.where) {
        const nodeRef = getOrCreateCypherNode(where.varName);

        const wherePredicate = createAuthPredicate({
            context,
            node: where.node,
            nodeRef,
            rule: authRule,
            kind: "where",
        });
        if (wherePredicate) {
            thisPredicates.push(wherePredicate);
        }
    }

    if (bind && authRule.bind) {
        const nodeRef = getOrCreateCypherNode(bind.varName);

        const allowPredicate = createAuthPredicate({
            context,
            node: bind.node,
            nodeRef,
            rule: authRule,
            kind: "bind",
        });
        if (allowPredicate) {
            thisPredicates.push(allowPredicate);
        }
    }

    return Cypher.and(...thisPredicates);
}
