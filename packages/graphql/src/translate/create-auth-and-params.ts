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
            param = `${chainStr}_${index}`;
        } else {
            param = `${varName}_auth${index}`;
        }

        if (rules.filter((x) => x.allow === "*").length) {
            return res;
        }

        Object.entries(ruleValue as { [k: string]: string }).forEach(([key, value]) => {
            const valueIsObject = Boolean(
                !Array.isArray(value) && Object.keys(value).length && typeof value !== "string"
            );
            if (valueIsObject) {
                const recurse = createAuthAndParams({ rules, jwt, varName, node, chainStr, neoSchema });
                res.authPredicates.push(`(${recurse[0]})`);
                res.params = { ...res.params, ...recurse[1] };

                return;
            }

            switch (key) {
                case "AND":
                case "OR":
                    {
                        // TODO better recurse REPLACE ME
                        const inner: string[] = [];

                        ((value as unknown) as any[]).forEach((v, i) => {
                            const reduced = reducer({ authPredicates: [], params: [] }, v, i);

                            inner.push(reduced.authPredicates.join(" "));
                            res.params = { ...res.params, ...reduced.params };
                        });

                        res.authPredicates.push(`(${inner.join(` ${key} `)})`);
                    }
                    break;

                default: {
                    const isPrimitiveField = node.primitiveFields.find((x) => x.fieldName === key);
                    if (isPrimitiveField) {
                        const _param = `${param}_${key}`;
                        res.authPredicates.push(`${varName}.${key} = $${_param}`);
                        res.params[_param] = jwt[value];
                    }

                    const relationField = node.relationFields.find((x) => key.startsWith(x.fieldName));
                    if (relationField) {
                        const inStr = relationField.direction === "IN" ? "<-" : "-";
                        const outStr = relationField.direction === "OUT" ? "->" : "-";
                        const relTypeStr = `[:${relationField.type}]`;
                        const relationVarName = relationField.fieldName;
                        const [, relationKey] = key.split(`${relationField.fieldName}_`);
                        const _param = `${param}_${key}`;

                        const existsStr = `EXISTS((${varName})${inStr}${relTypeStr}${outStr}(:${relationField.typeMeta.name}))`;
                        const allStr = `ALL(${relationVarName} IN [(${varName})${inStr}${relTypeStr}${outStr}(${relationVarName}:${relationField.typeMeta.name}) | ${relationVarName}] WHERE ${relationVarName}.${relationKey} = $${_param})`;

                        res.authPredicates.push(`${existsStr} AND\n${allStr}`);
                        res.params[_param] = jwt[value];
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
