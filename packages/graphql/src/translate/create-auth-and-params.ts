import dotProp from "dot-prop";
import { Context, Node } from "../classes";
import { AuthOperations, BaseField, AuthRule, AuthOrders } from "../types";

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
    if (allow === "*") {
        return [`true`, {}];
    }

    let param = "";
    if (chainStr) {
        param = chainStr;
    } else {
        param = `${varName}_auth_allow`;
    }

    const result = Object.entries(allow as Record<string, any>).reduce(
        (res: Res, [key, value]) => {
            switch (key) {
                case "AND":
                case "OR":
                    {
                        const inner: string[] = [];

                        ((value as unknown) as any[]).forEach((v, i) => {
                            const recurse = createAllowAndParams({
                                rule: v as AuthRule,
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
                    break;

                default: {
                    if (typeof value === "string") {
                        const _param = `${param}_${key}`;
                        res.strs.push(`${varName}.${key} = $${_param}`);

                        const jwt = context.getJWTSafe();

                        res.params[_param] = dotProp.get({ value: jwt }, `value.${value}`);
                    }

                    const relationField = node.relationFields.find((x) => key === x.fieldName);
                    if (relationField) {
                        const refNode = context.neoSchema.nodes.find(
                            (x) => x.name === relationField.typeMeta.name
                        ) as Node;

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
                }
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
    const subPredicates: string[] = [];
    let params: Record<string, unknown> = {};

    if (!entity.auth) {
        return ["", params];
    }

    let authRules: AuthRule[] = [];
    if (operation) {
        authRules = entity?.auth.rules.filter((r) => r.operations?.includes(operation));
    } else {
        authRules = entity?.auth.rules;
    }

    if (!skipRoles) {
        const rules = authRules
            .filter((o) => Boolean(o.roles))
            .map((r) => createRolesStr({ roles: r.roles as string[], escapeQuotes }));

        subPredicates.push(rules.join(" OR "));
    }

    if (!skipIsAuthenticated) {
        const rules = authRules
            .filter((o) => o.isAuthenticated === true || o.isAuthenticated === false)
            .map((o) => `$auth.isAuthenticated = ${Boolean(o?.isAuthenticated)}`);

        subPredicates.push(rules.join(" OR "));
    }

    if (allow) {
        const rules: string[] = [];

        authRules
            .filter((rule) => rule.allow)
            .forEach((rule, index) => {
                const allowAndParams = createAllowAndParams({
                    context,
                    node: allow.parentNode,
                    varName: allow.varName,
                    rule,
                    chainStr: `${allow.chainStr || allow.varName}_auth_allow${index}`,
                });
                if (allowAndParams[0]) {
                    rules.push(allowAndParams[0]);
                    params = { ...params, ...allowAndParams[1] };
                }
            });

        subPredicates.push(rules.join(" OR "));
    }

    return [subPredicates.filter(Boolean).join(" AND "), params];
}

export default createAuthAndParams;
