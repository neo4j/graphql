import { GraphQLSchema } from "graphql";
import Node from "./Node";
import { MakeAugmentedSchemaOptions } from "../schema/index";

export interface NeoSchemaConstructor {
    schema: GraphQLSchema;
    nodes: Node[];
    options: MakeAugmentedSchemaOptions;
    resolvers: any;
    typeDefs: string;
}

class NeoSchema {
    public schema: GraphQLSchema;

    public nodes: Node[];

    public options: MakeAugmentedSchemaOptions;

    public resolvers: any;

    public typeDefs: string;

    constructor(input: NeoSchemaConstructor) {
        this.schema = input.schema;
        this.nodes = input.nodes;
        this.options = input.options;
        this.resolvers = input.resolvers;
        this.typeDefs = input.typeDefs;
    }
}

export default NeoSchema;
