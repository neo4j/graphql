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

import type { FieldsByTypeName, ResolveTree } from "graphql-parse-resolve-info";
import { GraphQLUnionType } from "graphql";
import { mergeDeep } from "@graphql-tools/utils";
import type { Node } from "../classes";
import type {
    GraphQLOptionsArg,
    GraphQLSortArg,
    GraphQLWhereArg,
    Context,
    ConnectionField,
    RelationField,
    CypherField,
} from "../types";
import { createAuthAndParams } from "./create-auth-and-params";
import { AUTH_FORBIDDEN_ERROR } from "../constants";
import { createDatetimeElement } from "./projection/elements/create-datetime-element";
import createPointElement from "./projection/elements/create-point-element";
import mapToDbProperty from "../utils/map-to-db-property";
import { createFieldAggregation } from "./field-aggregations/create-field-aggregation";
import { addGlobalIdField } from "../utils/global-node-projection";
import { getRelationshipDirection } from "../utils/get-relationship-direction";
import { generateMissingOrAliasedFields, filterFieldsInSelection, generateProjectionField } from "./utils/resolveTree";
import { removeDuplicates } from "../utils/utils";
import * as CypherBuilder from "./cypher-builder/CypherBuilder";
import { createProjectionSubquery } from "./projection/subquery/create-projection-subquery";
import { collectUnionSubqueriesResults } from "./projection/subquery/collect-union-subqueries-results";
// eslint-disable-next-line import/no-cycle
import createInterfaceProjectionAndParams from "./create-interface-projection-and-params";
// eslint-disable-next-line import/no-cycle
import { createConnectionClause } from "./connection-clause/create-connection-clause";

interface Res {
    projection: string[];
    params: any;
    meta: ProjectionMeta;
    subqueries: Array<CypherBuilder.Clause>;
}

export interface ProjectionMeta {
    authValidateStrs?: string[];
    cypherSortFields?: { alias: string; apocStr: string }[];
}

export type ProjectionResult = {
    projection: string;
    params: Record<string, any>;
    meta: ProjectionMeta;
    subqueries: Array<CypherBuilder.Clause>;
};

