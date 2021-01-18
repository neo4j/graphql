import { Context, Node } from "../classes";
import { RelationField } from "../types";
import createWhereAndParams from "./create-where-and-params";
import createAuthAndParams from "./create-auth-and-params";
import { checkRoles } from "../auth";

interface Res {
    disconnects: string[];
    params: any;
}

function createDisconnectAndParams({
    withVars,
    value,
    varName,
    relationField,
    parentVar,
    refNode,
    context,
    labelOverride,
    parentNode,
}: {
    withVars: string[];
    value: any;
    varName: string;
    relationField: RelationField;
    parentVar: string;
    context: Context;
    refNode: Node;
    labelOverride?: string;
    parentNode: Node;
}): [string, any] {
    function reducer(res: Res, disconnect: any, index): Res {
        const _varName = `${varName}${index}`;
        const inStr = relationField.direction === "IN" ? "<-" : "-";
        const outStr = relationField.direction === "OUT" ? "->" : "-";
        const relTypeStr = `[${_varName}_rel:${relationField.type}]`;

        res.disconnects.push(`WITH ${withVars.join(", ")}`);
        res.disconnects.push(
            `OPTIONAL MATCH (${parentVar})${inStr}${relTypeStr}${outStr}(${_varName}:${
                labelOverride || relationField.typeMeta.name
            })`
        );

        if (disconnect.where) {
            const where = createWhereAndParams({
                varName: _varName,
                whereInput: disconnect.where,
                node: refNode,
                context,
            });
            res.disconnects.push(where[0]);
            res.params = { ...res.params, ...where[1] };
        }

        if (refNode.auth) {
            checkRoles({ node: refNode, context, operation: "disconnect" });

            const allowAndParams = createAuthAndParams({
                context,
                node: refNode,
                operation: "disconnect",
                varName: _varName,
                chainStrOverRide: `${_varName}_allow`,
                type: "allow",
            });
            res.disconnects.push(allowAndParams[0]);
            res.params = { ...res.params, ...allowAndParams[1] };
        }

        /* 
           Replace with subclauses https://neo4j.com/developer/kb/conditional-cypher-execution/
           https://neo4j.slack.com/archives/C02PUHA7C/p1603458561099100 
        */
        res.disconnects.push(`FOREACH(_ IN CASE ${_varName} WHEN NULL THEN [] ELSE [1] END | `);
        res.disconnects.push(`DELETE ${_varName}_rel`);
        res.disconnects.push(`)`); // close FOREACH

        if (disconnect.disconnect) {
            const disconnects = (Array.isArray(disconnect.disconnect)
                ? disconnect.disconnect
                : [disconnect.disconnect]) as any[];

            disconnects.forEach((c) => {
                const reduced = Object.entries(c).reduce(
                    (r: Res, [k, v]) => {
                        const relField = refNode.relationFields.find((x) => k.startsWith(x.fieldName));
                        let newRefNode: Node;

                        if (relationField.union) {
                            const [modelName] = k.split(`${relationField.fieldName}_`).join("").split("_");
                            newRefNode = context.neoSchema.nodes.find((x) => x.name === modelName) as Node;
                        } else {
                            newRefNode = context.neoSchema.nodes.find(
                                (x) => x.name === (relField as RelationField).typeMeta.name
                            ) as Node;
                        }

                        const recurse = createDisconnectAndParams({
                            withVars: [...withVars, _varName],
                            value: v,
                            varName: `${_varName}_${k}`,
                            relationField: relField as RelationField,
                            parentVar: _varName,
                            context,
                            refNode: newRefNode as Node,
                            parentNode: refNode,
                        });
                        r.disconnects.push(recurse[0]);
                        r.params = { ...r.params, ...recurse[1] };

                        return r;
                    },
                    { disconnects: [], params: {} }
                ) as Res;

                res.disconnects.push(reduced.disconnects.join("\n"));
                res.params = { ...res.params, ...reduced.params };
            });
        }

        return res;
    }

    const initialStrs: string[] = [];
    let initialParams = {};

    checkRoles({ node: parentNode, context, operation: "disconnect" });

    if (parentNode.auth) {
        const allowAndParams = createAuthAndParams({
            context,
            node: parentNode,
            operation: "disconnect",
            varName: parentVar,
            chainStrOverRide: `${parentVar}_allow`,
            type: "allow",
        });
        initialStrs.push(allowAndParams[0]);
        initialParams = { ...initialParams, ...allowAndParams[1] };
    }

    const { disconnects, params } = ((relationField.typeMeta.array ? value : [value]) as any[]).reduce(reducer, {
        disconnects: initialStrs,
        params: initialParams,
    });

    return [disconnects.join("\n"), params];
}

export default createDisconnectAndParams;
