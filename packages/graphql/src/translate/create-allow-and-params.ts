import { AuthRule, Context, Node } from "../classes";
import { AuthOperations } from "../types";

interface Res {
    allows: string[];
    params: any;
}

function createAllowAndParams({
    varName,
    node,
    chainStr,
    context,
    functionType,
    recurseArray,
    operation,
}: {
    node: Node;
    context: Context;
    varName: string;
    chainStr?: string;
    functionType?: boolean;
    recurseArray?: AuthRule[];
    operation: AuthOperations;
}): [string, any] {
    const rules = (node?.auth?.rules || []).filter(
        (r) => r.operations?.includes(operation) && r.allow && r.isAuthenticated !== false
    );

    if (rules.filter((x) => x.allow === "*").length) {
        return ["", {}];
    }

    function reducer(res: Res, ruleValue: any, index: number): Res {
        let param = "";
        if (chainStr) {
            param = chainStr;
        } else {
            param = `${varName}_auth${index}`;
        }

        Object.entries(ruleValue).forEach(([key, value]) => {
            switch (key) {
                case "AND":
                case "OR":
                    {
                        const inner: string[] = [];

                        ((value as unknown) as any[]).forEach((v, i) => {
                            const recurse = createAllowAndParams({
                                recurseArray: [{ allow: v }],
                                varName,
                                node,
                                chainStr: `${param}_${key}${i}`,
                                context,
                                operation,
                            });

                            inner.push(
                                recurse[0]
                                    .replace("CALL apoc.util.validate(NOT(", "")
                                    .replace(`), "Forbidden", [0])`, "")
                            );
                            res.params = { ...res.params, ...recurse[1] };
                        });

                        res.allows.push(`(${inner.join(` ${key} `)})`);
                    }
                    break;

                default: {
                    if (typeof value === "string") {
                        const _param = `${param}_${key}`;
                        res.allows.push(`${varName}.${key} = $${_param}`);

                        const jwt = context.getJWT();

                        if (!jwt) {
                            throw new Error("Unauthorized");
                        }

                        res.params[_param] = jwt[value];
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
                                recurseArray: [{ allow: { [k]: v } }],
                                operation,
                            });

                            resultStr += recurse[0]
                                .replace("CALL apoc.util.validate(NOT(", "")
                                .replace(`), "Forbidden", [0])`, "");

                            resultStr += ")"; // close ALL
                            res.params = { ...res.params, ...recurse[1] };
                            res.allows.push(resultStr);
                        });
                    }
                }
            }
        });

        return res;
    }

    const { allows, params } = (recurseArray || rules).reduce(
        (res: Res, value, i) => reducer(res, value.allow as any, i),
        {
            allows: [],
            params: {},
        }
    ) as Res;

    const allow = allows.length ? `CALL apoc.util.validate(NOT(${allows.join(" AND ")}), "Forbidden", [0])` : "";

    if (functionType) {
        return [allow.replace(/CALL/g, "").replace(/apoc.util.validate/g, "apoc.util.validatePredicate"), params];
    }

    return [allow, params];
}

export default createAllowAndParams;
