import { RelationField, CypherField, PrimitiveField, NestedField } from "../types";

export interface NodeConstructor {
    name: string;
    relationFields: RelationField[];
    cypherFields: CypherField[];
    primitiveFields: PrimitiveField[];
    nestedFields: NestedField[];
}

class Node {
    public name: string;

    public relationFields: RelationField[];

    public cypherFields: CypherField[];

    public primitiveFields: PrimitiveField[];

    public nestedFields: NestedField[];

    constructor(input: NodeConstructor) {
        this.name = input.name;
        this.relationFields = input.relationFields;
        this.cypherFields = input.cypherFields;
        this.primitiveFields = input.primitiveFields;
        this.nestedFields = input.nestedFields;
    }
}

export default Node;
