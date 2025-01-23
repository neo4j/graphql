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

import { Kind, type ASTNode, type ObjectTypeDefinitionNode } from "graphql";
import { nodeDirective, relationshipPropertiesDirective } from "../../../../../graphql/directives";
import { isRootType } from "../../../../../utils/is-root-type";
import { asArray } from "../../../../../utils/utils";
import type { ObjectExtensionsTypeMap } from "../../../Neo4jValidationContext";
import { getPathToNode } from "../../utils/path-parser";

export function typeIsANodeType({
    objectTypeDefinitionNode,
    extensionsTypeMap,
}: {
    objectTypeDefinitionNode: ObjectTypeDefinitionNode;
    extensionsTypeMap: ObjectExtensionsTypeMap;
}): boolean {
    const { directives } = objectTypeDefinitionNode;
    const objectTypeExtensionNodes = extensionsTypeMap[objectTypeDefinitionNode.name.value]?.extensions;

    const extensionsDirectives = asArray(objectTypeExtensionNodes).flatMap((extensionNode) => {
        return extensionNode.directives ?? [];
    });
    const allDirectives = [...(directives ?? []), ...extensionsDirectives];

    const hasNodeDirective = allDirectives?.find((directive) => directive.name.value === nodeDirective.name);
    if (hasNodeDirective) {
        return true;
    }
    return false;
}

export function fieldIsInNodeType({
    path,
    ancestors,
    extensionsTypeMap,
}: {
    path: readonly (string | number)[];
    ancestors: readonly (ASTNode | readonly ASTNode[])[];
    extensionsTypeMap: ObjectExtensionsTypeMap;
}): boolean {
    const [pathToNode, _traversedDef, parentOfTraversedDef] = getPathToNode(path, ancestors);
    if (!parentOfTraversedDef) {
        throw new Error(
            `Validation error: field with path: ${pathToNode.join(", ")} is in a type that does not exist in the extensionsTypeMap`
        );
    }
    const parentTypeAndExtensions = extensionsTypeMap[parentOfTraversedDef.name.value];
    if (!parentTypeAndExtensions) {
        throw new Error(
            `Validation error: field with path: ${pathToNode.join(", ")} is in a type that does not exist in the extensionsTypeMap`
        );
    }
    const allDirectives = [
        ...(parentTypeAndExtensions.definition.directives ?? []),
        ...parentTypeAndExtensions.extensions.flatMap((ext) => ext.directives ?? []),
    ];
    const hasNodeDirective = allDirectives?.find((directive) => directive.name.value === nodeDirective.name);
    if (hasNodeDirective) {
        return true;
    }

    return false;
}

export function fieldIsInRelationshipPropertiesType({
    path,
    ancestors,
    extensionsTypeMap,
}: {
    path: readonly (string | number)[];
    ancestors: readonly (ASTNode | readonly ASTNode[])[];
    extensionsTypeMap: ObjectExtensionsTypeMap;
}): boolean {
    const [pathToNode, _traversedDef, parentOfTraversedDef] = getPathToNode(path, ancestors);
    if (!parentOfTraversedDef) {
        throw new Error(
            `Validation error: field with path: ${pathToNode.join(", ")} is in a type that does not exist in the extensionsTypeMap`
        );
    }
    const parentTypeAndExtensions = extensionsTypeMap[parentOfTraversedDef.name.value];
    if (!parentTypeAndExtensions) {
        throw new Error(
            `Validation error: field with path: ${pathToNode.join(", ")} is in a type that does not exist in the extensionsTypeMap`
        );
    }
    const allDirectives = [
        ...(parentTypeAndExtensions.definition.directives ?? []),
        ...parentTypeAndExtensions.extensions.flatMap((ext) => ext.directives ?? []),
    ];
    const hasRelationshipProperties = allDirectives?.find(
        (directive) => directive.name.value === relationshipPropertiesDirective.name
    );
    if (hasRelationshipProperties) {
        return true;
    }

    return false;
}

export function fieldIsInInterfaceType({
    path,
    ancestors,
    extensionsTypeMap,
}: {
    path: readonly (string | number)[];
    ancestors: readonly (ASTNode | readonly ASTNode[])[];
    extensionsTypeMap: ObjectExtensionsTypeMap;
}): boolean {
    const [pathToNode, _traversedDef, parentOfTraversedDef] = getPathToNode(path, ancestors);
    if (!parentOfTraversedDef) {
        throw new Error(
            `Validation error: field with path: ${pathToNode.join(", ")} is in a type that does not exist in the extensionsTypeMap`
        );
    }
    const parentTypeAndExtensions = extensionsTypeMap[parentOfTraversedDef.name.value];
    if (!parentTypeAndExtensions) {
        throw new Error(
            `Validation error: field with path: ${pathToNode.join(", ")} is in a type that does not exist in the extensionsTypeMap`
        );
    }
    if (parentTypeAndExtensions.definition.kind === Kind.INTERFACE_TYPE_DEFINITION) {
        return true;
    }
    return false;
}

export function fieldIsInRootType({
    path,
    ancestors,
    extensionsTypeMap,
}: {
    path: readonly (string | number)[];
    ancestors: readonly (ASTNode | readonly ASTNode[])[];
    extensionsTypeMap: ObjectExtensionsTypeMap;
}): boolean {
    const [pathToNode, _traversedDef, parentOfTraversedDef] = getPathToNode(path, ancestors);
    if (!parentOfTraversedDef) {
        throw new Error(
            `Validation error: field with path: ${pathToNode.join(", ")} is in a type that does not exist in the extensionsTypeMap`
        );
    }
    const parentTypeAndExtensions = extensionsTypeMap[parentOfTraversedDef.name.value];
    if (!parentTypeAndExtensions) {
        throw new Error(
            `Validation error: field with path: ${pathToNode.join(", ")} is in a type that does not exist in the extensionsTypeMap`
        );
    }
    if (isRootType(parentTypeAndExtensions.definition)) {
        return true;
    }
    return false;
}

export function fieldIsInSubscriptionType({
    path,
    ancestors,
    extensionsTypeMap,
}: {
    path: readonly (string | number)[];
    ancestors: readonly (ASTNode | readonly ASTNode[])[];
    extensionsTypeMap: ObjectExtensionsTypeMap;
}): boolean {
    const [pathToNode, _traversedDef, parentOfTraversedDef] = getPathToNode(path, ancestors);
    if (!parentOfTraversedDef) {
        throw new Error(
            `Validation error: field with path: ${pathToNode.join(", ")} is in a type that does not exist in the extensionsTypeMap`
        );
    }
    const parentTypeAndExtensions = extensionsTypeMap[parentOfTraversedDef.name.value];
    if (!parentTypeAndExtensions) {
        throw new Error(
            `Validation error: field with path: ${pathToNode.join(", ")} is in a type that does not exist in the extensionsTypeMap`
        );
    }
    if (parentTypeAndExtensions.definition.name.value === "Subscription") {
        return true;
    }
    return false;
}
