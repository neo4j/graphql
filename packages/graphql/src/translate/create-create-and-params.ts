import { NeoSchema, Node } from "../classes";
import createConnectAndParams from "./create-connect-and-params";
import { getRoles } from "../auth";

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
    jwt,
}: {
    input: any;
    varName: string;
    node: Node;
    neoSchema: NeoSchema;
    withVars: string[];
    jwt: any;
}): [string, any] {
    function reducer(res: Res, [key, value]: [string, any]): Res {
        const _varName = `${varName}_${key}`;
        const relationField = node.relationFields.find((x) => x.fieldName === key);

        if (relationField) {
            const refNode = neoSchema.nodes.find((x) => x.name === relationField.typeMeta.name) as Node;

            if (value.create) {
                let jwtRoles: string[];

                if (refNode.auth) {
                    const createRules = refNode.auth.rules.filter((x) => x.operations?.includes("create"));

                    if (!createRules.length) {
                        throw new Error("Forbidden");
                    }

                    const allowStar = createRules.filter((x) => x.allow && x.allow === "*");

                    if (!allowStar.length) {
                        createRules
                            .filter((x) => x.isAuthenticated !== false && x.roles)
                            .forEach((rule) => {
                                ((rule.roles as unknown) as string[]).forEach((role) => {
                                    if (!jwtRoles) {
                                        jwtRoles = getRoles(jwt);
                                    }

                                    if (!jwtRoles.includes(role)) {
                                        throw new Error("Forbidden");
                                    }
                                });
                            });
                    }
                }

                const creates = relationField.typeMeta.array ? value.create : [value.create];
                creates.forEach((create, index) => {
                    const innerVarName = `${_varName}${index}`;
                    res.create += `\n\nWITH ${withVars.join(", ")}`;

                    const recurse = createCreateAndParams({
                        input: create,
                        neoSchema,
                        node: refNode,
                        varName: innerVarName,
                        withVars: [...withVars, innerVarName],
                        jwt,
                    });
                    res.create += `\n${recurse[0]}`;
                    res.params = { ...res.params, ...recurse[1] };

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
