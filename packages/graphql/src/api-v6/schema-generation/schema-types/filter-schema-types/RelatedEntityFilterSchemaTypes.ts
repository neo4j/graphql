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
import type { RelatedEntityTypeNames } from "../../../schema-model/graphql-type-names/RelatedEntityTypeNames";
import type { SchemaBuilder } from "../../SchemaBuilder";
import type { SchemaTypes } from "../SchemaTypes";
import { FilterSchemaTypes } from "./FilterSchemaTypes";

export class RelatedEntityFilterSchemaTypes extends FilterSchemaTypes<RelatedEntityTypeNames> {
    private relationship: Relationship;
    constructor({
        relationship,
        schemaBuilder,
        schemaTypes,
    }: {
        schemaBuilder: SchemaBuilder;
        relationship: Relationship;
        schemaTypes: SchemaTypes;
    }) {
        super({ entityTypeNames: relationship.typeNames, schemaBuilder, schemaTypes });
        this.relationship = relationship;
    }
    protected get edgeWhere(): InputTypeComposer {
        return this.schemaBuilder.getOrCreateInputType(this.entityTypeNames.edgeWhere, (itc: InputTypeComposer) => {
            const fields = {
                AND: itc.NonNull.List,
                OR: itc.NonNull.List,
                NOT: itc,
                node: this.nodeWhere,
            };
            const properties = this.propertiesWhere;
            if (properties) {
                fields["properties"] = properties;
            }
            return { fields };
        });
    }

    public get nestedOperationWhere(): InputTypeComposer {
        return this.schemaBuilder.getOrCreateInputType(
            this.relationship.typeNames.nestedOperationWhere,
            (itc: InputTypeComposer) => {
                return {
                    fields: {
                        AND: itc.NonNull.List,
                        OR: itc.NonNull.List,
                        NOT: itc,
                        all: this.edgeListWhere,
                        none: this.edgeListWhere,
                        single: this.edgeListWhere,
                        some: this.edgeListWhere,
                    },
                };
            }
        );
    }

    private get edgeListWhere(): InputTypeComposer {
        return this.schemaBuilder.getOrCreateInputType(this.entityTypeNames.edgeListWhere, (itc: InputTypeComposer) => {
            return {
                fields: {
                    AND: itc.NonNull.List,
                    OR: itc.NonNull.List,
                    NOT: itc,
                    edges: this.edgeWhere,
                },
            };
        });
    }

    protected get nodeWhere(): InputTypeComposer {
        const target = this.relationship.target;
        if (!(target instanceof ConcreteEntity)) {
            throw new Error("Interfaces not supported yet");
        }
        const targetSchemaTypes = this.schemaTypes.getEntitySchemaTypes(target);
        return targetSchemaTypes.nodeWhere;
    }

    private get propertiesWhere(): InputTypeComposer | undefined {
        if (this.entityTypeNames.properties) {
            return this.schemaBuilder.getOrCreateInputType(
                this.entityTypeNames.propertiesWhere,
                (itc: InputTypeComposer) => {
                    return {
                        fields: {
                            AND: itc.NonNull.List,
                            OR: itc.NonNull.List,
                            NOT: itc,
                            ...this.createPropertyFilters([...this.relationship.attributes.values()]),
                        },
                    };
                }
            );
        }
    }
}
