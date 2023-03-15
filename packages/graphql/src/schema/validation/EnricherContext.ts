import type {
    DocumentNode,
    GraphQLSchema,
    TypeDefinitionNode,
    DirectiveDefinitionNode,
    ObjectTypeExtensionNode,
} from "graphql";
import { buildASTSchema, isTypeExtensionNode, isTypeDefinitionNode } from "graphql";

export type DefinitionNodeMap = Record<
    string,
    TypeDefinitionNode | DirectiveDefinitionNode | ObjectTypeExtensionNode[]
>;

export class EnricherContext {
    public augmentedSchema: GraphQLSchema;
    public userDefinitionNodeMap: DefinitionNodeMap;
    public augmentedDefinitionNodeMap: DefinitionNodeMap;

    constructor(userDocument: DocumentNode, augmentedDocument: DocumentNode) {
        this.augmentedSchema = buildASTSchema(augmentedDocument, { assumeValid: true });
        this.userDefinitionNodeMap = this.buildDefinitionsNodeMap(userDocument);
        this.augmentedDefinitionNodeMap = this.buildDefinitionsNodeMap(augmentedDocument);
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
