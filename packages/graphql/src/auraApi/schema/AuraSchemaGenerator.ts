import { printSchemaWithDirectives } from "@graphql-tools/utils";
import { type GraphQLSchema } from "graphql";
import type { Neo4jGraphQLSchemaModel } from "../../schema-model/Neo4jGraphQLSchemaModel";
import type { ConcreteEntity } from "../../schema-model/entity/ConcreteEntity";
import { ConcreteEntityOperations } from "../AuraEntityOperations";
import { SchemaBuilder } from "./SchemaBuilder";

export class AuraSchemaGenerator {
    private schemaBuilder: SchemaBuilder;

    constructor() {
        this.schemaBuilder = new SchemaBuilder();
    }

    public generate({ schemaModel }: { schemaModel: Neo4jGraphQLSchemaModel }): GraphQLSchema {
        // 1. Use the schemaModel
        for (const entity of schemaModel.entities.values()) {
            if (entity.isConcreteEntity()) {
                this.concreteEntitySteps(entity);
            }
        }
        const schema = this.schemaBuilder.build();
        console.log(printSchemaWithDirectives(schema));
        return schema;
    }

    private concreteEntitySteps(concreteEntity: ConcreteEntity) {
        // steps are:
        // 1. Movie
        // 2. MovieEdge
        // 3. MovieConnection
        // 4. MovieOperation
        // 5. Query with movies: MovieOperation

        this.createEntityType(concreteEntity);
        this.createEntityEdgeType(concreteEntity);
        this.addQueryField(concreteEntity);
    }

    private addQueryField(concreteEntity: ConcreteEntity) {
        const objectType = this.schemaBuilder.getObjectType(concreteEntity.name);
        const entityOperations = new ConcreteEntityOperations(concreteEntity);
        this.schemaBuilder.addQueryField(concreteEntity.name, entityOperations.edgeType);
    }

    private createEntityEdgeType(concreteEntity: ConcreteEntity): void {
        const entityOperations = new ConcreteEntityOperations(concreteEntity);
        this.schemaBuilder.createObjectType(entityOperations.edgeType, entityOperations.edgeFields);
    }

    private createEntityType(concreteEntity: ConcreteEntity): void {
        const fields = this.getObjectFields(concreteEntity);
        this.schemaBuilder.createObjectType(concreteEntity.name, fields);
    }

    private getObjectFields(concreteEntity: ConcreteEntity): Record<string, string> {
        return Object.fromEntries(
            [...concreteEntity.attributes.values()].map((attribute) => [attribute.name, attribute.type.name])
        );
    }
}
