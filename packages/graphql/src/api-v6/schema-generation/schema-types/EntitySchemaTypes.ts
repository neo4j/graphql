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
    Directive,
    InputTypeComposer,
    ListComposer,
    NonNullComposer,
    ObjectTypeComposer,
    ScalarTypeComposer,
} from "graphql-compose";
import { connectionOperationResolver } from "../../resolvers/connection-operation-resolver";
import type { EntityTypeNames } from "../../schema-model/graphql-type-names/EntityTypeNames";
import type { SchemaBuilder } from "../SchemaBuilder";
import type { SchemaTypes } from "./SchemaTypes";

/** This class defines the GraphQL types for an entity */
export abstract class EntitySchemaTypes<T extends EntityTypeNames> {
    protected schemaBuilder: SchemaBuilder;
    protected entityTypeNames: T;
    protected schemaTypes: SchemaTypes;
    protected extraDirectives: Directive[] = [];

    constructor({
        schemaBuilder,
        entityTypeNames,
        schemaTypes,
    }: {
        schemaBuilder: SchemaBuilder;
        schemaTypes: SchemaTypes;
        entityTypeNames: T;
    }) {
        this.schemaBuilder = schemaBuilder;
        this.entityTypeNames = entityTypeNames;
        this.schemaTypes = schemaTypes;
    }

    public get connectionOperation(): ObjectTypeComposer {
        return this.schemaBuilder.getOrCreateObjectType(this.entityTypeNames.connectionOperation, () => {
            const args: {
                first: ScalarTypeComposer;
                after: ScalarTypeComposer;
                sort?: ListComposer<NonNullComposer<InputTypeComposer>>;
            } = {
                first: this.schemaBuilder.types.int,
                after: this.schemaBuilder.types.string,
            };
            if (this.isSortable()) {
                args.sort = this.connectionSort.NonNull.List;
            }
            return {
                fields: {
                    connection: {
                        type: this.connection,
                        args: args,
                        resolve: connectionOperationResolver,
                    },
                },
                directives: this.extraDirectives,
            };
        });
    }

    protected get connection(): ObjectTypeComposer {
        return this.schemaBuilder.getOrCreateObjectType(this.entityTypeNames.connection, () => {
            return {
                fields: {
                    pageInfo: this.schemaTypes.staticTypes.pageInfo,
                    edges: this.edge.List,
                },
                directives: this.extraDirectives,
            };
        });
    }

    protected get connectionSort(): InputTypeComposer {
        return this.schemaBuilder.getOrCreateInputType(this.entityTypeNames.connectionSort, () => {
            return {
                fields: {
                    edges: this.edgeSort,
                },
            };
        });
    }

    protected abstract get edgeSort(): InputTypeComposer;
    protected abstract get edge(): ObjectTypeComposer;

    public abstract get nodeType(): ObjectTypeComposer;
    public abstract get nodeSort(): InputTypeComposer;

    public abstract isSortable(): boolean;
}
