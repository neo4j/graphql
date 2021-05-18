import { Node, Relationship } from "../../classes";
import { ConnectionWhereArg, Context } from "../../types";
import createRelationshipWhereAndParams from "./create-relationship-where-and-params";
import createNodeWhereAndParams from "./create-node-where-and-params";

function createConnectionWhereAndParams({
    whereInput,
    context,
    node,
    nodeVariable,
    relationship,
    relationshipVariable,
    parameterPrefix,
}: {
    whereInput: ConnectionWhereArg;
    context: Context;
    node: Node;
    nodeVariable: string;
    relationship: Relationship;
    relationshipVariable: string;
    parameterPrefix: string;
}): [string, any] {
    const reduced = Object.entries(whereInput).reduce<{ whereStrs: string[]; params: any }>(
        (res, [k, v]) => {
            if (["AND", "OR"].includes(k)) {
                const innerClauses: string[] = [];
                const innerParams: any[] = [];

                v.forEach((o, i) => {
                    const or = createConnectionWhereAndParams({
                        whereInput: o,
                        node,
                        nodeVariable,
                        relationship,
                        relationshipVariable,
                        context,
                        parameterPrefix: `${parameterPrefix}.${k}[${i}]`,
                    });

                    innerClauses.push(`${or[0]}`);
                    innerParams.push(or[1]);
                });

                // whereStrs.push(`(${innerClauses.join(` ${k} `)})`);
                // params = { ...params, [k]: innerParams };

                const whereStrs = [...res.whereStrs, `(${innerClauses.filter((clause) => !!clause).join(` ${k} `)})`];
                const params = { ...res.params, [k]: innerParams };
                res = { whereStrs, params };
                return res;
            }

            if (k.startsWith("relationship")) {
                const relationshipWhere = createRelationshipWhereAndParams({
                    whereInput: v,
                    relationship,
                    relationshipVariable,
                    context,
                    parameterPrefix: `${parameterPrefix}.${k}`,
                });
                // whereStrs.push(k === "relationship_NOT" ? `(NOT ${relationshipWhere[0]})` : relationshipWhere[0]);
                // params = { ...params, [k]: relationshipWhere[1] };

                const whereStrs = [
                    ...res.whereStrs,
                    k === "relationship_NOT" ? `(NOT ${relationshipWhere[0]})` : relationshipWhere[0],
                ];
                const params = { ...res.params, [k]: relationshipWhere[1] };
                res = { whereStrs, params };
                return res;
            }

            if (k.startsWith("node") || k.startsWith(node.name)) {
                const nodeWhere = createNodeWhereAndParams({
                    whereInput: v,
                    node,
                    nodeVariable,
                    context,
                    parameterPrefix: `${parameterPrefix}.${k}`,
                });
                // whereStrs.push(k.endsWith("_NOT") ? `(NOT ${nodeWhere[0]})` : nodeWhere[0]);
                // params = { ...params, [k]: nodeWhere[1] };

                const whereStrs = [...res.whereStrs, k.endsWith("_NOT") ? `(NOT ${nodeWhere[0]})` : nodeWhere[0]];
                const params = { ...res.params, [k]: nodeWhere[1] };
                res = { whereStrs, params };
            }
            return res;
        },
        { whereStrs: [], params: {} }
    );

    return [reduced.whereStrs.join(" AND "), reduced.params];
}

export default createConnectionWhereAndParams;
