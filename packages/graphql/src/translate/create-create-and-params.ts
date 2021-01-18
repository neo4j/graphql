import { Context, Node } from "../classes";
import createConnectAndParams from "./create-connect-and-params";
import { checkRoles } from "../auth";
import createAuthAndParams from "./create-auth-and-params";

interface Res {
    creates: string[];
    params: any;
}

function createCreateAndParams({
    input,
    varName,
    node,
    context,
    withVars,
}: {
    input: any;
    varName: string;
    node: Node;
    context: Context;
    withVars: string[];
}): [string, any] {
    function reducer(res: Res, [key, value]: [string, any]): Res {
        const _varName = `${varName}_${key}`;
        const relationField = node.relationFields.find((x) => key.startsWith(x.fieldName));
        const primitiveField = node.primitiveFields.find((x) => key === x.fieldName);

        if (relationField) {
            let refNode: Node;
            let unionTypeName = "";

            if (relationField.union) {
                [unionTypeName] = key.split(`${relationField.fieldName}_`).join("").split("_");
                refNode = context.neoSchema.nodes.find((x) => x.name === unionTypeName) as Node;
            } else {
                refNode = context.neoSchema.nodes.find((x) => x.name === relationField.typeMeta.name) as Node;
            }

            if (value.create) {
                const creates = relationField.typeMeta.array ? value.create : [value.create];
                creates.forEach((create, index) => {
                    const innerVarName = `${_varName}${index}`;
                    res.creates.push(`\nWITH ${withVars.join(", ")}`);

                    const recurse = createCreateAndParams({
                        input: create,
                        context,
                        node: refNode,
                        varName: innerVarName,
                        withVars: [...withVars, innerVarName],
                    });
                    res.creates.push(recurse[0]);
                    res.params = { ...res.params, ...recurse[1] };

                    const inStr = relationField.direction === "IN" ? "<-" : "-";
                    const outStr = relationField.direction === "OUT" ? "->" : "-";
                    const relTypeStr = `[:${relationField.type}]`;
                    res.creates.push(`MERGE (${varName})${inStr}${relTypeStr}${outStr}(${innerVarName})`);
                });
            }

            if (value.connect) {
                const connectAndParams = createConnectAndParams({
                    withVars,
                    value: value.connect,
                    varName: `${_varName}_connect`,
                    parentVar: varName,
                    relationField,
                    context,
                    refNode,
                    labelOverride: unionTypeName,
                    parentNode: node,
                    fromCreate: true,
                });
                res.creates.push(connectAndParams[0]);
                res.params = { ...res.params, ...connectAndParams[1] };
            }

            return res;
        }

        if (primitiveField?.autogenerate) {
            res.creates.push(`SET ${varName}.${key} = randomUUID()`);
        } else {
            res.creates.push(`SET ${varName}.${key} = $${_varName}`);
            res.params[_varName] = value;
        }

        return res;
    }

    checkRoles({ node, context, operation: "create" });

    // eslint-disable-next-line prefer-const
    let { creates, params } = Object.entries(input).reduce(reducer, {
        creates: [`CREATE (${varName}:${node.name})`],
        params: {},
    }) as Res;

    if (node.auth) {
        const bindAndParams = createAuthAndParams({
            context,
            node,
            operation: "create",
            varName,
            chainStrOverRide: `${varName}_bind`,
            type: "bind",
        });
        if (bindAndParams[0]) {
            creates.push(`WITH ${withVars.join(", ")}`);
        }
        creates.push(bindAndParams[0]);
        params = { ...params, ...bindAndParams[1] };
    }

    return [creates.join("\n"), params];
}

export default createCreateAndParams;
