import type { ObjectTypeComposer } from "graphql-compose";
import { Memoize } from "typescript-memoize";
import type { ConcreteEntity } from "../../schema-model/entity/ConcreteEntity";
import { AuraEntityOperations } from "../AuraEntityOperations";
import type { StaticTypes } from "./AuraSchemaGenerator";
import type { SchemaBuilder } from "./SchemaBuilder";

export class EntitySchemaTypes {
    private schemaBuilder: SchemaBuilder;
    private entityOperations: AuraEntityOperations;
    private entity: ConcreteEntity;
    private staticTypes: StaticTypes;

    constructor({
        schemaBuilder,
        entity,
        staticTypes,
    }: {
        schemaBuilder: SchemaBuilder;
        entity: ConcreteEntity;
        staticTypes: StaticTypes;
    }) {
        this.schemaBuilder = schemaBuilder;
        this.entityOperations = new AuraEntityOperations(entity);
        this.entity = entity;
        this.staticTypes = staticTypes;
    }

    @Memoize()
    public get nodeType(): ObjectTypeComposer {
        const fields = this.getObjectFields(this.entity);
        return this.schemaBuilder.createObjectType(this.entityOperations.nodeType, fields);
    }

    @Memoize()
    public get edge(): ObjectTypeComposer {
        return this.schemaBuilder.createObjectType(this.entityOperations.edgeType, {
            node: this.nodeType,
            cursor: "String",
        });
    }

    @Memoize()
    public get connection(): ObjectTypeComposer {
        return this.schemaBuilder.createObjectType(this.entityOperations.connectionType, {
            pageInfo: this.staticTypes.pageInfo,
            edges: [this.edge],
        });
    }

    @Memoize()
    public get connectionOperation(): ObjectTypeComposer {
        return this.schemaBuilder.createObjectType(this.entityOperations.connectionOperation, {
            connection: this.connection,
        });
    }

    public get queryFieldName(): string {
        return this.entityOperations.queryField;
    }

    private getObjectFields(concreteEntity: ConcreteEntity): Record<string, string> {
        return Object.fromEntries(
            [...concreteEntity.attributes.values()].map((attribute) => [attribute.name, attribute.type.name])
        );
    }
}
