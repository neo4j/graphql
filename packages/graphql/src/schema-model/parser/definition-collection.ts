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
    DirectiveDefinitionNode,
    DirectiveNode,
    DocumentNode,
    EnumTypeDefinitionNode,
    InterfaceTypeDefinitionNode,
    ObjectTypeDefinitionNode,
    ScalarTypeDefinitionNode,
    SchemaExtensionNode,
    UnionTypeDefinitionNode,
} from "graphql";
import { Kind } from "graphql";
import { jwt, relationshipPropertiesDirective } from "../../graphql/directives";
import { isRootType } from "../../utils/is-root-type";
import { findDirective } from "./utils";

export type DefinitionCollection = {
    nodes: Map<string, ObjectTypeDefinitionNode>; // this does not include @jwtPayload type.
    scalarTypes: Map<string, ScalarTypeDefinitionNode>;
    enumTypes: Map<string, EnumTypeDefinitionNode>;
    interfaceTypes: Map<string, InterfaceTypeDefinitionNode>; // this does not include @relationshipProperties interfaces.
    unionTypes: Map<string, UnionTypeDefinitionNode>;
    directives: Map<string, DirectiveDefinitionNode>;
    relationshipProperties: Map<string, InterfaceTypeDefinitionNode>;
    schemaExtension: SchemaExtensionNode | undefined;
    jwtPayload: ObjectTypeDefinitionNode | undefined;
    interfaceToImplementingTypeNamesMap: Map<string, string[]>; // TODO: change this logic, this was the logic contained in initInterfacesToTypeNamesMap but potentially can be simplified now.
    operations: ObjectTypeDefinitionNode[];
    schemaDirectives: DirectiveNode[];
};

export function getDefinitionCollection(document: DocumentNode): DefinitionCollection {
    return document.definitions.reduce<DefinitionCollection>(
        (definitionCollection, definition) => {
            switch (definition.kind) {
                case Kind.SCALAR_TYPE_DEFINITION:
                    definitionCollection.scalarTypes.set(definition.name.value, definition);
                    break;
                case Kind.OBJECT_TYPE_DEFINITION:
                    if (findDirective(definition.directives, jwt.name)) {
                        definitionCollection.jwtPayload = definition;
                    } else if (!isRootType(definition)) {
                        definitionCollection.nodes.set(definition.name.value, definition);
                    } else {
                        definitionCollection.operations.push(definition);
                    }
                    break;
                case Kind.ENUM_TYPE_DEFINITION:
                    definitionCollection.enumTypes.set(definition.name.value, definition);
                    break;
                case Kind.INTERFACE_TYPE_DEFINITION:
                    if (
                        findDirective(definition.directives, relationshipPropertiesDirective.name)
                    ) {
                        definitionCollection.relationshipProperties.set(definition.name.value, definition);
                    } else {
                        definitionCollection.interfaceTypes.set(definition.name.value, definition);
                        definitionCollection.interfaceToImplementingTypeNamesMap.set(definition.name.value, []); // previous initInterfacesToTypeNamesMap logic.
                    }
                    break;
                case Kind.DIRECTIVE_DEFINITION:
                    definitionCollection.directives.set(definition.name.value, definition);
                    break;
                case Kind.UNION_TYPE_DEFINITION:
                    definitionCollection.unionTypes.set(definition.name.value, definition);
                    break;
                case Kind.SCHEMA_EXTENSION:
                    // This is based on the assumption that mergeTypeDefs is used and therefore there is only one schema extension (merged), this assumption is currently used as well for object extensions.
                    definitionCollection.schemaExtension = definition;
                    definitionCollection.schemaDirectives = definition.directives ? Array.from(definition.directives) : [];
                    break;
            }

            return definitionCollection;
        },
        {
            nodes: new Map(),
            enumTypes: new Map(),
            scalarTypes: new Map(),
            interfaceTypes: new Map(),
            directives: new Map(),
            unionTypes: new Map(),
            relationshipProperties: new Map(),
            schemaExtension: undefined,
            jwtPayload: undefined,
            interfaceToImplementingTypeNamesMap: new Map(),
            operations: [],
            schemaDirectives: [],
        }
    );
}
