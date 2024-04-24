import { type GraphQLSchema } from "graphql";
import type { Neo4jGraphQLSchemaModel } from "../../schema-model/Neo4jGraphQLSchemaModel";
import type { ConcreteEntity } from "../../schema-model/entity/ConcreteEntity";
import { SchemaBuilder } from "./SchemaBuilder";

export class AuraSchemaGenerator {
    private schemaBuilder: SchemaBuilder;

    constructor() {
        this.schemaBuilder = new SchemaBuilder();
    }

    public generate({ schemaModel }: { schemaModel: Neo4jGraphQLSchemaModel }): GraphQLSchema {
        const schemaBuilder = new SchemaBuilder();

        // 1. Use the schemaModel
        for (const entity of schemaModel.entities.values()) {
            if (entity.isConcreteEntity()) {
                this.createObjectType(entity);
            }
        }

        return schemaBuilder.build();
    }

    private createObjectType(concreteEntity: ConcreteEntity): void {
        console.log(concreteEntity);

        this.schemaBuilder.createObjectType(concreteEntity.name);
    }
}
