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
import { ConcreteEntity } from "../../../../schema-model/entity/ConcreteEntity";
import type { Relationship } from "../../../../schema-model/relationship/Relationship";
import type { SchemaBuilder } from "../../SchemaBuilder";
import { RelatedEntityFilterSchemaTypes } from "../filter-schema-types/RelatedEntityFilterSchemaTypes";
import type { SchemaTypes } from "../SchemaTypes";
import { TopLevelDeleteSchemaTypes } from "./TopLevelDeleteSchemaTypes";

export class RelatedEntityDeleteSchemaTypes {
    private relationship: Relationship;
    protected schemaTypes: SchemaTypes;
    private schemaBuilder: SchemaBuilder;
    constructor({
        relationship,
        schemaBuilder,
        schemaTypes,
    }: {
        schemaBuilder: SchemaBuilder;
        relationship: Relationship;
        schemaTypes: SchemaTypes;
    }) {
        this.relationship = relationship;
        this.schemaBuilder = schemaBuilder;
        this.schemaTypes = schemaTypes;
    }

    public get deleteOperation(): InputTypeComposer {
        return this.schemaBuilder.getOrCreateInputType(
            this.relationship.typeNames.deleteOperation,
            (_itc: InputTypeComposer) => {
                return {
                    fields: {
                        delete: this.deleteInput,
                    },
                };
            }
        );
    }

    public get deleteInput(): InputTypeComposer {
        const relatedFilterSchemaTypes = new RelatedEntityFilterSchemaTypes({
            schemaBuilder: this.schemaBuilder,
            relationship: this.relationship,
            schemaTypes: this.schemaTypes,
        });

        if (this.relationship.target instanceof ConcreteEntity) {
            const topLevelDeleteSchemaTypes = new TopLevelDeleteSchemaTypes({
                schemaBuilder: this.schemaBuilder,
                entity: this.relationship.target,
                schemaTypes: this.schemaTypes,
            });

            return this.schemaBuilder.getOrCreateInputType(
                this.relationship.typeNames.deleteInput,
                (_itc: InputTypeComposer) => {
                    return {
                        fields: {
                            input: topLevelDeleteSchemaTypes.deleteInput,
                            where: relatedFilterSchemaTypes.operationWhereTopLevel,
                        },
                    };
                }
            );
        } else {
            return this.schemaBuilder.getOrCreateInputType(
                this.relationship.typeNames.deleteInput,
                (_itc: InputTypeComposer) => {
                    return {
                        fields: {
                            where: relatedFilterSchemaTypes.operationWhereTopLevel,
                        },
                    };
                }
            );
        }
    }
}
