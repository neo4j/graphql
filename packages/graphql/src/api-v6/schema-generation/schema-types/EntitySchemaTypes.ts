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

import type { InputTypeComposer, ObjectTypeComposer } from "graphql-compose";
import { Memoize } from "typescript-memoize";
import type { EntityTypeNames } from "../../schema-model/graphql-type-names/EntityTypeNames";
import type { SchemaBuilder } from "../SchemaBuilder";
import type { StaticSchemaTypes } from "./StaticSchemaTypes";

/** This class defines the GraphQL types for an entity */
export abstract class EntitySchemaTypes<T extends EntityTypeNames> {
    protected schemaBuilder: SchemaBuilder;
    protected entityTypeNames: T;
    protected staticTypes: StaticSchemaTypes;

    constructor({
        schemaBuilder,
        entityTypeNames,
        staticTypes,
    }: {
        schemaBuilder: SchemaBuilder;
        staticTypes: StaticSchemaTypes;
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
                args: {
                    sort: this.connectionSort,
                },
            },
        });
    }

    protected get connection(): ObjectTypeComposer {
        return this.schemaBuilder.createObjectType(this.entityTypeNames.connection, {
            pageInfo: this.staticTypes.pageInfo,
            edges: this.edge.List,
        });
    }

    protected get connectionSort(): InputTypeComposer {
        return this.schemaBuilder.createInputObjectType(this.entityTypeNames.connectionSort, {
            edges: this.edgeSort.NonNull.List,
        });
    }

    protected abstract get edgeSort(): InputTypeComposer;
    protected abstract get edge(): ObjectTypeComposer;

    public abstract get nodeType(): string;
    public abstract get nodeSort(): string;
}
