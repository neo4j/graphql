import { AuthRule, Context, Node } from "../classes";
import { AuthOperations } from "../types";

interface Res {
    strs: string[];
    params: any;
}

function createAuthAndParams({
    varName,
    node,
    chainStr,
    context,
    functionType,
    recurseArray,
    operation,
    chainStrOverRide,
    type,
}: {
    node: Node;
    context: Context;
    varName: string;
    chainStr?: string;
    functionType?: boolean;
    recurseArray?: AuthRule[];
    operation: AuthOperations;
    chainStrOverRide?: string;
    type: "bind" | "allow";
}): [string, any] {
    const rules = (node?.auth?.rules || []).filter(
        (r) => r.operations?.includes(operation) && r[type] && r.isAuthenticated !== false
    );

    if (rules.filter((x) => x[type] === "*").length && !recurseArray) {
        return ["", {}];
    }

    function reducer(res: Res, ruleValue: any, index: number): Res {
        let param = "";
        if (chainStr && !chainStrOverRide) {
            param = chainStr;
        } else if (chainStrOverRide) {
            param = `${chainStrOverRide}${index}`;
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
                            const recurse = createAuthAndParams({
                                recurseArray: [{ [type]: v }],
                                varName,
                                node,
                                chainStr: `${param}_${key}${i}`,
                                context,
                                operation,
                                type,
                            });

                            inner.push(
                                recurse[0]
                                    .replace("CALL apoc.util.validate(NOT(", "")
                                    .replace(`), "Forbidden", [0])`, "")
                            );
                            res.params = { ...res.params, ...recurse[1] };
                        });

                        res.strs.push(`(${inner.join(` ${key} `)})`);
                    }
                    break;

                default: {
                    if (typeof value === "string") {
                        const _param = `${param}_${key}`;
                        res.strs.push(`${varName}.${key} = $${_param}`);

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
                            `AND ${
                                type === "bind" ? "ALL" : "ANY"
                            }(${relationVarName} IN [(${varName})${inStr}${relTypeStr}${outStr}(${relationVarName}:${
                                relationField.typeMeta.name
                            }) | ${relationVarName}] WHERE `,
                        ].join(" ");

                        Object.entries(value as any).forEach(([k, v]: [string, any]) => {
                            const recurse = createAuthAndParams({
                                node: refNode,
                                context,
                                chainStr: `${param}_${key}`,
                                varName: relationVarName,
                                recurseArray: [{ [type]: { [k]: v } }],
                                operation,
                                type,
                            });

                            resultStr += recurse[0]
                                .replace("CALL apoc.util.validate(NOT(", "")
                                .replace(`), "Forbidden", [0])`, "");

                            resultStr += ")"; // close ALL
                            res.params = { ...res.params, ...recurse[1] };
                            res.strs.push(resultStr);
                        });
                    }
                }
            }
        });

        return res;
    }

    const { strs, params } = (recurseArray || rules).reduce(
        (res: Res, value, i) => reducer(res, value[type] as any, i),
        {
            strs: [],
            params: {},
        }
    ) as Res;

    const auth = strs.length ? `CALL apoc.util.validate(NOT(${strs.join(" AND ")}), "Forbidden", [0])` : "";

    if (functionType) {
        return [auth.replace(/CALL/g, "").replace(/apoc.util.validate/g, "apoc.util.validatePredicate"), params];
    }

    return [auth, params];
}

export default createAuthAndParams;
