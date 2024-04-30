import type { ObjectTypeComposer } from "graphql-compose";
import { Memoize } from "typescript-memoize";
import { ConcreteEntity } from "../../../schema-model/entity/ConcreteEntity";
import type { Relationship } from "../../../schema-model/relationship/Relationship";
import type { RelationshipTypeNames } from "../../graphQLTypeNames/NestedEntityTypeNames";
import type { SchemaBuilder } from "../SchemaBuilder";
import { EntityTypes } from "./EntityTypes";
import type { StaticTypes } from "./StaticTypes";

export class NestedEntitySchemaTypes extends EntityTypes<RelationshipTypeNames> {
    private relationship: Relationship;

    constructor({
        relationship,
        schemaBuilder,
        entityTypes,
        staticTypes,
    }: {
        schemaBuilder: SchemaBuilder;
        relationship: Relationship;
        staticTypes: StaticTypes;
        entityTypes: RelationshipTypeNames;
    }) {
        super({
            schemaBuilder,
            entityTypes,
            staticTypes,
        });
        this.relationship = relationship;
    }

    protected getEdgeProperties(): ObjectTypeComposer | undefined {
        if (this.entityTypes.propertiesType) {
            const fields = this.getRelationshipFields(this.relationship);
            return this.schemaBuilder.getOrCreateObjectType(this.entityTypes.propertiesType, fields);
        }
    }

    @Memoize()
    public get nodeType(): string {
        const target = this.relationship.target;
        if (!(target instanceof ConcreteEntity)) {
            throw new Error("Interfaces not supported yet");
        }
        return target.types.nodeType;
    }

    private getRelationshipFields(relationship: Relationship): Record<string, string> {
        return Object.fromEntries(
            [...relationship.attributes.values()].map((attribute) => [attribute.name, attribute.type.name])
        );
    }
}
