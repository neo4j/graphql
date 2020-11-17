import { RelationField, CypherField, PrimitiveField } from "../types";

export interface NodeConstructor {
    name: string;
    relationFields: RelationField[];
    cypherFields: CypherField[];
    primitiveFields: PrimitiveField[];
}

class Node {
    public name: string;

    public relationFields: RelationField[];

    public cypherFields: CypherField[];

    public primitiveFields: PrimitiveField[];

    constructor(input: NodeConstructor) {
        this.name = input.name;
        this.relationFields = input.relationFields;
        this.cypherFields = input.cypherFields;
        this.primitiveFields = input.primitiveFields;
    }
}

export default Node;
