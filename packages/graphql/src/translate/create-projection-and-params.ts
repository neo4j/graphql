import { FieldsByTypeName } from "graphql-parse-resolve-info";
import { Context, Node } from "../classes";
import createWhereAndParams from "./create-where-and-params";
import { GraphQLOptionsArg, GraphQLWhereArg } from "../types";
import createAuthAndParams from "./create-auth-and-params";
import createAuthParam from "./create-auth-param";
import { AUTH_FORBIDDEN_ERROR } from "../constants";

interface Res {
    projection: string[];
    params: any;
    meta?: ProjectionMeta;
}

interface ProjectionMeta {
    authValidateStrs?: string[];
    authWhereStrs?: string[];
}

function createSkipLimitStr({ skip, limit }: { skip?: number; limit?: number }): string {
    const hasSkip = typeof skip !== "undefined";
    const hasLimit = typeof limit !== "undefined";
    let skipLimitStr = "";

    if (hasSkip && !hasLimit) {
        skipLimitStr = `[${skip}..]`;
    }

    if (hasLimit && !hasSkip) {
        skipLimitStr = `[..${limit}]`;
    }

    if (hasLimit && hasSkip) {
        skipLimitStr = `[${skip}..${limit}]`;
    }

    return skipLimitStr;
}

function createNodeWhereAndParams({
    whereInput,
    varName,
    context,
    node,
    varNameOverRide,
    authWhereStrs,
    authValidateStrs,
}: {
    whereInput?: any;
    context: Context;
    node: Node;
    varName: string;
    varNameOverRide?: string;
    authWhereStrs?: string[];
    authValidateStrs?: string[];
}): [string, any] {
    const whereStrs: string[] = [];
    let params = {};

    if (whereInput) {
        const whereAndParams = createWhereAndParams({
            context,
            node,
            varName,
            whereInput,
            chainStrOverRide: varNameOverRide,
            recursing: true,
        });
        if (whereAndParams[0]) {
            whereStrs.push(whereAndParams[0]);
            params = { ...params, ...whereAndParams[1] };
        }
    }

    if (node.auth) {
        const whereAuth = createAuthAndParams({
            entity: node,
            operation: "read",
            context,
            where: {
                varName,
                chainStr: varNameOverRide,
                node,
            },
        });
        if (whereAuth[0]) {
            whereStrs.push(whereAuth[0]);
            params = { ...params, ...whereAuth[1] };
        }

        const preAuth = createAuthAndParams({
            entity: node,
            operation: "read",
            context,
            allow: {
                parentNode: node,
                varName,
                chainStr: varNameOverRide,
            },
        });
        if (preAuth[0]) {
            whereStrs.push(`apoc.util.validatePredicate(NOT(${preAuth[0]}), "${AUTH_FORBIDDEN_ERROR}", [0])`);
            params = { ...params, ...preAuth[1] };
        }
    }

    if (authWhereStrs?.length) {
        whereStrs.push(authWhereStrs.join(" AND "));
    }

    if (authValidateStrs?.length) {
        whereStrs.push(
            `apoc.util.validatePredicate(NOT(${authValidateStrs.join(" AND ")}), "${AUTH_FORBIDDEN_ERROR}", [0])`
        );
    }

    return [whereStrs.join(" AND "), params];
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
        const authableField = node.authableFields.find((x) => x.fieldName === key);

        if (authableField) {
            if (authableField.auth) {
                const allowAndParams = createAuthAndParams({
                    entity: authableField,
                    operation: "read",
                    context,
                    allow: { parentNode: node, varName, chainStr: param },
                });
                if (allowAndParams[0]) {
                    if (!res.meta) {
                        res.meta = { authValidateStrs: [] };
                    }
                    res.meta?.authValidateStrs?.push(allowAndParams[0]);
                    res.params = { ...res.params, ...allowAndParams[1] };
                }

                const whereAuthAndParams = createAuthAndParams({
                    entity: authableField,
                    operation: "read",
                    context,
                    where: { varName, chainStr: param, node },
                });
                if (whereAuthAndParams[0]) {
                    if (!res.meta) {
                        res.meta = { authWhereStrs: [] };
                    }
                    res.meta?.authWhereStrs?.push(whereAuthAndParams[0]);
                    res.params = { ...res.params, ...whereAuthAndParams[1] };
                }
            }
        }

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
                [projectionStr] = recurse;
                res.params = { ...res.params, ...recurse[1] };
                if (recurse[2]?.authValidateStrs?.length) {
                    projectionAuthStr = recurse[2].authValidateStrs.join(" AND ");
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
                { strs: ["auth: $auth"], params: {} }
            ) as { strs: string[]; params: any };
            res.params = { ...res.params, ...apocParams.params, auth: createAuthParam({ context }) };

            const expectMultipleValues = referenceNode && cypherField.typeMeta.array ? "true" : "false";
            const apocWhere = `${
                projectionAuthStr
                    ? `WHERE apoc.util.validatePredicate(NOT(${projectionAuthStr}), "${AUTH_FORBIDDEN_ERROR}", [0])`
                    : ""
            }`;
            const apocStr = `${!isPrimitive ? `${param} IN` : ""} apoc.cypher.runFirstColumn("${
                cypherField.statement
            }", {this: ${chainStr || varName}${
                apocParams.strs.length ? `, ${apocParams.strs.join(", ")}` : ""
            }}, ${expectMultipleValues}) ${apocWhere} ${projectionStr ? `| ${param} ${projectionStr}` : ""}`;

            if (!cypherField.typeMeta.array) {
                res.projection.push(`${key}: head([${apocStr}])`);

                return res;
            }

            if (isPrimitive) {
                res.projection.push(`${key}: ${apocStr}`);
            } else {
                res.projection.push(`${key}: [${apocStr}]`);
            }

            return res;
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
                );

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

                    if (field.fieldsByTypeName[refNode.name]) {
                        const recurse = createProjectionAndParams({
                            // @ts-ignore
                            fieldsByTypeName: field.fieldsByTypeName,
                            node: refNode,
                            context,
                            varName: param,
                            chainStrOverRide: varNameOverRide,
                        });

                        const nodeWhereAndParams = createNodeWhereAndParams({
                            whereInput: field.args[refNode.name],
                            context,
                            node: refNode,
                            varName: param,
                            varNameOverRide,
                            authValidateStrs: recurse[2]?.authValidateStrs,
                            authWhereStrs: recurse[2]?.authWhereStrs,
                        });
                        if (nodeWhereAndParams[0]) {
                            innerHeadStr.push(`AND ${nodeWhereAndParams[0]}`);
                            res.params = { ...res.params, ...nodeWhereAndParams[1] };
                        }

                        innerHeadStr.push(`| ${param}`);

                        innerHeadStr.push(
                            [`{ __resolveType: "${refNode.name}", `, ...recurse[0].replace("{", "").split("")].join("")
                        );
                        res.params = { ...res.params, ...recurse[1] };
                    } else {
                        innerHeadStr.push(`| ${param}`);

                        innerHeadStr.push(`{ __resolveType: "${refNode.name}" } `);
                    }

                    innerHeadStr.push(`]`);
                    headStrs.push(innerHeadStr.join(" "));
                });

                unionStrs.push(headStrs.join(" + "));
                unionStrs.push(")");
                unionStrs.push("]");

                if (optionsInput) {
                    const skipLimit = createSkipLimitStr({ skip: optionsInput.skip, limit: optionsInput.limit });
                    if (skipLimit) {
                        unionStrs.push(skipLimit);
                    }
                }

                unionStrs.push(`${!isArray ? ")" : ""}`);
                res.projection.push(unionStrs.join(" "));

                return res;
            }

            let projectionStr = "";
            const recurse = createProjectionAndParams({
                fieldsByTypeName: fieldFields,
                node: referenceNode || node,
                context,
                varName: `${varName}_${key}`,
                chainStr: param,
            });
            [projectionStr] = recurse;
            res.params = { ...res.params, ...recurse[1] };

            let whereStr = "";
            const nodeWhereAndParams = createNodeWhereAndParams({
                whereInput,
                varName: `${varName}_${key}`,
                node: referenceNode,
                context,
                authWhereStrs: recurse[2]?.authWhereStrs,
                authValidateStrs: recurse[2]?.authValidateStrs,
            });
            if (nodeWhereAndParams[0]) {
                [whereStr] = nodeWhereAndParams;
                res.params = { ...res.params, ...nodeWhereAndParams[1] };
            }
            whereStr = whereStr ? `WHERE ${whereStr}` : whereStr;

            const pathStr = `${nodeMatchStr}${inStr}${relTypeStr}${outStr}${nodeOutStr}`;
            const innerStr = `${pathStr}  ${whereStr} | ${param} ${projectionStr}`;

            let nestedQuery;

            if (optionsInput) {
                const skipLimit = createSkipLimitStr({ skip: optionsInput.skip, limit: optionsInput.limit });

                if (optionsInput.sort) {
                    const sorts = optionsInput.sort.map((x) => {
                        const [fieldName, op] = x.split("_");

                        if (op === "DESC") {
                            return `'${fieldName}'`;
                        }

                        return `'^${fieldName}'`;
                    });

                    nestedQuery = `${key}: apoc.coll.sortMulti([ ${innerStr} ], [${sorts.join(", ")}])${skipLimit}`;
                } else {
                    nestedQuery = `${key}: ${!isArray ? "head(" : ""}[ ${innerStr} ]${skipLimit}${!isArray ? ")" : ""}`;
                }
            } else {
                nestedQuery = `${key}: ${!isArray ? "head(" : ""}[ ${innerStr} ]${!isArray ? ")" : ""}`;
            }

            res.projection.push(nestedQuery);

            return res;
        }

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

        return res;
    }

    const { projection, params, meta } = Object.entries(fieldsByTypeName[node.name] as { [k: string]: any }).reduce(
        reducer,
        {
            projection: [],
            params: {},
        }
    );

    return [`{ ${projection.join(", ")} }`, params, meta];
}

export default createProjectionAndParams;
