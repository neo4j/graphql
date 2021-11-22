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

import { UnionTypeDefinitionNode } from "graphql/language/ast";
import { FieldsByTypeName, ResolveTree } from "graphql-parse-resolve-info";
import { Node } from "../classes";
import createWhereAndParams from "./create-where-and-params";
import { GraphQLOptionsArg, GraphQLSortArg, GraphQLWhereArg, Context, ConnectionField } from "../types";
import createAuthAndParams from "./create-auth-and-params";
import { AUTH_FORBIDDEN_ERROR } from "../constants";
import { createDatetimeElement } from "./projection/elements/create-datetime-element";
import createPointElement from "./projection/elements/create-point-element";
// eslint-disable-next-line import/no-cycle
import createConnectionAndParams from "./connection/create-connection-and-params";
import { createOffsetLimitStr } from "../schema/pagination";
import mapToDbProperty from "../utils/map-to-db-property";
import { createFieldAggregation } from "./field-aggregations/create-field-aggregation";

interface Res {
    projection: string[];
    params: any;
    meta: ProjectionMeta;
}

interface ProjectionMeta {
    authValidateStrs?: string[];
    connectionFields?: ResolveTree[];
    interfaceFields?: ResolveTree[];
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
    function reducer(res: Res, [key, field]: [string, ResolveTree]): Res {
        let param = "";
        if (chainStr) {
            param = `${chainStr}_${key}`;
        } else {
            param = `${varName}_${key}`;
        }

        const whereInput = field.args.where as GraphQLWhereArg;
        const optionsInput = field.args.options as GraphQLOptionsArg;
        const fieldFields = (field.fieldsByTypeName as unknown) as FieldsByTypeName;
        const cypherField = node.cypherFields.find((x) => x.fieldName === field.name);
        const relationField = node.relationFields.find((x) => x.fieldName === field.name);
        const connectionField = node.connectionFields.find((x) => x.fieldName === field.name);
        const pointField = node.pointFields.find((x) => x.fieldName === field.name);
        const temporalField = node.temporalFields.find((x) => x.fieldName === field.name);
        const authableField = node.authableFields.find((x) => x.fieldName === field.name);

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
            const projectionAuthStrs: string[] = [];
            const unionWheres: string[] = [];
            let projectionStr = "";

            const isArray = cypherField.typeMeta.array;

            const isPrimitive = ["ID", "String", "Boolean", "Float", "Int", "DateTime", "BigInt"].includes(
                cypherField.typeMeta.name
            );
            const isEnum = context.neoSchema.document.definitions.find(
                (x) => x.kind === "EnumTypeDefinition" && x.name.value === cypherField.typeMeta.name
            );
            const isScalar = context.neoSchema.document.definitions.find(
                (x) => x.kind === "ScalarTypeDefinition" && x.name.value === cypherField.typeMeta.name
            );

            const referenceNode = context.neoSchema.nodes.find((x) => x.name === cypherField.typeMeta.name);
            const unions = context.neoSchema.document.definitions.filter(
                (x) => x.kind === "UnionTypeDefinition"
            ) as UnionTypeDefinitionNode[];
            const referenceUnion = unions.find((u) => u.name.value === cypherField.typeMeta.name);

            if (referenceNode) {
                const recurse = createProjectionAndParams({
                    fieldsByTypeName: fieldFields,
                    node: referenceNode || node,
                    context,
                    varName: `${varName}_${key}`,
                    chainStr: param,
                });
                const [str, p, meta] = recurse;
                projectionStr = str;
                res.params = { ...res.params, ...p };
                if (meta?.authValidateStrs?.length) {
                    projectionAuthStrs.push(meta.authValidateStrs.join(" AND "));
                }
            }

            if (referenceUnion) {
                const headStrs: string[] = [];
                const referencedNodes =
                    referenceUnion?.types
                        ?.map((u) => context.neoSchema.nodes.find((n) => n.name === u.name.value))
                        ?.filter((b) => b !== undefined)
                        ?.filter((n) => Object.keys(fieldFields).includes(n?.name ?? "")) || [];

                referencedNodes.forEach((refNode) => {
                    if (refNode) {
                        const labelsStatements = refNode
                            .getLabels(context)
                            .map((label) => `"${label}" IN labels(${varName}_${key})`);
                        unionWheres.push(`(${labelsStatements.join("AND")})`);

                        const innerHeadStr: string[] = [
                            `[ ${varName}_${key} IN [${varName}_${key}] WHERE (${labelsStatements.join(" AND ")})`,
                        ];

                        if (fieldFields[refNode.name]) {
                            const [str, p, meta] = createProjectionAndParams({
                                fieldsByTypeName: fieldFields,
                                node: refNode,
                                context,
                                varName: `${varName}_${key}`,
                            });

                            innerHeadStr.push(
                                [
                                    `| ${varName}_${key} { __resolveType: "${refNode.name}", `,
                                    ...str.replace("{", "").split(""),
                                ].join("")
                            );
                            res.params = { ...res.params, ...p };

                            if (meta?.authValidateStrs?.length) {
                                projectionAuthStrs.push(meta.authValidateStrs.join(" AND "));
                            }
                        } else {
                            innerHeadStr.push(`| ${varName}_${key} { __resolveType: "${refNode.name}" } `);
                        }

                        innerHeadStr.push(`]`);

                        headStrs.push(innerHeadStr.join(" "));
                    }
                });

                projectionStr = `${!isArray ? "head(" : ""} ${headStrs.join(" + ")} ${!isArray ? ")" : ""}`;
            }

            const initApocParamsStrs = [
                ...(context.auth ? ["auth: $auth"] : []),
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
            res.params = {
                ...res.params,
                ...apocParams.params,
                ...(context.cypherParams ? { cypherParams: context.cypherParams } : {}),
            };

            const expectMultipleValues = referenceNode && cypherField.typeMeta.array ? "true" : "false";
            const apocWhere = projectionAuthStrs.length
                ? `WHERE apoc.util.validatePredicate(NOT(${projectionAuthStrs.join(
                      " AND "
                  )}), "${AUTH_FORBIDDEN_ERROR}", [0])`
                : "";
            const unionWhere = unionWheres.length ? `WHERE ${unionWheres.join(" OR ")}` : "";
            const apocParamsStr = `{this: ${chainStr || varName}${
                apocParams.strs.length ? `, ${apocParams.strs.join(", ")}` : ""
            }}`;
            const apocStr = `${!isPrimitive && !isEnum && !isScalar ? `${param} IN` : ""} apoc.cypher.runFirstColumn("${
                cypherField.statement
            }", ${apocParamsStr}, ${expectMultipleValues})${apocWhere ? ` ${apocWhere}` : ""}${
                unionWhere ? ` ${unionWhere} ` : ""
            }${projectionStr ? ` | ${!referenceUnion ? param : ""} ${projectionStr}` : ""}`;

            if (isPrimitive || isEnum || isScalar) {
                res.projection.push(`${key}: ${apocStr}`);

                return res;
            }

            if (cypherField.typeMeta.array) {
                res.projection.push(`${key}: [${apocStr}]`);

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
            const labels = referenceNode?.getLabelString(context);
            const nodeOutStr = `(${param}${labels})`;
            const isArray = relationField.typeMeta.array;

            if (relationField.interface) {
                if (!res.meta.interfaceFields) {
                    res.meta.interfaceFields = [];
                }

                const f = field;

                res.meta.interfaceFields.push(f);

                let offsetLimitStr = "";
                if (optionsInput) {
                    offsetLimitStr = createOffsetLimitStr({ offset: optionsInput.offset, limit: optionsInput.limit });
                }
                res.projection.push(`${f.alias}: ${!isArray ? "head(" : ""}collect(${f.alias})${offsetLimitStr}${!isArray ? ")" : ""}`);

                return res;
            }

            if (relationField.union) {
                const referenceNodes = context.neoSchema.nodes.filter(
                    (x) =>
                        relationField.union?.nodes?.includes(x.name) &&
                        (!field.args.where || Object.prototype.hasOwnProperty.call(field.args.where, x.name))
                );

                const unionStrs: string[] = [
                    `${key}: ${!isArray ? "head(" : ""} [${param} IN [(${
                        chainStr || varName
                    })${inStr}${relTypeStr}${outStr}(${param})`,
                    `WHERE ${referenceNodes
                        .map((x) => {
                            const labelsStatements = x
                                .getLabels(context)
                                .map((label) => `"${label}" IN labels(${param})`);
                            return `(${labelsStatements.join(" AND ")})`;
                        })
                        .join(" OR ")}`,
                    `| head(`,
                ];

                const headStrs: string[] = referenceNodes.map((refNode) => {
                    const labelsStatements = refNode
                        .getLabels(context)
                        .map((label) => `"${label}" IN labels(${param})`);
                    const innerHeadStr: string[] = [
                        `[ ${param} IN [${param}] WHERE (${labelsStatements.join(" AND ")})`,
                    ];

                    // Extract interface names implemented by reference node
                    const refNodeInterfaceNames = refNode.interfaces.map(
                        (implementedInterface) => implementedInterface.name.value
                    );

                    // Determine if there are any fields to project
                    const hasFields = Object.keys(field.fieldsByTypeName).some((fieldByTypeName) =>
                        [refNode.name, ...refNodeInterfaceNames].includes(fieldByTypeName)
                    );

                    if (hasFields) {
                        const recurse = createProjectionAndParams({
                            fieldsByTypeName: field.fieldsByTypeName,
                            node: refNode,
                            context,
                            varName: param,
                        });

                        const nodeWhereAndParams = createNodeWhereAndParams({
                            whereInput: field.args.where ? field.args.where[refNode.name] : field.args.where,
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
                unionStrs.push(`) ] WHERE ${param} IS NOT NULL]`);

                if (optionsInput) {
                    const offsetLimit = createOffsetLimitStr({
                        offset: optionsInput.offset,
                        limit: optionsInput.limit,
                    });
                    if (offsetLimit) {
                        unionStrs.push(offsetLimit);
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
                const offsetLimit = createOffsetLimitStr({ offset: optionsInput.offset, limit: optionsInput.limit });

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

                    nestedQuery = `${key}: apoc.coll.sortMulti([ ${innerStr} ], [${sorts.join(", ")}])${offsetLimit}`;
                } else {
                    nestedQuery = `${key}: ${!isArray ? "head(" : ""}[ ${innerStr} ]${offsetLimit}${
                        !isArray ? ")" : ""
                    }`;
                }
            } else {
                nestedQuery = `${key}: ${!isArray ? "head(" : ""}[ ${innerStr} ]${!isArray ? ")" : ""}`;
            }

            res.projection.push(nestedQuery);

            return res;
        }

        const aggregationFieldProjection = createFieldAggregation({
            context,
            nodeLabel: chainStr || varName,
            node,
            field,
        });

        if (aggregationFieldProjection) {
            res.projection.push(`${key}: ${aggregationFieldProjection.query}`);
            res.params = { ...res.params, ...aggregationFieldProjection.params };
            return res;
        }

        if (connectionField) {
            if (!inRelationshipProjection) {
                if (!res.meta.connectionFields) {
                    res.meta.connectionFields = [];
                }

                res.meta.connectionFields.push(field);
                res.projection.push(literalElements ? `${field.alias}: ${field.alias}` : `${field.alias}`);

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
                `${field.name}: apoc.cypher.runFirstColumn("${connection[0].replace(/("|')/g, "\\$1")} RETURN ${
                    field.name
                }", ${runFirstColumnParams}, false)`
            );
            res.params = { ...res.params, ...connection[1] };
            return res;
        }

        if (pointField) {
            res.projection.push(createPointElement({ resolveTree: field, field: pointField, variable: varName }));
        } else if (temporalField?.typeMeta.name === "DateTime") {
            res.projection.push(createDatetimeElement({ resolveTree: field, field: temporalField, variable: varName }));
        } else {
            // If field is aliased, rename projected field to alias and set to varName.fieldName
            // e.g. RETURN varname { .fieldName } -> RETURN varName { alias: varName.fieldName }
            let aliasedProj: string;

            if (field.alias !== field.name) {
                aliasedProj = `${field.alias}: ${varName}`;
            } else if (literalElements) {
                aliasedProj = `${key}: ${varName}`;
            } else {
                aliasedProj = "";
            }

            // In the case of using the @alias directive (map a GraphQL field to a db prop)
            // the output will be RETURN varName {GraphQLfield: varName.dbAlias}
            const dbFieldName = mapToDbProperty(node, field.name);
            if (dbFieldName !== field.name) {
                aliasedProj = !aliasedProj ? `${key}: ${varName}` : aliasedProj;
            }

            res.projection.push(`${aliasedProj}.${dbFieldName}`);
        }

        return res;
    }

    // Include fields of implemented interfaces to allow for fragments on interfaces
    // cf. https://github.com/neo4j/graphql/issues/476

    const fields = (node.interfaces ?? [])
        // Map over the implemented interfaces of the node and extract the names
        .map((implementedInterface) => implementedInterface.name.value)
        // Combine the fields of the interfaces...
        .reduce(
            (prevFields, interfaceName) => ({ ...prevFields, ...fieldsByTypeName[interfaceName] }),
            // with the fields of the node
            fieldsByTypeName[node.name]
        );

    const { projection, params, meta } = Object.entries(fields).reduce(reducer, {
        projection: resolveType ? [`__resolveType: "${node.name}"`] : [],
        params: {},
        meta: {},
    });

    return [`{ ${projection.join(", ")} }`, params, meta];
}

export default createProjectionAndParams;
