import dotProp from "dot-prop";
import { Context, Node } from "../classes";
import { AuthOperations, BaseField, AuthRule, BaseAuthRule } from "../types";
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
}: {
    context: Context;
    varName: string;
    node: Node;
    rule: AuthRule;
    chainStr: string;
    kind: "allow" | "bind";
}): [string, any] {
    const allowOrBind = rule[kind];

    if (!allowOrBind) {
        return ["", {}];
    }

    const result = Object.entries(allowOrBind as Record<string, any>).reduce(
        (res: Res, [key, value]) => {
            if (key === "AND" || key === "OR") {
                const inner: string[] = [];

                ((value as unknown) as any[]).forEach((v, i) => {
                    const authPredicate = createAuthPredicate({
                        rule: { [kind]: v } as AuthRule,
                        varName,
                        node,
                        chainStr: `${chainStr}_${key}${i}`,
                        context,
                        kind,
                    });

                    inner.push(authPredicate[0]);
                    res.params = { ...res.params, ...authPredicate[1] };
                });

                res.strs.push(`(${inner.join(` ${key} `)})`);
            }

            const authableField = node.authableFields.find((field) => field.fieldName === key);
            if (authableField) {
                const jwt = context.getJWTSafe();
                const _param = `${chainStr}_${key}`;
                const [, jwtPath] = (value as string).split("$jwt.");
                const [, ctxPath] = (value as string).split("$context.");

                if (jwtPath) {
                    res.params[_param] = dotProp.get({ value: jwt }, `value.${jwtPath}`);
                    res.strs.push(`${varName}.${key} = $${_param}`);
                }

                if (ctxPath) {
                    res.params[_param] = dotProp.get({ value: context.graphQLContext }, `value.${ctxPath}`);
                    res.strs.push(`${varName}.${key} = $${_param}`);
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
                        kind === "allow" ? "ANY" : "ALL"
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
                        rule: { [kind]: { [k]: v } } as AuthRule,
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
    ) as Res;

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
}: {
    entity: Node | BaseField;
    operation?: AuthOperations;
    skipRoles?: boolean;
    skipIsAuthenticated?: boolean;
    allow?: Allow;
    context: Context;
    escapeQuotes?: boolean;
    bind?: Bind;
}): [string, any] {
    if (!entity.auth) {
        return ["", {}];
    }

    let authRules: AuthRule[] = [];
    if (operation) {
        authRules = entity?.auth.rules.filter((r) => r.operations === "*" || r.operations?.includes(operation));
    } else {
        authRules = entity?.auth.rules;
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
    ) as Res;

    return [subPredicates.strs.filter(Boolean).join(" OR "), subPredicates.params];
}

export default createAuthAndParams;
