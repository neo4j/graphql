/* eslint-disable no-param-reassign */
/* eslint-disable @typescript-eslint/naming-convention */
/* eslint-disable no-underscore-dangle */
import { NeoSchema, Node } from "../classes";
import { RelationField } from "../types";
import createWhereAndParams from "./create-where-and-params";

interface Res {
    create: string;
    params: any;
}

function createConnectAndParams({
    withVars,
    value,
    varName,
    relationField,
    parentVar,
    refNode,
    neoSchema,
}: {
    withVars: string[];
    value: any;
    varName: string;
    relationField: RelationField;
    parentVar: string;
    neoSchema: NeoSchema;
    parentNode: Node;
    refNode: Node;
}): [string, any] {
    function reducer(res: { connect: string; params: any }, connect: any, index): { connect: string; params: any } {
        const _varName = `${varName}${index}`;

        res.connect += `\nWITH ${withVars.join(", ")}`;
        res.connect += `\nOPTIONAL MATCH (${_varName}:${relationField.typeMeta.name})`;

        if (connect.where) {
            const where = createWhereAndParams({ varName: _varName, whereInput: connect.where });
            res.connect += `\n${where[0]}`;
            res.params = { ...res.params, ...where[1] };
        }

        // TODO replace with subclauses https://neo4j.com/developer/kb/conditional-cypher-execution/
        res.connect += `\nFOREACH(_ IN CASE [] WHEN NULL THEN [] ELSE [1] END | `;

        const inStr = relationField.direction === "IN" ? "<-" : "-";
        const outStr = relationField.direction === "OUT" ? "->" : "-";
        const relTypeStr = `[:${relationField.type}]`;

        res.connect += `\nMERGE (${parentVar})${inStr}${relTypeStr}${outStr}(${_varName})`;
        res.connect += `\n)`; // close FOREACH

        if (connect.connect) {
            const connects = (Array.isArray(connect.connect) ? connect.connect : [connect.connect]) as any[];
            connects.forEach((c) => {
                const { str, params } = Object.entries(c).reduce(
                    (r, [k, v]) => {
                        const relField = refNode.relationFields.find((x) => x.fieldName === k) as RelationField;

                        const recurse = createConnectAndParams({
                            withVars: [...withVars, _varName],
                            value: v,
                            varName: `${_varName}_${k}`,
                            relationField: relField,
                            parentVar: _varName,
                            neoSchema,
                            parentNode: refNode,
                            refNode: neoSchema.nodes.find((x) => x.name === relField.typeMeta.name) as Node,
                        });

                        r.str += `\n${recurse[0]}`;
                        r.params = { ...r.params, ...recurse[1] };

                        return r;
                    },
                    { str: "", params: {} }
                );

                res.connect += `\n${str}`;
                res.params = { ...res.params, ...params };
            });
        }

        return res;
    }

    const { connect, params } = ((relationField.typeMeta.array ? value : [value]) as any[]).reduce(reducer, {
        connect: "",
        params: {},
    });

    return [connect, params];
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

                    const withStr = `\nWITH ${[...withVars].join(", ")}`;
                    res.create += `\n${withStr}`;

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
                const connectAndParams = createConnectAndParams({
                    withVars,
                    value: value.connect,
                    varName: `${varName}_${key}_connect`,
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
