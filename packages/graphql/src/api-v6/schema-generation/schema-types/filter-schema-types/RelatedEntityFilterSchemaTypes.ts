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
import type { SchemaTypes } from "../SchemaTypes";
import { FilterSchemaTypes } from "./FilterSchemaTypes";

export class RelatedEntityFilterSchemaTypes extends FilterSchemaTypes<Relationship> {
    constructor({
        entity,
        schemaBuilder,
        schemaTypes,
    }: {
        schemaBuilder: SchemaBuilder;
        entity: Relationship;
        schemaTypes: SchemaTypes;
    }) {
        super({ entity, schemaBuilder, schemaTypes });
    }
    protected get edgeWhere(): InputTypeComposer {
        return this.schemaBuilder.getOrCreateInputType(this.entity.typeNames.edgeWhere, (itc: InputTypeComposer) => {
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

    protected get nodeWhere(): InputTypeComposer {
        return this.schemaBuilder.getOrCreateInputType(this.entity.typeNames.nodeWhere, (itc: InputTypeComposer) => {
            if (!(this.entity.target instanceof ConcreteEntity)) {
                throw new Error("Interface filters not supported yet.");
            }
            return {
                fields: {
                    AND: itc.NonNull.List,
                    OR: itc.NonNull.List,
                    NOT: itc,
                    ...this.convertAttributesToFilters([...this.entity.target.attributes.values()]),
                },
            };
        });
    }

    private get propertiesWhere(): InputTypeComposer | undefined {
        if (this.entity.typeNames.properties) {
            return this.schemaBuilder.getOrCreateInputType(
                this.entity.typeNames.propertiesWhere,
                (itc: InputTypeComposer) => {
                    return {
                        fields: {
                            AND: itc.NonNull.List,
                            OR: itc.NonNull.List,
                            NOT: itc,
                            ...this.convertAttributesToFilters([...this.entity.attributes.values()]),
                        },
                    };
                }
            );
        }
    }
}
