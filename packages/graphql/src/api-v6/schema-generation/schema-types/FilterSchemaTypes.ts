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

import type { InputTypeComposer } from "graphql-compose";
import { GraphQLBuiltInScalarType } from "../../../schema-model/attribute/AttributeType";
import type { ConcreteEntity } from "../../../schema-model/entity/ConcreteEntity";
import type { SchemaBuilder } from "../SchemaBuilder";
import type { SchemaTypes } from "./SchemaTypes";

export class FilterSchemaTypes {
    private entity: ConcreteEntity;
    private schemaTypes: SchemaTypes;
    private schemaBuilder: SchemaBuilder;

    constructor({
        entity,
        schemaBuilder,
        schemaTypes,
    }: {
        schemaBuilder: SchemaBuilder;
        entity: ConcreteEntity;
        schemaTypes: SchemaTypes;
    }) {
        this.schemaBuilder = schemaBuilder;
        this.schemaTypes = schemaTypes;
        this.entity = entity;
    }

    public get operationWhere(): InputTypeComposer {
        return this.schemaBuilder.getOrCreateInputType(this.entity.typeNames.operationWhere, () => {
            return {
                fields: {
                    AND: this.operationWhere.NonNull.List,
                    OR: this.operationWhere.NonNull.List,
                    NOT: this.operationWhere,
                    edges: this.edgeWhere,
                },
            };
        });
    }

    private get edgeWhere(): InputTypeComposer {
        return this.schemaBuilder.getOrCreateInputType(this.entity.typeNames.edgeWhere, () => {
            return {
                fields: {
                    AND: this.edgeWhere.NonNull.List,
                    OR: this.edgeWhere.NonNull.List,
                    NOT: this.edgeWhere,
                    node: this.nodeWhere,
                },
            };
        });
    }

    private get nodeWhere(): InputTypeComposer {
        return this.schemaBuilder.getOrCreateInputType(this.entity.typeNames.nodeWhere, () => {
            return {
                fields: {
                    AND: this.nodeWhere.NonNull.List,
                    OR: this.nodeWhere.NonNull.List,
                    NOT: this.nodeWhere,
                    ...this.propertyFilters,
                },
            };
        });
    }

    private get propertyFilters(): Record<string, InputTypeComposer> {
        const fields: ([string, InputTypeComposer] | [])[] = [...this.entity.attributes.values()].map((attribute) => {
            switch (attribute.type.name as GraphQLBuiltInScalarType) {
                case GraphQLBuiltInScalarType.String: {
                    return [attribute.name, this.schemaTypes.staticTypes.stringWhere];
                }

                case GraphQLBuiltInScalarType.Int: {
                    return [attribute.name, this.schemaTypes.staticTypes.intWhere];
                }

                case GraphQLBuiltInScalarType.Float: {
                    return [attribute.name, this.schemaTypes.staticTypes.floatWhere];
                }

                default: {
                    return [];
                }
            }
        });
        return Object.fromEntries(fields);
    }
}
