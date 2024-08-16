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
import type { ConcreteEntity } from "../../../../schema-model/entity/ConcreteEntity";
import type { TopLevelEntityTypeNames } from "../../../schema-model/graphql-type-names/TopLevelEntityTypeNames";
import type { InputFieldDefinition, SchemaBuilder } from "../../SchemaBuilder";
import type { SchemaTypes } from "../SchemaTypes";
import { RelatedEntityDeleteSchemaTypes } from "./RelatedEntityDeleteSchemaTypes";

export class TopLevelDeleteSchemaTypes {
    private entityTypeNames: TopLevelEntityTypeNames;
    private schemaBuilder: SchemaBuilder;
    private entity: ConcreteEntity;
    private schemaTypes: SchemaTypes;

    constructor({
        entity,
        schemaBuilder,
        schemaTypes,
    }: {
        entity: ConcreteEntity;
        schemaBuilder: SchemaBuilder;
        schemaTypes: SchemaTypes;
    }) {
        this.entity = entity;
        this.entityTypeNames = entity.typeNames;
        this.schemaBuilder = schemaBuilder;
        this.schemaTypes = schemaTypes;
    }

    public get deleteInput(): InputTypeComposer {
        return this.schemaBuilder.getOrCreateInputType(this.entityTypeNames.deleteInput, (_itc: InputTypeComposer) => {
            return {
                fields: {
                    node: this.deleteNode,
                },
            };
        });
    }

    public get deleteNode(): InputTypeComposer {
        return this.schemaBuilder.getOrCreateInputType(this.entityTypeNames.deleteNode, (_itc: InputTypeComposer) => {
            const relationshipFields = Array.from(this.entity.relationships.values()).reduce<
                Record<string, InputFieldDefinition>
            >((acc, relationship) => {
                const relatedEntityDeleteSchemaTypes = new RelatedEntityDeleteSchemaTypes({
                    relationship,
                    schemaBuilder: this.schemaBuilder,
                    schemaTypes: this.schemaTypes,
                });
                acc[relationship.name] = {
                    type: relatedEntityDeleteSchemaTypes.deleteOperation,
                };
                return acc;
            }, {});

            const inputFields: Record<string, InputFieldDefinition> = {
                ...relationshipFields,
            };

            const isEmpty = Object.keys(inputFields).length === 0;
            const fields = isEmpty ? { _emptyInput: this.schemaBuilder.types.boolean } : inputFields;
            return {
                fields,
            };
        });
    }
}
