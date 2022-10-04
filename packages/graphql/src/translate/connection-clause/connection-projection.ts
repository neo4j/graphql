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
import type { ConnectionField, ConnectionSortArg, Context } from "../../types";
import type { Node } from "../../classes";
// eslint-disable-next-line import/no-cycle
import createProjectionAndParams from "../create-projection-and-params";
import type Relationship from "../../classes/Relationship";
import { createRelationshipPropertyValue } from "../projection/elements/create-relationship-property-element";
import { AUTH_FORBIDDEN_ERROR } from "../../constants";
import { generateMissingOrAliasedFields } from "../utils/resolveTree";
import * as CypherBuilder from "../cypher-builder/CypherBuilder";

export function createEdgeProjection({
    resolveTree,
    field,
    relationshipRef,
    relatedNodeVariableName,
    context,
    relatedNode,
    resolveType,
    extraFields = [],
}: {
    resolveTree: ResolveTree;
    field: ConnectionField;
    relationshipRef: CypherBuilder.Relationship;
    relatedNodeVariableName: string;
    context: Context;
    relatedNode: Node;
    resolveType?: boolean;
    extraFields?: Array<string>;
}): { projection: CypherBuilder.Map; subqueries: CypherBuilder.Clause[] } {
    const connection = resolveTree.fieldsByTypeName[field.typeMeta.name];

    const edgeProjectionProperties = new CypherBuilder.Map();
    const subqueries: CypherBuilder.Clause[] = [];
    if (connection.edges) {
        const relationship = context.relationships.find((r) => r.name === field.relationshipTypeName) as Relationship;
        const relationshipFieldsByTypeName = connection.edges.fieldsByTypeName[field.relationshipTypeName];
        const relationshipProperties = Object.values(relationshipFieldsByTypeName).filter((v) => v.name !== "node");
        if (relationshipProperties.length || extraFields.length) {
            const relationshipPropertyEntries = relationshipProperties.filter((p) => p.name !== "cursor");

            for (const property of relationshipPropertyEntries) {
                const prop = createRelationshipPropertyValue({
                    resolveTree: property,
                    relationship,
                    relationshipVariable: relationshipRef,
                });

                edgeProjectionProperties.set(property.alias, prop);
            }

            for (const extraField of extraFields) {
                const prop = relationshipRef.property(extraField);
                edgeProjectionProperties.set(extraField, prop);
            }
        }

        const nodeField = Object.values(relationshipFieldsByTypeName).find((v) => v.name === "node");
        if (nodeField) {
            const nodeProjection = createConnectionNodeProjection({
                nodeResolveTree: nodeField as ResolveTree,
                context,
                node: relatedNode,
                resolveTree,
                nodeRefVarName: relatedNodeVariableName,
                resolveType,
            });
            const alias = nodeField.alias;
            edgeProjectionProperties.set(alias, nodeProjection.projection);
            subqueries.push(...nodeProjection.subqueries);
        }
    } else {
        // This ensures that totalCount calculation is accurate if edges are not asked for

        return {
            projection: new CypherBuilder.Map({
                node: new CypherBuilder.Map({ __resolveType: new CypherBuilder.Literal(relatedNode.name) }),
            }),
            subqueries,
        };
    }

    return { projection: edgeProjectionProperties, subqueries };
}

function createConnectionNodeProjection({
    nodeResolveTree,
    nodeRefVarName,
    context,
    node,
    resolveType = false,
    resolveTree,
}: {
    nodeResolveTree: ResolveTree;
    context;
    nodeRefVarName: string;
    node: Node;
    resolveType?: boolean;
    resolveTree: ResolveTree; // Global resolve tree
}): { projection: CypherBuilder.Expr; subqueries: CypherBuilder.Clause[] } {
    const selectedFields: Record<string, ResolveTree> = mergeDeep([
        nodeResolveTree.fieldsByTypeName[node.name],
        ...node.interfaces.map((i) => nodeResolveTree?.fieldsByTypeName[i.name.value]),
    ]);

    const sortInput = (resolveTree.args.sort ?? []) as ConnectionSortArg[];
    const nodeSortFields = sortInput.map(({ node: n = {} }) => Object.keys(n)).flat();
    const mergedResolveTree: ResolveTree = mergeDeep<ResolveTree[]>([
        nodeResolveTree,
        {
            ...nodeResolveTree,
            fieldsByTypeName: {
                [node.name]: generateMissingOrAliasedFields({
                    fieldNames: nodeSortFields,
                    selection: selectedFields,
                }),
            },
        },
    ]);

    const nodeProjectionAndParams = createProjectionAndParams({
        resolveTree: mergedResolveTree,
        node,
        context,
        varName: nodeRefVarName,
        literalElements: true,
        resolveType,
    });

    const projectionMeta = nodeProjectionAndParams.meta;
    const projectionSubqueries = [
        ...nodeProjectionAndParams.subqueriesBeforeSort,
        ...nodeProjectionAndParams.subqueries,
    ];

    if (projectionMeta?.authValidateStrs?.length) {
        const authStrs = projectionMeta.authValidateStrs;
        const projectionAuth = new CypherBuilder.RawCypher(() => {
            return `CALL apoc.util.validate(NOT (${authStrs.join(" AND ")}), "${AUTH_FORBIDDEN_ERROR}", [0])`;
        });
        projectionSubqueries.push(projectionAuth);
    }
    return {
        subqueries: projectionSubqueries,
        projection: new CypherBuilder.RawCypher(() => {
            return [`${nodeProjectionAndParams.projection}`, nodeProjectionAndParams.params];
        }),
    };
}
