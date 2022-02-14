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
import { cursorToOffset } from "graphql-relay";
import { mergeDeep } from "@graphql-tools/utils";
import { Integer } from "neo4j-driver";
import { ConnectionField, ConnectionSortArg, ConnectionWhereArg, Context } from "../../types";
import { Node } from "../../classes";
// eslint-disable-next-line import/no-cycle
import createProjectionAndParams from "../create-projection-and-params";
import Relationship from "../../classes/Relationship";
import createRelationshipPropertyElement from "../projection/elements/create-relationship-property-element";
import createConnectionWhereAndParams from "../where/create-connection-where-and-params";
import createAuthAndParams from "../create-auth-and-params";
import { AUTH_FORBIDDEN_ERROR } from "../../constants";
import { createOffsetLimitStr } from "../../schema/pagination";
import filterInterfaceNodes from "../../utils/filter-interface-nodes";
import { getRelationshipDirection } from "../cypher-builder/get-relationship-direction";
import { isString } from "../../utils/utils";
import {
    generateMissingOrAliasedFields,
    generateProjectionField,
    getResolveTreeByFieldName,
} from "../utils/resolveTree";

function createConnectionAndParams({
    resolveTree,
    field,
    context,
    nodeVariable,
    parameterPrefix,
}: {
    resolveTree: ResolveTree;
    field: ConnectionField;
    context: Context;
    nodeVariable: string;
    parameterPrefix?: string;
}): [string, Record<string, any>] {
    const param = `${nodeVariable}_${resolveTree.alias}`;
    const isAbstractType = Boolean(field.relationship.union || field.relationship.interface);

    const whereInput = (resolveTree.args.where ?? {}) as ConnectionWhereArg;
    const firstInput = resolveTree.args.first as number | Integer | undefined;
    const afterInput = resolveTree.args.after;
    const sortInput = (resolveTree.args.sort ?? []) as ConnectionSortArg[];
    // Fields of {edge, node} to sort on. A simple resolve tree will be added if not in selection set
    // Since nodes of abstract types and edges are constructed sort will not work if field is not in selection set
    const edgeSortFields = sortInput.map(({ edge = {} }) => Object.keys(edge)).flat();
    const nodeSortFields = sortInput.map(({ node = {} }) => Object.keys(node)).flat();

    const relationshipVariable = `${nodeVariable}_${field.relationship.type.toLowerCase()}_relationship`;
    const relatedNode = context.nodes.find((x) => x.name === field.relationship.typeMeta.name) as Node;
    const relatedRelationship = context.relationships.find(
        (r) => r.name === field.relationshipTypeName
    ) as Relationship;

    const connection = resolveTree.fieldsByTypeName[field.typeMeta.name];

    const relationshipFieldsByTypeName = connection.edges?.fieldsByTypeName[field.relationshipTypeName] ?? {};

    const relationshipProperties = Object.values(relationshipFieldsByTypeName).filter((v) => v.name !== "node");

    edgeSortFields.forEach((sortField) => {
        // For every sort field on edge check to see if the field is in selection set
        if (
            !relationshipProperties.find((rt) => rt.name === sortField) ||
            relationshipProperties.find((rt) => rt.name === sortField && rt.alias !== sortField)
        ) {
            // if it doesn't exist add a basic resolve tree to relationshipProperties
            relationshipProperties.push({ alias: sortField, args: {}, fieldsByTypeName: {}, name: sortField });
        }
    });

    const relationshipPropertyEntries = relationshipProperties
        .filter((p) => p.name !== "cursor")
        .map((v) =>
            createRelationshipPropertyElement({
                resolveTree: v,
                relationship: relatedRelationship,
                relationshipVariable,
            })
        );

    const nodeResolveTree = Object.values(relationshipFieldsByTypeName).find((v) => v.name === "node");

    // TODO: Rework params
    let params = Object.keys(whereInput).length ? { [param]: { args: { where: whereInput } } } : {};
    const nodeSubquery = context.nodes
        .filter(
            (node) =>
                node.name === field.relationship.typeMeta.name ||
                (field.relationship.interface?.implementations?.includes(node.name) &&
                    filterInterfaceNodes({ node, whereInput })) ||
                (field.relationship.union?.nodes?.includes(node.name) &&
                    (!resolveTree.args.where ||
                        Object.prototype.hasOwnProperty.call(resolveTree.args.where, node.name)))
        )
        .map((node) => {
            const sourceNode = `(${nodeVariable})`;

            const { inStr, outStr } = getRelationshipDirection(field.relationship, resolveTree.args);
            const targetRelationship = `${inStr}[${relationshipVariable}:${field.relationship.type}]${outStr}`;
            const edgeElements: string[] = [relationshipPropertyEntries.join(", ")];

            const labels = node.getLabelString(context);
            // TODO: Why
            const targetNodeVariable = isAbstractType
                ? `${nodeVariable}_${node.name}`
                : `${nodeVariable}_${field.relationship.typeMeta.name.toLowerCase()}`;
            const targetNode = `(${targetNodeVariable}${labels})`;

            // TODO: query limits

            const [authAllow, authAllowParams] = createAuthAndParams({
                operations: "READ",
                entity: node,
                context,
                allow: {
                    parentNode: node,
                    varName: targetNodeVariable,
                },
            });

            const [authWhere, authWhereParams] = createAuthAndParams({
                operations: "READ",
                entity: node,
                context,
                where: { varName: targetNodeVariable, node },
            });

            const [connectionWhere, connectionWhereParams] = createConnectionWhereAndParams({
                whereInput: field.relationship.union ? whereInput[node.name] ?? {} : whereInput,
                node,
                nodeVariable: targetNodeVariable,
                relationship: relatedRelationship,
                relationshipVariable,
                context,
                parameterPrefix: `${parameterPrefix ? `${parameterPrefix}.` : `${nodeVariable}_`}${
                    resolveTree.alias
                }.args.where${field.relationship.union ? `.${node.name}` : ""}`,
            });

            const resTree = nodeResolveTree ?? generateProjectionField({ name: "node" }).node;

            const selectedFields: Record<string, ResolveTree> = mergeDeep([
                resTree.fieldsByTypeName[node.name],
                ...node.interfaces.map((i) => resTree.fieldsByTypeName[i.name.value]),
            ]);
            const mergedResolveTree: ResolveTree = mergeDeep([
                resTree,
                {
                    fieldsByTypeName: {
                        [node.name]: generateMissingOrAliasedFields({
                            fieldNames: nodeSortFields,
                            selection: selectedFields,
                        }),
                    },
                },
            ]);

            const [nodeProjection, nodeProjectionParams, nodeProjectionMeta] = createProjectionAndParams({
                resolveTree: mergedResolveTree,
                node,
                context,
                varName: targetNodeVariable,
                literalElements: true,
                resolveType: true,
            });

            edgeElements.push(`node: ${nodeProjection}`);

            const where = [
                authAllow ? `CALL apoc.util.validate(NOT(${authAllow}), "${AUTH_FORBIDDEN_ERROR}", [0])` : "",
                authWhere,
                connectionWhere,
                nodeProjectionMeta.authValidateStrs.length
                    ? `apoc.util.validatePredicate(NOT(${nodeProjectionMeta.authValidateStrs.join(
                          " AND "
                      )}), "${AUTH_FORBIDDEN_ERROR}", [0])`
                    : "",
            ]
                .filter(Boolean)
                .join(" AND ");

            params = mergeDeep([
                params,
                nodeProjectionParams,
                authAllowParams,
                authWhereParams,
                Object.keys(connectionWhereParams).length
                    ? {
                          [targetNodeVariable]: isAbstractType
                              ? { [node.name]: connectionWhereParams }
                              : connectionWhereParams,
                      }
                    : {},
            ]);

            return [
                isAbstractType ? `WITH ${nodeVariable}` : "",
                `MATCH ${sourceNode}${targetRelationship}${targetNode}`,
                where ? `WHERE ${where}` : "",
                nodeProjectionMeta.subQueries.join("\n"),
                `${isAbstractType ? "RETURN" : "WITH"} { ${edgeElements.filter(Boolean).join(", ")} } AS edge`,
                // TODO: implement query limit
            ]
                .filter(Boolean)
                .join("\n");
        })
        .join("\nUNION\n");

    const sort = sortInput.map((s) =>
        [
            ...Object.entries(s.edge || []).map(([f, direction]) => `edge.${f} ${direction}`),
            ...Object.entries(s.node || []).map(([f, direction]) => `edge.node.${f} ${direction}`),
        ].join(", ")
    );

    const splice = createOffsetLimitStr({
        offset: isString(afterInput) ? cursorToOffset(afterInput) + 1 : undefined,
        limit: relatedNode?.queryOptions?.getLimit() ?? firstInput,
    });

    const returnValues: string[] = [];

    if (getResolveTreeByFieldName({ fieldName: "edges", selection: connection }) || connection.pageInfo) {
        returnValues.push(`edges: edges${splice}`);
    }
    returnValues.push("totalCount: size(edges)");

    const subQuery = [
        "CALL {",
        `WITH ${nodeVariable}`,
        isAbstractType ? ["CALL {", nodeSubquery, "}"].join("\n") : nodeSubquery,
        sort.length ? `WITH edge ORDER BY ${sort.join(", ")}` : "",
        // TODO: possibly below as the concrete nodeSubquery ends with WITH {} AS edge
        // sort.length ? `${isAbstractType ? "WITH edge " : ""}ORDER BY ${sort.join(", ")}` : "",
        `WITH collect(edge) AS edges`,
        `RETURN { ${returnValues.join(", ")} } AS ${param}`,
        "}",
    ].join("\n");

    return [subQuery, params];
}

export default createConnectionAndParams;
