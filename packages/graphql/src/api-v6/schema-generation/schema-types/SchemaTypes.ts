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

import type { ConcreteEntity } from "../../../schema-model/entity/ConcreteEntity";
import type { StaticSchemaTypes } from "./StaticSchemaTypes";
import type { TopLevelEntitySchemaTypes } from "./TopLevelEntitySchemaTypes";

export class SchemaTypes {
    public readonly staticTypes: StaticSchemaTypes;
    private entitySchemas: Map<ConcreteEntity, TopLevelEntitySchemaTypes>;

    constructor({
        staticTypes,
        entitySchemas,
    }: {
        staticTypes: StaticSchemaTypes;
        entitySchemas: Map<ConcreteEntity, TopLevelEntitySchemaTypes>;
    }) {
        this.staticTypes = staticTypes;
        this.entitySchemas = entitySchemas;
    }

    public getEntitySchemaTypes(entity: ConcreteEntity): TopLevelEntitySchemaTypes {
        const entitySchema = this.entitySchemas.get(entity);
        if (!entitySchema) {
            throw new Error("EntitySchema not found");
        }

        return entitySchema;
    }
}
