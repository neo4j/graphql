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
import type { Node } from "../classes";
import { Neo4jGraphQLAuthenticationError } from "../classes";
import type { AuthOperations, BaseField, AuthRule, BaseAuthRule, Context, RelationField } from "../types";
import { isPredicateJoin, PREDICATE_JOINS } from "../utils/join-predicates";
import ContextParser from "../utils/context-parser";
import { isString } from "../utils/utils";
import { NodeAuth } from "../classes/NodeAuth";
import mapToDbProperty from "../utils/map-to-db-property";
import { AUTH_UNAUTHENTICATED_ERROR } from "../constants";
import { getOrCreateCypherNode } from "./utils/get-or-create-cypher-variable";
import { getCypherRelationshipDirection } from "../utils/get-relationship-direction";

interface Allow {
    varName: string | Cypher.Node;
    parentNode: Node;
}

interface Bind {
    varName: string | Cypher.Node;
    parentNode: Node;
}

interface Where {
    varName: string | Cypher.Node;
    node: Node;
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

    const authPredicateExpr = new Cypher.RawCypher((env: Cypher.Environment) => {
        return authPredicate.getCypher(env);
    });

    const chainStr = generateUniqueChainStr([where?.varName, allow?.varName, bind?.varName]);

    // Params must be globally unique, variables can be just slightly different, as each auth statement is scoped
    const authCypher = authPredicateExpr.build({ params: `${chainStr}auth_`, variables: `auth_` });

    return [authCypher.cypher, authCypher.params];
}

function generateUniqueChainStr(varNames: Array<string | Cypher.Node | undefined>): string {
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
}): Cypher.Predicate | undefined {
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

    const orPredicates = Cypher.or(...subPredicates);
    if (!orPredicates) return undefined;

    const authPredicate = new Cypher.RawCypher((env: Cypher.Environment) => {
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
                escapeQuotes,
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
        // console.trace("hocus pocus", bind.varName);

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

    return Cypher.and(...thisPredicates);
}

function createAuthPredicate({
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
            // const relationshipNodeRef = new Cypher.NamedNode("hocus", {
            //     labels: refNode.getLabels(context),
            // });
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

function createRelationshipPredicate({
    nodeRef,
    relationField,
    targetNodeRef,
    authPredicate,
    kind,
    context,
}: {
    nodeRef: Cypher.Node;
    relationField: RelationField;
    targetNodeRef: Cypher.Node;
    authPredicate: Cypher.Predicate;
    kind: string;
    context: Context;
}): Cypher.Predicate {
    const relationship = new Cypher.Relationship({
        type: relationField.type,
    });

    const direction = getCypherRelationshipDirection(relationField);
    const innerPattern = new Cypher.Pattern(nodeRef)
        .withoutLabels()
        .related(relationship)
        .withDirection(direction)
        .withoutVariable()
        .to(targetNodeRef);

    const existsPattern = new Cypher.Pattern(nodeRef)
        .withoutLabels()
        .related(relationship)
        .withDirection(direction)
        .withoutVariable()
        .to(targetNodeRef)
        .withoutVariable();

    let predicateFunction: Cypher.PredicateFunction;
    if (kind === "allow") {
        predicateFunction = Cypher.any(
            targetNodeRef,
            new Cypher.PatternComprehension(innerPattern, targetNodeRef),
            authPredicate
        );
    } else {
        if (!context.plugins?.auth) {
            throw new Error("Auth plugin is undefined");
        }
        predicateFunction = Cypher[context.plugins?.auth?.bindPredicate](
            targetNodeRef,
            new Cypher.PatternComprehension(innerPattern, targetNodeRef),
            authPredicate
        );
    }

    const existsFunction = Cypher.exists(existsPattern);

    return Cypher.and(existsFunction, predicateFunction);
}

function createRolesPredicate(
    roles: string[],
    rolesParam: Cypher.Param | Cypher.PropertyRef
): Cypher.PredicateFunction {
    const roleVar = new Cypher.Variable();
    const rolesList = new Cypher.Literal(roles);

    const roleInParamPredicate = isValueInListCypher(roleVar, rolesParam);

    const rolesInListComprehension = Cypher.any(roleVar, rolesList, roleInParamPredicate);

    return rolesInListComprehension;
}

function createAuthenticatedPredicate(
    authenticated: boolean,
    authenticatedParam: Cypher.Variable | Cypher.PropertyRef
): Cypher.Predicate {
    const authenticatedPredicate = Cypher.not(Cypher.eq(authenticatedParam, new Cypher.Literal(authenticated)));

    return new Cypher.apoc.ValidatePredicate(authenticatedPredicate, AUTH_UNAUTHENTICATED_ERROR);
}

function createAuthField({
    node,
    key,
    elementRef,
    param,
}: {
    node: Node;
    key: string;
    elementRef: Cypher.Node | Cypher.Relationship;
    param: Cypher.Param;
}): Cypher.Predicate {
    const dbFieldName = mapToDbProperty(node, key);
    const fieldPropertyRef = elementRef.property(dbFieldName);
    if (param.value === undefined) {
        return new Cypher.Literal(false);
    }

    if (param.value === null) {
        return Cypher.isNull(fieldPropertyRef);
    }

    const isNotNull = Cypher.isNotNull(fieldPropertyRef);
    const equalsToParam = Cypher.eq(fieldPropertyRef, param);
    return Cypher.and(isNotNull, equalsToParam);
}

function isValueInListCypher(value: Cypher.Variable, list: Cypher.Expr): Cypher.PredicateFunction {
    const listItemVar = new Cypher.Variable();
    return Cypher.any(listItemVar, list, Cypher.eq(listItemVar, value));
}
