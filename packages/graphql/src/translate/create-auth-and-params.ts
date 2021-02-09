import dotProp from "dot-prop";
import { Context, Node } from "../classes";
import { AuthOperations, BaseField, AuthRule, BaseAuthRule } from "../types";

interface Res {
    strs: string[];
    params: any;
}

interface Allow {
    varName: string;
    parentNode: Node;
    chainStr?: string;
}

function createRolesStr({ roles, escapeQuotes }: { roles: string[]; escapeQuotes?: boolean }) {
    const quote = escapeQuotes ? `\\"` : `"`;

    const joined = roles.map((r) => `${quote}${r}${quote}`).join(", ");

    return `ANY(r IN [${joined}] WHERE ANY(rr IN $auth.roles WHERE r = rr))`;
}

function createAllowAndParams({
    rule,
    node,
    varName,
    context,
    chainStr,
}: {
    context: Context;
    varName: string;
    node: Node;
    rule: AuthRule;
    chainStr?: string;
}): [string, any] {
    const allow = rule.allow;

    let param = "";
    if (chainStr) {
        param = chainStr;
    } else {
        param = `${varName}_auth_allow`;
    }

    const result = Object.entries(allow as Record<string, any>).reduce(
        (res: Res, [key, value]) => {
            if (key === "AND" || key === "OR") {
                const inner: string[] = [];

                ((value as unknown) as any[]).forEach((v, i) => {
                    const recurse = createAllowAndParams({
                        rule: { allow: v } as AuthRule,
                        varName,
                        node,
                        chainStr: `${param}_${key}${i}`,
                        context,
                    });

                    inner.push(recurse[0]);
                    res.params = { ...res.params, ...recurse[1] };
                });

                res.strs.push(`(${inner.join(` ${key} `)})`);
            }

            const authableField = node.authableFields.find((field) => field.fieldName === key);
            if (authableField) {
                const jwt = context.getJWTSafe();
                const _param = `${param}_${key}`;
                res.params[_param] = dotProp.get({ value: jwt }, `value.${value}`);
                res.strs.push(`${varName}.${key} = $${_param}`);
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
                    `AND ANY(${relationVarName} IN [(${varName})${inStr}${relTypeStr}${outStr}(${relationVarName}:${relationField.typeMeta.name}) | ${relationVarName}] WHERE `,
                ].join(" ");

                Object.entries(value as any).forEach(([k, v]: [string, any]) => {
                    const recurse = createAllowAndParams({
                        node: refNode,
                        context,
                        chainStr: `${param}_${key}`,
                        varName: relationVarName,
                        rule: { allow: { [k]: v } } as AuthRule,
                    });
                    resultStr += recurse[0];
                    resultStr += ")"; // close ALL
                    res.params = { ...res.params, ...recurse[1] };
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
}: {
    entity: Node | BaseField;
    operation?: AuthOperations;
    skipRoles?: boolean;
    skipIsAuthenticated?: boolean;
    allow?: Allow;
    context: Context;
    escapeQuotes?: boolean;
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
            thisPredicates.push(`$auth.isAuthenticated = ${Boolean(authRule.isAuthenticated)}`);
        }

        if (allow && authRule.allow) {
            const allowAndParams = createAllowAndParams({
                context,
                node: allow.parentNode,
                varName: allow.varName,
                rule: authRule,
                chainStr: `${allow.chainStr || allow.varName}${chainStr || ""}_auth_allow${index}`,
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

            const strs: string[] = [];
            let _params = {};

            value.forEach((v, i) => {
                const [str, par] = createSubPredicate({
                    authRule: v,
                    index: i,
                    chainStr: chainStr ? `${chainStr}${key}${i}` : `${key}${i}`,
                });

                if (!str) {
                    return;
                }

                strs.push(str);
                _params = { ..._params, ...par };
            });

            thisPredicates.push(strs.join(` ${key} `));
            thisParams = { ...thisParams, ..._params };
        });

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
