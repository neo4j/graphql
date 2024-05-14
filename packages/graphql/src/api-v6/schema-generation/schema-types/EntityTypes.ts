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

import type { EnumTypeComposer, InputTypeComposer, ObjectTypeComposer } from "graphql-compose";
import { Memoize } from "typescript-memoize";
import type { Attribute } from "../../../schema-model/attribute/Attribute";
import type { EntityTypeNames } from "../../schema-model/graphql-type-names/EntityTypeNames";
import type { SchemaBuilder } from "../SchemaBuilder";
import type { StaticTypes } from "./StaticTypes";

/** This class defines the GraphQL types for an entity */
export abstract class EntityTypes<T extends EntityTypeNames> {
    protected schemaBuilder: SchemaBuilder;
    protected entityTypeNames: T;
    protected staticTypes: StaticTypes;

    constructor({
        schemaBuilder,
        entityTypeNames,
        staticTypes,
    }: {
        schemaBuilder: SchemaBuilder;
        staticTypes: StaticTypes;
        entityTypeNames: T;
    }) {
        this.schemaBuilder = schemaBuilder;
        this.entityTypeNames = entityTypeNames;
        this.staticTypes = staticTypes;
    }

    @Memoize()
    public get connectionOperation(): ObjectTypeComposer {
        return this.schemaBuilder.createObjectType(this.entityTypeNames.connectionOperation, {
            connection: {
                type: this.connection,
                args: this.connectionArgs,
            },
        });
    }

    @Memoize()
    public get connection(): ObjectTypeComposer {
        return this.schemaBuilder.createObjectType(this.entityTypeNames.connection, {
            pageInfo: this.staticTypes.pageInfo,
            edges: this.edge.List,
        });
    }

    @Memoize()
    protected get connectionArgs(): { sort: InputTypeComposer } {
        return {
            sort: this.connectionSort,
        };
    }

    @Memoize()
    public get connectionSort(): InputTypeComposer {
        return this.schemaBuilder.createInputObjectType(this.entityTypeNames.connectionSort, {
            edges: this.edgeSort.NonNull.List,
        });
    }

    @Memoize()
    public get edgeSort(): InputTypeComposer {
        const edgeSortFields = {
            node: this.nodeSortType,
        };
        const properties = this.getEdgeSortProperties();
        if (properties) {
            edgeSortFields["properties"] = properties;
        }

        return this.schemaBuilder.createInputObjectType(this.entityTypeNames.edgeSort, edgeSortFields);
    }

    @Memoize()
    public get sortFields(): Record<string, EnumTypeComposer> {
        return Object.fromEntries(this.getFields().map((field) => [field.name, this.staticTypes.sortDirection]));
    }

    @Memoize()
    public get edge(): ObjectTypeComposer {
        const fields = {
            node: this.nodeType,
            cursor: "String",
        };

        const properties = this.getEdgeProperties();
        if (properties) {
            fields["properties"] = properties;
        }

        return this.schemaBuilder.createObjectType(this.entityTypeNames.edge, fields);
    }

    protected abstract getEdgeProperties(): ObjectTypeComposer | undefined;
    protected abstract getEdgeSortProperties(): InputTypeComposer | undefined;
    protected abstract getFields(): Attribute[];
    public abstract get nodeType(): string;
    public abstract get nodeSortType(): string;
}
