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

import {
    Kind,
    type InterfaceTypeDefinitionNode,
    type ObjectTypeDefinitionNode,
    type UnionTypeDefinitionNode,
} from "graphql";
import { nodeDirective } from "../../../../../graphql/directives";
import { asArray } from "../../../../../utils/utils";
import type { TypeMapWithExtensions } from "../../../Neo4jValidationContext";

export function typeIsANodeType({
    objectTypeDefinitionNode,
    typeMapWithExtensions,
}: {
    objectTypeDefinitionNode: ObjectTypeDefinitionNode;
    typeMapWithExtensions: TypeMapWithExtensions;
}): boolean {
    const { directives } = objectTypeDefinitionNode;
    const objectTypeExtensionNodes = typeMapWithExtensions[objectTypeDefinitionNode.name.value]?.extensions;

    const extensionsDirectives = asArray(objectTypeExtensionNodes).flatMap((extensionNode) => {
        return extensionNode.directives ?? [];
    });
    const allDirectives = [...(directives ?? []), ...extensionsDirectives];

    return !!allDirectives?.find((directive) => directive.name.value === nodeDirective.name);
}

export function interfaceIsNode({
    interfaceTypeDefinitionNode,
    typeMapWithExtensions,
    interfacesMap,
}: {
    interfaceTypeDefinitionNode: InterfaceTypeDefinitionNode;
    typeMapWithExtensions: TypeMapWithExtensions;
    interfacesMap: Record<string, Array<ObjectTypeDefinitionNode>>;
}): boolean {
    const interfaceName = interfaceTypeDefinitionNode.name.value;
    const interfaceConcreteTypes = interfacesMap[interfaceName] ?? [];

    for (const concreteType of interfaceConcreteTypes) {
        const isConcreteTypeANode = typeIsANodeType({
            objectTypeDefinitionNode: concreteType,
            typeMapWithExtensions,
        });

        if (!isConcreteTypeANode) {
            return false;
        }
    }
    return true;
}

export function unionIsNode({
    unionTypeDefinitionNode,
    typeMapWithExtensions,
}: {
    unionTypeDefinitionNode: UnionTypeDefinitionNode;
    typeMapWithExtensions: TypeMapWithExtensions;
}): boolean {
    for (const concreteType of unionTypeDefinitionNode.types ?? []) {
        const concreteTypeFileName = concreteType.name.value;
        const type = typeMapWithExtensions[concreteTypeFileName];
        if (!type) {
            throw new Error(`Type ${concreteTypeFileName} not found in validation`);
        }

        if (type.definition && type.definition.kind === Kind.OBJECT_TYPE_DEFINITION) {
            const isConcreteTypeANode = typeIsANodeType({
                objectTypeDefinitionNode: type.definition,
                typeMapWithExtensions,
            });
            if (!isConcreteTypeANode) {
                return false;
            }
        }
    }

    return true;
}