export default function createProjectionAndParams({
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
}): ProjectionResult {
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
            return translateCypherProjection({
                context,
                cypherField,
                field,
                node,
                varName,
                alias,
                param,
                chainStr: chainStr as any,
                res,
            });
        }

        if (relationField) {
            const referenceNode = context.nodes.find((x) => x.name === relationField.typeMeta.name);

            if (referenceNode?.queryOptions) {
                optionsInput.limit = referenceNode.queryOptions.getLimit(optionsInput.limit);
            }

            if (relationField.interface) {
                const interfaceResolveTree = field;

                const prevRelationshipFields: string[] = [];
                const relationshipField = node.relationFields.find(
                    (x) => x.fieldName === interfaceResolveTree.name
                ) as RelationField;
                const interfaceProjection = createInterfaceProjectionAndParams({
                    resolveTree: interfaceResolveTree,
                    field: relationshipField,
                    context,
                    nodeVariable: varName,
                    withVars: prevRelationshipFields,
                });
                res.subqueries.push(interfaceProjection);
                res.projection.push(`${field.alias}: ${varName}_${field.name}`);

                return res;
            }

            if (relationField.union) {
                const referenceNodes = context.nodes.filter(
                    (x) =>
                        relationField.union?.nodes?.includes(x.name) &&
                        (!field.args.where || Object.prototype.hasOwnProperty.call(field.args.where, x.name))
                );

                const parentNode = new CypherBuilder.NamedNode(chainStr || varName);

                const unionSubqueries: CypherBuilder.Clause[] = [];
                const unionVariableName = `${param}`;
                for (const refNode of referenceNodes) {
                    const refNodeInterfaceNames = node.interfaces.map(
                        (implementedInterface) => implementedInterface.name.value
                    );
                    const hasFields = Object.keys(field.fieldsByTypeName).some((fieldByTypeName) =>
                        [refNode.name, ...refNodeInterfaceNames].includes(fieldByTypeName)
                    );
                    const recurse = createProjectionAndParams({
                        resolveTree: field,
                        node: refNode,
                        context,
                        varName: `${varName}_${alias}`,
                        chainStr: unionVariableName,
                    });
                    res.params = { ...res.params, ...recurse.params };

                    const direction = getRelationshipDirection(relationField, field.args);

                    let nestedProjection = [
                        ` { __resolveType: "${refNode.name}", `,
                        recurse.projection.replace("{", ""),
                    ].join("");

                    if (!hasFields) {
                        nestedProjection = `{ __resolveType: "${refNode.name}" }`;
                    }

                    const subquery = createProjectionSubquery({
                        parentNode,
                        whereInput: field.args.where ? field.args.where[refNode.name] : field.args.where,
                        node: refNode,
                        context,
                        alias: unionVariableName,
                        nestedProjection,
                        nestedSubqueries: recurse.subqueries,
                        relationField,
                        relationshipDirection: direction,
                        optionsInput,
                        authValidateStrs: recurse.meta?.authValidateStrs,
                        addSkipAndLimit: false,
                        collect: false,
                    });

                    const unionWith = new CypherBuilder.With(parentNode);
                    unionSubqueries.push(CypherBuilder.concat(unionWith, subquery));
                }

                const unionClause = new CypherBuilder.Union(...unionSubqueries);

                const collectAndLimitStatements = collectUnionSubqueriesResults({
                    resultVariable: new CypherBuilder.NamedNode(unionVariableName),
                    optionsInput,
                    isArray: Boolean(relationField.typeMeta.array),
                });

                const unionAndSort = CypherBuilder.concat(
                    new CypherBuilder.Call(unionClause),
                    collectAndLimitStatements
                );
                res.subqueries.push(new CypherBuilder.Call(unionAndSort).with(parentNode));
                res.projection.push(`${alias}: ${unionVariableName}`);

                return res;
            }

            const recurse = createProjectionAndParams({
                resolveTree: field,
                node: referenceNode || node,
                context,
                varName: `${varName}_${alias}`,
                chainStr: param,
            });
            res.params = { ...res.params, ...recurse.params };

            const parentNode = new CypherBuilder.NamedNode(chainStr || varName);

            const direction = getRelationshipDirection(relationField, field.args);
            const subquery = createProjectionSubquery({
                parentNode,
                whereInput,
                node: referenceNode as Node, // TODO: improve typings
                context,
                alias: param,
                nestedProjection: recurse.projection,
                nestedSubqueries: recurse.subqueries,
                relationField,
                relationshipDirection: direction,
                optionsInput,
                authValidateStrs: recurse.meta?.authValidateStrs,
            });
            res.subqueries.push(new CypherBuilder.Call(subquery).with(parentNode));
            res.projection.push(`${alias}: ${param}`);

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
            const matchedConnectionField = node.connectionFields.find(
                (x) => x.fieldName === field.name
            ) as ConnectionField;

            const connectionClause = new CypherBuilder.Call(
                createConnectionClause({
                    resolveTree: field,
                    field: matchedConnectionField,
                    context,
                    nodeVariable: varName,
                })
            ).with(new CypherBuilder.NamedNode(varName));

            const connection = connectionClause.build(`${varName}_connection_${field.alias}`); // TODO: remove build from here
            const stupidParams = connection.params;

            const connectionSubClause = new CypherBuilder.RawCypher((_env) => {
                // TODO: avoid REPLACE_ME in params and return them here

                return [connection.cypher, {}];
            });
            res.subqueries.push(connectionSubClause);
            res.projection.push(`${field.alias}: ${field.alias}`);

            res.params = { ...res.params, ...stupidParams };
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

    let existingProjection = { ...resolveTree.fieldsByTypeName[node.name] };

    // If we have a query for a globalNode and it includes the "id" field
    // we modify the projection to include the appropriate db fields

    if (node.isGlobalNode && existingProjection.id) {
        existingProjection = addGlobalIdField(existingProjection, node.getGlobalIdField());
    }

    // Fields of reference node to sort on. Since sorting is done on projection, if field is not selected
    // sort will fail silently

    const sortFieldNames = ((resolveTree.args.options as GraphQLOptionsArg)?.sort ?? []).map(Object.keys).flat();

    // Iterate over fields name in sort argument
    const nodeFields = sortFieldNames.reduce(
        (acc, sortFieldName) => ({
            ...acc,
            // If fieldname is not found in fields of selection set
            ...(!Object.values(existingProjection).find((field) => field.name === sortFieldName)
                ? // generate a basic resolve tree
                  generateProjectionField({ name: sortFieldName })
                : {}),
        }),
        // and add it to existing fields for projection
        existingProjection
    );

    // Include fields of implemented interfaces to allow for fragments on interfaces
    // cf. https://github.com/neo4j/graphql/issues/476
    const mergedSelectedFields: Record<string, ResolveTree> = mergeDeep<Record<string, ResolveTree>[]>([
        nodeFields,
        ...node.interfaces.map((i) => resolveTree.fieldsByTypeName[i.name.value]),
    ]);

    // Merge fields for final projection to account for multiple fragments
    // cf. https://github.com/neo4j/graphql/issues/920
    const mergedFields: Record<string, ResolveTree> = mergeDeep<Record<string, ResolveTree>[]>([
        mergedSelectedFields,
        generateMissingOrAliasedSortFields({ selection: mergedSelectedFields, resolveTree }),
        generateMissingOrAliasedRequiredFields({ selection: mergedSelectedFields, node }),
    ]);

    const { projection, params, meta, subqueries } = Object.values(mergedFields).reduce(reducer, {
        projection: resolveType ? [`__resolveType: "${node.name}"`] : [],
        params: {},
        meta: {},
        subqueries: [],
    });

    return {
        projection: `{ ${projection.join(", ")} }`,
        params,
        meta,
        subqueries,
    };
}

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
        filterFieldsInSelection({ fields: node.computedFields, selection })
            .map((f) => f.requiredFields)
            .flat()
    );

    return generateMissingOrAliasedFields({ fieldNames: requiredFields, selection });
};

