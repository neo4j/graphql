import type { ObjectTypeComposer } from "graphql-compose";
import { Memoize } from "typescript-memoize";
import { ConcreteEntity } from "../../../schema-model/entity/ConcreteEntity";
import type { Relationship } from "../../../schema-model/relationship/Relationship";
import type { AuraRelationshipOperations } from "../../AuraEntityOperations";
import { AuraEntityOperations } from "../../AuraEntityOperations";
import type { SchemaBuilder } from "../SchemaBuilder";
import { EntityTypes } from "./EntityTypes";
import type { StaticTypes } from "./StaticTypes";

export class NestedEntitySchemaTypes extends EntityTypes<AuraRelationshipOperations> {
    private relationship: Relationship;

    constructor({
        relationship,
        schemaBuilder,
        entityOperations,
        staticTypes,
    }: {
        schemaBuilder: SchemaBuilder;
        relationship: Relationship;
        staticTypes: StaticTypes;
        entityOperations: AuraRelationshipOperations;
    }) {
        super({
            schemaBuilder,
            entityOperations,
            staticTypes,
        });
        this.relationship = relationship;
    }

    protected getEdgeProperties(): ObjectTypeComposer | undefined {
        if (this.entityOperations.propertiesType) {
            const fields = this.getRelationshipFields(this.relationship);
            return this.schemaBuilder.getOrCreateObjectType(this.entityOperations.propertiesType, fields);
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
