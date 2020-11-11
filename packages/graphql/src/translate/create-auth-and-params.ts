import { AuthRule, NeoSchema, Node } from "../classes";

interface Res {
    authPredicates: string[];
    params: any;
}

function createAuthAndParams({
    rules,
    jwt,
    varName,
    node,
    chainStr,
    neoSchema,
}: {
    rules: AuthRule[];
    jwt: any;
    node: Node;
    neoSchema: NeoSchema;
    varName: string;
    chainStr?: string;
}): [string, any] {
    function reducer(res: Res, ruleValue: any, index: number): Res {
        let param = "";
        if (chainStr) {
            param = chainStr;
        } else {
            param = `${varName}_auth${index}`;
        }

        if (rules.filter((x) => x.allow === "*").length) {
            return res;
        }

        Object.entries(ruleValue).forEach(([key, value]) => {
            switch (key) {
                case "AND":
                case "OR":
                    {
                        const inner: string[] = [];

                        ((value as unknown) as any[]).forEach((v, i) => {
                            const recurse = createAuthAndParams({
                                rules: [{ allow: v }],
                                jwt,
                                varName,
                                node,
                                chainStr: `${param}_${key}${i}`,
                                neoSchema,
                            });

                            inner.push(
                                recurse[0]
                                    .replace("CALL apoc.util.validate(NOT(", "")
                                    .replace(`), "Forbidden", [0])`, "")
                            );
                            res.params = { ...res.params, ...recurse[1] };
                        });

                        res.authPredicates.push(`(${inner.join(` ${key} `)})`);
                    }
                    break;

                default: {
                    if (typeof value === "string") {
                        const _param = `${param}_${key}`;
                        res.authPredicates.push(`${varName}.${key} = $${_param}`);
                        res.params[_param] = jwt[value];
                    }

                    const relationField = node.relationFields.find((x) => key === x.fieldName);
                    if (relationField) {
                        const refNode = neoSchema.nodes.find((x) => x.name === relationField.typeMeta.name) as Node;

                        const inStr = relationField.direction === "IN" ? "<-" : "-";
                        const outStr = relationField.direction === "OUT" ? "->" : "-";
                        const relTypeStr = `[:${relationField.type}]`;
                        const relationVarName = relationField.fieldName;

                        let resultStr = [
                            `EXISTS((${varName})${inStr}${relTypeStr}${outStr}(:${relationField.typeMeta.name}))`,
                            `AND ALL(${relationVarName} IN [(${varName})${inStr}${relTypeStr}${outStr}(${relationVarName}:${relationField.typeMeta.name}) | ${relationVarName}] WHERE `,
                        ].join(" ");

                        Object.entries(value as any).forEach(([k, v]: [string, any]) => {
                            const recurse = createAuthAndParams({
                                node: refNode,
                                neoSchema,
                                chainStr: `${param}_${key}`,
                                varName: relationVarName,
                                jwt,
                                rules: [{ allow: { [k]: v } }],
                            });

                            resultStr += recurse[0]
                                .replace("CALL apoc.util.validate(NOT(", "")
                                .replace(`), "Forbidden", [0])`, "");

                            resultStr += ")"; // close ALL
                            res.params = { ...res.params, ...recurse[1] };
                            res.authPredicates.push(resultStr);
                        });
                    }
                }
            }
        });

        return res;
    }

    const { authPredicates, params } = rules.reduce((res: Res, value, i) => reducer(res, value.allow as any, i), {
        authPredicates: [],
        params: {},
    }) as Res;

    const authStr = authPredicates.length
        ? `CALL apoc.util.validate(NOT(${authPredicates.join(" AND ")}), "Forbidden", [0])`
        : "";

    return [authStr, params];
}

export default createAuthAndParams;
