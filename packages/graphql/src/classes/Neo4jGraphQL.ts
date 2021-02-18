import { Driver } from "neo4j-driver";
import { DocumentNode, GraphQLSchema } from "graphql";
import { SchemaComposer } from "graphql-compose";
import { TypeDefs, Resolvers, SchemaDirectives } from "../types";
import { makeAugmentedSchema, mergeExtensionsIntoAST, mergeTypeDefs } from "../schema";
import Node from "./Node";

export interface Neo4jGraphQLConstructor {
    typeDefs: TypeDefs;
    resolvers?: Resolvers;
    schemaDirectives?: SchemaDirectives;
    debug?: boolean | ((...values: any[]) => void);
    context?: { [k: string]: any } & { driver?: Driver };
}

class Neo4jGraphQL {
    public schema: GraphQLSchema;

    public nodes: Node[];

    public input: Neo4jGraphQLConstructor;

    public resolvers: any;

    public typeDefs: string;

    constructor(input: Neo4jGraphQLConstructor) {
        this.input = input;

        const { nodes, resolvers, schema, typeDefs } = makeAugmentedSchema(this);

        this.nodes = nodes;
        this.resolvers = resolvers;
        this.schema = schema;
        this.typeDefs = typeDefs;
    }

    debug(message: string) {
        if (!this.input.debug) {
            return;
        }

        // eslint-disable-next-line no-console
        let debug = console.log;

        if (typeof this.input.debug === "function") {
            debug = this.input.debug;
        }

        debug(message);
    }
}

export default Neo4jGraphQL;
