import { ResolveTree } from "graphql-parse-resolve-info";
import { Node } from "../classes";
import { AUTH_FORBIDDEN_ERROR } from "../constants";
import { ConnectionField, Context, InterfaceWhereArg, RelationField } from "../types";
import filterInterfaceNodes from "../utils/filter-interface-nodes";
import createConnectionAndParams from "./connection/create-connection-and-params";
import createAuthAndParams from "./create-auth-and-params";
import createProjectionAndParams from "./create-projection-and-params";
import createNodeWhereAndParams from "./where/create-node-where-and-params";

function createInterfaceProjectionAndParams({
    resolveTree,
    field,
    context,
    node,
    nodeVariable,
    parameterPrefix,
}: {
    resolveTree: ResolveTree;
    field: RelationField;
    context: Context;
    node: Node;
    nodeVariable: string;
    parameterPrefix?: string;
}): { cypher: string; params: Record<string, any> } {
    let globalParams = {};
    let params: { args?: any } = {};

    const inStr = field.direction === "IN" ? "<-" : "-";
    const relTypeStr = `[:${field.type}]`;
    const outStr = field.direction === "OUT" ? "->" : "-";

    const whereInput = resolveTree.args.where as InterfaceWhereArg;

    const referenceNodes = context.neoSchema.nodes.filter(
        (x) => field.interface?.implementations?.includes(x.name) && filterInterfaceNodes({ node: x, whereInput })
    );

    let whereArgs: { _on?: any; [str: string]: any } = {};

    const subqueries = referenceNodes.map((refNode) => {
        const param = `${nodeVariable}_${refNode.name}`;
        const subquery = [
            `WITH ${nodeVariable}`,
            `MATCH (${nodeVariable})${inStr}${relTypeStr}${outStr}(${param}:${refNode.name})`,
        ];

        const fieldsByTypeName = {
            [refNode.name]: {
                ...resolveTree.fieldsByTypeName[field.typeMeta.name],
                ...resolveTree.fieldsByTypeName[refNode.name],
            },
        };

        const allowAndParams = createAuthAndParams({
            operations: "READ",
            entity: refNode,
            context,
            allow: {
                parentNode: refNode,
                varName: param,
            },
        });
        if (allowAndParams[0]) {
            globalParams = { ...globalParams, ...allowAndParams[1] };
            subquery.push(`CALL apoc.util.validate(NOT(${allowAndParams[0]}), "${AUTH_FORBIDDEN_ERROR}", [0])`);
        }

        const whereStrs: string[] = [];

        if (resolveTree.args.where) {
            // For root filters
            const rootNodeWhereAndParams = createNodeWhereAndParams({
                whereInput: {
                    ...Object.entries(whereInput).reduce((args, [k, v]) => {
                        if (k !== "_on") {
                            // If this where key is also inside _on for this implementation, use the one in _on instead
                            if (whereInput?._on?.[refNode.name]?.[k]) {
                                return args;
                            }
                            return { ...args, [k]: v };
                        }

                        return args;
                    }, {}),
                },
                context,
                node: refNode,
                nodeVariable: param,
                parameterPrefix: `${parameterPrefix ? `${parameterPrefix}.` : `${nodeVariable}_`}${
                    resolveTree.alias
                }.args.where`,
            });
            if (rootNodeWhereAndParams[0]) {
                whereStrs.push(rootNodeWhereAndParams[0]);
                whereArgs = { ...whereArgs, ...rootNodeWhereAndParams[1] };
            }

            // For _on filters
            if (whereInput?._on?.[refNode.name]) {
                const onTypeNodeWhereAndParams = createNodeWhereAndParams({
                    whereInput: {
                        ...Object.entries(whereInput).reduce((args, [k, v]) => {
                            if (k !== "_on") {
                                return { ...args, [k]: v };
                            }

                            if (Object.prototype.hasOwnProperty.call(v, refNode.name)) {
                                return { ...args, ...v[refNode.name] };
                            }

                            return args;
                        }, {}),
                    },
                    context,
                    node: refNode,
                    nodeVariable: param,
                    parameterPrefix: `${parameterPrefix ? `${parameterPrefix}.` : `${nodeVariable}_`}${
                        resolveTree.alias
                    }.args.where._on.${refNode.name}`,
                });
                if (onTypeNodeWhereAndParams[0]) {
                    whereStrs.push(onTypeNodeWhereAndParams[0]);
                    if (whereArgs._on) {
                        // eslint-disable-next-line prefer-destructuring
                        whereArgs._on[refNode.name] = onTypeNodeWhereAndParams[1];
                    } else {
                        whereArgs._on = { [refNode.name]: onTypeNodeWhereAndParams[1] };
                    }
                }
            }
        }

        const whereAuth = createAuthAndParams({
            operations: "READ",
            entity: refNode,
            context,
            where: { varName: param, node: refNode },
        });
        if (whereAuth[0]) {
            whereStrs.push(whereAuth[0]);
            globalParams = { ...globalParams, ...whereAuth[1] };
        }

        if (whereStrs.length) {
            subquery.push(`WHERE ${whereStrs.join(" AND ")}`);
        }

        const recurse = createProjectionAndParams({
            fieldsByTypeName,
            node: refNode,
            context,
            varName: param,
            literalElements: true,
            resolveType: true,
        });

        if (recurse[2]?.connectionFields?.length) {
            recurse[2].connectionFields.forEach((connectionResolveTree) => {
                const connectionField = refNode.connectionFields.find(
                    (x) => x.fieldName === connectionResolveTree.name
                ) as ConnectionField;
                const connection = createConnectionAndParams({
                    resolveTree: connectionResolveTree,
                    field: connectionField,
                    context,
                    nodeVariable: param,
                });
                subquery.push(connection[0]);
                params = { ...params, ...connection[1] };
            });
        }

        if (recurse[2]?.interfaceFields?.length) {
            recurse[2].interfaceFields.forEach((interfaceResolveTree) => {
                const relationshipField = refNode.relationFields.find(
                    (x) => x.fieldName === interfaceResolveTree.name
                ) as RelationField;
                const interfaceProjection = createInterfaceProjectionAndParams({
                    resolveTree: interfaceResolveTree,
                    field: relationshipField,
                    context,
                    node: refNode,
                    nodeVariable: param,
                });
                subquery.push(interfaceProjection.cypher);
                params = { ...params, ...interfaceProjection.params };
            });
        }

        subquery.push(`RETURN ${recurse[0]} AS ${field.fieldName}`);
        globalParams = {
            ...globalParams,
            ...recurse[1],
        };

        return subquery.join("\n");
    });
    const interfaceProjection = [`WITH ${nodeVariable}`, "CALL {", subqueries.join("\nUNION\n"), "}"];
    if (Object.keys(whereArgs).length) {
        params.args = { where: whereArgs };
    }

    return {
        cypher: interfaceProjection.join("\n"),
        params: {
            ...globalParams,
            ...(Object.keys(params).length ? { [`${nodeVariable}_${resolveTree.alias}`]: params } : {}),
        },
    };
}

export default createInterfaceProjectionAndParams;
