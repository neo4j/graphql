/*
 * Copyright (c) "Neo4j"
 * Neo4j Sweden AB [http://neo4j.com]
 *
 * This file is part of Neo4j.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import { FieldsByTypeName, ResolveTree } from "graphql-parse-resolve-info";
import { Node } from "../classes";
import createWhereAndParams from "./create-where-and-params";
import { GraphQLOptionsArg, GraphQLSortArg, GraphQLWhereArg, Context, ConnectionField } from "../types";
import createAuthAndParams from "./create-auth-and-params";
import { AUTH_FORBIDDEN_ERROR } from "../constants";
import createDatetimeElement from "./projection/elements/create-datetime-element";
import createPointElement from "./projection/elements/create-point-element";
// eslint-disable-next-line import/no-cycle
import createConnectionAndParams from "./connection/create-connection-and-params";
import { createSkipLimitStr } from "../schema/pagination";

interface Res {
    projection: string[];
    params: any;
    meta: ProjectionMeta;
}

interface ProjectionMeta {
    authValidateStrs?: string[];
    connectionFields?: ResolveTree[];
}

function createNodeWhereAndParams({
    whereInput,
    varName,
    context,
    node,
    authValidateStrs,
    chainStr,
}: {
    whereInput?: any;
    context: Context;
    node: Node;
    varName: string;
    authValidateStrs?: string[];
    chainStr?: string;
}): [string, any] {
    const whereStrs: string[] = [];
    let params = {};

    if (whereInput) {
        const whereAndParams = createWhereAndParams({
            context,
            node,
            varName,
            whereInput,
            chainStr,
            recursing: true,
        });
        if (whereAndParams[0]) {
            whereStrs.push(whereAndParams[0]);
            params = { ...params, ...whereAndParams[1] };
        }
    }

    const whereAuth = createAuthAndParams({
        entity: node,
        operation: "READ",
        context,
        where: {
            varName,
            chainStr,
            node,
        },
    });
    if (whereAuth[0]) {
        whereStrs.push(whereAuth[0]);
        params = { ...params, ...whereAuth[1] };
    }

    const preAuth = createAuthAndParams({
        entity: node,
        operation: "READ",
        context,
        allow: {
            parentNode: node,
            varName,
            chainStr,
        },
    });
    if (preAuth[0]) {
        whereStrs.push(`apoc.util.validatePredicate(NOT(${preAuth[0]}), "${AUTH_FORBIDDEN_ERROR}", [0])`);
        params = { ...params, ...preAuth[1] };
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
    literalElements,
    resolveType,
    inRelationshipProjection,
}: {
    fieldsByTypeName: FieldsByTypeName;
    node: Node;
    context: Context;
    chainStr?: string;
    varName: string;
    literalElements?: boolean;
    resolveType?: boolean;
    inRelationshipProjection?: boolean;
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
        } else {
            param = `${varName}_${key}`;
        }

        const whereInput = field.args.where as GraphQLWhereArg;
        const optionsInput = field.args.options as GraphQLOptionsArg;
        const fieldFields = (field.fieldsByTypeName as unknown) as FieldsByTypeName;
        const cypherField = node.cypherFields.find((x) => x.fieldName === key);
        const relationField = node.relationFields.find((x) => x.fieldName === key);
        const connectionField = node.connectionFields.find((x) => x.fieldName === key);
        const pointField = node.pointFields.find((x) => x.fieldName === key);
        const dateTimeField = node.dateTimeFields.find((x) => x.fieldName === key);
        const authableField = node.authableFields.find((x) => x.fieldName === key);

        if (authableField) {
            if (authableField.auth) {
                const allowAndParams = createAuthAndParams({
                    entity: authableField,
                    operation: "READ",
                    context,
                    allow: { parentNode: node, varName, chainStr: param },
                });
                if (allowAndParams[0]) {
                    if (!res.meta.authValidateStrs) {
                        res.meta.authValidateStrs = [];
                    }
                    res.meta.authValidateStrs?.push(allowAndParams[0]);
                    res.params = { ...res.params, ...allowAndParams[1] };
                }
            }
        }

        if (cypherField) {
            let projectionAuthStr = "";
            let projectionStr = "";
            const isPrimitive = ["ID", "String", "Boolean", "Float", "Int", "DateTime", "BigInt"].includes(
                cypherField.typeMeta.name
            );
            const isEnum = context.neoSchema.document.definitions.find(
                (x) => x.kind === "EnumTypeDefinition" && x.name.value === cypherField.typeMeta.name
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

            const initApocParamsStrs = [
                "auth: $auth",
                ...(context.cypherParams ? ["cypherParams: $cypherParams"] : []),
            ];
            const apocParams = Object.entries(field.args).reduce(
                (r: { strs: string[]; params: any }, entry) => {
                    const argName = `${param}_${entry[0]}`;

                    return {
                        strs: [...r.strs, `${entry[0]}: $${argName}`],
                        params: { ...r.params, [argName]: entry[1] },
                    };
                },
                { strs: initApocParamsStrs, params: {} }
            ) as { strs: string[]; params: any };
            res.params = { ...res.params, ...apocParams.params, cypherParams: context.cypherParams };

            const expectMultipleValues = referenceNode && cypherField.typeMeta.array ? "true" : "false";
            const apocWhere = `${
                projectionAuthStr
                    ? `WHERE apoc.util.validatePredicate(NOT(${projectionAuthStr}), "${AUTH_FORBIDDEN_ERROR}", [0])`
                    : ""
            }`;
            const apocParamsStr = `{this: ${chainStr || varName}${
                apocParams.strs.length ? `, ${apocParams.strs.join(", ")}` : ""
            }}`;
            const apocStr = `${!isPrimitive && !isEnum ? `${param} IN` : ""} apoc.cypher.runFirstColumn("${
                cypherField.statement
            }", ${apocParamsStr}, ${expectMultipleValues}) ${apocWhere} ${
                projectionStr ? `| ${param} ${projectionStr}` : ""
            }`;

            if (cypherField.typeMeta.array) {
                res.projection.push(`${key}: [${apocStr}]`);

                return res;
            }

            if (isPrimitive || isEnum) {
                res.projection.push(`${key}: ${apocStr}`);

                return res;
            }

            res.projection.push(`${key}: head([${apocStr}])`);

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

                const headStrs: string[] = referenceNodes.map((refNode) => {
                    const innerHeadStr: string[] = [
                        `[ ${param} IN [${param}] WHERE "${refNode.name}" IN labels (${param})`,
                    ];

                    if (field.fieldsByTypeName[refNode.name]) {
                        const recurse = createProjectionAndParams({
                            fieldsByTypeName: field.fieldsByTypeName,
                            node: refNode,
                            context,
                            varName: param,
                        });

                        const nodeWhereAndParams = createNodeWhereAndParams({
                            whereInput: field.args[refNode.name],
                            context,
                            node: refNode,
                            varName: param,
                            chainStr: `${param}_${refNode.name}`,
                            authValidateStrs: recurse[2]?.authValidateStrs,
                        });
                        if (nodeWhereAndParams[0]) {
                            innerHeadStr.push(`AND ${nodeWhereAndParams[0]}`);
                            res.params = { ...res.params, ...nodeWhereAndParams[1] };
                        }

                        innerHeadStr.push(
                            [
                                `| ${param} { __resolveType: "${refNode.name}", `,
                                ...recurse[0].replace("{", "").split(""),
                            ].join("")
                        );
                        res.params = { ...res.params, ...recurse[1] };
                    } else {
                        innerHeadStr.push(`| ${param} { __resolveType: "${refNode.name}" } `);
                    }

                    innerHeadStr.push(`]`);

                    return innerHeadStr.join(" ");
                });
                unionStrs.push(headStrs.join(" + "));
                unionStrs.push(") ]");

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
                inRelationshipProjection: true,
            });
            [projectionStr] = recurse;
            res.params = { ...res.params, ...recurse[1] };

            let whereStr = "";
            const nodeWhereAndParams = createNodeWhereAndParams({
                whereInput,
                varName: `${varName}_${key}`,
                node: referenceNode,
                context,
                authValidateStrs: recurse[2]?.authValidateStrs,
            });
            if (nodeWhereAndParams[0]) {
                whereStr = `WHERE ${nodeWhereAndParams[0]}`;
                res.params = { ...res.params, ...nodeWhereAndParams[1] };
            }

            const pathStr = `${nodeMatchStr}${inStr}${relTypeStr}${outStr}${nodeOutStr}`;
            const innerStr = `${pathStr}  ${whereStr} | ${param} ${projectionStr}`;
            let nestedQuery;

            if (optionsInput) {
                const skipLimit = createSkipLimitStr({ skip: optionsInput.skip, limit: optionsInput.limit });

                if (optionsInput.sort) {
                    const sorts = optionsInput.sort.reduce((s: string[], sort: GraphQLSortArg) => {
                        return [
                            ...s,
                            ...Object.entries(sort).map(([fieldName, direction]) => {
                                if (direction === "DESC") {
                                    return `'${fieldName}'`;
                                }

                                return `'^${fieldName}'`;
                            }),
                        ];
                    }, []);

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

        if (connectionField) {
            if (!inRelationshipProjection) {
                if (!res.meta.connectionFields) res.meta.connectionFields = [];
                res.meta.connectionFields.push(field as ResolveTree);
                res.projection.push(literalElements ? `${field.name}: ${field.name}` : `${field.name}`);
                return res;
            }

            const matchedConnectionField = node.connectionFields.find(
                (x) => x.fieldName === field.name
            ) as ConnectionField;
            const connection = createConnectionAndParams({
                resolveTree: field,
                field: matchedConnectionField,
                context,
                nodeVariable: varName,
            });

            const connectionParamName = Object.keys(connection[1])[0];
            const runFirstColumnParams = connectionParamName
                ? `{ ${chainStr}: ${chainStr}, ${connectionParamName}: $${connectionParamName} }`
                : `{ ${chainStr}: ${chainStr} }`;

            res.projection.push(
                `${field.name}: apoc.cypher.runFirstColumn("${connection[0]} RETURN ${field.name}", ${runFirstColumnParams}, false)`
            );
            res.params = { ...res.params, ...connection[1] };
            return res;
        }

        if (pointField) {
            res.projection.push(createPointElement({ resolveTree: field, field: pointField, variable: varName }));
        } else if (dateTimeField) {
            res.projection.push(createDatetimeElement({ resolveTree: field, field: dateTimeField, variable: varName }));
        } else {
            res.projection.push(literalElements ? `${key}: ${varName}.${key}` : `.${key}`);
        }

        return res;
    }

    const { projection, params, meta } = Object.entries(fieldsByTypeName[node.name] as { [k: string]: any }).reduce(
        reducer,
        {
            projection: resolveType ? [`__resolveType: "${node.name}"`] : [],
            params: {},
            meta: {},
        }
    );

    return [`{ ${projection.join(", ")} }`, params, meta];
}

export default createProjectionAndParams;
