import { NeoSchema, Node } from "../classes";
import createConnectAndParams from "./create-connect-and-params";

interface Res {
    create: string;
    params: any;
}

function createCreateAndParams({
    input,
    varName,
    node,
    neoSchema,
    withVars,
}: {
    input: any;
    varName: string;
    node: Node;
    neoSchema: NeoSchema;
    withVars: string[];
}): [string, any] {
    function reducer(res: Res, [key, value]: [string, any]): Res {
        const _varName = `${varName}_${key}`;
        const relationField = node.relationFields.find((x) => x.fieldName === key);

        if (relationField) {
            const refNode = neoSchema.nodes.find((x) => x.name === relationField.typeMeta.name) as Node;

            if (value.create) {
                const creates = relationField.typeMeta.array ? value.create : [value.create];
                creates.forEach((create, index) => {
                    const innerVarName = `${_varName}${index}`;
                    const withStr = `\nWITH ${[...withVars].join(", ")}`;
                    res.create += `\n${withStr}`;

                    const innerCreate = createCreateAndParams({
                        input: create,
                        neoSchema,
                        node: refNode,
                        varName: innerVarName,
                        withVars: [...withVars, innerVarName],
                    });
                    res.create += `\n${innerCreate[0]}`;
                    res.params = { ...res.params, ...innerCreate[1] };

                    const inStr = relationField.direction === "IN" ? "<-" : "-";
                    const outStr = relationField.direction === "OUT" ? "->" : "-";
                    const relTypeStr = `[:${relationField.type}]`;
                    res.create += `\nMERGE (${varName})${inStr}${relTypeStr}${outStr}(${innerVarName})`;
                });
            }

            if (value.connect) {
                const connectAndParams = createConnectAndParams({
                    withVars,
                    value: value.connect,
                    varName: `${_varName}_connect`,
                    parentVar: varName,
                    relationField,
                    neoSchema,
                    parentNode: node,
                    refNode,
                });
                res.create += `\n${connectAndParams[0]}`;
                res.params = { ...res.params, ...connectAndParams[1] };
            }

            return res;
        }

        res.create += `\nSET ${varName}.${key} = $${_varName}`;
        res.params[_varName] = value;

        return res;
    }

    const { create, params } = Object.entries(input).reduce(reducer, {
        create: `CREATE (${varName}:${node.name})`,
        params: {},
    }) as Res;

    return [create, params];
}

export default createCreateAndParams;
