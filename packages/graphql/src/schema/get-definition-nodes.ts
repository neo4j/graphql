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

import Debug from "debug";
import type {
    DirectiveDefinitionNode,
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
import { isRootType } from "../utils/is-root-type";
import { DEBUG_GENERATE } from "../constants";

const debug = Debug(DEBUG_GENERATE);

export type DefinitionNodes = {
    objectTypes: ObjectTypeDefinitionNode[];
    scalarTypes: ScalarTypeDefinitionNode[];
    enumTypes: EnumTypeDefinitionNode[];
    inputObjectTypes: InputObjectTypeDefinitionNode[];
    interfaceTypes: InterfaceTypeDefinitionNode[];
    directives: DirectiveDefinitionNode[];
    unionTypes: UnionTypeDefinitionNode[];
    schemaExtensions: SchemaExtensionNode[];
};

export function getDefinitionNodes(document: DocumentNode): DefinitionNodes {
    return document.definitions.reduce<DefinitionNodes>(
        (definitionNodes, definition) => {
            switch (definition.kind) {
                case Kind.SCALAR_TYPE_DEFINITION:
                    definitionNodes.scalarTypes.push(definition);
                    break;
                case Kind.OBJECT_TYPE_DEFINITION:
                    if (!isRootType(definition)) {
                        definitionNodes.objectTypes.push(definition);
                    }
                    break;
                case Kind.ENUM_TYPE_DEFINITION:
                    definitionNodes.enumTypes.push(definition);
                    break;
                case Kind.INPUT_OBJECT_TYPE_DEFINITION:
                    definitionNodes.inputObjectTypes.push(definition);
                    break;
                case Kind.INTERFACE_TYPE_DEFINITION:
                    definitionNodes.interfaceTypes.push(definition);
                    break;
                case Kind.DIRECTIVE_DEFINITION:
                    definitionNodes.directives.push(definition);
                    break;
                case Kind.UNION_TYPE_DEFINITION:
                    definitionNodes.unionTypes.push(definition);
                    break;
                case Kind.SCHEMA_EXTENSION:
                    definitionNodes.schemaExtensions.push(definition);
                    break;
                case Kind.SCHEMA_DEFINITION:
                    break;
                default:
                    debug(`Ignoring definition kind ${definition.kind}`);
            }

            return definitionNodes;
        },
        {
            objectTypes: [],
            inputObjectTypes: [],
            enumTypes: [],
            scalarTypes: [],
            interfaceTypes: [],
            directives: [],
            unionTypes: [],
            schemaExtensions: [],
        }
    );
}
