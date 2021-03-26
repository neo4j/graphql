import { Driver } from "neo4j-driver";
import { DocumentNode, GraphQLSchema, parse, printSchema } from "graphql";
import { ITypeDefinitions, IResolvers } from "@graphql-tools/utils";
import { IExecutableSchemaDefinition } from "@graphql-tools/schema";
import { DriverConfig } from "../types";
import { makeAugmentedSchema } from "../schema";
import Node from "./Node";
import { verifyDatabase } from "../utils";

export type SchemaDirectives = IExecutableSchemaDefinition["schemaDirectives"];

export interface Neo4jGraphQLConstructor {
    typeDefs: ITypeDefinitions;
    resolvers?: IResolvers;
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

    public document: DocumentNode;

    constructor(input: Neo4jGraphQLConstructor) {
        this.input = input;

        const { nodes, schema } = makeAugmentedSchema(this);
        this.nodes = nodes;
        this.schema = schema;
        this.document = parse(printSchema(schema));
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
