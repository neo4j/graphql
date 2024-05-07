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

import type { GraphQLSchema } from "graphql";
import type { Neo4jGraphQLSchemaModel } from "../../schema-model/Neo4jGraphQLSchemaModel";
import type { ConcreteEntity } from "../../schema-model/entity/ConcreteEntity";
import { generateReadResolver } from "../resolvers/readResolver";
import { SchemaBuilder } from "./SchemaBuilder";
import { StaticTypes } from "./schema-types/StaticTypes";
import { TopLevelEntityTypes } from "./schema-types/TopLevelEntityTypes";

export class AuraSchemaGenerator {
    private schemaBuilder: SchemaBuilder;

    constructor() {
        this.schemaBuilder = new SchemaBuilder();
    }

    public generate(schemaModel: Neo4jGraphQLSchemaModel): GraphQLSchema {
        const staticTypes = new StaticTypes({ schemaBuilder: this.schemaBuilder });
        const entityTypes = this.generateEntityTypes(schemaModel, staticTypes);
        this.createQueryFields(entityTypes);

        return this.schemaBuilder.build();
    }

    private createQueryFields(entityTypes: Map<ConcreteEntity, TopLevelEntityTypes>): void {
        entityTypes.forEach((entitySchemaTypes, entity) => {
            const resolver = generateReadResolver({
                entity,
            });
            this.schemaBuilder.addQueryField(
                entitySchemaTypes.queryFieldName,
                entitySchemaTypes.connectionOperation,
                resolver
            );
        });
    }

    private generateEntityTypes(
        schemaModel: Neo4jGraphQLSchemaModel,
        staticTypes: StaticTypes
    ): Map<ConcreteEntity, TopLevelEntityTypes> {
        const resultMap = new Map<ConcreteEntity, TopLevelEntityTypes>();
        for (const entity of schemaModel.entities.values()) {
            if (entity.isConcreteEntity()) {
                const entitySchemaTypes = new TopLevelEntityTypes({
                    entity,
                    schemaBuilder: this.schemaBuilder,
                    staticTypes,
                });

                resultMap.set(entity, entitySchemaTypes);
            }
        }

        return resultMap;
    }
}
