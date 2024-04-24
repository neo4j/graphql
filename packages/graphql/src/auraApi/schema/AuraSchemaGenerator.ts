import { type GraphQLSchema } from "graphql";
import { type ObjectTypeComposer } from "graphql-compose";
import { Memoize } from "typescript-memoize";
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
        for (const entity of schemaModel.entities.values()) {
            if (entity.isConcreteEntity()) {
                this.generateTypesForConcreteEntity(entity);
            }
        }

        const schema = this.schemaBuilder.build();
        return schema;
    }

    @Memoize()
    private get staticTypes() {
        return {
            pageInfo: this.createPageInfoType(),
        } as const;
    }

    private createPageInfoType(): ObjectTypeComposer {
        return this.schemaBuilder.createObjectType("PageInfo", { hasNextPage: "Boolean", hasPreviousPage: "Boolean" });
    }

    private generateTypesForConcreteEntity(concreteEntity: ConcreteEntity) {
        const entityOperations = new AuraEntityOperations(concreteEntity);

        const entityOperationType = this.createEntityOperationType(entityOperations, concreteEntity);

        this.schemaBuilder.addQueryField(entityOperations.plural, entityOperationType);
    }

    private createEntityOperationType(
        entityOperations: AuraEntityOperations,
        concreteEntity: ConcreteEntity
    ): ObjectTypeComposer {
        const nodeType = this.createEntityType(entityOperations.nodeType, concreteEntity);

        const edgeType = this.schemaBuilder.createObjectType(entityOperations.edgeType, {
            node: nodeType,
            cursor: "String",
        });

        const connectionType = this.schemaBuilder.createObjectType(entityOperations.connectionType, {
            pageInfo: this.staticTypes.pageInfo,
            edges: [edgeType],
        });

        const connectionOperation = this.schemaBuilder.createObjectType(entityOperations.connectionOperation, {
            connection: connectionType,
        });

        return connectionOperation;
    }

    private createEntityType(nodeType: string, concreteEntity: ConcreteEntity): ObjectTypeComposer {
        const fields = this.getObjectFields(concreteEntity);
        return this.schemaBuilder.createObjectType(nodeType, fields);
    }

    private getObjectFields(concreteEntity: ConcreteEntity): Record<string, string> {
        return Object.fromEntries(
            [...concreteEntity.attributes.values()].map((attribute) => [attribute.name, attribute.type.name])
        );
    }
}
