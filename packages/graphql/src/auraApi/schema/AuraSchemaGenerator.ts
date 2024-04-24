import { printSchemaWithDirectives } from "@graphql-tools/utils";
import { type GraphQLSchema } from "graphql";
import type { Neo4jGraphQLSchemaModel } from "../../schema-model/Neo4jGraphQLSchemaModel";
import type { ConcreteEntity } from "../../schema-model/entity/ConcreteEntity";
import { AuraEntityOperations } from "../AuraEntityOperations";
import { SchemaBuilder } from "./SchemaBuilder";

export class AuraSchemaGenerator {
    private schemaBuilder: SchemaBuilder;

    constructor() {
        this.schemaBuilder = new SchemaBuilder();
    }

    public generate({ schemaModel }: { schemaModel: Neo4jGraphQLSchemaModel }): GraphQLSchema {
        // 1. Use the schemaModel
        // 2. Generate concrete specific types
        // 3. Generate static types

        this.createStaticTypes();
        for (const entity of schemaModel.entities.values()) {
            if (entity.isConcreteEntity()) {
                this.concreteEntitySteps(entity);
            }
        }

        const schema = this.schemaBuilder.build();
        console.log(printSchemaWithDirectives(schema));
        return schema;
    }

    private createStaticTypes() {
        // Steps are:
        // 1. PageInfo
        // 2. Others static types
        this.createPageInfoType();
    }
    private createPageInfoType() {
        this.schemaBuilder.createObjectType("PageInfo", { hasNextPage: "Boolean", hasPreviousPage: "Boolean" });
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
        this.createEntityConnectionType(concreteEntity);

        this.addQueryField(concreteEntity);
    }

    private addQueryField(concreteEntity: ConcreteEntity) {
        const entityOperations = new AuraEntityOperations(concreteEntity);
        this.schemaBuilder.addQueryField(concreteEntity.name, entityOperations.connectionType);
    }

    private createEntityConnectionType(concreteEntity: ConcreteEntity): void {
        const entityOperations = new AuraEntityOperations(concreteEntity);
        this.schemaBuilder.createObjectType(entityOperations.connectionType, this.getConnectionFields(concreteEntity));
    }

    private createEntityEdgeType(concreteEntity: ConcreteEntity): void {
        const entityOperations = new AuraEntityOperations(concreteEntity);
        this.schemaBuilder.createObjectType(entityOperations.edgeType, this.getEdgeFields(concreteEntity));
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

    private getConnectionFields(concreteEntity: ConcreteEntity): Record<string, any> {
        const concreteOperations = new AuraEntityOperations(concreteEntity);
        const pageInfo = this.schemaBuilder.getObjectType("PageInfo");
        const edges = this.schemaBuilder.getObjectType(concreteOperations.edgeType);
        return {
            pageInfo,
            edges,
        };
    }

    private getEdgeFields(concreteEntity: ConcreteEntity): Record<string, any> {
        const node = this.schemaBuilder.getObjectType(concreteEntity.name);
        return {
            node,
            cursor: "String",
            // TODO: FullText
        };
    }
}
