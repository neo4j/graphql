import { GraphQLSchema } from "graphql";
import Node from "./Node";
import { MakeAugmentedSchemaOptions } from "../api/index";

export interface NeoSchemaConstructor {
    schema: GraphQLSchema;
    nodes: Node[];
    options: MakeAugmentedSchemaOptions;
}

class NeoSchema {
    public schema: GraphQLSchema;

    public nodes: Node[];

    public options: MakeAugmentedSchemaOptions;

    constructor(input: NeoSchemaConstructor) {
        this.schema = input.schema;
        this.nodes = input.nodes;
        this.options = input.options;
    }
}

export default NeoSchema;
