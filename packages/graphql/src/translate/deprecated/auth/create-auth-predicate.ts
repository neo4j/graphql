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
import { Neo4jGraphQLAuthenticationError } from "../../../classes";
import type { Context, Node } from "../../../types";
import type { AuthRule } from "../../../types/deprecated/auth/auth-rule";
import ContextParser from "../../../utils/context-parser";
import { isPredicateJoin } from "../../../utils/join-predicates";
import { isString } from "../../../utils/utils";
import { createAuthField } from "./create-auth-field";
import { createRelationshipPredicate } from "./create-relationship-predicate";

export function createAuthPredicate({
    rule,
    node,
    nodeRef,
    context,
    kind,
}: {
    context: Context;
    nodeRef: Cypher.Node;
    node: Node;
    rule: AuthRule;
    kind: "allow" | "bind" | "where";
}): Cypher.Predicate | undefined {
    if (!rule[kind]) {
        return undefined;
    }

    const { allowUnauthenticated } = rule;
    const predicates: Cypher.Predicate[] = [];

    Object.entries(rule[kind] as Record<string, any>).forEach(([key, value]) => {
        if (isPredicateJoin(key)) {
            const inner: Cypher.Predicate[] = [];

            (value as any[]).forEach((v) => {
                const authPredicate = createAuthPredicate({
                    rule: {
                        [kind]: v,
                        allowUnauthenticated,
                    } as AuthRule,
                    nodeRef,
                    node,
                    context,
                    kind,
                });
                if (authPredicate) {
                    inner.push(authPredicate);
                }
            });

            let operator: Cypher.Predicate | undefined;
            if (key === "AND") {
                operator = Cypher.and(...inner);
            } else if (key === "OR") {
                operator = Cypher.or(...inner);
            }
            if (operator) predicates.push(operator);
        }

        const authableField = node.authableFields.find((field) => field.fieldName === key);

        if (authableField) {
            const jwtPath = isString(value) ? ContextParser.parseTag(value, "jwt") : undefined;
            let ctxPath = isString(value) ? ContextParser.parseTag(value, "context") : undefined;
            let paramValue = value as string | undefined;

            if (jwtPath) ctxPath = `jwt.${jwtPath}`;

            if (ctxPath) {
                paramValue = ContextParser.getProperty(ctxPath, context);
            }

            if (paramValue === undefined && allowUnauthenticated !== true) {
                throw new Neo4jGraphQLAuthenticationError("Unauthenticated");
            }
            const fieldPredicate = createAuthField({
                param: new Cypher.Param(paramValue),
                key,
                node,
                elementRef: nodeRef,
            });

            predicates.push(fieldPredicate);
        }

        const relationField = node.relationFields.find((x) => key === x.fieldName);

        if (relationField) {
            const refNode = context.nodes.find((x) => x.name === relationField.typeMeta.name) as Node;
            const relationshipNodeRef = new Cypher.Node({
                labels: refNode.getLabels(context),
            });
            Object.entries(value as Record<string, any>).forEach(([k, v]: [string, any]) => {
                const authPredicate = createAuthPredicate({
                    node: refNode,
                    context,
                    nodeRef: relationshipNodeRef,
                    rule: {
                        [kind]: { [k]: v },
                        allowUnauthenticated,
                    } as AuthRule,
                    kind,
                });
                if (!authPredicate) throw new Error("Invalid predicate");

                const relationshipPredicate = createRelationshipPredicate({
                    targetNodeRef: relationshipNodeRef,
                    nodeRef,
                    relationField,
                    authPredicate,
                    kind,
                    context,
                });
                predicates.push(relationshipPredicate);
            });
        }
    });

    return Cypher.and(...predicates);
}
