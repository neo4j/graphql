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

import type { GraphQLScalarType } from "graphql";
import { GraphQLBoolean } from "graphql";
import type { InputTypeComposer } from "graphql-compose";
import type { Attribute } from "../../../../schema-model/attribute/Attribute";
import { GraphQLBuiltInScalarType } from "../../../../schema-model/attribute/AttributeType";
import type { ConcreteEntity } from "../../../../schema-model/entity/ConcreteEntity";
import type { Relationship } from "../../../../schema-model/relationship/Relationship";
import { filterTruthy } from "../../../../utils/utils";
import type { SchemaBuilder } from "../../SchemaBuilder";
import type { SchemaTypes } from "../SchemaTypes";

export abstract class FilterSchemaTypes<T extends ConcreteEntity | Relationship> {
    protected entity: T;
    protected schemaTypes: SchemaTypes;
    protected schemaBuilder: SchemaBuilder;

    constructor({
        entity,
        schemaBuilder,
        schemaTypes,
    }: {
        schemaBuilder: SchemaBuilder;
        entity: T;
        schemaTypes: SchemaTypes;
    }) {
        this.schemaBuilder = schemaBuilder;
        this.schemaTypes = schemaTypes;
        this.entity = entity;
    }

    public get operationWhere(): InputTypeComposer {
        return this.schemaBuilder.getOrCreateInputType(
            this.entity.typeNames.operationWhere,
            (itc: InputTypeComposer) => {
                return {
                    fields: {
                        AND: itc.NonNull.List,
                        OR: itc.NonNull.List,
                        NOT: itc,
                        edges: this.edgeWhere,
                    },
                };
            }
        );
    }

    protected convertAttributesToFilters(attributes: Attribute[]): Record<string, InputTypeComposer> {
        const fields: ([string, InputTypeComposer | GraphQLScalarType] | [])[] = filterTruthy(
            attributes.map((attribute) => {
                const filter = this.attributeToPropertyFilter(attribute);
                if (filter) {
                    return [attribute.name, filter];
                }
            })
        );
        return Object.fromEntries(fields);
    }

    private attributeToPropertyFilter(attribute: Attribute): GraphQLScalarType | InputTypeComposer | undefined {
        switch (attribute.type.name as GraphQLBuiltInScalarType) {
            case GraphQLBuiltInScalarType.Boolean: {
                return GraphQLBoolean;
            }

            case GraphQLBuiltInScalarType.String: {
                return this.schemaTypes.staticTypes.stringWhere;
            }

            case GraphQLBuiltInScalarType.ID: {
                return this.schemaTypes.staticTypes.idWhere;
            }

            case GraphQLBuiltInScalarType.Int: {
                return this.schemaTypes.staticTypes.intWhere;
            }

            case GraphQLBuiltInScalarType.Float: {
                return this.schemaTypes.staticTypes.floatWhere;
            }

            default: {
                return;
            }
        }
    }

    protected abstract get edgeWhere(): InputTypeComposer;
    protected abstract get nodeWhere(): InputTypeComposer;
}
