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

import type { DocumentNode, FieldDefinitionNode } from "graphql";
import { parse } from "graphql";
import type { ResolveTree } from "graphql-parse-resolve-info";
import { selectionSetToResolveTree } from "../../schema/get-custom-resolver-meta";
import { getDefinitionCollection } from "../parser/definition-collection";
import type { Annotation } from "./Annotation";

export class CustomResolverAnnotation implements Annotation {
    readonly name = "customResolver";
    public readonly requires: string | undefined;
    public parsedRequires: Record<string, ResolveTree> | undefined;

    constructor({ requires }: { requires: string | undefined }) {
        this.requires = requires;
    }

    public parseRequire(document: DocumentNode, objectFields?: ReadonlyArray<FieldDefinitionNode>): void {
        if (!this.requires) {
            return;
        }
        const definitionCollection = getDefinitionCollection(document);

        const { interfaceTypes, objectTypes, unionTypes } = definitionCollection;

        const selectionSetDocument = parse(`{ ${this.requires} }`);
        // TODO: likely selectionSetToResolveTree could be change to accept Maps instead of Arrays.
        // initially these were arrays as they were coming from getDefinitionNodes that was returning arrays
        this.parsedRequires = selectionSetToResolveTree(
            objectFields || [],
            [...objectTypes.values()],
            [...interfaceTypes.values()],
            [...unionTypes.values()],
            selectionSetDocument
        );
    }
}
