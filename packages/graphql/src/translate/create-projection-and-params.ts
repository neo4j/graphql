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
import { ResolveTree } from "graphql-parse-resolve-info";
import { mergeDeep } from "@graphql-tools/utils";
import { Node } from "../classes";
import createWhereAndParams from "./where/create-where-and-params";
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
import { getRelationshipDirection } from "./cypher-builder/get-relationship-direction";
import { generateMissingOrAliasedFields, filterFieldsInSelection } from "./utils/resolveTree";
import { removeDuplicates } from "../utils/utils";

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
        operations: "READ",
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
        operations: "READ",
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
    resolveTree,
    node,
    context,
    chainStr,
    varName,
    literalElements,
    resolveType,
    inRelationshipProjection,
}: {
    resolveTree: ResolveTree;
    node: Node;
    context: Context;
    chainStr?: string;
    varName: string;
    literalElements?: boolean;
    resolveType?: boolean;
    inRelationshipProjection?: boolean;
}): [string, any, ProjectionMeta?] {
    function reducer(res: Res, field: ResolveTree): Res {
        const alias = field.alias;
        let param = "";
        if (chainStr) {
            param = `${chainStr}_${alias}`;
        } else {
            param = `${varName}_${alias}`;
        }

        const whereInput = field.args.where as GraphQLWhereArg;
        const optionsInput = (field.args.options || {}) as GraphQLOptionsArg;
        const fieldFields = field.fieldsByTypeName;
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
                    operations: "READ",
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

            const referenceNode = context.neoSchema.nodes.find((x) => x.name === cypherField.typeMeta.name);
            const unions = context.neoSchema.document.definitions.filter(
                (x) => x.kind === "UnionTypeDefinition"
            ) as UnionTypeDefinitionNode[];
            const referenceUnion = unions.find((u) => u.name.value === cypherField.typeMeta.name);

            if (referenceNode) {
                const recurse = createProjectionAndParams({
                    resolveTree: field,
                    node: referenceNode || node,
                    context,
                    varName: `${varName}_${alias}`,
                    chainStr: param,
                    inRelationshipProjection: true,
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
                            .map((label) => `"${label}" IN labels(${varName}_${alias})`);
                        unionWheres.push(`(${labelsStatements.join("AND")})`);

                        const innerHeadStr: string[] = [
                            `[ ${varName}_${alias} IN [${varName}_${alias}] WHERE (${labelsStatements.join(" AND ")})`,
                        ];

                        if (fieldFields[refNode.name]) {
                            const [str, p, meta] = createProjectionAndParams({
                                resolveTree: field,
                                node: refNode,
                                context,
                                varName: `${varName}_${alias}`,
                            });

                            innerHeadStr.push(
                                [
                                    `| ${varName}_${alias} { __resolveType: "${refNode.name}", `,
                                    ...str.replace("{", "").split(""),
                                ].join("")
                            );
                            res.params = { ...res.params, ...p };

                            if (meta?.authValidateStrs?.length) {
                                projectionAuthStrs.push(meta.authValidateStrs.join(" AND "));
                            }
                        } else {
                            innerHeadStr.push(`| ${varName}_${alias} { __resolveType: "${refNode.name}" } `);
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

            // Null default argument values are not passed into the resolve tree therefore these are not being passed to
            // `apocParams` below causing a runtime error when executing.
            const nullArgumentValues = cypherField.arguments.reduce(
                (r, argument) => ({
                    ...r,
                    ...{ [argument.name.value]: null },
                }),
                {}
            );

            const apocParams = Object.entries({ ...nullArgumentValues, ...field.args }).reduce(
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
            const apocStr = `${
                !cypherField.isScalar && !cypherField.isEnum ? `${param} IN` : ""
            } apoc.cypher.runFirstColumn("${cypherField.statement}", ${apocParamsStr}, ${expectMultipleValues})${
                apocWhere ? ` ${apocWhere}` : ""
            }${unionWhere ? ` ${unionWhere} ` : ""}${
                projectionStr ? ` | ${!referenceUnion ? param : ""} ${projectionStr}` : ""
            }`;

            if (cypherField.isScalar || cypherField.isEnum) {
                res.projection.push(`${alias}: ${apocStr}`);

                return res;
            }

            if (cypherField.typeMeta.array) {
                res.projection.push(`${alias}: [${apocStr}]`);

                return res;
            }

            res.projection.push(`${alias}: head([${apocStr}])`);

            return res;
        }

        if (relationField) {
            const referenceNode = context.neoSchema.nodes.find((x) => x.name === relationField.typeMeta.name) as Node;

            if (referenceNode?.queryOptions) {
                optionsInput.limit = referenceNode.queryOptions.getLimit(optionsInput.limit);
            }

            const nodeMatchStr = `(${chainStr || varName})`;
            const relTypeStr = `[:${relationField.type}]`;
            const labels = referenceNode?.getLabelString(context);
            const nodeOutStr = `(${param}${labels})`;
            const isArray = relationField.typeMeta.array;

            const { inStr, outStr } = getRelationshipDirection(relationField, field.args);

            if (relationField.interface) {
                if (!res.meta.interfaceFields) {
                    res.meta.interfaceFields = [];
                }

                res.meta.interfaceFields.push(field);

                let offsetLimitStr = "";
                if (optionsInput) {
                    offsetLimitStr = createOffsetLimitStr({
                        offset: optionsInput.offset,
                        limit: optionsInput.limit,
                    });

                    if (optionsInput.sort) {
                        const sorts = optionsInput.sort.reduce(sortReducer, []);

                        res.projection.push(
                            `${field.alias}: apoc.coll.sortMulti(collect(${field.alias}), [${sorts.join(
                                ", "
                            )}])${offsetLimitStr}`
                        );
                        return res;
                    }
                }

                res.projection.push(
                    `${field.alias}: ${!isArray ? "head(" : ""}collect(${field.alias})${offsetLimitStr}${
                        !isArray ? ")" : ""
                    }`
                );

                return res;
            }

            if (relationField.union) {
                const referenceNodes = context.neoSchema.nodes.filter(
                    (x) =>
                        relationField.union?.nodes?.includes(x.name) &&
                        (!field.args.where || Object.prototype.hasOwnProperty.call(field.args.where, x.name))
                );

                const unionStrs: string[] = [
                    `${alias}: ${!isArray ? "head(" : ""} [${param} IN [(${
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
                            resolveTree: field,
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
                resolveTree: field,
                node: referenceNode || node,
                context,
                varName: `${varName}_${alias}`,
                chainStr: param,
                inRelationshipProjection: true,
            });
            [projectionStr] = recurse;
            res.params = { ...res.params, ...recurse[1] };

            let whereStr = "";
            const nodeWhereAndParams = createNodeWhereAndParams({
                whereInput,
                varName: `${varName}_${alias}`,
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
            let nestedQuery: string;

            if (optionsInput) {
                const offsetLimit = createOffsetLimitStr({ offset: optionsInput.offset, limit: optionsInput.limit });

                if (optionsInput.sort) {
                    const sorts = optionsInput.sort.reduce(sortReducer, []);

                    nestedQuery = `${alias}: apoc.coll.sortMulti([ ${innerStr} ], [${sorts.join(", ")}])${offsetLimit}`;
                } else {
                    nestedQuery = `${alias}: ${!isArray ? "head(" : ""}[ ${innerStr} ]${offsetLimit}${
                        !isArray ? ")" : ""
                    }`;
                }
            } else {
                nestedQuery = `${alias}: ${!isArray ? "head(" : ""}[ ${innerStr} ]${!isArray ? ")" : ""}`;
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
            res.projection.push(`${alias}: ${aggregationFieldProjection.query}`);
            res.params = { ...res.params, ...aggregationFieldProjection.params };
            return res;
        }

        if (connectionField) {
            if (!inRelationshipProjection) {
                if (!res.meta.connectionFields) {
                    res.meta.connectionFields = [];
                }

                res.meta.connectionFields.push(field);
                res.projection.push(literalElements ? `${alias}: ${alias}` : `${alias}`);

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
            const runFirstColumnParams = [
                ...[`${chainStr}: ${chainStr}`],
                ...(connectionParamName ? [`${connectionParamName}: $${connectionParamName}`] : []),
                ...(context.auth ? ["auth: $auth"] : []),
                ...(context.cypherParams ? ["cypherParams: $cypherParams"] : []),
            ];

            res.projection.push(
                `${field.name}: apoc.cypher.runFirstColumn("${connection[0].replace(/("|')/g, "\\$1")} RETURN ${
                    field.name
                }", { ${runFirstColumnParams.join(", ")} }, false)`
            );
            res.params = { ...res.params, ...connection[1] };
            return res;
        }

        if (pointField) {
            res.projection.push(createPointElement({ resolveTree: field, field: pointField, variable: varName }));
        } else if (temporalField?.typeMeta.name === "DateTime") {
            res.projection.push(createDatetimeElement({ resolveTree: field, field: temporalField, variable: varName }));
        } else {
            // In the case of using the @alias directive (map a GraphQL field to a db prop)
            // the output will be RETURN varName {GraphQLfield: varName.dbAlias}
            const dbFieldName = mapToDbProperty(node, field.name);

            // If field is aliased, rename projected field to alias and set to varName.fieldName
            // e.g. RETURN varname { .fieldName } -> RETURN varName { alias: varName.fieldName }
            let aliasedProj: string;

            if (alias !== field.name || dbFieldName !== field.name || literalElements) {
                aliasedProj = `${alias}: ${varName}`;
            } else {
                aliasedProj = "";
            }

            res.projection.push(`${aliasedProj}.${dbFieldName}`);
        }

        return res;
    }

    // Include fields of implemented interfaces to allow for fragments on interfaces
    // cf. https://github.com/neo4j/graphql/issues/476
    const mergedSelectedFields: Record<string, ResolveTree> = mergeDeep<Record<string, ResolveTree>[]>([
        resolveTree.fieldsByTypeName[node.name],
        ...node.interfaces.map((i) => resolveTree.fieldsByTypeName[i.name.value]),
    ]);

    // Merge fields for final projection to account for multiple fragments
    // cf. https://github.com/neo4j/graphql/issues/920
    const mergedFields: Record<string, ResolveTree> = mergeDeep<Record<string, ResolveTree>[]>([
        mergedSelectedFields,
        generateMissingOrAliasedSortFields({ selection: mergedSelectedFields, resolveTree }),
        generateMissingOrAliasedRequiredFields({ selection: mergedSelectedFields, node }),
    ]);

    const { projection, params, meta } = Object.values(mergedFields).reduce(reducer, {
        projection: resolveType ? [`__resolveType: "${node.name}"`] : [],
        params: {},
        meta: {},
    });

    return [`{ ${projection.join(", ")} }`, params, meta];
}

function sortReducer(s: string[], sort: GraphQLSortArg) {
    return [
        ...s,
        ...Object.entries(sort).map(([fieldName, direction]) => {
            if (direction === "DESC") {
                return `'${fieldName}'`;
            }

            return `'^${fieldName}'`;
        }),
    ];
}

export default createProjectionAndParams;

// Generates any missing fields required for sorting
const generateMissingOrAliasedSortFields = ({
    selection,
    resolveTree,
}: {
    selection: Record<string, ResolveTree>;
    resolveTree: ResolveTree;
}): Record<string, ResolveTree> => {
    const sortFieldNames = removeDuplicates(
        ((resolveTree.args.options as GraphQLOptionsArg)?.sort ?? []).map(Object.keys).flat()
    );

    return generateMissingOrAliasedFields({ fieldNames: sortFieldNames, selection });
};

// Generated any missing fields required for custom resolvers
const generateMissingOrAliasedRequiredFields = ({
    node,
    selection,
}: {
    node: Node;
    selection: Record<string, ResolveTree>;
}): Record<string, ResolveTree> => {
    const requiredFields = removeDuplicates(
        filterFieldsInSelection({ fields: node.ignoredFields, selection })
            .map((f) => f.requiredFields)
            .flat()
    );

    return generateMissingOrAliasedFields({ fieldNames: requiredFields, selection });
};
