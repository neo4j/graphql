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
    ASTNode,
    ObjectTypeDefinitionNode,
    FieldDefinitionNode,
    InterfaceTypeDefinitionNode,
    ObjectTypeExtensionNode,
    InterfaceTypeExtensionNode,
} from "graphql";
import { Kind } from "graphql";

export type ObjectOrInterfaceWithExtensions =
    | ObjectTypeDefinitionNode
    | InterfaceTypeDefinitionNode
    | ObjectTypeExtensionNode
    | InterfaceTypeExtensionNode;

export function getPathToNode(
    path: readonly (number | string)[],
    ancestors: readonly (ASTNode | readonly ASTNode[])[]
): [
    Array<string>,
    ObjectOrInterfaceWithExtensions | FieldDefinitionNode | undefined,
    ObjectOrInterfaceWithExtensions | undefined
] {
    if (!ancestors || !ancestors[0]) {
        return [[], undefined, undefined];
    }
    let traversedDefinition, pathIdx;
    // if visiting from the document level
    if (!Array.isArray(ancestors[0]) && (ancestors[0] as ASTNode).kind === Kind.DOCUMENT) {
        const documentASTNodes = ancestors[1];
        if (!documentASTNodes || (Array.isArray(documentASTNodes) && !documentASTNodes.length)) {
            return [[], undefined, undefined];
        }
        const [, definitionIdx] = path;
        traversedDefinition = documentASTNodes[definitionIdx as number];
        pathIdx = 2;
    }
    // if visiting from inside another visitor
    if (!Array.isArray(ancestors[0]) && (ancestors[0] as ASTNode).kind !== Kind.DOCUMENT) {
        traversedDefinition = ancestors[0];
        pathIdx = 0;
    }
    const pathToHere: (ObjectOrInterfaceWithExtensions | FieldDefinitionNode)[] = [traversedDefinition];
    let lastSeenDefinition: ObjectOrInterfaceWithExtensions | FieldDefinitionNode = traversedDefinition;
    const getNextDefinition = parsePath(path, traversedDefinition, pathIdx);
    for (const definition of getNextDefinition()) {
        lastSeenDefinition = definition;
        pathToHere.push(definition);
    }
    const parentOfLastSeenDefinition = pathToHere.slice(-2)[0] as ObjectOrInterfaceWithExtensions;
    return [pathToHere.map((n) => n.name?.value || "Schema"), lastSeenDefinition, parentOfLastSeenDefinition];
}

function parsePath(
    path: readonly (number | string)[],
    traversedDefinition: ObjectOrInterfaceWithExtensions | FieldDefinitionNode,
    startingIdx: number
) {
    return function* getNextDefinition(idx = startingIdx) {
        while (path[idx] && path[idx] !== "directives") {
            // continue parsing for annotated fields
            const key = path[idx] as string;
            const idxAtKey = path[idx + 1] as number;
            traversedDefinition = traversedDefinition[key][idxAtKey];
            yield traversedDefinition;
            idx += 2;
        }
    };
}
