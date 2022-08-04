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

interface Allow {
    varName: string;
    parentNode: Node;
    chainStr?: string;
}

interface Bind {
    varName: string;
    parentNode: Node;
    chainStr?: string;
}

export default function createAuthAndParams({
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
    where?: { varName: string; chainStr?: string; node: Node };
}): [string, any] {
    if (!entity.auth) {
        return ["", {}];
    }

    /** FIXME: this is required to keep compatibility with BaseField type */
    const nodeAuth = new NodeAuth(entity.auth);
    const authRules = nodeAuth.getRules(operations);

    const hasWhere = (rule: BaseAuthRule): boolean =>
        !!(rule.where || rule.AND?.some(hasWhere) || rule.OR?.some(hasWhere));

    if (where && !authRules.some(hasWhere)) {
        return ["", [{}]];
    }
    const subPredicates = authRules.map((authRule: AuthRule, index) => {
        const predicate = createSubPredicate({
            authRule,
            index,
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
    if (!orPredicates) return ["", {}];

    const authPredicate = new CypherBuilder.RawCypher((env: CypherBuilder.Environment) => {
        return orPredicates.getCypher(env);
    });
    const authCypher = authPredicate.build();
    return [authCypher.cypher, authCypher.params];
}

function createSubPredicate({
    authRule,
    index,
    chainStr,
    skipRoles,
    skipIsAuthenticated,
    allow,
    context,
    escapeQuotes,
    bind,
    where,
}: {
    authRule: AuthRule | BaseAuthRule;
    index: number;
    chainStr?: string;

    skipRoles?: boolean;
    skipIsAuthenticated?: boolean;
    allow?: Allow;
    context: Context;
    escapeQuotes?: boolean;
    bind?: Bind;
    where?: { varName: string; chainStr?: string; node: Node };
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
        const allowAndParams = createAuthPredicate({
            context,
            node: allow.parentNode,
            varName: allow.varName,
            rule: authRule,
            chainStr: `${allow.chainStr || allow.varName}${chainStr || ""}_auth_allow${index}`,
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

        value.forEach((v, i) => {
            const predicate = createSubPredicate({
                authRule: v,
                index: i,
                chainStr: chainStr ? `${chainStr}${key}${i}` : `${key}${i}`,
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
        const wherePredicate = createAuthPredicate({
            context,
            node: where.node,
            varName: where.varName,
            rule: authRule,
            chainStr: `${where.chainStr || where.varName}${chainStr || ""}_auth_where${index}`,
            kind: "where",
        });
        if (wherePredicate) {
            thisPredicates.push(wherePredicate);
        }
    }

    if (bind && authRule.bind) {
        const allowPredicate = createAuthPredicate({
            context,
            node: bind.parentNode,
            varName: bind.varName,
            rule: authRule,
            chainStr: `${bind.chainStr || bind.varName}${chainStr || ""}_auth_bind${index}`,
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
    varName,
    context,
    chainStr,
    kind,
}: {
    context: Context;
    varName: string;
    node: Node;
    rule: AuthRule;
    chainStr: string;
    kind: "allow" | "bind" | "where";
}): CypherBuilder.Predicate | undefined {
    if (!rule[kind]) {
        return undefined;
    }

    const { allowUnauthenticated } = rule;
    const predicates: CypherBuilder.Predicate[] = [];

    Object.entries(rule[kind] as any).forEach(([key, value]) => {
        if (isPredicateJoin(key)) {
            const inner: CypherBuilder.Predicate[] = [];

            (value as any[]).forEach((v, i) => {
                const authPredicate = createAuthPredicate({
                    rule: {
                        [kind]: v,
                        allowUnauthenticated,
                    } as AuthRule,
                    varName,
                    node,
                    chainStr: `${chainStr}_${key}${i}`,
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
                param: new CypherBuilder.NamedParam(`${chainStr}_${key}`, paramValue), // TODO: change
                key,
                node,
                nodeRef: new CypherBuilder.NamedNode(varName),
            });

            predicates.push(fieldPredicate);
        }

        const relationField = node.relationFields.find((x) => key === x.fieldName);

        if (relationField) {
            const refNode = context.nodes.find((x) => x.name === relationField.typeMeta.name) as Node;
            const relationVarName = relationField.fieldName;

            Object.entries(value as any).forEach(([k, v]: [string, any]) => {
                const authPredicate = createAuthPredicate({
                    node: refNode,
                    context,
                    chainStr: `${chainStr}_${key}`,
                    varName: relationVarName,
                    rule: {
                        [kind]: { [k]: v },
                        allowUnauthenticated,
                    } as AuthRule,
                    kind,
                });
                if (!authPredicate) throw new Error("Invalid predicate");

                const relationshipPredicate = createRelationshipPredicate({
                    targetNode: refNode,
                    nodeRef: new CypherBuilder.NamedNode(varName),
                    relationVarName, // TODO: this should be autogenerated node
                    context,
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
    relationVarName,
    targetNode,
    context,
    authPredicate,
    kind,
}: {
    nodeRef: CypherBuilder.Node;
    relationField: RelationField;
    relationVarName: string;
    targetNode: Node;
    context: Context;
    authPredicate: CypherBuilder.Predicate;
    kind: string;
}): CypherBuilder.Predicate {
    const targetNodeRef = new CypherBuilder.NamedNode(relationVarName, { labels: targetNode.getLabels(context) });
    const relationship = new CypherBuilder.Relationship({
        source: nodeRef,
        target: targetNodeRef,
        type: relationField.type,
    });

    const innerPattern = relationship.pattern({
        relationship: {
            variable: false,
        },
    });

    const existsPattern = relationship.pattern({
        target: {
            variable: false,
        },
        source: {
            variable: true,
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
    nodeRef,
    param,
}: {
    node: Node;
    key: string;
    nodeRef: CypherBuilder.Node;
    param: CypherBuilder.Param;
}): CypherBuilder.Predicate {
    const dbFieldName = mapToDbProperty(node, key);
    const fieldPropertyRef = nodeRef.property(dbFieldName);
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
