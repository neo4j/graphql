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
import type { SchemaBuilder } from "../../SchemaBuilder";
import type { SchemaTypes } from "../SchemaTypes";
import { FilterSchemaTypes } from "./FilterSchemaTypes";

export class TopLevelFilterSchemaTypes extends FilterSchemaTypes<ConcreteEntity> {
    constructor({
        entity,
        schemaBuilder,
        schemaTypes,
    }: {
        schemaBuilder: SchemaBuilder;
        entity: ConcreteEntity;
        schemaTypes: SchemaTypes;
    }) {
        super({ entity, schemaBuilder, schemaTypes });
    }

    protected get edgeWhere(): InputTypeComposer {
        return this.schemaBuilder.getOrCreateInputType(this.entity.typeNames.edgeWhere, (itc: InputTypeComposer) => {
            return {
                fields: {
                    AND: itc.NonNull.List,
                    OR: itc.NonNull.List,
                    NOT: itc,
                    node: this.nodeWhere,
                },
            };
        });
    }

    protected get nodeWhere(): InputTypeComposer {
        return this.schemaBuilder.getOrCreateInputType(this.entity.typeNames.nodeWhere, (itc: InputTypeComposer) => {
            return {
                fields: {
                    AND: itc.NonNull.List,
                    OR: itc.NonNull.List,
                    NOT: itc,
                    ...this.convertAttributesToFilters([...this.entity.attributes.values()]),
                },
            };
        });
    }
}
