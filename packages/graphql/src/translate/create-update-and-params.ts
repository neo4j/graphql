import { Node, Context } from "../classes";
import createConnectAndParams from "./create-connect-and-params";
import createDisconnectAndParams from "./create-disconnect-and-params";
import createWhereAndParams from "./create-where-and-params";
import createCreateAndParams from "./create-create-and-params";
import createAuthAndParams from "./create-auth-and-params";
import { checkRoles } from "../auth";

interface Res {
    strs: string[];
    params: any;
}

function createUpdateAndParams({
    updateInput,
    varName,
    node,
    parentVar,
    chainStr,
    insideDoWhen,
    withVars,
    context,
}: {
    parentVar: string;
    updateInput: any;
    varName: string;
    chainStr?: string;
    node: Node;
    withVars: string[];
    insideDoWhen?: boolean;
    context: Context;
}): [string, any] {
    function reducer(res: Res, [key, value]: [string, any]) {
        let param;

        if (chainStr) {
            param = `${chainStr}_${key}`;
        } else {
            param = `${parentVar}_update_${key}`;
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

            const updates = relationField.typeMeta.array ? value : [value];
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
                            node: refNode,
                            context,
                        });
                        res.strs.push(whereAndParams[0]);
                        res.params = { ...res.params, ...whereAndParams[1] };
                    }

                    res.strs.push(`CALL apoc.do.when(${_varName} IS NOT NULL, ${insideDoWhen ? '\\"' : '"'}`);

                    let innerApocParams = {};

                    if (refNode.auth) {
                        const allowAndParams = createAuthAndParams({
                            operation: "update",
                            node: refNode,
                            context,
                            varName: _varName,
                            type: "allow",
                        });
                        res.strs.push(allowAndParams[0].replace(/"/g, '\\"'));
                        res.params = { ...res.params, ...allowAndParams[1] };
                        innerApocParams = { ...innerApocParams, ...allowAndParams[1] };
                    }

                    const updateAndParams = createUpdateAndParams({
                        context,
                        node: refNode,
                        updateInput: update.update,
                        varName: _varName,
                        withVars: [...withVars, _varName],
                        parentVar: _varName,
                        chainStr: `${param}${index}`,
                        insideDoWhen: true,
                    });
                    res.params = { ...res.params, ...updateAndParams[1] };
                    innerApocParams = { ...innerApocParams, ...updateAndParams[1] };

                    if (refNode.auth) {
                        const bindAndParams = createAuthAndParams({
                            operation: "update",
                            node: refNode,
                            context,
                            varName: _varName,
                            chainStrOverRide: `${_varName}_bind`,
                            type: "bind",
                        });
                        res.strs.push(bindAndParams[0].replace(/"/g, '\\"'));
                        res.params = { ...res.params, ...bindAndParams[1] };
                        innerApocParams = { ...innerApocParams, ...bindAndParams[1] };
                    }

                    const updateStrs = [updateAndParams[0], "RETURN count(*)"];
                    const apocArgs = `{${parentVar}:${parentVar}, ${_varName}:${_varName}REPLACE_ME}`;

                    if (insideDoWhen) {
                        updateStrs.push(`\\", \\"\\", ${apocArgs})`);
                    } else {
                        updateStrs.push(`", "", ${apocArgs})`);
                    }
                    updateStrs.push("YIELD value as _");

                    const paramsString = (Object.keys(innerApocParams).reduce(
                        (r: string[], k) => [...r, `${k}:$${k}`],
                        []
                    ) as string[]).join(",");

                    const updateStr = updateStrs.join("\n").replace(/REPLACE_ME/g, `, ${paramsString}`);
                    res.strs.push(updateStr);
                }

                if (update.disconnect) {
                    const disconnectAndParams = createDisconnectAndParams({
                        context,
                        refNode,
                        value: update.disconnect,
                        varName: `${_varName}_disconnect`,
                        withVars,
                        parentVar,
                        relationField,
                        labelOverride: unionTypeName,
                        parentNode: node,
                    });
                    res.strs.push(disconnectAndParams[0]);
                    res.params = { ...res.params, ...disconnectAndParams[1] };
                }

                if (update.connect) {
                    const connectAndParams = createConnectAndParams({
                        context,
                        refNode,
                        value: update.connect,
                        varName: `${_varName}_connect`,
                        withVars,
                        parentVar,
                        relationField,
                        labelOverride: unionTypeName,
                        parentNode: node,
                    });
                    res.strs.push(connectAndParams[0]);
                    res.params = { ...res.params, ...connectAndParams[1] };
                }

                if (update.create) {
                    if (withVars) {
                        res.strs.push(`WITH ${withVars.join(", ")}`);
                    }

                    const creates = relationField.typeMeta.array ? update.create : [update.create];
                    creates.forEach((create, i) => {
                        const innerVarName = `${_varName}_create${i}`;

                        const createAndParams = createCreateAndParams({
                            context,
                            node: refNode,
                            input: create,
                            varName: innerVarName,
                            withVars: [...withVars, innerVarName],
                        });
                        res.strs.push(createAndParams[0]);
                        res.params = { ...res.params, ...createAndParams[1] };
                        res.strs.push(`MERGE (${parentVar})${inStr}${relTypeStr}${outStr}(${innerVarName})`);
                    });
                }
            });

            return res;
        }

        checkRoles({ node, context, operation: "update" });

        res.strs.push(`SET ${varName}.${key} = $${param}`);
        res.params[param] = value;

        return res;
    }

    const { strs, params } = Object.entries(updateInput).reduce(reducer, { strs: [], params: {} }) as Res;

    return [strs.join("\n"), params];
}

export default createUpdateAndParams;