// TRANSLATECYPHER
function translateCypherProjection({
    context,
    cypherField,
    field,
    node,
    varName,
    alias,
    param,
    chainStr,
    res,
}: {
    context: Context;
    cypherField: CypherField;
    field: ResolveTree;
    node: Node;
    chainStr: string;
    alias: string;
    varName: string;
    param: string;
    res: Res;
}) {
    const projectionAuthStrs: string[] = [];
    const unionWheres: string[] = [];
    let projectionStr = "";

    const isArray = cypherField.typeMeta.array;
    const fieldFields = field.fieldsByTypeName;

    const graphqlType = context.schema.getType(cypherField.typeMeta.name);

    const referenceNode = context.nodes.find((x) => x.name === cypherField.typeMeta.name);

    const referenceUnion = graphqlType instanceof GraphQLUnionType ? graphqlType.astNode : undefined;

    const subqueries: CypherBuilder.Clause[] = [];
    if (referenceNode) {
        const {
            projection: str,
            params: p,
            meta,
            subqueries: nestedSubqueries,
        } = createProjectionAndParams({
            resolveTree: field,
            node: referenceNode || node,
            context,
            varName: param,
            chainStr: param,
        });

        projectionStr = `${param} ${str}`;
        res.params = { ...res.params, ...p };
        subqueries.push(...nestedSubqueries);
        if (meta?.authValidateStrs?.length) {
            projectionAuthStrs.push(meta.authValidateStrs.join(" AND "));
        }
    }

    if (referenceUnion) {
        const fieldFieldsKeys = Object.keys(fieldFields);
        const hasMultipleFieldFields = fieldFieldsKeys.length > 1;

        let referencedNodes =
            referenceUnion?.types
                ?.map((u) => context.nodes.find((n) => n.name === u.name.value))
                ?.filter((b) => b !== undefined) || [];
        if (hasMultipleFieldFields) {
            referencedNodes = referencedNodes?.filter((n) => fieldFieldsKeys.includes(n?.name ?? "")) || [];
        }

        const unionProjections: Array<{ predicate: string; projection: string }> = [];
        referencedNodes.forEach((refNode) => {
            if (refNode) {
                const labelsStatements = refNode.getLabels(context).map((label) => `${param}:\`${label}\``);
                unionWheres.push(`(${labelsStatements.join(" AND ")})`);

                if (fieldFields[refNode.name]) {
                    const {
                        projection: str,
                        params: p,
                        meta,
                    } = createProjectionAndParams({
                        resolveTree: field,
                        node: refNode,
                        context,
                        varName: param,
                    });

                    unionProjections.push({
                        projection: `{ __resolveType: "${refNode.name}", ${str.replace("{", "")}`,
                        predicate: labelsStatements.join(" AND "),
                    });

                    res.params = { ...res.params, ...p };

                    if (meta?.authValidateStrs?.length) {
                        projectionAuthStrs.push(meta.authValidateStrs.join(" AND "));
                    }
                } else {
                    unionProjections.push({
                        projection: `{ __resolveType: "${refNode.name}" }`,
                        predicate: labelsStatements.join(" AND "),
                    });
                }
            }
        });

        projectionStr = `CASE ${unionProjections
            .map(({ predicate, projection }) => `WHEN ${predicate} THEN ${param} ${projection}`)
            .join("\n")} END`;
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

    const expectMultipleValues = (referenceNode || referenceUnion) && cypherField.typeMeta.array;
    const apocWhere = projectionAuthStrs.length
        ? `WHERE apoc.util.validatePredicate(NOT (${projectionAuthStrs.join(" AND ")}), "${AUTH_FORBIDDEN_ERROR}", [0])`
        : "";
    const unionWhere = unionWheres.length ? `WHERE ${unionWheres.join(" OR ")}` : "";
    const apocParamsStr = `{this: ${chainStr || varName}${
        apocParams.strs.length ? `, ${apocParams.strs.join(", ")}` : ""
    }}`;

    const isProjectionStrEmpty = projectionStr.trim().length === 0;

    const apocStr = `apoc.cypher.runFirstColumn${expectMultipleValues ? "Many" : "Single"}("${
        cypherField.statement
    }", ${apocParamsStr})${apocWhere ? ` ${apocWhere}` : ""}`;

    const apocClause = new CypherBuilder.RawCypher(apocStr);

    const unionExpression = unionWhere
        ? CypherBuilder.concat(new CypherBuilder.With("*"), new CypherBuilder.RawCypher(`${unionWhere} `))
        : new CypherBuilder.RawCypher("");

    const unwindClause = new CypherBuilder.Unwind([apocClause, param]);
    const projectionExpression = new CypherBuilder.RawCypher(`${projectionStr}`);
    let returnData: CypherBuilder.Expr = !isProjectionStrEmpty
        ? projectionExpression
        : new CypherBuilder.NamedVariable(param);
    if (isArray) {
        returnData = CypherBuilder.collect(returnData);
    }
    const retClause = new CypherBuilder.Return([returnData, param]);
    const callSt = new CypherBuilder.Call(
        CypherBuilder.concat(unwindClause, unionExpression, ...subqueries, retClause)
    ).with(new CypherBuilder.NamedVariable(chainStr || varName));
    res.subqueries.push(callSt);

    const sortInput = (context.resolveTree.args.sort ??
        (context.resolveTree.args.options as any)?.sort ??
        []) as GraphQLSortArg[];
    const isSortArg = sortInput.find((obj) => Object.keys(obj)[0] === alias);
    if (isSortArg) {
        if (!res.meta.cypherSortFields) {
            res.meta.cypherSortFields = [];
        }

        res.meta.cypherSortFields.push({
            alias,
            apocStr,
        });
    }

    res.projection.push(`${alias}: ${`${param}`}`);
    return res;
}
