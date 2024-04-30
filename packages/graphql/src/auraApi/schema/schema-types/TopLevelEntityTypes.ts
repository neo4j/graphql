import type { ObjectTypeComposer } from "graphql-compose";
import { Memoize } from "typescript-memoize";
import type { ConcreteEntity } from "../../../schema-model/entity/ConcreteEntity";
import type { EntityTypeNames } from "../../graphQLTypeNames/EntityTypeNames";
import type { SchemaBuilder } from "../SchemaBuilder";
import { EntityTypes } from "./EntityTypes";
import { NestedEntitySchemaTypes } from "./NestedEntityTypes";
import type { StaticTypes } from "./StaticTypes";

export class TopLevelEntityTypes extends EntityTypes<EntityTypeNames> {
    private entity: ConcreteEntity;

    constructor({
        entity,
        schemaBuilder,
        staticTypes,
    }: {
        schemaBuilder: SchemaBuilder;
        entity: ConcreteEntity;
        staticTypes: StaticTypes;
    }) {
        super({
            schemaBuilder,
            entityTypes: entity.types,
            staticTypes,
        });
        this.entity = entity;
    }

    public get queryFieldName(): string {
        return this.entity.types.queryField;
    }

    @Memoize()
    public get nodeType(): string {
        const fields = this.getNodeFields(this.entity);
        const relationships = this.getRelationshipFields(this.entity);
        this.schemaBuilder.createObjectType(this.entity.types.nodeType, { ...fields, ...relationships });
        return this.entity.types.nodeType;
    }

    protected getEdgeProperties(): ObjectTypeComposer<any, any> | undefined {
        return undefined;
    }

    private getNodeFields(concreteEntity: ConcreteEntity): Record<string, string> {
        return Object.fromEntries(
            [...concreteEntity.attributes.values()].map((attribute) => [attribute.name, attribute.type.name])
        );
    }

    private getRelationshipFields(concreteEntity: ConcreteEntity): Record<string, ObjectTypeComposer> {
        return Object.fromEntries(
            [...concreteEntity.relationships.values()].map((relationship) => {
                const relationshipTypes = new NestedEntitySchemaTypes({
                    schemaBuilder: this.schemaBuilder,
                    relationship,
                    entityTypes: this.entity.types.relationship(relationship),
                    staticTypes: this.staticTypes,
                });
                const relationshipType = relationshipTypes.connectionOperation;

                return [relationship.name, relationshipType];
            })
        );
    }
}
