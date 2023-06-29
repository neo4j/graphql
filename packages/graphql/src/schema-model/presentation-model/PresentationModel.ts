import { Neo4jGraphQLSchemaModel } from "../Neo4jGraphQLSchemaModel";
import { ConcreteEntity } from "../entity/ConcreteEntity";
import type {
    CustomEnumField,
    CustomScalarField,
    CypherField,
    ObjectField,
    PointField,
    PrimitiveField,
    TemporalField,
    UnionField,
} from "../../types";

// TODO check if we keep this type
type MutableField =
    | PrimitiveField
    | CustomScalarField
    | CustomEnumField
    | UnionField
    | ObjectField
    | TemporalField
    | PointField
    | CypherField;

type AuthableField =
    | PrimitiveField
    | CustomScalarField
    | CustomEnumField
    | UnionField
    | ObjectField
    | TemporalField
    | PointField
    | CypherField;

type ConstrainableField = PrimitiveField | CustomScalarField | CustomEnumField | TemporalField | PointField;


/* class PresentationModel {
    public neo4jGraphQLSchemaModel: Neo4jGraphQLSchemaModel; 

    constructor(neo4jGraphQLSchemaModel: Neo4jGraphQLSchemaModel) {
        
    }

    

    getRootTypesName() {

    }


    // Fields you can set in a create or update mutation
    public get mutableFields(): MutableField[] {
        return this.mutableFields;
    }

}
 */

/* interface PresentationModel {
 
    getGlobalEntities: () => ConcreteEntity[];
    isGlobalEntity: (entity: ConcreteEntity) => boolean;

    getRelationshipPropertiesInterfaces(): CompositeEntity[] {
        return [];
    }
    public getUpdateInputFields(relationship: Relationship): Record<string, InputField> {
        return {};
    }
    public getCreateInputFields(relationship: Relationship): Record<string, InputField> {
        return {};
    }
    public getRelationshipFilterableFields(relationship: Relationship): Record<string, InputField> {
        return {};
    }

} */