import { NeoSchema, Node } from "../classes";
import { RelationField } from "../types";
import createWhereAndParams from "./create-where-and-params";

interface Res {
    connect: string;
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
    function reducer(res: Res, connect: any, index): Res {
        const _varName = `${varName}${index}`;
        const inStr = relationField.direction === "IN" ? "<-" : "-";
        const outStr = relationField.direction === "OUT" ? "->" : "-";
        const relTypeStr = `[:${relationField.type}]`;

        res.connect += `\nWITH ${withVars.join(", ")}`;
        res.connect += `\nOPTIONAL MATCH (${_varName}:${relationField.typeMeta.name})`;
        if (connect.where) {
            const where = createWhereAndParams({ varName: _varName, whereInput: connect.where });
            res.connect += `\n${where[0]}`;
            res.params = { ...res.params, ...where[1] };
        }
        res.connect += `\nFOREACH(_ IN CASE [] WHEN NULL THEN [] ELSE [1] END | `; // TODO replace with subclauses https://neo4j.com/developer/kb/conditional-cypher-execution/
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

export default createConnectAndParams;
