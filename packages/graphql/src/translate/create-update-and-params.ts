import { Node, NeoSchema } from "../classes";
import createConnectAndParams from "./create-connect-and-params";
import createDisconnectAndParams from "./create-disconnect-and-params";
import createWhereAndParams from "./create-where-and-params";

interface Res {
    strs: string[];
    params: any;
}

function createUpdateAndParams({
    updateInput,
    varName,
    node,
    neoSchema,
    parentVar,
    chainStr,
    insideDoWhen,
    withVars,
}: {
    parentVar: string;
    updateInput: any;
    varName: string;
    chainStr?: string;
    node: Node;
    neoSchema: NeoSchema;
    withVars: string[];
    insideDoWhen?: boolean;
}): [string, any] {
    function reducer(res: Res, [key, value]: [string, any]) {
        let param;

        if (chainStr) {
            param = `${chainStr}_${key}`;
        } else {
            param = `${parentVar}_update_${key}`;
        }

        const relationField = node.relationFields.find((x) => x.fieldName === key);
        if (relationField) {
            const updates = relationField.typeMeta.array ? value : [value];
            const refNode = neoSchema.nodes.find((x) => x.name === relationField.typeMeta.name) as Node;
            const inStr = relationField.direction === "IN" ? "<-" : "-";
            const outStr = relationField.direction === "OUT" ? "->" : "-";
            const relTypeStr = `[:${relationField.type}]`;

            updates.forEach((update, index) => {
                const _varName = `${varName}_${key}${index}`;

                if (update.update) {
                    if (withVars) {
                        res.strs.push(`WITH ${withVars.join(", ")}`);
                    }

                    res.strs.push(
                        `OPTIONAL MATCH (${parentVar})${inStr}${relTypeStr}${outStr}(${_varName}:${refNode.name})`
                    );

                    if (update.where) {
                        const whereAndParams = createWhereAndParams({
                            varName: _varName,
                            whereInput: update.where,
                        });
                        res.strs.push(whereAndParams[0]);
                        res.params = { ...res.params, ...whereAndParams[1] };
                    }

                    res.strs.push(`CALL apoc.do.when(${_varName} IS NOT NULL, ${insideDoWhen ? '\\"' : '"'}`);

                    const updateAndParams = createUpdateAndParams({
                        neoSchema,
                        node: refNode,
                        updateInput: update.update,
                        varName: _varName,
                        withVars: [...withVars, _varName],
                        parentVar: _varName,
                        chainStr: `${param}${index}`,
                        insideDoWhen: true,
                    });
                    res.params = { ...res.params, ...updateAndParams[1] };

                    const updateStrs = [updateAndParams[0], "RETURN count(*)"];
                    const apocArgs = `{${parentVar}:${parentVar}, ${_varName}:${_varName}REPLACE_ME}`;

                    if (insideDoWhen) {
                        updateStrs.push(`\\", \\"\\", ${apocArgs})`);
                    } else {
                        updateStrs.push(`", "", ${apocArgs})`);
                    }
                    updateStrs.push("YIELD value as _");

                    const paramsString = (Object.keys(updateAndParams[1]).reduce(
                        (r: string[], k) => [...r, `${k}:$${k}`],
                        []
                    ) as string[]).join(",");
                    const updateStr = updateStrs.join("\n").replace(/REPLACE_ME/g, `, ${paramsString}`);
                    res.strs.push(updateStr);
                }

                if (update.connect) {
                    const connectAndParams = createConnectAndParams({
                        neoSchema,
                        refNode,
                        value: update.connect,
                        varName: `${_varName}_connect`,
                        withVars,
                        parentVar,
                        relationField,
                    });
                    res.strs.push(connectAndParams[0]);
                    res.params = { ...res.params, ...connectAndParams[1] };
                }

                if (update.disconnect) {
                    const disconnectAndParams = createDisconnectAndParams({
                        neoSchema,
                        refNode,
                        value: update.disconnect,
                        varName: `${_varName}_disconnect`,
                        withVars,
                        parentVar,
                        relationField,
                    });
                    res.strs.push(disconnectAndParams[0]);
                    res.params = { ...res.params, ...disconnectAndParams[1] };
                }
            });

            return res;
        }

        res.strs.push(`SET ${varName}.${key} = $${param}`);
        res.params[param] = value;

        return res;
    }

    const { strs, params } = Object.entries(updateInput).reduce(reducer, { strs: [], params: {} }) as Res;

    return [strs.join("\n"), params];
}

export default createUpdateAndParams;
