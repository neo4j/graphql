import type { GraphQLSchema } from "graphql";
import { type ObjectTypeComposer } from "graphql-compose";
import { Memoize } from "typescript-memoize";
import type { Neo4jGraphQLSchemaModel } from "../../schema-model/Neo4jGraphQLSchemaModel";
import type { ConcreteEntity } from "../../schema-model/entity/ConcreteEntity";
import { generateReadResolver } from "../resolvers/readResolver";
import { EntitySchemaTypes } from "./EntitySchemaTypes";
import { SchemaBuilder } from "./SchemaBuilder";

export type StaticTypes = Record<"pageInfo", ObjectTypeComposer>;

export class AuraSchemaGenerator {
    private schemaBuilder: SchemaBuilder;

    private entityTypes: Map<ConcreteEntity, EntitySchemaTypes>;

    constructor(schemaModel: Neo4jGraphQLSchemaModel) {
        this.schemaBuilder = new SchemaBuilder();
        this.entityTypes = this.generateEntityTypes(schemaModel);
    }

    public generate(): GraphQLSchema {
        this.createQueryFields();

        return this.schemaBuilder.build();
    }

    private createQueryFields(): void {
        this.entityTypes.forEach((entitySchemaTypes, entity) => {
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

    @Memoize()
    private get staticTypes(): StaticTypes {
        return {
            pageInfo: this.createPageInfoType(),
        } as const;
    }

    private generateEntityTypes(schemaModel: Neo4jGraphQLSchemaModel): Map<ConcreteEntity, EntitySchemaTypes> {
        const resultMap = new Map<ConcreteEntity, EntitySchemaTypes>();
        for (const entity of schemaModel.entities.values()) {
            if (entity.isConcreteEntity()) {
                const entitySchemaTypes = new EntitySchemaTypes({
                    entity,
                    schemaBuilder: this.schemaBuilder,
                    staticTypes: this.staticTypes,
                });

                resultMap.set(entity, entitySchemaTypes);
            }
        }

        return resultMap;
    }

    private createPageInfoType(): ObjectTypeComposer {
        return this.schemaBuilder.createObjectType("PageInfo", { hasNextPage: "Boolean", hasPreviousPage: "Boolean" });
    }
}
