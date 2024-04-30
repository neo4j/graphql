import type { GraphQLSchema } from "graphql";
import type { Neo4jGraphQLSchemaModel } from "../../schema-model/Neo4jGraphQLSchemaModel";
import type { ConcreteEntity } from "../../schema-model/entity/ConcreteEntity";
import { AuraEntityOperations } from "../AuraEntityOperations";
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
                    entityOperations: new AuraEntityOperations(entity),
                });

                resultMap.set(entity, entitySchemaTypes);
            }
        }

        return resultMap;
    }
}
