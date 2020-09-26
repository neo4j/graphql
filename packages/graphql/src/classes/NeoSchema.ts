import { GraphQLSchema } from "graphql";

export interface NeoSchemaConstructor {
    schema: GraphQLSchema;
}

class NeoSchema {
    public schema: GraphQLSchema;

    constructor(input: NeoSchemaConstructor) {
        this.schema = input.schema;
    }
}

export default NeoSchema;
