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

import pluralize from "pluralize";
import type { RelationshipAdapter } from "../../relationship/model-adapters/RelationshipAdapter";
import type { RelationshipDeclarationAdapter } from "../../relationship/model-adapters/RelationshipDeclarationAdapter";

export class ListFiltersAdapter {
    readonly relationshipAdapter: RelationshipAdapter | RelationshipDeclarationAdapter;

    constructor(relationshipAdapter: RelationshipAdapter | RelationshipDeclarationAdapter) {
        if (!relationshipAdapter.isList) {
            throw new Error("Relationship field is not a list");
        }
        this.relationshipAdapter = relationshipAdapter;
    }

    getAll(): { type: string; description: string } {
        return {
            type: `${this.relationshipAdapter.name}_ALL`,
            description: `Return ${pluralize(
                this.relationshipAdapter.source.name
            )} where all of the related ${pluralize(this.relationshipAdapter.target.name)} match this filter`,
        };
    }

    getNone(): { type: string; description: string } {
        return {
            type: `${this.relationshipAdapter.name}_NONE`,
            description: `Return ${pluralize(
                this.relationshipAdapter.source.name
            )} where none of the related ${pluralize(this.relationshipAdapter.target.name)} match this filter`,
        };
    }

    getSingle(): { type: string; description: string } {
        return {
            type: `${this.relationshipAdapter.name}_SINGLE`,
            description: `Return ${pluralize(
                this.relationshipAdapter.source.name
            )} where one of the related ${pluralize(this.relationshipAdapter.target.name)} match this filter`,
        };
    }

    getSome(): { type: string; description: string } {
        return {
            type: `${this.relationshipAdapter.name}_SOME`,
            description: `Return ${pluralize(
                this.relationshipAdapter.source.name
            )} where some of the related ${pluralize(this.relationshipAdapter.target.name)} match this filter`,
        };
    }

    get filters(): { type: string; description: string }[] {
        return [this.getAll(), this.getNone(), this.getSingle(), this.getSome()];
    }

    getConnectionAll(): { type: string; description: string } {
        return {
            type: `${this.relationshipAdapter.operations.connectionFieldName}_ALL`,
            description: `Return ${pluralize(
                this.relationshipAdapter.source.name
            )} where all of the related ${pluralize(
                this.relationshipAdapter.operations.connectionFieldTypename
            )} match this filter`,
        };
    }

    getConnectionNone(): { type: string; description: string } {
        return {
            type: `${this.relationshipAdapter.operations.connectionFieldName}_NONE`,
            description: `Return ${pluralize(
                this.relationshipAdapter.source.name
            )} where none of the related ${pluralize(
                this.relationshipAdapter.operations.connectionFieldTypename
            )} match this filter`,
        };
    }

    getConnectionSingle(): { type: string; description: string } {
        return {
            type: `${this.relationshipAdapter.operations.connectionFieldName}_SINGLE`,
            description: `Return ${pluralize(
                this.relationshipAdapter.source.name
            )} where one of the related ${pluralize(
                this.relationshipAdapter.operations.connectionFieldTypename
            )} match this filter`,
        };
    }

    getConnectionSome(): { type: string; description: string } {
        return {
            type: `${this.relationshipAdapter.operations.connectionFieldName}_SOME`,
            description: `Return ${pluralize(
                this.relationshipAdapter.source.name
            )} where some of the related ${pluralize(
                this.relationshipAdapter.operations.connectionFieldTypename
            )} match this filter`,
        };
    }

    get connectionFilters(): { type: string; description: string }[] {
        return [
            this.getConnectionAll(),
            this.getConnectionNone(),
            this.getConnectionSingle(),
            this.getConnectionSome(),
        ];
    }
}
