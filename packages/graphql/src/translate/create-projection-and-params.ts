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

import type { ResolveTree } from "graphql-parse-resolve-info";
import { mergeDeep } from "@graphql-tools/utils";
import Cypher from "@neo4j/cypher-builder";
import type { Node } from "../classes";
import type { GraphQLOptionsArg, GraphQLWhereArg, Context, GraphQLSortArg } from "../types";
import { createAuthAndParams } from "./create-auth-and-params";
import { createDatetimeElement } from "./projection/elements/create-datetime-element";
import createPointElement from "./projection/elements/create-point-element";
import mapToDbProperty from "../utils/map-to-db-property";
import { createFieldAggregation } from "./field-aggregations/create-field-aggregation";
import { addGlobalIdField } from "../utils/global-node-projection";
import { getRelationshipDirection } from "../utils/get-relationship-direction";
import { generateMissingOrAliasedFields, filterFieldsInSelection, generateProjectionField } from "./utils/resolveTree";
import { removeDuplicates } from "../utils/utils";
import { createProjectionSubquery } from "./projection/subquery/create-projection-subquery";
import { collectUnionSubqueriesResults } from "./projection/subquery/collect-union-subqueries-results";
import { createConnectionClause } from "./connection-clause/create-connection-clause";
import { translateCypherDirectiveProjection } from "./projection/subquery/translate-cypher-directive-projection";

interface Res {
    projection: string[];
    params: any;
    meta: ProjectionMeta;
    subqueries: Array<Cypher.Clause>;
    subqueriesBeforeSort: Array<Cypher.Clause>;
}

export interface ProjectionMeta {
    authValidateStrs?: string[];
    cypherSortFields?: string[];
}

