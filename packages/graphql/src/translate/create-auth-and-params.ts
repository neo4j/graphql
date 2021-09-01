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

import dotProp from "dot-prop";
import { Neo4jGraphQLAuthenticationError, Node } from "../classes";
import { AuthOperations, BaseField, AuthRule, BaseAuthRule, Context } from "../types";
import { AUTH_UNAUTHENTICATED_ERROR } from "../constants";

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
    predicate,
}: {
    context: Context;
    varName: string;
    node: Node;
    rule: AuthRule;
    chainStr: string;
    kind: "allow" | "bind" | "where";
    predicate?: "ANY" | "ALL";
}): [string, any] {
    if (!rule[kind]) {
        return ["", {}];
    }

    const { jwt } = context;
    const { allowUnauthenticated } = rule;

    const result = Object.entries(rule[kind] as any).reduce(
        (res: Res, [key, value]) => {
            if (key === "AND" || key === "OR") {
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
                        predicate,
                    });

                    inner.push(authPredicate[0]);
                    res.params = { ...res.params, ...authPredicate[1] };
                });

                res.strs.push(`(${inner.join(` ${key} `)})`);
            }

            if (key === "ANY" || key === "ALL") {
                const authPredicate = createAuthPredicate({
                    rule: {
                        [kind]: value,
                        allowUnauthenticated,
                    } as AuthRule,
                    varName,
                    node,
                    chainStr: `${chainStr}_${key}`,
                    context,
                    kind,
                    predicate: key,
                });

                res.strs.push(authPredicate[0]);
                res.params = { ...res.params, ...authPredicate[1] };
            }

            const authableField = node.authableFields.find((field) => field.fieldName === key);
            if (authableField) {
                const [, jwtPath] = (value as string)?.split?.("$jwt.") || [];
                const [, ctxPath] = (value as string)?.split?.("$context.") || [];
                let paramValue: string | null = value as string;

                if (jwtPath) {
                    paramValue = dotProp.get({ value: jwt }, `value.${jwtPath}`) as string;
                } else if (ctxPath) {
                    paramValue = dotProp.get({ value: context }, `value.${ctxPath}`) as string;
                }

                if (paramValue === undefined && allowUnauthenticated !== true) {
                    throw new Neo4jGraphQLAuthenticationError("Unauthenticated");
                }

                if (paramValue === undefined) {
                    res.strs.push("false");
                } else if (paramValue === null) {
                    res.strs.push(`${varName}.${key} IS NULL`);
                } else {
                    const param = `${chainStr}_${key}`;
                    res.params[param] = paramValue;
                    res.strs.push(`${varName}.${key} IS NOT NULL AND ${varName}.${key} = $${param}`);
                }
            }

            const relationField = node.relationFields.find((x) => key === x.fieldName);
            if (relationField) {
                const refNode = context.neoSchema.nodes.find((x) => x.name === relationField.typeMeta.name) as Node;
                const inStr = relationField.direction === "IN" ? "<-" : "-";
                const outStr = relationField.direction === "OUT" ? "->" : "-";
                const relTypeStr = `[:${relationField.type}]`;
                const relationVarName = relationField.fieldName;

                let resultStr = [
                    `EXISTS((${varName})${inStr}${relTypeStr}${outStr}(:${relationField.typeMeta.name}))`,
                    `AND ${
                        predicate ?? kind === "allow" ? "ANY" : "ALL"
                    }(${relationVarName} IN [(${varName})${inStr}${relTypeStr}${outStr}(${relationVarName}:${
                        relationField.typeMeta.name
                    }) | ${relationVarName}] WHERE `,
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

    return [result.strs.join(" AND "), result.params];
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
    operation?: AuthOperations;
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
        authRules = entity?.auth.rules.filter((r) => !r.operations || r.operations?.includes(operation));
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

        const joined = subPredicates.strs.filter(Boolean).join(" OR ");

        return [joined, subPredicates.params];
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

        if (!skipIsAuthenticated && (authRule.isAuthenticated === true || authRule.isAuthenticated === false)) {
            thisPredicates.push(
                `apoc.util.validatePredicate(NOT($auth.isAuthenticated = ${Boolean(
                    authRule.isAuthenticated
                )}), "${AUTH_UNAUTHENTICATED_ERROR}", [0])`
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

        ["AND", "OR"].forEach((key) => {
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

            thisPredicates.push(predicates.join(` ${key} `));
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

        return [thisPredicates.join(" AND "), thisParams];
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

    return [subPredicates.strs.filter(Boolean).join(" OR "), subPredicates.params];
}

export default createAuthAndParams;
