import { FieldsByTypeName } from "graphql-parse-resolve-info";
import { Context, Node } from "../classes";
import createWhereAndParams from "./create-where-and-params";
import { GraphQLOptionsArg, GraphQLWhereArg } from "../types";
import { checkRoles } from "../auth";
import createAllowAndParams from "./create-allow-and-params";

interface Res {
    projection: string[];
    params: any;
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
}): [string, any] {
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

        if (cypherField) {
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
            }

            const safeJWT = context.getJWTSafe();

            const apocParams = Object.entries(field.args).reduce(
                (r: { strs: string[]; params: any }, f) => {
                    const argName = `${param}_${f[0]}`;

                    return {
                        strs: [...r.strs, `${f[0]}: $${argName}`],
                        params: { ...r.params, [argName]: f[1] },
                    };
                },
                { strs: [`jwt: $jwt`], params: {} }
            ) as { strs: string[]; params: any };
            res.params = { ...res.params, ...apocParams.params, jwt: safeJWT };

            const expectMultipleValues = referenceNode && cypherField.typeMeta.array ? "true" : "false";

            const apocStr = `${!isPrimitive ? `${param} IN` : ""} apoc.cypher.runFirstColumn("${
                cypherField.statement
            }", {this: ${chainStr || varName}${
                apocParams.strs.length ? `, ${apocParams.strs.join(", ")}` : ""
            }}, ${expectMultipleValues}) ${projectionStr ? `| ${param} ${projectionStr}` : ""}`;

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

        const relationField = node.relationFields.find((x) => x.fieldName === key);
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
                    const _param = `${param}_${refNode.name}`;
                    const innenrHeadStr: string[] = [];
                    innenrHeadStr.push("[");
                    innenrHeadStr.push(`${param} IN [${param}] WHERE "${refNode.name}" IN labels (${param})`);

                    if (refNode.auth) {
                        checkRoles({ node: refNode, context, operation: "read" });
                    }

                    const thisWhere = field.args[refNode.name];
                    if (thisWhere) {
                        const whereAndParams = createWhereAndParams({
                            context,
                            node: refNode,
                            varName: param,
                            whereInput: thisWhere,
                            chainStrOverRide: _param,
                        });
                        innenrHeadStr.push(`AND ${whereAndParams[0].replace("WHERE", "")}`);
                        res.params = { ...res.params, ...whereAndParams[1] };
                    }

                    if (refNode.auth) {
                        const allowAndParams = createAllowAndParams({
                            node: refNode,
                            context,
                            varName: param,
                            chainStrOverRide: `${_param}_auth`,
                            functionType: true,
                            operation: "read",
                        });
                        innenrHeadStr.push(`AND ${allowAndParams[0]}`);
                        res.params = { ...res.params, ...allowAndParams[1] };
                    }

                    innenrHeadStr.push(`| ${param}`);

                    if (field.fieldsByTypeName[refNode.name]) {
                        const recurse = createProjectionAndParams({
                            // @ts-ignore
                            fieldsByTypeName: field.fieldsByTypeName,
                            node: refNode,
                            context,
                            varName: param,
                            chainStrOverRide: _param,
                        });
                        innenrHeadStr.push(
                            [`{ __resolveType: "${refNode.name}", `, ...recurse[0].replace("{", "").split("")].join("")
                        );
                        res.params = { ...res.params, ...recurse[1] };
                    } else {
                        innenrHeadStr.push(`{ __resolveType: "${refNode.name}" } `);
                    }

                    innenrHeadStr.push(`]`);
                    headStrs.push(innenrHeadStr.join(" "));
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

            if (referenceNode.auth) {
                checkRoles({ node: referenceNode, context, operation: "read" });
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

            if (referenceNode.auth) {
                const allowAndParams = createAllowAndParams({
                    node: referenceNode,
                    context,
                    varName: `${varName}_${key}`,
                    functionType: true,
                    operation: "read",
                });
                authStr = allowAndParams[0];
                res.params = { ...res.params, ...allowAndParams[1] };
            }

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
            return res;
        }

        res.projection.push(`.${key}`);

        return res;
    }

    const { projection, params } = Object.entries(fieldsByTypeName[node.name] as { [k: string]: any }).reduce(reducer, {
        projection: [],
        params: {},
    }) as Res;

    return [`{ ${projection.join(", ")} }`, params];
}

export default createProjectionAndParams;
