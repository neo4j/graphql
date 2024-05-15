import type { ConcreteEntity } from "../../../schema-model/entity/ConcreteEntity";
import type { StaticSchemaTypes } from "./StaticSchemaTypes";
import type { TopLevelEntitySchemaTypes } from "./TopLevelEntitySchemaTypes";

export class SchemaTypes {
    public readonly staticTypes: StaticSchemaTypes;
    private entitySchemas: Map<ConcreteEntity, TopLevelEntitySchemaTypes>;

    constructor({
        staticTypes,
        entitySchemas,
    }: {
        staticTypes: StaticSchemaTypes;
        entitySchemas: Map<ConcreteEntity, TopLevelEntitySchemaTypes>;
    }) {
        this.staticTypes = staticTypes;
        this.entitySchemas = entitySchemas;
    }

    public getEntitySchemaTypes(entity: ConcreteEntity): TopLevelEntitySchemaTypes {
        const entitySchema = this.entitySchemas.get(entity);
        if (!entitySchema) {
            throw new Error("EntitySchema not found");
        }

        return entitySchema;
    }
}
