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

import type { GraphQLResolveInfo, GraphQLSchema } from "graphql";
import type { Neo4jGraphQLSchemaModel } from "../../schema-model/Neo4jGraphQLSchemaModel";
import type { ConcreteEntity } from "../../schema-model/entity/ConcreteEntity";
import type { Neo4jGraphQLTranslationContext } from "../../types/neo4j-graphql-translation-context";
import { generateReadResolver } from "../resolvers/read-resolver";
import { SchemaBuilder } from "./SchemaBuilder";
import { SchemaTypes } from "./schema-types/SchemaTypes";
import { StaticSchemaTypes } from "./schema-types/StaticSchemaTypes";
import { TopLevelEntitySchemaTypes } from "./schema-types/TopLevelEntitySchemaTypes";

export class SchemaGenerator {
    private schemaBuilder: SchemaBuilder;

    constructor() {
        this.schemaBuilder = new SchemaBuilder();
    }

    public generate(schemaModel: Neo4jGraphQLSchemaModel): GraphQLSchema {
        const staticTypes = new StaticSchemaTypes({ schemaBuilder: this.schemaBuilder });
        this.generateEntityTypes(schemaModel, staticTypes);
        // Taken from makeAugmentedSchema
        // const hasGlobalNodes = addGlobalNodeFields(nodes, composer, schemaModel.concreteEntities);
        this.generateGlobalNodeQuery(schemaModel, staticTypes);

        return this.schemaBuilder.build();
    }

    private generateGlobalNodeQuery(schemaModel: Neo4jGraphQLSchemaModel, staticTypes: StaticSchemaTypes): void {
        for (const entity of schemaModel.entities.values()) {
            if (entity.isConcreteEntity() && entity.globalIdField) {
                // const globalEntities = schemaModel.concreteEntities
                //     .map((e) => new ConcreteEntityAdapter(e))
                //     .filter((e) => e.isGlobalNode());

                this.schemaBuilder.addQueryField({
                    name: "node",
                    type: staticTypes.globalNodeInterface,
                    args: {
                        id: "ID!",
                    },
                    description: "Fetches an object given its ID",
                    resolver(_root: any, args: any, context: Neo4jGraphQLTranslationContext, info: GraphQLResolveInfo) {
                        // TODO
                        return undefined;
                    },
                });
                return;
            }
        }
    }

    private generateEntityTypes(schemaModel: Neo4jGraphQLSchemaModel, staticTypes: StaticSchemaTypes): void {
        const resultMap = new Map<ConcreteEntity, TopLevelEntitySchemaTypes>();
        const schemaTypes = new SchemaTypes({
            staticTypes,
            entitySchemas: resultMap,
        });
        for (const entity of schemaModel.entities.values()) {
            if (entity.isConcreteEntity()) {
                const entitySchemaTypes = new TopLevelEntitySchemaTypes({
                    entity,
                    schemaBuilder: this.schemaBuilder,
                    schemaTypes,
                });
                resultMap.set(entity, entitySchemaTypes);
            }
        }
        for (const [entity, entitySchemaTypes] of resultMap.entries()) {
            const resolver = generateReadResolver({
                entity,
            });
            entitySchemaTypes.addTopLevelQueryField(resolver);
        }
    }
}
