import { FieldsByTypeName } from "graphql-parse-resolve-info";
import { Context, Node } from "../classes";
import createWhereAndParams from "./create-where-and-params";
import { GraphQLOptionsArg, GraphQLWhereArg } from "../types";
import createAuthAndParams from "./create-auth-and-params";

interface Res {
    projection: string[];
    params: any;
    meta?: ProjectionMeta;
}

interface ProjectionMeta {
    authStrs: string[];
}

function createProjectionAndParams({
    fieldsByTypeName,
    node,
    context,
    chainStr,
    varName,
    chainStrOverRide,
}: {
    fieldsByTypeName: FieldsByTypeName;
    node: Node;
    context: Context;
    chainStr?: string;
    varName: string;
    chainStrOverRide?: string;
}): [string, any, ProjectionMeta?] {
    function reducer(res: Res, [k, field]: [string, any]): Res {
        let key = k;
        const alias: string | undefined = field.alias !== field.name ? field.alias : undefined;

        if (alias) {
            key = field.name as string;
        }

        let param = "";
        if (chainStr) {
            param = `${chainStr}_${key}`;
        } else if (chainStrOverRide) {
            param = `${chainStrOverRide}_${key}`;
        } else {
            param = `${varName}_${key}`;
        }

        const whereInput = field.args.where as GraphQLWhereArg;
        const optionsInput = field.args.options as GraphQLOptionsArg;
        const fieldFields = (field.fieldsByTypeName as unknown) as FieldsByTypeName;
        const cypherField = node.cypherFields.find((x) => x.fieldName === key);
        const relationField = node.relationFields.find((x) => x.fieldName === key);
        const pointField = node.pointFields.find((x) => x.fieldName === key);
        const dateTimeField = node.dateTimeFields.find((x) => x.fieldName === key);

        if (cypherField) {
            let projectionAuthStr = "";
            let projectionStr = "";
            const isPrimitive = ["ID", "String", "Boolean", "Float", "Int", "DateTime"].includes(
                cypherField.typeMeta.name
            );

            const referenceNode = context.neoSchema.nodes.find((x) => x.name === cypherField.typeMeta.name);
            if (referenceNode) {
                const recurse = createProjectionAndParams({
                    fieldsByTypeName: fieldFields,
                    node: referenceNode || node,
                    context,
                    varName: `${varName}_${key}`,
                    chainStr: param,
                });
                projectionStr = recurse[0];
                res.params = { ...res.params, ...recurse[1] };
                if (recurse[2]?.authStrs.length) {
                    projectionAuthStr = recurse[2].authStrs.join(" AND ");
                }
            }

            const apocParams = Object.entries(field.args).reduce(
                (r: { strs: string[]; params: any }, entry) => {
                    const argName = `${param}_${entry[0]}`;

                    return {
                        strs: [...r.strs, `${entry[0]}: $${argName}`],
                        params: { ...r.params, [argName]: entry[1] },
                    };
                },
                { strs: [...(cypherField.statement.includes("$auth.") ? [`auth: $auth`] : [])], params: {} }
            ) as { strs: string[]; params: any };
            res.params = { ...res.params, ...apocParams.params };

            const expectMultipleValues = referenceNode && cypherField.typeMeta.array ? "true" : "false";

            const apocStr = `${!isPrimitive ? `${param} IN` : ""} apoc.cypher.runFirstColumn("${
                cypherField.statement
            }", {this: ${chainStr || varName}${
                apocParams.strs.length ? `, ${apocParams.strs.join(", ")}` : ""
            }}, ${expectMultipleValues}) ${
                projectionAuthStr
                    ? `WHERE apoc.util.validatePredicate(NOT(${projectionAuthStr}), "Forbidden", [0])`
                    : ""
            } ${projectionStr ? `| ${param} ${projectionStr}` : ""}`;

            if (!cypherField.typeMeta.array) {
                res.projection.push(`${key}: head([${apocStr}])`);

                return res;
            }

            if (isPrimitive) {
                res.projection.push(`${key}: ${apocStr}`);
            } else {
                res.projection.push(`${key}: [${apocStr}]`);
            }
        }

        if (relationField) {
            const referenceNode = context.neoSchema.nodes.find((x) => x.name === relationField.typeMeta.name) as Node;
            const nodeMatchStr = `(${chainStr || varName})`;
            const inStr = relationField.direction === "IN" ? "<-" : "-";
            const relTypeStr = `[:${relationField.type}]`;
            const outStr = relationField.direction === "OUT" ? "->" : "-";
            const nodeOutStr = `(${param}:${referenceNode?.name})`;
            const isArray = relationField.typeMeta.array;

            if (relationField.union) {
                const referenceNodes = context.neoSchema.nodes.filter((x) =>
                    relationField.union?.nodes?.includes(x.name)
                ) as Node[];

                const unionStrs: string[] = [
                    `${key}: ${!isArray ? "head(" : ""} [(${
                        chainStr || varName
                    })${inStr}${relTypeStr}${outStr}(${param})`,
                    `WHERE ${referenceNodes.map((x) => `"${x.name}" IN labels(${param})`).join(" OR ")}`,
                    `| head(`,
                ];

                const headStrs: string[] = [];

                referenceNodes.forEach((refNode) => {
                    const varNameOverRide = `${param}_${refNode.name}`;
                    const innerHeadStr: string[] = [];
                    innerHeadStr.push("[");
                    innerHeadStr.push(`${param} IN [${param}] WHERE "${refNode.name}" IN labels (${param})`);

                    const thisWhere = field.args[refNode.name];
                    if (thisWhere) {
                        const whereAndParams = createWhereAndParams({
                            context,
                            node: refNode,
                            varName: param,
                            whereInput: thisWhere,
                            chainStrOverRide: varNameOverRide,
                        });
                        innerHeadStr.push(`AND ${whereAndParams[0].replace("WHERE", "")}`);
                        res.params = { ...res.params, ...whereAndParams[1] };
                    }

                    const preAuth = createAuthAndParams({
                        entity: refNode,
                        operation: "read",
                        context,
                        allow: {
                            parentNode: refNode,
                            varName: param,
                            chainStr: varNameOverRide,
                        },
                    });
                    if (preAuth[0]) {
                        innerHeadStr.push(`AND apoc.util.validatePredicate(NOT(${preAuth[0]}), "Forbidden", [0])`);
                        res.params = { ...res.params, ...preAuth[1] };
                    }

                    innerHeadStr.push(`| ${param}`);

                    if (field.fieldsByTypeName[refNode.name]) {
                        // TODO META
                        const recurse = createProjectionAndParams({
                            // @ts-ignore
                            fieldsByTypeName: field.fieldsByTypeName,
                            node: refNode,
                            context,
                            varName: param,
                            chainStrOverRide: varNameOverRide,
                        });
                        innerHeadStr.push(
                            [`{ __resolveType: "${refNode.name}", `, ...recurse[0].replace("{", "").split("")].join("")
                        );
                        res.params = { ...res.params, ...recurse[1] };
                    } else {
                        innerHeadStr.push(`{ __resolveType: "${refNode.name}" } `);
                    }

                    innerHeadStr.push(`]`);
                    headStrs.push(innerHeadStr.join(" "));
                });

                unionStrs.push(headStrs.join(" + "));
                unionStrs.push(")");
                unionStrs.push("]");

                if (optionsInput) {
                    const hasSkip = Boolean(optionsInput.skip) || optionsInput.skip === 0;
                    const hasLimit = Boolean(optionsInput.limit) || optionsInput.limit === 0;

                    let sortLimitStr = "";

                    if (hasSkip && !hasLimit) {
                        sortLimitStr = `[${optionsInput.skip}..]`;
                    }

                    if (hasLimit && !hasSkip) {
                        sortLimitStr = `[..${optionsInput.limit}]`;
                    }

                    if (hasLimit && hasSkip) {
                        sortLimitStr = `[${optionsInput.skip}..${optionsInput.limit}]`;
                    }

                    unionStrs.push(sortLimitStr);
                }

                unionStrs.push(`${!isArray ? ")" : ""}`);
                res.projection.push(unionStrs.join(" "));

                return res;
            }

            let whereStr = "";
            let projectionStr = "";
            let authStr = "";

            if (whereInput) {
                const where = createWhereAndParams({
                    whereInput,
                    varName: `${varName}_${key}`,
                    node,
                    context,
                });
                whereStr = where[0];
                res.params = { ...res.params, ...where[1] };
            }

            const preAuth = createAuthAndParams({
                entity: referenceNode,
                operation: "read",
                context,
                allow: {
                    parentNode: referenceNode,
                    varName: `${varName}_${key}`,
                },
            });
            if (preAuth[0]) {
                authStr = `apoc.util.validatePredicate(NOT(${preAuth[0]}), "Forbidden", [0])`;
                res.params = { ...res.params, ...preAuth[1] };
            }

            // TODO meta
            const recurse = createProjectionAndParams({
                fieldsByTypeName: fieldFields,
                node: referenceNode || node,
                context,
                varName: `${varName}_${key}`,
                chainStr: param,
            });
            projectionStr = recurse[0];
            res.params = { ...res.params, ...recurse[1] };

            const pathStr = `${nodeMatchStr}${inStr}${relTypeStr}${outStr}${nodeOutStr}`;
            const innerStr = `${pathStr} ${whereStr} ${
                authStr ? `${!whereStr ? "WHERE " : ""} ${whereStr ? "AND " : ""} ${authStr}` : ""
            } | ${param} ${projectionStr}`;

            let nestedQuery;

            if (optionsInput) {
                let sortLimitStr = "";

                if (optionsInput.skip && !optionsInput.limit) {
                    sortLimitStr = `[${optionsInput.skip}..]`;
                }

                if (optionsInput.limit && !optionsInput.skip) {
                    sortLimitStr = `[..${optionsInput.limit}]`;
                }

                if (optionsInput.limit && optionsInput.skip) {
                    sortLimitStr = `[${optionsInput.skip}..${optionsInput.limit}]`;
                }

                if (optionsInput.sort) {
                    const sorts = optionsInput.sort.map((x) => {
                        const [fieldName, op] = x.split("_");

                        if (op === "DESC") {
                            return `'${fieldName}'`;
                        }

                        return `'^${fieldName}'`;
                    });

                    nestedQuery = `${key}: apoc.coll.sortMulti([ ${innerStr} ], [${sorts.join(", ")}])${sortLimitStr}`;
                } else {
                    nestedQuery = `${key}: ${!isArray ? "head(" : ""}[ ${innerStr} ]${sortLimitStr}${
                        !isArray ? ")" : ""
                    }`;
                }
            } else {
                nestedQuery = `${key}: ${!isArray ? "head(" : ""}[ ${innerStr} ]${!isArray ? ")" : ""}`;
            }

            res.projection.push(nestedQuery);
        }

        const authableField = [
            ...node.dateTimeFields,
            ...node.enumFields,
            ...node.objectFields,
            ...node.scalarFields,
            ...node.primitiveFields,
            ...node.interfaceFields,
            ...node.objectFields,
            ...node.unionFields,
            ...node.cypherFields,
        ].find((x) => x.fieldName === key);

        if (authableField) {
            if (authableField.auth) {
                const authAndParams = createAuthAndParams({
                    entity: authableField,
                    operation: "read",
                    context,
                    allow: { parentNode: node, varName },
                });

                if (!res.meta) {
                    res.meta = { authStrs: [] };
                }

                res.meta.authStrs.push(authAndParams[0]);
                res.params = { ...res.params, ...authAndParams[1] };
            }
        }

        const selectableField = [
            ...node.dateTimeFields,
            ...node.enumFields,
            ...node.objectFields,
            ...node.scalarFields,
            ...node.primitiveFields,
            ...node.interfaceFields,
            ...node.objectFields,
            ...node.unionFields,
            ...node.pointFields,
        ].find((x) => x.fieldName === key);

        if (selectableField) {
            if (pointField) {
                const isArray = pointField.typeMeta.array;

                const { crs, ...point } = fieldFields[pointField.typeMeta.name];
                const fields: string[] = [];

                // Sadly need to select the whole point object due to the risk of height/z
                // being selected on a 2D point, to which the database will throw an error
                if (point) {
                    fields.push(isArray ? "point:p" : `point: ${varName}.${key}`);
                }

                if (crs) {
                    fields.push(isArray ? "crs: p.crs" : `crs: ${varName}.${key}.crs`);
                }

                res.projection.push(
                    isArray
                        ? `${key}: [p in ${varName}.${key} | { ${fields.join(", ")} }]`
                        : `${key}: { ${fields.join(", ")} }`
                );
            } else if (dateTimeField) {
                res.projection.push(
                    dateTimeField.typeMeta.array
                        ? `${key}: [ dt in ${varName}.${key} | apoc.date.convertFormat(toString(dt), "iso_zoned_date_time", "iso_offset_date_time") ]`
                        : `${key}: apoc.date.convertFormat(toString(${varName}.${key}), "iso_zoned_date_time", "iso_offset_date_time")`
                );
            } else {
                res.projection.push(`.${key}`);
            }
        }

        return res;
    }

    const { projection, params, meta } = Object.entries(fieldsByTypeName[node.name] as { [k: string]: any }).reduce(
        reducer,
        {
            projection: [],
            params: {},
        }
    ) as Res;

    return [`{ ${projection.join(", ")} }`, params, meta];
}

export default createProjectionAndParams;
