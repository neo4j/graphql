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

import type {
    DocumentNode,
    GraphQLSchema,
    TypeDefinitionNode,
    DirectiveDefinitionNode,
    ObjectTypeExtensionNode,
    InterfaceTypeExtensionNode,
} from "graphql";
import { buildASTSchema, isTypeExtensionNode, isTypeDefinitionNode } from "graphql";

export type DefinitionNodeMap = Record<
    string,
    TypeDefinitionNode | DirectiveDefinitionNode | ObjectTypeExtensionNode[] | InterfaceTypeExtensionNode[]
>;

export class EnricherContext {
    public augmentedSchema: GraphQLSchema;
    public userDefinitionNodeMap: DefinitionNodeMap;

    constructor(userDocument: DocumentNode, augmentedDocument: DocumentNode) {
        this.augmentedSchema = buildASTSchema(augmentedDocument, { assumeValid: true });
        this.userDefinitionNodeMap = this.buildDefinitionsNodeMap(userDocument);
    }

    buildDefinitionsNodeMap(documentNode: DocumentNode): DefinitionNodeMap {
        const definitionNodeMap = {};
        for (const definition of documentNode.definitions) {
            if (isTypeDefinitionNode(definition)) {
                definitionNodeMap[definition.name.value] = definition;
            }
            if (isTypeExtensionNode(definition)) {
                const definitionNodeMapKey = `${definition.name.value}_EXTENSIONS`;
                definitionNodeMap[definitionNodeMapKey] = definitionNodeMap[definitionNodeMapKey]
                    ? [...definitionNodeMap[definitionNodeMapKey], definition]
                    : [definition];
            }
        }
        return definitionNodeMap;
    }
}
