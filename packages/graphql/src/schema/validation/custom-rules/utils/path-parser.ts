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
import type { ASTNode, ObjectTypeDefinitionNode, FieldDefinitionNode, InterfaceTypeDefinitionNode } from "graphql";

export function getPathToNode(
    path: readonly (number | string)[],
    ancenstors: readonly (ASTNode | readonly ASTNode[])[]
): [
    Array<string>,
    ObjectTypeDefinitionNode | FieldDefinitionNode | InterfaceTypeDefinitionNode | undefined,
    ObjectTypeDefinitionNode | InterfaceTypeDefinitionNode | undefined
] {
    const documentASTNodes = ancenstors[1];
    if (!documentASTNodes || (Array.isArray(documentASTNodes) && !documentASTNodes.length)) {
        return [[], undefined, undefined];
    }
    const [, definitionIdx] = path;
    const traversedDefinition = documentASTNodes[definitionIdx as number];
    const pathToHere: (ObjectTypeDefinitionNode | InterfaceTypeDefinitionNode | FieldDefinitionNode)[] = [
        traversedDefinition,
    ];
    let lastSeenDefinition: ObjectTypeDefinitionNode | InterfaceTypeDefinitionNode | FieldDefinitionNode =
        traversedDefinition;
    const getNextDefinition = parsePath(path, traversedDefinition);
    for (const definition of getNextDefinition()) {
        lastSeenDefinition = definition;
        pathToHere.push(definition);
    }
    const parentOfLastSeenDefinition = pathToHere.slice(-2)[0] as
        | ObjectTypeDefinitionNode
        | InterfaceTypeDefinitionNode;
    return [pathToHere.map((n) => n.name?.value || "Schema"), lastSeenDefinition, parentOfLastSeenDefinition];
}

function parsePath(
    path: readonly (number | string)[],
    traversedDefinition: ObjectTypeDefinitionNode | InterfaceTypeDefinitionNode | FieldDefinitionNode
) {
    return function* getNextDefinition(idx = 2) {
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
