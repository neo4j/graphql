import { Driver } from "neo4j-driver";
import { DocumentNode, GraphQLSchema, parse, printSchema } from "graphql";
import { ITypeDefinitions, IResolvers } from "@graphql-tools/utils";
import { addSchemaLevelResolver, IExecutableSchemaDefinition } from "@graphql-tools/schema";
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

        const { nodes, schema } = makeAugmentedSchema({
            typeDefs: input.typeDefs,
            resolvers: input.resolvers,
            schemaDirectives: input.schemaDirectives,
        });

        this.nodes = nodes;
        this.schema = this.createWrappedSchema(schema, input.driver, input.driverConfig);
        this.document = parse(printSchema(schema));
    }

    private createWrappedSchema(schema: GraphQLSchema, driver?: Driver, driverConfig?: DriverConfig): GraphQLSchema {
        return addSchemaLevelResolver(schema, (_obj, _args, context: any, info: any) => {
            /*
                Deleting this property ensures that we call this function more than once,
                See https://github.com/ardatan/graphql-tools/issues/353#issuecomment-499569711
            */
            // eslint-disable-next-line no-param-reassign,no-underscore-dangle
            delete info.operation.__runAtMostOnce;

            if (!context?.driver) {
                if (!driver) {
                    throw new Error(
                        "A Neo4j driver instance must either be passed to Neo4jGraphQL on construction, or passed as context.driver in each request."
                    );
                }
                context.driver = driver;
            }

            if (!context?.driverConfig) {
                context.driverConfig = driverConfig;
            }

            context.neoSchema = this;
        });
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
