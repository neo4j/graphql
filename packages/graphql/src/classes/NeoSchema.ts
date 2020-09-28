import { GraphQLSchema } from "graphql";
import Node from "./Node";

export interface NeoSchemaConstructor {
    schema: GraphQLSchema;
    nodes: Node[];
}

class NeoSchema {
    public schema: GraphQLSchema;

    public nodes: Node[];

    constructor(input: NeoSchemaConstructor) {
        this.schema = input.schema;
        this.nodes = input.nodes;
    }
}

export default NeoSchema;