export type ProjectionResult = {
    projection: string;
    params: Record<string, any>;
    meta: ProjectionMeta;
    subqueries: Array<Cypher.Clause>;
    subqueriesBeforeSort: Array<Cypher.Clause>;
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
            // TODO: move this to translate-top-level
            if (authableField.auth) {
                const allowAndParams = createAuthAndParams({
                    entity: authableField,
                    operations: "READ",
                    context,
                    allow: { parentNode: node, varName },
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
            return translateCypherDirectiveProjection({
                context,
                cypherField,
                field,
                node,
                alias,
                param,
                chainStr: chainStr || varName,
                res,
            });
        }

        if (relationField) {
            const referenceNode = context.nodes.find((x) => x.name === relationField.typeMeta.name);

            if (referenceNode?.queryOptions) {
                optionsInput.limit = referenceNode.queryOptions.getLimit(optionsInput.limit);
            }

            if (relationField.interface || relationField.union) {
                let referenceNodes;
                if (relationField.interface) {
                    const interfaceImplementations = context.nodes.filter((x) =>
                        relationField.interface?.implementations?.includes(x.name)
                    );

                    if (field.args.where) {
                        // Enrich concrete types with shared filters
                        field.args.where = addSharedFiltersToInterfaceImplementation(
                            field.args.where as GraphQLWhereArg,
                            interfaceImplementations
                        );
                    }
                    const hasImplementationsFilters = Object.prototype.hasOwnProperty.call(field.args.where || {}, "_on");
                    referenceNodes = interfaceImplementations.filter(
                        (x) =>
                            // where is not defined
                            !field.args.where ||
                            // where exists but has no filters defined
                            Object.keys(field.args.where).length === 0 ||
                            // where exists and has a filter on this implementation
                            (hasImplementationsFilters &&
                                Object.prototype.hasOwnProperty.call(field.args.where["_on"], x.name))
                    );
                    if (field.args.where != null && typeof field.args.where === "object" && hasImplementationsFilters) {
                        field.args.where = {
                            ...field.args.where,
                            ...(field.args.where["_on"] as Record<string, any>),
                        };
                        delete field.args.where["_on"];
                    }
                } else {
                    referenceNodes = context.nodes.filter(
                        (x) =>
                            relationField.union?.nodes?.includes(x.name) &&
                            (!field.args.where || Object.prototype.hasOwnProperty.call(field.args.where, x.name))
                    );
                }

                const parentNode = new Cypher.NamedNode(chainStr || varName);
                const unionSubqueries: Cypher.Clause[] = [];
                const unionVariableName = `${param}`;
                for (const refNode of referenceNodes) {
                    const recurse = createProjectionAndParams({
                        resolveTree: field,
                        node: refNode,
                        context,
                        varName: `${varName}_${alias}`,
                        chainStr: unionVariableName,
                    });
                    res.params = { ...res.params, ...recurse.params };

                    const direction = getRelationshipDirection(relationField, field.args);

                    const nestedProj = recurse.projection.replace(/{|}/gm, "");

                    const nestedProjString = nestedProj.trim().length ? `, ${nestedProj}` : "";
                    const nestedProjection = `{ __resolveType: "${refNode.name}" ${nestedProjString}}`;

                    const subquery = createProjectionSubquery({
                        parentNode,
                        whereInput: field.args.where ? field.args.where[refNode.name] : {},
                        node: refNode,
                        context,
                        alias: unionVariableName,
                        nestedProjection,
                        nestedSubqueries: [...recurse.subqueriesBeforeSort, ...recurse.subqueries],
                        relationField,
                        relationshipDirection: direction,
                        optionsInput,
                        authValidateStrs: recurse.meta?.authValidateStrs,
                        addSkipAndLimit: false,
                        collect: false,
                    });

                    const unionWith = new Cypher.With("*");
                    unionSubqueries.push(Cypher.concat(unionWith, subquery));
                }

                const unionClause = new Cypher.Union(...unionSubqueries);

                const collectAndLimitStatements = collectUnionSubqueriesResults({
                    resultVariable: new Cypher.NamedNode(unionVariableName),
                    optionsInput,
                    isArray: Boolean(relationField.typeMeta.array),
                });

                const unionAndSort = Cypher.concat(new Cypher.Call(unionClause), collectAndLimitStatements);
                res.subqueries.push(new Cypher.Call(unionAndSort).innerWith(parentNode));
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

            const parentNode = new Cypher.NamedNode(chainStr || varName);

            const direction = getRelationshipDirection(relationField, field.args);
            const subquery = createProjectionSubquery({
                parentNode,
                whereInput,
                node: referenceNode as Node, // TODO: improve typings
                context,
                alias: param,
                nestedProjection: recurse.projection,
                nestedSubqueries: [...recurse.subqueriesBeforeSort, ...recurse.subqueries],
                relationField,
                relationshipDirection: direction,
                optionsInput,
                authValidateStrs: recurse.meta?.authValidateStrs,
            });
            res.subqueries.push(new Cypher.Call(subquery).innerWith(parentNode));
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
            if (aggregationFieldProjection.projectionSubqueryCypher) {
                res.subqueries.push(new Cypher.RawCypher(aggregationFieldProjection.projectionSubqueryCypher));
            }
            res.projection.push(`${alias}: ${aggregationFieldProjection.projectionCypher}`);
            res.params = { ...res.params, ...aggregationFieldProjection.projectionParams };
            return res;
        }

        if (connectionField) {
            const connectionClause = new Cypher.Call(
                createConnectionClause({
                    resolveTree: field,
                    field: connectionField,
                    context,
                    nodeVariable: varName,
                    returnVariable: new Cypher.NamedVariable(param),
                })
            ).innerWith(new Cypher.NamedNode(varName));

            const connection = connectionClause.build(`${varName}_connection_${field.alias}`); // TODO: remove build from here
            const stupidParams = connection.params;

            const connectionSubClause = new Cypher.RawCypher(() => {
                // TODO: avoid REPLACE_ME in params and return them here

                return [connection.cypher, {}];
            });
            res.subqueries.push(connectionSubClause);
            res.projection.push(`${field.alias}: ${param}`);

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

    if (context.fulltextIndex) {
        return createFulltextProjection({
            resolveTree,
            node,
            context,
            chainStr,
            varName,
            literalElements,
            resolveType,
        });
    }

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

    const { projection, params, meta, subqueries, subqueriesBeforeSort } = Object.values(mergedFields).reduce(reducer, {
        projection: resolveType ? [`__resolveType: "${node.name}"`] : [],
        params: {},
        meta: {},
        subqueries: [],
        subqueriesBeforeSort: [],
    });

    return {
        projection: `{ ${projection.join(", ")} }`,
        params,
        meta,
        subqueries,
        subqueriesBeforeSort,
    };
}

function getSortArgs(resolveTree: ResolveTree): GraphQLSortArg[] {
    const connectionArgs = resolveTree.args.sort as GraphQLSortArg[] | undefined;
    const optionsArgs = (resolveTree.args.options as GraphQLOptionsArg)?.sort;

    return connectionArgs || optionsArgs || [];
}

// Generates any missing fields required for sorting
const generateMissingOrAliasedSortFields = ({
    selection,
    resolveTree,
}: {
    selection: Record<string, ResolveTree>;
    resolveTree: ResolveTree;
}): Record<string, ResolveTree> => {
    const sortArgs = getSortArgs(resolveTree);
    const sortFieldNames = removeDuplicates(sortArgs.map(Object.keys).flat());

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
        filterFieldsInSelection({ fields: node.customResolverFields, selection })
            .map((f) => f.requiredFields)
            .flat()
    );

    return generateMissingOrAliasedFields({ fieldNames: requiredFields, selection });
};

function createFulltextProjection({
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
    if (!resolveTree.fieldsByTypeName[node.fulltextTypeNames.result][node.singular]) {
        return {
            projection: "{ }",
            params: {},
            meta: {},
            subqueries: [],
            subqueriesBeforeSort: [],
        };
    }

    const nodeResolveTree = resolveTree.fieldsByTypeName[node.fulltextTypeNames.result][node.singular];

    const nodeContext = { ...context, fulltextIndex: false };

    return createProjectionAndParams({
        resolveTree: nodeResolveTree,
        node,
        context: nodeContext,
        chainStr,
        varName,
        literalElements,
        resolveType,
    });
}

function addSharedFiltersToInterfaceImplementation(where: GraphQLWhereArg, implementations: Node[]) {
    const interfaceSharedFilters = Object.entries(where || {}).filter(([key]) => key !== "_on");
    implementations.forEach((node) => {
        interfaceSharedFilters.forEach(([sharedFilterKey, sharedFilterValue]) => {
            if (!Object.prototype.hasOwnProperty.call(where, "_on")) {
                where["_on"] = {};
            }
            let nodeWhere = where["_on"][node.name];
            if (nodeWhere) {
                nodeWhere[sharedFilterKey] = nodeWhere[sharedFilterKey]
                    ? nodeWhere[sharedFilterKey]
                    : sharedFilterValue;
            } else {
                nodeWhere = {
                    [sharedFilterKey]: sharedFilterValue,
                };
            }
            where["_on"][node.name] = nodeWhere;
        });
    });
    return where;
}
