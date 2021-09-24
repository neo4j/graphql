import { ResolveTree } from "graphql-parse-resolve-info";
import { Node } from "../classes";
import { AUTH_FORBIDDEN_ERROR } from "../constants";
import { ConnectionField, Context, RelationField } from "../types";
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
    let params = {};

    const inStr = field.direction === "IN" ? "<-" : "-";
    const relTypeStr = `[:${field.type}]`;
    const outStr = field.direction === "OUT" ? "->" : "-";

    const referenceNodes = context.neoSchema.nodes.filter(
        (x) =>
            field.interface?.implementations?.includes(x.name) &&
            (!resolveTree.args.where ||
                Object.prototype.hasOwnProperty.call(resolveTree.args.where, x.name) ||
                !field.interface?.implementations?.some((i) =>
                    Object.prototype.hasOwnProperty.call(resolveTree.args.where, i)
                ))
    );

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
            operation: "READ",
            entity: refNode,
            context,
            allow: {
                parentNode: refNode,
                varName: param,
            },
        });
        if (allowAndParams[0]) {
            params = { ...params, ...allowAndParams[1] };
            subquery.push(`CALL apoc.util.validate(NOT(${allowAndParams[0]}), "${AUTH_FORBIDDEN_ERROR}", [0])`);
        }

        const whereStrs: string[] = [];

        if (resolveTree.args.where) {
            const nodeWhereAndParams = createNodeWhereAndParams({
                whereInput: {
                    ...Object.entries(resolveTree.args.where).reduce((args, [k, v]) => {
                        if (!field.interface?.implementations?.includes(k)) {
                            return { ...args, [k]: v };
                        }

                        if (k === refNode.name) {
                            return { ...args, ...v };
                        }

                        return args;
                    }, {}),
                },
                context,
                node: refNode,
                nodeVariable: param,
                // chainStr: `${param}_${refNode.name}`,
                // authValidateStrs: recurse[2]?.authValidateStrs,
                parameterPrefix: `${parameterPrefix ? `${parameterPrefix}.` : `${nodeVariable}_`}${
                    resolveTree.alias
                }.args.where`,
            });
            if (nodeWhereAndParams[0]) {
                whereStrs.push(nodeWhereAndParams[0]);
                params = { ...params, ...{ args: { where: nodeWhereAndParams[1] } } };
            }
        }

        const whereAuth = createAuthAndParams({
            operation: "READ",
            entity: refNode,
            context,
            where: { varName: param, node: refNode },
        });
        if (whereAuth[0]) {
            whereStrs.push(whereAuth[0]);
            params = { ...params, ...whereAuth[1] };
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

        return subquery.join("\n");
    });
    const interfaceProjection = [`WITH ${nodeVariable}`, "CALL {", subqueries.join("\nUNION\n"), "}"];

    // if (optionsInput) {
    //     const offsetLimit = createOffsetLimitStr({
    //         offset: optionsInput.offset,
    //         limit: optionsInput.limit,
    //     });
    //     if (offsetLimit) {
    //         unionStrs.push(offsetLimit);
    //     }
    // }
    // unionStrs.push(`${!isArray ? ")" : ""}`);
    // res.projection.push(interfaceProjection.join("\n"));
    // return res;
    return {
        cypher: interfaceProjection.join("\n"),
        params: Object.keys(params).length ? { [`${nodeVariable}_${resolveTree.alias}`]: params } : {},
    };
}

export default createInterfaceProjectionAndParams;
