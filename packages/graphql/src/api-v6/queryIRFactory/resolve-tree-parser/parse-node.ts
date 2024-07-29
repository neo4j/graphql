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
import type { GraphQLTreeLeafField } from "./graphql-tree/attributes";
import type { GraphQLTreeNode, GraphQLTreeReadOperation } from "./graphql-tree/graphql-tree";
import { parseAttributeField } from "./parse-attribute-fields";
import { parseRelationshipField } from "./parse-resolve-info-tree";
import { ResolveTreeParserError } from "./resolve-tree-parser-error";

export function parseNode(resolveTree: ResolveTree, targetNode: ConcreteEntity): GraphQLTreeNode {
    const entityTypes = targetNode.typeNames;
    const fieldsResolveTree = resolveTree.fieldsByTypeName[entityTypes.node] ?? {};

    const fields = getNodeFields(fieldsResolveTree, targetNode);

    return {
        alias: resolveTree.alias,
        args: resolveTree.args,
        fields: fields,
    };
}

export function getNodeFields(
    fields: Record<string, ResolveTree>,
    targetNode: ConcreteEntity
): Record<string, GraphQLTreeLeafField | GraphQLTreeReadOperation> {
    const propertyFields: Record<string, GraphQLTreeLeafField | GraphQLTreeReadOperation> = {};
    for (const [key, fieldResolveTree] of Object.entries(fields)) {
        const fieldName = fieldResolveTree.name;
        const field =
            parseRelationshipField(fieldResolveTree, targetNode) ?? parseAttributeField(fieldResolveTree, targetNode);
        if (!field) {
            throw new ResolveTreeParserError(`${fieldName} is not a field of node`);
        }
        propertyFields[key] = field;
    }
    return propertyFields;
}
