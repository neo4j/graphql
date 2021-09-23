import { ResolveTree } from "graphql-parse-resolve-info";
import { Context, RelationField } from "../types";
import createProjectionAndParams from "./create-projection-and-params";
import createNodeWhereAndParams from "./where/create-node-where-and-params";

function createInterfaceProjectionAndParams({
    resolveTree,
    field,
    context,
    nodeVariable,
    parameterPrefix,
}: {
    resolveTree: ResolveTree;
    field: RelationField;
    context: Context;
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

        // if (resolveTree.fieldsByTypeName[refNode.name]) {
        const recurse = createProjectionAndParams({
            fieldsByTypeName,
            node: refNode,
            context,
            varName: param,
            literalElements: true,
            resolveType: true,
        });
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
                subquery.push(`WHERE ${nodeWhereAndParams[0]}`);
                params = { ...params, ...{ args: { where: nodeWhereAndParams[1] } } };
            }
        }
        subquery.push(`RETURN ${recurse[0]} AS ${field.fieldName}`);
        // res.params = { ...res.params, ...recurse[1] };
        // } else {
        //     subquery.push(`RETURN { __resolveType: "${refNode.name}" } AS ${field.fieldName}`);
        // }
        return subquery.join("\n");
    });
    const interfaceProjection = [`WITH ${nodeVariable}`, "CALL {", subqueries.join("\nUNION\n"), "}"];
    // const unionStrs: string[] = [
    //     `${key}: ${!isArray ? "head(" : ""} [(${
    //         chainStr || varName
    //     })${inStr}${relTypeStr}${outStr}(${param})`,
    //     `WHERE ${referenceNodes.map((x) => `"${x.name}" IN labels(${param})`).join(" OR ")}`,
    //     `| head(`,
    // ];
    // const headStrs: string[] = referenceNodes.map((refNode) => {
    //     const innerHeadStr: string[] = [
    //         `[ ${param} IN [${param}] WHERE "${refNode.name}" IN labels (${param})`,
    //     ];
    //     if (field.fieldsByTypeName[refNode.name]) {
    //         const recurse = createProjectionAndParams({
    //             fieldsByTypeName: field.fieldsByTypeName,
    //             node: refNode,
    //             context,
    //             varName: param,
    //         });
    //         const nodeWhereAndParams = createNodeWhereAndParams({
    //             whereInput: field.args.where ? field.args.where[refNode.name] : field.args.where,
    //             context,
    //             node: refNode,
    //             varName: param,
    //             chainStr: `${param}_${refNode.name}`,
    //             authValidateStrs: recurse[2]?.authValidateStrs,
    //         });
    //         if (nodeWhereAndParams[0]) {
    //             innerHeadStr.push(`AND ${nodeWhereAndParams[0]}`);
    //             res.params = { ...res.params, ...nodeWhereAndParams[1] };
    //         }
    //         innerHeadStr.push(
    //             [
    //                 `| ${param} { __resolveType: "${refNode.name}", `,
    //                 ...recurse[0].replace("{", "").split(""),
    //             ].join("")
    //         );
    //         res.params = { ...res.params, ...recurse[1] };
    //     } else {
    //         innerHeadStr.push(`| ${param} { __resolveType: "${refNode.name}" } `);
    //     }
    //     innerHeadStr.push(`]`);
    //     return innerHeadStr.join(" ");
    // });
    // unionStrs.push(headStrs.join(" + "));
    // unionStrs.push(") ]");
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
