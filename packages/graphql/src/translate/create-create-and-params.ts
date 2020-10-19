/* eslint-disable @typescript-eslint/naming-convention */
/* eslint-disable no-underscore-dangle */
import { NeoSchema, Node } from "../classes";
import createWhereAndParams from "./create-where-and-params";

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
        const relationField = node.relationFields.find((x) => x.fieldName === key);
        if (relationField) {
            const refNode = neoSchema.nodes.find((x) => x.name === relationField.typeMeta.name) as Node;

            if (value.create) {
                const creates = relationField.typeMeta.array ? value.create : [value.create];
                creates.forEach((create, index) => {
                    const _varName = `${varName}_${key}${index}`;
                    res.create += `\nWITH ${withVars.join(", ")}`;

                    const innerCreate = createCreateAndParams({
                        input: create,
                        neoSchema,
                        node: refNode,
                        varName: _varName,
                        withVars: [...withVars, _varName],
                    });
                    res.create += `\n${innerCreate[0]}`;
                    res.params = { ...res.params, ...innerCreate[1] };

                    const inStr = relationField.direction === "IN" ? "<-" : "-";
                    const outStr = relationField.direction === "OUT" ? "->" : "-";
                    const relTypeStr = `[:${relationField.type}]`;
                    res.create += `\nMERGE (${varName})${inStr}${relTypeStr}${outStr}(${_varName})`;
                });
            }

            if (value.connect) {
                const connects = relationField.typeMeta.array ? value.connect : [value.connect];
                connects.forEach((connect, index) => {
                    const _varName = `${varName}_${key}${index}`;
                    res.create += `\nWITH ${withVars.join(", ")}`;
                    res.create += `\nMATCH (${_varName}:${relationField.typeMeta.name})`;

                    if (connect.where) {
                        const where = createWhereAndParams({ varName: _varName, whereInput: connect.where });
                        res.create += `\n${where[0]}`;
                        res.params = { ...res.params, ...where[1] };
                    }

                    /*  if (connect.connect) {
                         todo recurse? make new func called createConnectAndParams?
                    } */

                    const inStr = relationField.direction === "IN" ? "<-" : "-";
                    const outStr = relationField.direction === "OUT" ? "->" : "-";
                    const relTypeStr = `[:${relationField.type}]`;
                    res.create += `\nMERGE (${varName})${inStr}${relTypeStr}${outStr}(${_varName})`;
                });
            }

            return res;
        }

        const param = `${varName}_${key}`;
        res.create += `\nSET ${varName}.${key} = $${param}`;
        res.params[param] = value;

        return res;
    }

    const { create, params } = Object.entries(input).reduce(reducer, {
        create: `CREATE (${varName}:${node.name})`,
        params: {},
    }) as Res;

    return [create, params];
}

export default createCreateAndParams;
