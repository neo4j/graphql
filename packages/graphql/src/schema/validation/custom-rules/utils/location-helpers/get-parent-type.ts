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

import { type ASTNode } from "graphql";
import type { TypeMapWithExtensions } from "../../../Neo4jValidationContext";
import { getPathToNode } from "../path-parser";

export function getParentType({
    path,
    ancestors,
    typeMapWithExtensions,
}: {
    path: readonly (string | number)[];
    ancestors: readonly (ASTNode | readonly ASTNode[])[];
    typeMapWithExtensions: TypeMapWithExtensions;
}) {
    const [pathToNode, _traversedDef, parentOfTraversedDef] = getPathToNode(path, ancestors);
    if (!parentOfTraversedDef) {
        throw new Error(
            `Internal validation error: field with path: ${pathToNode.join(", ")} is in a type that does not exist in the typeMapWithExtensions`
        );
    }
    const parentTypeAndExtensions = typeMapWithExtensions[parentOfTraversedDef.name.value];
    if (!parentTypeAndExtensions) {
        throw new Error(
            `Internal validation error: field with path: ${pathToNode.join(", ")} is in a type that does not exist in the typeMapWithExtensions`
        );
    }
    return parentTypeAndExtensions;
}
