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

import type { Node } from "../classes";
import { Neo4jGraphQLAuthenticationError } from "../classes";
import type { AuthOperations, BaseField, AuthRule, BaseAuthRule, Context, RelationField } from "../types";
import { isPredicateJoin, PREDICATE_JOINS } from "../utils/join-predicates";
import ContextParser from "../utils/context-parser";
import { isString } from "../utils/utils";
import { NodeAuth } from "../classes/NodeAuth";
import * as CypherBuilder from "./cypher-builder/CypherBuilder";
import mapToDbProperty from "../utils/map-to-db-property";
import { AUTH_UNAUTHENTICATED_ERROR } from "../constants";
import { getOrCreateCypherNode } from "./utils/get-or-create-cypher-variable";

interface Allow {
    varName: string | CypherBuilder.Node;
    parentNode: Node;
    chainStr?: string;
}

interface Bind {
    varName: string | CypherBuilder.Node;
    parentNode: Node;
    chainStr?: string;
}

interface Where {
    varName: string | CypherBuilder.Node;
    node: Node;
    chainStr?: string;
}

export function createAuthAndParams({
    entity,
    operations,
    skipRoles,
    skipIsAuthenticated,
    allow,
    context,
    escapeQuotes,
    bind,
    where,
}: {
    entity: Node | BaseField;
    operations?: AuthOperations | AuthOperations[];
    skipRoles?: boolean;
    skipIsAuthenticated?: boolean;
    allow?: Allow;
    context: Context;
    escapeQuotes?: boolean;
    bind?: Bind;
    where?: Where;
}): [string, Record<string, any>] {
    const authPredicate = createAuthPredicates({
        entity,
        operations,
        skipRoles,
        skipIsAuthenticated,
        allow,
        context,
        escapeQuotes,
        bind,
        where,
    });
    if (!authPredicate) return ["", {}];

    const authPredicateExpr = new CypherBuilder.RawCypher((env: CypherBuilder.Environment) => {
        return authPredicate.getCypher(env);
    });

    const chainStr = generateUniqueChainStr([where?.varName, allow?.varName, bind?.varName]);

    // Params must be globally unique, variables can be just slightly different, as each auth statement is scoped
    const authCypher = authPredicateExpr.build({ params: `${chainStr}auth_`, variables: `auth_` });

    return [authCypher.cypher, authCypher.params];
}

function generateUniqueChainStr(varNames: Array<string | CypherBuilder.Node | undefined>): string {
    return varNames
        .map((v) => {
            return typeof v === "string" ? v : "";
        })
        .join("");
}

export function createAuthPredicates({
    entity,
    operations,
    skipRoles,
    skipIsAuthenticated,
    allow,
    context,
    escapeQuotes,
    bind,
    where,
}: {
    entity: Node | BaseField;
    operations?: AuthOperations | AuthOperations[];
    skipRoles?: boolean;
    skipIsAuthenticated?: boolean;
    allow?: Allow;
    context: Context;
    escapeQuotes?: boolean;
    bind?: Bind;
    where?: Where;
}): CypherBuilder.Predicate | undefined {
    if (!entity.auth) {
        return undefined;
    }

    /** FIXME: this is required to keep compatibility with BaseField type */
    const nodeAuth = new NodeAuth(entity.auth);
    const authRules = nodeAuth.getRules(operations);

    const hasWhere = (rule: BaseAuthRule): boolean =>
        !!(rule.where || rule.AND?.some(hasWhere) || rule.OR?.some(hasWhere));

    if (where && !authRules.some(hasWhere)) {
        return undefined;
    }
    const subPredicates = authRules.map((authRule: AuthRule) => {
        const predicate = createSubPredicate({
            authRule,
            skipRoles,
            skipIsAuthenticated,
            allow,
            context,
            escapeQuotes,
            bind,
            where,
        });

        return predicate;
    });

    const orPredicates = CypherBuilder.or(...subPredicates);
    if (!orPredicates) return undefined;

    const authPredicate = new CypherBuilder.RawCypher((env: CypherBuilder.Environment) => {
        return orPredicates.getCypher(env);
    });
    return authPredicate;
}

function createSubPredicate({
    authRule,
    skipRoles,
    skipIsAuthenticated,
    allow,
    context,
    escapeQuotes,
    bind,
    where,
}: {
    authRule: AuthRule | BaseAuthRule;
    skipRoles?: boolean;
    skipIsAuthenticated?: boolean;
    allow?: Allow;
    context: Context;
    escapeQuotes?: boolean;
    bind?: Bind;
    where?: Where;
}): CypherBuilder.Predicate | undefined {
    const thisPredicates: CypherBuilder.Predicate[] = [];
    const authParam = new CypherBuilder.NamedParam("auth");

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
            node: allow.parentNode,
            nodeRef,
            rule: authRule,
            kind: "allow",
        });
        if (allowAndParams) {
            thisPredicates.push(allowAndParams);
        }
    }

    PREDICATE_JOINS.forEach((key) => {
        const value = authRule[key] as AuthRule["AND"] | AuthRule["OR"];

        if (!value) {
            return;
        }

        const predicates: CypherBuilder.Predicate[] = [];

        value.forEach((v) => {
            const predicate = createSubPredicate({
                authRule: v,
                skipRoles,
                skipIsAuthenticated,
                allow,
                context,
                escapeQuotes,
                bind,
                where,
            });

            if (!predicate) {
                return;
            }

            predicates.push(predicate);
        });

        let joinedPredicate: CypherBuilder.Predicate | undefined;
        if (key === "AND") {
            joinedPredicate = CypherBuilder.and(...predicates);
        } else if (key === "OR") {
            joinedPredicate = CypherBuilder.or(...predicates);
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
            node: bind.parentNode,
            nodeRef,
            rule: authRule,
            kind: "bind",
        });
        if (allowPredicate) {
            thisPredicates.push(allowPredicate);
        }
    }

    return CypherBuilder.and(...thisPredicates);
}

