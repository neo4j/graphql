/*
 * Copyright (c) "Neo4j"
 * Neo4j Sweden AB [http://neo4j.com]
 */

import type {
    DirectiveDefinitionNode,
    DirectiveNode,
    DocumentNode,
    EnumTypeDefinitionNode,
    InputObjectTypeDefinitionNode,
    InterfaceTypeDefinitionNode,
    ObjectTypeDefinitionNode,
    ScalarTypeDefinitionNode,
    SchemaExtensionNode,
    UnionTypeDefinitionNode,
} from "graphql";
import { Kind } from "graphql";
import { jwt, nodeDirective, relationshipPropertiesDirective } from "../../graphql/directives";
import { isRootType } from "../../utils/is-root-type";
import { findDirective } from "./utils";

export type DefinitionCollection = {
    nodes: Map<string, ObjectTypeDefinitionNode>; // includes all object types marked with @node
    objectTypes: Map<string, ObjectTypeDefinitionNode>; // includes all objects
    userDefinedObjectTypes: Map<string, ObjectTypeDefinitionNode>; // includes objects not reserved by the library
    scalarTypes: Map<string, ScalarTypeDefinitionNode>;
    enumTypes: Map<string, EnumTypeDefinitionNode>;
    interfaceTypes: Map<string, InterfaceTypeDefinitionNode>;
    unionTypes: Map<string, UnionTypeDefinitionNode>;
    directives: Map<string, DirectiveDefinitionNode>;
    relationshipProperties: Map<string, ObjectTypeDefinitionNode>;
    inputTypes: Map<string, InputObjectTypeDefinitionNode>;
    schemaExtensions: SchemaExtensionNode | undefined;
    jwtPayload: ObjectTypeDefinitionNode | undefined;
    interfaceToImplementingTypeNamesMap: Map<string, string[]>; // TODO: change this logic, this was the logic contained in initInterfacesToTypeNamesMap but potentially can be simplified now.
    operations: ObjectTypeDefinitionNode[];
    schemaDirectives: DirectiveNode[];
    document: DocumentNode; // Raw Document from which the collection is made. NOTE: This is added here so we can generate customResolve fields following the old code.
};

export function getDefinitionCollection(document: DocumentNode): DefinitionCollection {
    return document.definitions.reduce<DefinitionCollection>(
        (definitionCollection, definition) => {
            switch (definition.kind) {
                case Kind.SCALAR_TYPE_DEFINITION:
                    definitionCollection.scalarTypes.set(definition.name.value, definition);
                    break;
                case Kind.OBJECT_TYPE_DEFINITION: {
                    definitionCollection.objectTypes.set(definition.name.value, definition);
                    if (findDirective(definition.directives, relationshipPropertiesDirective.name)) {
                        definitionCollection.relationshipProperties.set(definition.name.value, definition);
                        break;
                    }
                    if (findDirective(definition.directives, jwt.name)) {
                        definitionCollection.jwtPayload = definition;
                        break;
                    }
                    if (isRootType(definition)) {
                        definitionCollection.operations.push(definition);
                        break;
                    }
                    if (findDirective(definition.directives, nodeDirective.name)) {
                        definitionCollection.nodes.set(definition.name.value, definition);
                        break;
                    }
                    definitionCollection.userDefinedObjectTypes.set(definition.name.value, definition);
                    break;
                }
                case Kind.ENUM_TYPE_DEFINITION:
                    definitionCollection.enumTypes.set(definition.name.value, definition);
                    break;
                case Kind.INTERFACE_TYPE_DEFINITION:
                    definitionCollection.interfaceTypes.set(definition.name.value, definition);
                    definitionCollection.interfaceToImplementingTypeNamesMap.set(definition.name.value, []); // previous initInterfacesToTypeNamesMap logic.
                    break;
                case Kind.DIRECTIVE_DEFINITION:
                    definitionCollection.directives.set(definition.name.value, definition);
                    break;
                case Kind.UNION_TYPE_DEFINITION:
                    definitionCollection.unionTypes.set(definition.name.value, definition);
                    break;
                case Kind.INPUT_OBJECT_TYPE_DEFINITION:
                    definitionCollection.inputTypes.set(definition.name.value, definition);
                    break;
                case Kind.SCHEMA_EXTENSION:
                    // This is based on the assumption that mergeTypeDefs is used and therefore there is only one schema extension (merged), this assumption is currently used as well for object extensions.
                    definitionCollection.schemaExtensions = definition;
                    definitionCollection.schemaDirectives = definition.directives
                        ? Array.from(definition.directives)
                        : [];
                    break;
            }

            return definitionCollection;
        },
        {
            nodes: new Map(),
            objectTypes: new Map(),
            userDefinedObjectTypes: new Map(),
            enumTypes: new Map(),
            scalarTypes: new Map(),
            interfaceTypes: new Map(),
            directives: new Map(),
            unionTypes: new Map(),
            relationshipProperties: new Map(),
            inputTypes: new Map(),
            schemaExtensions: undefined,
            jwtPayload: undefined,
            interfaceToImplementingTypeNamesMap: new Map(),
            operations: [],
            schemaDirectives: [],
            document,
        }
    );
}
