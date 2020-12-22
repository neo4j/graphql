import { Context, Node } from "../classes";
import createConnectAndParams from "./create-connect-and-params";
import { checkRoles } from "../auth";

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
        let unionTypeName = "";

        if (relationField) {
            let refNode: Node;

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
                });
                res.creates.push(connectAndParams[0]);
                res.params = { ...res.params, ...connectAndParams[1] };
            }

            return res;
        }

        res.creates.push(`SET ${varName}.${key} = $${_varName}`);
        res.params[_varName] = value;

        return res;
    }

    checkRoles({ node, context, operation: "create" });

    const initial = [
        `CREATE (${varName}:${node.name})`,
        ...(node.timestamps
            ? [`SET ${varName}.createdAt = datetime()`, `SET ${varName}.updatedAt = ${varName}.createdAt`]
            : []),
    ];

    const { creates, params } = Object.entries(input).reduce(reducer, {
        creates: initial,
        params: {},
    }) as Res;

    return [creates.join("\n"), params];
}

export default createCreateAndParams;