function createAuthPredicate({
    rule,
    node,
    nodeRef,
    context,
    kind,
}: {
    context: Context;
    nodeRef: CypherBuilder.Node;
    node: Node;
    rule: AuthRule;
    kind: "allow" | "bind" | "where";
}): CypherBuilder.Predicate | undefined {
    if (!rule[kind]) {
        return undefined;
    }

    const { allowUnauthenticated } = rule;
    const predicates: CypherBuilder.Predicate[] = [];

    Object.entries(rule[kind] as Record<string, any>).forEach(([key, value]) => {
        if (isPredicateJoin(key)) {
            const inner: CypherBuilder.Predicate[] = [];

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

            let operator: CypherBuilder.Predicate | undefined;
            if (key === "AND") {
                operator = CypherBuilder.and(...inner);
            } else if (key === "OR") {
                operator = CypherBuilder.or(...inner);
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
                param: new CypherBuilder.Param(paramValue),
                key,
                node,
                elementRef: nodeRef,
            });

            predicates.push(fieldPredicate);
        }

        const relationField = node.relationFields.find((x) => key === x.fieldName);

        if (relationField) {
            const refNode = context.nodes.find((x) => x.name === relationField.typeMeta.name) as Node;
            const relationshipNodeRef = new CypherBuilder.Node({
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
                });
                predicates.push(relationshipPredicate);
            });
        }
    });

    return CypherBuilder.and(...predicates);
}

function createRelationshipPredicate({
    nodeRef,
    relationField,
    targetNodeRef,
    authPredicate,
    kind,
}: {
    nodeRef: CypherBuilder.Node;
    relationField: RelationField;
    targetNodeRef: CypherBuilder.Node;
    authPredicate: CypherBuilder.Predicate;
    kind: string;
}): CypherBuilder.Predicate {
    const relationship = new CypherBuilder.Relationship({
        source: nodeRef,
        target: targetNodeRef,
        type: relationField.type,
    });

    const innerPattern = relationship.pattern({
        relationship: {
            variable: false,
        },
        source: {
            variable: true,
            labels: false,
        },
    });

    const existsPattern = relationship.pattern({
        target: {
            variable: false,
        },
        source: {
            variable: true,
            labels: false,
        },
        relationship: {
            variable: false,
        },
    });

    if (relationField.direction === "IN") {
        innerPattern.reverse();
        existsPattern.reverse();
    }

    let predicateFunction: CypherBuilder.PredicateFunction;
    if (kind === "allow") {
        predicateFunction = CypherBuilder.any(
            targetNodeRef,
            new CypherBuilder.PatternComprehension(innerPattern, targetNodeRef),
            authPredicate
        );
    } else {
        predicateFunction = CypherBuilder.all(
            targetNodeRef,
            new CypherBuilder.PatternComprehension(innerPattern, targetNodeRef),
            authPredicate
        );
    }

    const existsFunction = CypherBuilder.exists(existsPattern);

    return CypherBuilder.and(existsFunction, predicateFunction);
}

function createRolesPredicate(
    roles: string[],
    rolesParam: CypherBuilder.Param | CypherBuilder.PropertyRef
): CypherBuilder.PredicateFunction {
    const roleVar = new CypherBuilder.Variable();
    const rolesList = new CypherBuilder.Literal(roles);

    const roleInParamPredicate = isValueInListCypher(roleVar, rolesParam);

    const rolesInListComprehension = CypherBuilder.any(roleVar, rolesList, roleInParamPredicate);

    return rolesInListComprehension;
}

function createAuthenticatedPredicate(
    authenticated: boolean,
    authenticatedParam: CypherBuilder.Variable | CypherBuilder.PropertyRef
): CypherBuilder.Predicate {
    const authenticatedPredicate = CypherBuilder.not(
        CypherBuilder.eq(authenticatedParam, new CypherBuilder.Literal(authenticated))
    );

    return new CypherBuilder.apoc.ValidatePredicate(authenticatedPredicate, AUTH_UNAUTHENTICATED_ERROR);
}

function createAuthField({
    node,
    key,
    elementRef,
    param,
}: {
    node: Node;
    key: string;
    elementRef: CypherBuilder.Node | CypherBuilder.Relationship;
    param: CypherBuilder.Param;
}): CypherBuilder.Predicate {
    const dbFieldName = mapToDbProperty(node, key);
    const fieldPropertyRef = elementRef.property(dbFieldName);
    if (param.value === undefined) {
        return new CypherBuilder.Literal(false);
    }

    if (param.value === null) {
        return CypherBuilder.isNull(fieldPropertyRef);
    }

    const isNotNull = CypherBuilder.isNotNull(fieldPropertyRef);
    const equalsToParam = CypherBuilder.eq(fieldPropertyRef, param);
    return CypherBuilder.and(isNotNull, equalsToParam);
}

function isValueInListCypher(value: CypherBuilder.Variable, list: CypherBuilder.Expr): CypherBuilder.PredicateFunction {
    const listItemVar = new CypherBuilder.Variable();
    return CypherBuilder.any(listItemVar, list, CypherBuilder.eq(listItemVar, value));
}
