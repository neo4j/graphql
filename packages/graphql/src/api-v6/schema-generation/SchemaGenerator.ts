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

import { type GraphQLSchema } from "graphql";
import type { Neo4jGraphQLSchemaModel } from "../../schema-model/Neo4jGraphQLSchemaModel";
import type { ConcreteEntity } from "../../schema-model/entity/ConcreteEntity";
import { generateGlobalNodeResolver } from "../resolvers/global-node-resolver";
import { generateReadResolver } from "../resolvers/read-resolver";
import { generateCreateResolver } from "../resolvers/translate-create-resolver";
import { generateDeleteResolver } from "../resolvers/translate-delete-resolver";
import { SchemaBuilder } from "./SchemaBuilder";
import { SchemaTypes } from "./schema-types/SchemaTypes";
import { StaticSchemaTypes } from "./schema-types/StaticSchemaTypes";
import { TopLevelEntitySchemaTypes } from "./schema-types/TopLevelEntitySchemaTypes";

export class SchemaGenerator {
    private schemaBuilder: SchemaBuilder;
    private staticTypes: StaticSchemaTypes;

    constructor() {
        this.schemaBuilder = new SchemaBuilder();
        this.staticTypes = new StaticSchemaTypes({ schemaBuilder: this.schemaBuilder });
    }

    public generate(schemaModel: Neo4jGraphQLSchemaModel): GraphQLSchema {
        const entityTypesMap = this.generateEntityTypes(schemaModel);
        this.generateTopLevelQueryFields(entityTypesMap);
        this.generateTopLevelCreateFields(entityTypesMap);
        this.generateTopLevelDeleteFields(entityTypesMap);

        this.generateGlobalNodeQueryField(schemaModel);

        return this.schemaBuilder.build();
    }

    private generateEntityTypes(schemaModel: Neo4jGraphQLSchemaModel): Map<ConcreteEntity, TopLevelEntitySchemaTypes> {
        const entityTypesMap = new Map<ConcreteEntity, TopLevelEntitySchemaTypes>();
        const schemaTypes = new SchemaTypes({
            staticTypes: this.staticTypes,
            entitySchemas: entityTypesMap,
        });

        for (const entity of schemaModel.entities.values()) {
            if (entity.isConcreteEntity()) {
                const entitySchemaTypes = new TopLevelEntitySchemaTypes({
                    entity,
                    schemaBuilder: this.schemaBuilder,
                    schemaTypes,
                });
                entityTypesMap.set(entity, entitySchemaTypes);
            }
        }

        return entityTypesMap;
    }

    private generateTopLevelQueryFields(entityTypesMap: Map<ConcreteEntity, TopLevelEntitySchemaTypes>): void {
        for (const [entity, entitySchemaTypes] of entityTypesMap.entries()) {
            const resolver = generateReadResolver({
                entity,
            });
            entitySchemaTypes.addTopLevelQueryField(resolver);
        }
    }

    private generateTopLevelCreateFields(entityTypesMap: Map<ConcreteEntity, TopLevelEntitySchemaTypes>): void {
        for (const [entity, entitySchemaTypes] of entityTypesMap.entries()) {
            const resolver = generateCreateResolver({
                entity,
            });
            entitySchemaTypes.addTopLevelCreateField(resolver);
        }
    }

    private generateTopLevelDeleteFields(entityTypesMap: Map<ConcreteEntity, TopLevelEntitySchemaTypes>): void {
        for (const [entity, entitySchemaTypes] of entityTypesMap.entries()) {
            const resolver = generateDeleteResolver({
                entity,
            });
            entitySchemaTypes.addTopLevelDeleteField(resolver);
        }
    }

    private generateGlobalNodeQueryField(schemaModel: Neo4jGraphQLSchemaModel): void {
        const globalEntities = schemaModel.concreteEntities.filter((e) => e.globalIdField);

        if (globalEntities.length > 0) {
            this.schemaBuilder.addQueryField({
                name: "node",
                type: this.staticTypes.globalNodeInterface,
                args: {
                    id: this.schemaBuilder.types.id.NonNull,
                },
                description: "Fetches an object given its ID",
                resolver: generateGlobalNodeResolver({ globalEntities }),
            });
        }
    }
}
