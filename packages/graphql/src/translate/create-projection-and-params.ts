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

import { ResolveTree } from "graphql-parse-resolve-info";
import { GraphQLUnionType } from "graphql";
import { mergeDeep } from "@graphql-tools/utils";
import { Node } from "../classes";
import { GraphQLOptionsArg, Context } from "../types";
import createAuthAndParams from "./create-auth-and-params";
import { AUTH_FORBIDDEN_ERROR } from "../constants";
import { createDatetimeElement } from "./projection/elements/create-datetime-element";
import createPointElement from "./projection/elements/create-point-element";
// eslint-disable-next-line import/no-cycle
import createRelatedFieldSubqueryAndParams from "./create-related-field-subquery-and-params";
// eslint-disable-next-line import/no-cycle
import createRelationshipFieldSubqueryAndParams from "./create-relationship-field-subquery-and-params";
// eslint-disable-next-line import/no-cycle
import createConnectionAndParams from "./connection/create-connection-and-params";
import mapToDbProperty from "../utils/map-to-db-property";
import { createFieldAggregation } from "./field-aggregations/create-field-aggregation";
import { generateMissingOrAliasedFields, filterFieldsInSelection } from "./utils/resolveTree";
import { removeDuplicates } from "../utils/utils";

interface Res {
    projection: string[];
    params: any;
    meta: ProjectionMeta;
}

interface ProjectionMeta {
    authValidateStrs: string[];
    connectionFields?: ResolveTree[];
    interfaceFields?: ResolveTree[];
    subQueries: string[];
}

function createProjectionAndParams({
    resolveTree,
    node,
    context,
    chainStr,
    varName,
    literalElements,
    resolveType,
}: {
    resolveTree: ResolveTree;
    node: Node;
    context: Context;
    chainStr?: string;
    varName: string;
    literalElements?: boolean;
    resolveType?: boolean;
    inRelationshipProjection?: boolean;
}): [string, Record<string, unknown>, ProjectionMeta] {
    function reducer(res: Res, field: ResolveTree): Res {
        const alias = field.alias;
        let param = "";
        if (chainStr) {
            param = `${chainStr}_${alias}`;
        } else {
            param = `${varName}_${alias}`;
        }

        const fieldFields = field.fieldsByTypeName;
        const computedField = node.computedFields.find((x) => x.fieldName === field.name);
        const cypherField = node.cypherFields.find((x) => x.fieldName === field.name);
        const relatedField = node.relatedFields.find((x) => x.fieldName === field.name);
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

        if (computedField) {
            const subqueryStatement = computedField.statement
                .replace(/\$\$source/, chainStr || varName)
                .replace(/\$\$field/, param);

            const subquery = ["CALL {", `WITH ${chainStr || varName}`, subqueryStatement, "}"].join("\n");

            res.meta.subQueries.push(subquery);
            res.projection.push(`${alias}: ${param}`);

            return res;
        }

        if (cypherField) {
            const projectionAuthStrs: string[] = [];
            const unionWheres: string[] = [];
            let projectionStr = "";

            const isArray = cypherField.typeMeta.array;

            const graphqlType = context.schema.getType(cypherField.typeMeta.name);

            const referenceNode = context.nodes.find((x) => x.name === cypherField.typeMeta.name);

            const referenceUnion = graphqlType instanceof GraphQLUnionType ? graphqlType.astNode : undefined;

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
                        ?.map((u) => context.nodes.find((n) => n.name === u.name.value))
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

        if (relatedField) {
            const isArray = relatedField.typeMeta.array;

            const [relatedSubquery, relatedSubqueryParams] = createRelatedFieldSubqueryAndParams({
                resolveTree: field,
                field: relatedField,
                context,
                nodeVariable: chainStr || varName,
            });

            res.meta.subQueries.push(relatedSubquery);
            res.params = mergeDeep([res.params, relatedSubqueryParams]);
            res.projection.push(`${alias}: ${!isArray ? "head(" : ""}collect(${param})${!isArray ? ")" : ""}`);

            return res;
        }

        if (relationField) {
            const isArray = relationField.typeMeta.array;

            const [relationshipSubquery, relationshipSubqueryParams] = createRelationshipFieldSubqueryAndParams({
                resolveTree: field,
                field: relationField,
                context,
                nodeVariable: chainStr || varName,
            });

            res.meta.subQueries.push(relationshipSubquery);
            res.params = mergeDeep([res.params, relationshipSubqueryParams]);
            res.projection.push(`${alias}: ${!isArray ? "head(" : ""}collect(${param})${!isArray ? ")" : ""}`);

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
            const [connectionSubquery, connectionSubqueryParams] = createConnectionAndParams({
                resolveTree: field,
                field: connectionField,
                context,
                nodeVariable: varName,
            });

            res.meta.subQueries.push(connectionSubquery);
            res.params = mergeDeep([res.params, connectionSubqueryParams]);
            res.projection.push(`${alias}: ${param}`);

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
        meta: {
            authValidateStrs: [],
            subQueries: [],
        },
    });

    return [`{ ${projection.join(", ")} }`, params, meta];
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
        filterFieldsInSelection({ fields: node.customFields, selection })
            .map((f) => f.requiredFields)
            .flat()
    );

    return generateMissingOrAliasedFields({ fieldNames: requiredFields, selection });
};
