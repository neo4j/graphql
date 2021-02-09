import { Node, Context } from "../classes";
import createWhereAndParams from "./create-where-and-params";
import createAllowAndParams from "./create-allow-and-params";
import { checkRoles } from "../auth";

interface Res {
    strs: string[];
    params: any;
}

function createDeleteAndParams({
    deleteInput,
    varName,
    node,
    parentVar,
    chainStr,
    withVars,
    context,
}: {
    parentVar: string;
    deleteInput: any;
    varName: string;
    chainStr?: string;
    node: Node;
    withVars: string[];
    context: Context;
}): [string, any] {
    function reducer(res: Res, [key, value]: [string, any]) {
        let param;

        if (chainStr) {
            param = `${chainStr}_${key}`;
        } else {
            param = `${parentVar}_delete_${key}`;
        }

        const relationField = node.relationFields.find((x) => key.startsWith(x.fieldName));
        let unionTypeName = "";

        if (relationField) {
            let refNode: Node;

            if (relationField.union) {
                [unionTypeName] = key.split(`${relationField.fieldName}_`).join("").split("_");
                refNode = context.neoSchema.nodes.find((x) => x.name === unionTypeName) as Node;
            } else {
                refNode = context.neoSchema.nodes.find((x) => x.name === relationField.typeMeta.name) as Node;
            }

            const inStr = relationField.direction === "IN" ? "<-" : "-";
            const outStr = relationField.direction === "OUT" ? "->" : "-";
            const relTypeStr = `[:${relationField.type}]`;

            const deletes = relationField.typeMeta.array ? value : [value];
            deletes.forEach((d, index) => {
                const _varName = `${varName}_${key}${index}`;

                if (withVars) {
                    res.strs.push(`WITH ${withVars.join(", ")}`);
                }

                res.strs.push(
                    `OPTIONAL MATCH (${parentVar})${inStr}${relTypeStr}${outStr}(${_varName}:${refNode.name})`
                );

                if (d.where) {
                    const whereAndParams = createWhereAndParams({
                        varName: _varName,
                        whereInput: d.where,
                        node: refNode,
                        context,
                    });
                    res.strs.push(whereAndParams[0]);
                    res.params = { ...res.params, ...whereAndParams[1] };
                }

                if (d.delete) {
                    const deleteAndParams = createDeleteAndParams({
                        context,
                        node: refNode,
                        deleteInput: d.delete,
                        varName: _varName,
                        withVars: [...withVars, _varName],
                        parentVar: _varName,
                        chainStr: `${param}${index}`,
                    });
                    res.strs.push(deleteAndParams[0]);
                    res.params = { ...res.params, ...deleteAndParams[1] };
                }

                res.strs.push(`
                      FOREACH(_ IN CASE ${_varName} WHEN NULL THEN [] ELSE [1] END |
                        DETACH DELETE ${_varName}
                      )`);

                if (refNode.auth) {
                    const allowAndParams = createAllowAndParams({
                        operation: "delete",
                        node: refNode,
                        context,
                        varName: _varName,
                    });
                    res.strs.push(allowAndParams[0].replace(/"/g, '\\"'));
                    res.params = { ...res.params, ...allowAndParams[1] };
                }
            });

            return res;
        }

        checkRoles({ node, context, operation: "delete" });

        res.params[param] = value;
        return res;
    }

    const { strs, params } = Object.entries(deleteInput).reduce(reducer, { strs: [], params: {} }) as Res;

    return [strs.join("\n"), params];
}

export default createDeleteAndParams;
