/*
 * Copyright (c) "Neo4j"
 * Neo4j Sweden AB [http://neo4j.com]
 */

import type {
    DirectiveDefinitionNode,
    DocumentNode,
    GraphQLSchema,
    InterfaceTypeExtensionNode,
    ObjectTypeExtensionNode,
    TypeDefinitionNode,
} from "graphql";
import { buildASTSchema, isTypeDefinitionNode, isTypeExtensionNode } from "graphql";

type DefinitionNodeMap = Record<
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
                definitionNodeMap[definitionNodeMapKey] = (definitionNodeMap[definitionNodeMapKey] || []).concat(
                    definition
                );
            }
        }
        return definitionNodeMap;
    }
}
