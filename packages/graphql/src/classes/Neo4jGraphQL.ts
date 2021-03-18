import { Driver } from "neo4j-driver";
import { DocumentNode, GraphQLSchema, parse } from "graphql";
import { TypeDefs, Resolvers, SchemaDirectives, DriverConfig } from "../types";
import { makeAugmentedSchema } from "../schema";
import Node from "./Node";
import { verifyDatabase } from "../utils";

export interface Neo4jGraphQLConstructor {
    typeDefs: TypeDefs;
    resolvers?: Resolvers;
    schemaDirectives?: SchemaDirectives;
    debug?: boolean | ((...values: any[]) => void);
    context?: { [k: string]: any } & { driver?: Driver };
    driver?: Driver;
    driverConfig?: DriverConfig;
}

class Neo4jGraphQL {
    public schema: GraphQLSchema;

    public nodes: Node[];

    public input: Neo4jGraphQLConstructor;

    public resolvers: any;

    public typeDefs: string;

    public document: DocumentNode;

    constructor(input: Neo4jGraphQLConstructor) {
        this.input = input;

        const { nodes, resolvers, schema, typeDefs } = makeAugmentedSchema(this);
        this.nodes = nodes;
        this.resolvers = resolvers;
        this.schema = schema;
        this.typeDefs = typeDefs;
        this.document = parse(typeDefs);
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

    async verifyDatabase(input: { driver?: Driver } = {}): Promise<void> {
        const driver = input.driver || this.input.driver;

        if (!driver) {
            throw new Error("neo4j-driver Driver missing");
        }

        return verifyDatabase({ driver });
    }
}

export default Neo4jGraphQL;
