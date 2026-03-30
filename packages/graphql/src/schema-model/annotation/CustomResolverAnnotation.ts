/*
 * Copyright (c) "Neo4j"
 * Neo4j Sweden AB [http://neo4j.com]
 */

import type { DocumentNode, FieldDefinitionNode } from "graphql";
import { parse } from "graphql";
import type { ResolveTree } from "graphql-parse-resolve-info";
import { selectionSetToResolveTree } from "../../schema/selection-set-to-resolve-tree";
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
