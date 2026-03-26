/*
 * Copyright (c) "Neo4j"
 * Neo4j Sweden AB [http://neo4j.com]
 */

import { RelationshipBaseOperations } from "./RelationshipBaseOperations";
import type { RelationshipDeclarationAdapter } from "./RelationshipDeclarationAdapter";

export class RelationshipDeclarationOperations extends RelationshipBaseOperations<RelationshipDeclarationAdapter> {
    constructor(relationshipDeclaration: RelationshipDeclarationAdapter) {
        super(relationshipDeclaration);
    }

    protected get fieldInputPrefixForTypename(): string {
        return this.relationship.source.name;
    }

    protected get edgePrefix(): string {
        return `${this.prefixForTypename}Edge`;
    }

    public get relationshipPropertiesFieldTypename(): string {
        return `${this.relationshipFieldTypename}Properties`;
    }

    public get relationshipFiltersTypeName(): string {
        return `${this.relationship.target.name}RelationshipFilters`;
    }

    public get connectionFiltersTypeName(): string {
        return `${this.prefixForTypename}ConnectionFilters`;
    }
}
