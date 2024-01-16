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
    ASTVisitor,
    DirectiveNode,
    InterfaceTypeDefinitionNode,
    InterfaceTypeExtensionNode,
    ObjectTypeDefinitionNode,
    ObjectTypeExtensionNode,
} from "graphql";
import { Integer } from "neo4j-driver";
import {
    getInheritedTypeNames,
    hydrateInterfaceWithImplementedTypesMap,
} from "../utils/interface-to-implementing-types";
import { getPathToNode } from "../utils/path-parser";
import { parseArgumentToInt } from "../utils/utils";

export function WarnIfAMaxLimitCanBeBypassedThroughInterface() {
    return function (): ASTVisitor {
        const entityToMaxLimitMap = new Map<string, Integer>();
        const interfaceToImplementingTypes = new Map<string, Set<string>>();
        const doOnInterface = {
            leave(interfaceType: InterfaceTypeDefinitionNode | InterfaceTypeExtensionNode) {
                const interfaceMax = entityToMaxLimitMap.get(interfaceType.name.value);
                if (!interfaceMax) {
                    return;
                }
                const concreteThatIsBypassed = (
                    getInheritedTypeNames(interfaceType, interfaceToImplementingTypes) || []
                ).find((typeName) => {
                    const concreteEntityLimit = entityToMaxLimitMap.get(typeName);
                    if (concreteEntityLimit && concreteEntityLimit.lessThan(interfaceMax)) {
                        return typeName;
                    }
                });
                if (concreteThatIsBypassed) {
                    console.warn(
                        `Max limit set on ${concreteThatIsBypassed} may be bypassed by its interface ${interfaceType.name.value}. To fix this update the \`@limit\` max value on the interface type. Ignore this message if the behavior is intended!`
                    );
                }
            },
        };
        const doOnObject = {
            enter(objectType: ObjectTypeDefinitionNode | ObjectTypeExtensionNode) {
                hydrateInterfaceWithImplementedTypesMap(objectType, interfaceToImplementingTypes);
            },
            leave(objectType: ObjectTypeDefinitionNode | ObjectTypeExtensionNode) {
                const concreteMax = entityToMaxLimitMap.get(objectType.name.value);
                if (!concreteMax) {
                    return;
                }
                const interfaceThatBypasses = (
                    getInheritedTypeNames(objectType, interfaceToImplementingTypes) || []
                ).find((typeName) => {
                    const interfaceMax = entityToMaxLimitMap.get(typeName);
                    if (!interfaceMax || interfaceMax.greaterThan(concreteMax)) {
                        return typeName;
                    }
                });
                if (interfaceThatBypasses) {
                    console.warn(
                        `Max limit set on ${objectType.name.value} may be bypassed by its interface ${interfaceThatBypasses}. To fix this update the \`@limit\` max value on the interface type. Ignore this message if the behavior is intended!`
                    );
                }
            },
        };
        return {
            Directive(directiveNode: DirectiveNode, _key, _parent, path, ancestors) {
                if (directiveNode.name.value !== "limit") {
                    return;
                }
                const [, traversedDef] = getPathToNode(path, ancestors);
                if (!traversedDef) {
                    return;
                }
                const maxArg = directiveNode.arguments?.find((a) => a.name.value === "max");
                const maxLimit = parseArgumentToInt(maxArg) || Integer.MAX_SAFE_VALUE;
                entityToMaxLimitMap.set(traversedDef.name.value, maxLimit);
            },
            ObjectTypeDefinition: doOnObject,
            ObjectTypeExtension: doOnObject,
            InterfaceTypeDefinition: doOnInterface,
            InterfaceTypeExtension: doOnInterface,
        };
    };
}
