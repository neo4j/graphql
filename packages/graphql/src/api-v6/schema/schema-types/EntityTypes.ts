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

import type { InputTypeComposer, ListComposer, NonNullComposer, ObjectTypeComposer } from "graphql-compose";
import { Memoize } from "typescript-memoize";
import type { Attribute } from "../../../schema-model/attribute/Attribute";
import type { EntityTypeNames } from "../../graphQLTypeNames/EntityTypeNames";
import type { SchemaBuilder } from "../SchemaBuilder";
import type { StaticTypes } from "./StaticTypes";

/** This class defines the GraphQL types for an entity */
export abstract class EntityTypes<T extends EntityTypeNames> {
    protected schemaBuilder: SchemaBuilder;
    protected entityTypes: T;
    protected staticTypes: StaticTypes;

    constructor({
        schemaBuilder,
        entityTypes,
        staticTypes,
    }: {
        schemaBuilder: SchemaBuilder;
        staticTypes: StaticTypes;
        entityTypes: T;
    }) {
        this.schemaBuilder = schemaBuilder;
        this.entityTypes = entityTypes;
        this.staticTypes = staticTypes;
    }

    @Memoize()
    public get connectionOperation(): ObjectTypeComposer {
        return this.schemaBuilder.createObjectType(this.entityTypes.connectionOperation, {
            connection: {
                type: this.connection,
                args: this.getConnectionArgs(),
            },
        });
    }

    @Memoize()
    public get connection(): ObjectTypeComposer {
        return this.schemaBuilder.createObjectType(this.entityTypes.connectionType, {
            pageInfo: this.staticTypes.pageInfo,
            edges: this.edge.List,
        });
    }

    @Memoize()
    public get connectionArgs(): InputTypeComposer {
        return this.schemaBuilder.createInputObjectType(this.entityTypes.connectionSortType, {
            edges: this.edgeSort,
        });
    }

    @Memoize()
    public get connectionSort(): InputTypeComposer {
        return this.schemaBuilder.createInputObjectType(this.entityTypes.connectionSortType, {
            edges: this.edgeSort,
        });
    }

    @Memoize()
    public get edgeSort(): InputTypeComposer {
        return this.schemaBuilder.createInputObjectType(this.entityTypes.edgeSortType, {
            node: this.nodeSort,
        });
    }

    @Memoize()
    public get nodeSort(): InputTypeComposer {
        const fields = this.getFields();
        const sortFields = Object.fromEntries(fields.map((field) => [field.name, this.staticTypes.sortDirection]));
        return this.schemaBuilder.createInputObjectType(this.entityTypes.nodeSortType, sortFields);
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

        return this.schemaBuilder.createObjectType(this.entityTypes.edgeType, fields);
    }

    // sort is optional because relationship sort is not yet implemented
    protected abstract getConnectionArgs(): { sort?: ListComposer<NonNullComposer<InputTypeComposer>> };
    protected abstract getEdgeProperties(): ObjectTypeComposer | undefined;
    protected abstract getFields(): Attribute[];
    public abstract get nodeType(): string;
}
