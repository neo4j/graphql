import { Node, Context } from "../classes";
import createWhereAndParams from "./create-where-and-params";
import createAuthAndParams from "./create-auth-and-params";
import { AUTH_FORBIDDEN_ERROR } from "../constants";

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
    insideDoWhen,
}: {
    parentVar: string;
    deleteInput: any;
    varName: string;
    chainStr?: string;
    node: Node;
    withVars: string[];
    context: Context;
    insideDoWhen?: boolean;
}): [string, any] {
    function reducer(res: Res, [key, value]: [string, any]) {
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
                const _varName = chainStr ? `${varName}${index}` : `${varName}_${key}${index}`;

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

                if (refNode.auth) {
                    const authAndParams = createAuthAndParams({
                        entity: refNode,
                        operation: "delete",
                        context,
                        escapeQuotes: Boolean(insideDoWhen),
                        allow: { parentNode: refNode, varName: _varName },
                    });
                    if (authAndParams[0]) {
                        const quote = insideDoWhen ? `\\"` : `"`;
                        res.strs.push(`WITH ${[...withVars, _varName].join(", ")}`);
                        res.strs.push(
                            `CALL apoc.util.validate(NOT(${authAndParams[0]}), ${quote}${AUTH_FORBIDDEN_ERROR}${quote}, [0])`
                        );
                        res.params = { ...res.params, ...authAndParams[1] };
                    }
                }

                if (d.delete) {
                    const deleteAndParams = createDeleteAndParams({
                        context,
                        node: refNode,
                        deleteInput: d.delete,
                        varName: _varName,
                        withVars: [...withVars, _varName],
                        parentVar: _varName,
                    });
                    res.strs.push(deleteAndParams[0]);
                    res.params = { ...res.params, ...deleteAndParams[1] };
                }

                res.strs.push(`
                    FOREACH(_ IN CASE ${_varName} WHEN NULL THEN [] ELSE [1] END |
                        DETACH DELETE ${_varName}
                    )`);
            });

            return res;
        }

        return res;
    }

    const { strs, params } = Object.entries(deleteInput).reduce(reducer, { strs: [], params: {} });

    return [strs.join("\n"), params];
}

export default createDeleteAndParams;
