import type { ObjectTypeComposer } from "graphql-compose";
import { Memoize } from "typescript-memoize";
import { ConcreteEntity } from "../../schema-model/entity/ConcreteEntity";
import type { Relationship } from "../../schema-model/relationship/Relationship";
import type { AuraRelationshipOperations } from "../AuraEntityOperations";
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

    public get queryFieldName(): string {
        return this.entityOperations.queryField;
    }

    @Memoize()
    public get connectionOperation(): ObjectTypeComposer {
        return this.schemaBuilder.createObjectType(this.entityOperations.connectionOperation, {
            connection: this.connection,
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
    public get edge(): ObjectTypeComposer {
        return this.schemaBuilder.createObjectType(this.entityOperations.edgeType, {
            node: this.nodeType,
            cursor: "String",
        });
    }

    @Memoize()
    public get nodeType(): ObjectTypeComposer {
        const fields = this.getObjectFields(this.entity);
        const relationships = this.getRelationshipFields(this.entity);
        return this.schemaBuilder.createObjectType(this.entityOperations.nodeType, { ...fields, ...relationships });
    }

    private getObjectFields(concreteEntity: ConcreteEntity): Record<string, string> {
        return Object.fromEntries(
            [...concreteEntity.attributes.values()].map((attribute) => [attribute.name, attribute.type.name])
        );
    }

    private getRelationshipFields(concreteEntity: ConcreteEntity): Record<string, ObjectTypeComposer> {
        return Object.fromEntries(
            [...concreteEntity.relationships.values()].map((relationship) => {
                const relationshipTypes = new RelationshipSchemaTypes({
                    schemaBuilder: this.schemaBuilder,
                    relationship,
                    entityOperations: this.entityOperations,
                    staticTypes: this.staticTypes,
                });
                const relationshipType = relationshipTypes.readOperation;

                return [relationship.name, relationshipType];
            })
        );
    }
}

class RelationshipSchemaTypes {
    private schemaBuilder: SchemaBuilder;
    private relationshipOperations: AuraRelationshipOperations;
    private relationship: Relationship;
    private staticTypes: StaticTypes;

    constructor({
        schemaBuilder,
        relationship,
        entityOperations,
        staticTypes,
    }: {
        schemaBuilder: SchemaBuilder;
        relationship: Relationship;
        entityOperations: AuraEntityOperations;
        staticTypes: StaticTypes;
    }) {
        this.schemaBuilder = schemaBuilder;
        this.relationshipOperations = entityOperations.relationship(relationship);
        this.relationship = relationship;
        this.staticTypes = staticTypes;
    }

    @Memoize()
    public get readOperation() {
        return this.schemaBuilder.createObjectType(this.relationshipOperations.connectionOperation, {
            connection: this.connection,
        });
    }

    @Memoize()
    public get connection(): ObjectTypeComposer {
        return this.schemaBuilder.createObjectType(this.relationshipOperations.connectionType, {
            pageInfo: this.staticTypes.pageInfo,
            edges: [this.edge],
        });
    }

    @Memoize()
    public get edge(): ObjectTypeComposer {
        const fields = {
            node: this.nodeType,
            cursor: "String",
        };

        const properties = this.relationshipProperties;
        if (properties) {
            fields["properties"] = properties;
        }

        return this.schemaBuilder.createObjectType(this.relationshipOperations.edgeType, fields);
    }

    // TODO: fix it using memoize
    public get relationshipProperties(): ObjectTypeComposer | undefined {
        if (this.relationshipOperations.propertiesType) {
            const fields = this.getRelationshipFields(this.relationship);
            return this.schemaBuilder.getOrCreateObjectType(this.relationshipOperations.propertiesType, fields);
        }
    }

    @Memoize()
    public get nodeType(): string {
        const target = this.relationship.target;
        if (!(target instanceof ConcreteEntity)) {
            throw new Error("Interfaces not supported yet");
        }
        const targetOperations = new AuraEntityOperations(target);
        return targetOperations.nodeType;
    }

    private getRelationshipFields(relationship: Relationship): Record<string, string> {
        return Object.fromEntries(
            [...relationship.attributes.values()].map((attribute) => [attribute.name, attribute.type.name])
        );
    }
}
