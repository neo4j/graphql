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
import type { ConcreteEntity } from "../../../schema-model/entity/ConcreteEntity";
import { Relationship } from "../../../schema-model/relationship/Relationship";
import type { GraphQLTreeLeafField } from "./graphql-tree/attributes";
import type { GraphQLTreeEdge, GraphQLTreeEdgeProperties } from "./graphql-tree/graphql-tree";
import { parseAttributeField } from "./parse-attribute-fields";
import { parseNode } from "./parse-node";
import { ResolveTreeParserError } from "./parse-resolve-info-tree";
import { findFieldByName } from "./utils/find-field-by-name";

export function parseEdges(resolveTree: ResolveTree, entity: Relationship | ConcreteEntity): GraphQLTreeEdge {
    const nodeTarget = entity instanceof Relationship ? (entity.target as ConcreteEntity) : entity;

    const edgeType = entity.typeNames.edge;

    const nodeResolveTree = findFieldByName(resolveTree, edgeType, "node");
    const resolveTreeProperties = findFieldByName(resolveTree, edgeType, "properties");

    const nodeFields = nodeResolveTree ? parseNode(nodeResolveTree, nodeTarget) : undefined;

    let edgeProperties: GraphQLTreeEdgeProperties | undefined;
    if (entity instanceof Relationship) {
        edgeProperties = resolveTreeProperties ? parseEdgeProperties(resolveTreeProperties, entity) : undefined;
    }

    return {
        alias: resolveTree.alias,
        args: resolveTree.args,
        fields: {
            node: nodeFields,
            properties: edgeProperties,
        },
    };
}

function parseEdgeProperties(
    resolveTree: ResolveTree,
    relationship: Relationship
): GraphQLTreeEdgeProperties | undefined {
    if (!relationship.typeNames.properties) {
        return;
    }
    const fieldsResolveTree = resolveTree.fieldsByTypeName[relationship.typeNames.properties] ?? {};

    const fields = getEdgePropertyFields(fieldsResolveTree, relationship);

    return {
        alias: resolveTree.alias,
        args: resolveTree.args,
        fields: fields,
    };
}

function getEdgePropertyFields(
    fields: Record<string, ResolveTree>,
    relationship: Relationship
): Record<string, GraphQLTreeLeafField> {
    const propertyFields: Record<string, GraphQLTreeLeafField> = {};
    for (const [key, fieldResolveTree] of Object.entries(fields)) {
        const fieldName = fieldResolveTree.name;
        const field = parseAttributeField(fieldResolveTree, relationship);
        if (!field) {
            throw new ResolveTreeParserError(`${fieldName} is not an attribute of edge`);
        }
        propertyFields[key] = field;
    }
    return propertyFields;
}
