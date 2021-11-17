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

import { Neo4jGraphQLAuthenticationError, Node } from "../classes";
import { AuthOperations, BaseField, AuthRule, BaseAuthRule, Context } from "../types";
import { AUTH_UNAUTHENTICATED_ERROR } from "../constants";
import mapToDbProperty from "../utils/map-to-db-property";
import joinPredicates, { isPredicateJoin, PREDICATE_JOINS } from "../utils/join-predicates";
import ContextParser from "../utils/context-parser";
import { isString, asArray, haveSharedElement } from "../utils/utils";

interface Res {
    strs: string[];
    params: any;
}

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

function createRolesStr({ roles, escapeQuotes }: { roles: string[]; escapeQuotes?: boolean }) {
    const quote = escapeQuotes ? `\\"` : `"`;

    const joined = roles.map((r) => `${quote}${r}${quote}`).join(", ");

    return `ANY(r IN [${joined}] WHERE ANY(rr IN $auth.roles WHERE r = rr))`;
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
}): [string, any] {
    if (!rule[kind]) {
        return ["", {}];
    }

    const { allowUnauthenticated } = rule;

    const result = Object.entries(rule[kind] as any).reduce(
        (res: Res, [key, value]) => {
            if (isPredicateJoin(key)) {
                const inner: string[] = [];

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

                    inner.push(authPredicate[0]);
                    res.params = { ...res.params, ...authPredicate[1] };
                });

                res.strs.push(joinPredicates(inner, key));
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

                const dbFieldName = mapToDbProperty(node, key);
                if (paramValue === undefined) {
                    res.strs.push("false");
                } else if (paramValue === null) {
                    res.strs.push(`${varName}.${dbFieldName} IS NULL`);
                } else {
                    const param = `${chainStr}_${key}`;
                    res.params[param] = paramValue;
                    res.strs.push(`${varName}.${dbFieldName} IS NOT NULL AND ${varName}.${dbFieldName} = $${param}`);
                }
            }

            const relationField = node.relationFields.find((x) => key === x.fieldName);
            if (relationField) {
                const refNode = context.neoSchema.nodes.find((x) => x.name === relationField.typeMeta.name) as Node;
                const inStr = relationField.direction === "IN" ? "<-" : "-";
                const outStr = relationField.direction === "OUT" ? "->" : "-";
                const relTypeStr = `[:${relationField.type}]`;
                const relationVarName = relationField.fieldName;
                const labels = refNode.getLabelString(context);
                let resultStr = [
                    `EXISTS((${varName})${inStr}${relTypeStr}${outStr}(${labels}))`,
                    `AND ${
                        kind === "allow" ? "ANY" : "ALL"
                    }(${relationVarName} IN [(${varName})${inStr}${relTypeStr}${outStr}(${relationVarName}${labels}) | ${relationVarName}] WHERE `,
                ].join(" ");

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
                    resultStr += authPredicate[0];
                    resultStr += ")"; // close ALL
                    res.params = { ...res.params, ...authPredicate[1] };
                    res.strs.push(resultStr);
                });
            }

            return res;
        },
        { params: {}, strs: [] }
    );

    return [joinPredicates(result.strs, "AND"), result.params];
}

function createAuthAndParams({
    entity,
    operation,
    skipRoles,
    skipIsAuthenticated,
    allow,
    context,
    escapeQuotes,
    bind,
    where,
}: {
    entity: Node | BaseField;
    operation?: AuthOperations | AuthOperations[];
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

    let authRules: AuthRule[] = [];
    if (operation) {
        const operations = asArray(operation);
        authRules = entity?.auth.rules.filter(
            (r) => !r.operations || haveSharedElement(operations, r.operations || [])
        );
    } else {
        authRules = entity?.auth.rules;
    }

    if (where) {
        const subPredicates = authRules.reduce(
            (res: Res, authRule: AuthRule, index): Res => {
                if (!authRule.where) {
                    return res;
                }

                const authWhere = createAuthPredicate({
                    rule: {
                        where: authRule.where,
                        allowUnauthenticated: authRule.allowUnauthenticated,
                    },
                    context,
                    node: where.node,
                    varName: where.varName,
                    chainStr: `${where.chainStr || where.varName}_auth_where${index}`,
                    kind: "where",
                });

                return {
                    strs: [...res.strs, authWhere[0]],
                    params: { ...res.params, ...authWhere[1] },
                };
            },
            { strs: [], params: {} }
        );

        return [joinPredicates(subPredicates.strs, "OR"), subPredicates.params];
    }

    function createSubPredicate({
        authRule,
        index,
        chainStr,
    }: {
        authRule: AuthRule | BaseAuthRule;
        index: number;
        chainStr?: string;
    }): [string, any] {
        const thisPredicates: string[] = [];
        let thisParams: any = {};

        if (!skipRoles && authRule.roles) {
            thisPredicates.push(createRolesStr({ roles: authRule.roles, escapeQuotes }));
        }

        const quotes = escapeQuotes ? '\\"' : '"';
        if (!skipIsAuthenticated && (authRule.isAuthenticated === true || authRule.isAuthenticated === false)) {
            thisPredicates.push(
                `apoc.util.validatePredicate(NOT($auth.isAuthenticated = ${Boolean(
                    authRule.isAuthenticated
                )}), ${quotes}${AUTH_UNAUTHENTICATED_ERROR}${quotes}, [0])`
            );
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
            if (allowAndParams[0]) {
                thisPredicates.push(allowAndParams[0]);
                thisParams = { ...thisParams, ...allowAndParams[1] };
            }
        }

        PREDICATE_JOINS.forEach((key) => {
            const value = authRule[key] as AuthRule["AND"] | AuthRule["OR"];

            if (!value) {
                return;
            }

            const predicates: string[] = [];
            let predicateParams = {};

            value.forEach((v, i) => {
                const [str, par] = createSubPredicate({
                    authRule: v,
                    index: i,
                    chainStr: chainStr ? `${chainStr}${key}${i}` : `${key}${i}`,
                });

                if (!str) {
                    return;
                }

                predicates.push(str);
                predicateParams = { ...predicateParams, ...par };
            });

            thisPredicates.push(joinPredicates(predicates, key));
            thisParams = { ...thisParams, ...predicateParams };
        });

        if (bind && authRule.bind) {
            const allowAndParams = createAuthPredicate({
                context,
                node: bind.parentNode,
                varName: bind.varName,
                rule: authRule,
                chainStr: `${bind.chainStr || bind.varName}${chainStr || ""}_auth_bind${index}`,
                kind: "bind",
            });
            if (allowAndParams[0]) {
                thisPredicates.push(allowAndParams[0]);
                thisParams = { ...thisParams, ...allowAndParams[1] };
            }
        }

        return [joinPredicates(thisPredicates, "AND"), thisParams];
    }

    const subPredicates = authRules.reduce(
        (res: Res, authRule: AuthRule, index): Res => {
            const [str, par] = createSubPredicate({ authRule, index });

            return {
                strs: [...res.strs, str],
                params: { ...res.params, ...par },
            };
        },
        { strs: [], params: {} }
    );

    return [joinPredicates(subPredicates.strs, "OR"), subPredicates.params];
}

export default createAuthAndParams;
