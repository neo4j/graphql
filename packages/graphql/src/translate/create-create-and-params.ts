import { Context, Node } from "../classes";
import createConnectAndParams from "./create-connect-and-params";
import createAuthAndParams from "./create-auth-and-params";

interface Res {
    creates: string[];
    params: any;
    meta?: CreateMeta;
}

interface CreateMeta {
    authStrs: string[];
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
        const pointField = node.pointFields.find((x) => key.startsWith(x.fieldName));

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

        if (primitiveField?.auth) {
            const authAndParams = createAuthAndParams({
                entity: primitiveField,
                operation: "create",
                context,
            });

            if (!res.meta) {
                res.meta = { authStrs: [] };
            }

            res.meta.authStrs.push(authAndParams[0]);
            res.params = { ...res.params, ...authAndParams[1] };
        }

        if (primitiveField?.autogenerate) {
            res.creates.push(`SET ${varName}.${key} = randomUUID()`);

            return res;
        }

        if (pointField) {
            if (pointField.typeMeta.array) {
                res.creates.push(`SET ${varName}.${key} = [p in $${_varName} | point(p)]`);
            } else {
                res.creates.push(`SET ${varName}.${key} = point($${_varName})`);
            }
        } else {
            res.creates.push(`SET ${varName}.${key} = $${_varName}`);
        }

        res.params[_varName] = value;

        return res;
    }

    const initial = [`CREATE (${varName}:${node.name})`];

    const timestamps = node.dateTimeFields.filter((x) => x.timestamps && x.timestamps.includes("create"));
    timestamps.forEach((ts) => {
        initial.push(`SET ${varName}.${ts.fieldName} = datetime()`);
    });

    // eslint-disable-next-line prefer-const
    let { creates, params, meta } = Object.entries(input).reduce(reducer, {
        creates: initial,
        params: {},
    }) as Res;

    if (node.auth) {
        const bindAndParams = createAuthAndParams({
            entity: node,
            operation: "create",
            context,
        });
        if (bindAndParams[0]) {
            creates.push(`WITH ${withVars.join(", ")}`);
            creates.push(`CALL apoc.util.validate(NOT(${bindAndParams[0]}), "Forbidden", [0])`);
            params = { ...params, ...bindAndParams[1] };
        }
    }

    if (meta) {
        creates.push(`WITH ${withVars.join(", ")}`);
        creates.push(`CALL apoc.util.validate(NOT(${meta.authStrs.join(" AND ")}), "Forbidden", [0])`);
    }

    return [creates.join("\n"), params];
}

export default createCreateAndParams;
