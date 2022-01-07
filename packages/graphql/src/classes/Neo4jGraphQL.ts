/*
 * Copyright (c) "Neo4j"
 * Neo4j Sweden AB [http://neo4j.com]
 *
 * This file is part of Neo4j.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import Debug from "debug";
import { Driver } from "neo4j-driver";
import { DocumentNode, GraphQLResolveInfo, GraphQLSchema, parse, printSchema, print } from "graphql";
import { IExecutableSchemaDefinition, makeExecutableSchema } from "@graphql-tools/schema";
import { forEachField } from "@graphql-tools/utils";
import { mergeResolvers } from "@graphql-tools/merge";

import type { DriverConfig, CypherQueryOptions } from "../types";
import { makeAugmentedSchema } from "../schema";
import Node from "./Node";
import Relationship from "./Relationship";
import checkNeo4jCompat from "./utils/verify-database";
import { getJWT } from "../auth";
import { DEBUG_GRAPHQL } from "../constants";
import createAuthParam from "../translate/create-auth-param";
import assertIndexesAndConstraints, {
    AssertIndexesAndConstraintsOptions,
} from "./utils/asserts-indexes-and-constraints";
import { wrapResolver } from "../schema/resolvers/wrapper";
import { composeResolvers } from "@graphql-tools/resolvers-composition";
import { defaultFieldResolver } from "../schema/resolvers";

const debug = Debug(DEBUG_GRAPHQL);

export interface Neo4jGraphQLJWT {
    jwksEndpoint?: string;
    secret?: string;
    noVerify?: boolean;
    rolesPath?: string;
}

export interface Neo4jGraphQLConfig {
    driverConfig?: DriverConfig;
    jwt?: Neo4jGraphQLJWT;
    enableRegex?: boolean;
    skipValidateTypeDefs?: boolean;
    queryOptions?: CypherQueryOptions;
}

export interface Neo4jGraphQLConstructor extends IExecutableSchemaDefinition {
    config?: Neo4jGraphQLConfig;
    driver?: Driver;
}

class Neo4jGraphQL {
    public schema: GraphQLSchema;
    public nodes: Node[];
    public relationships: Relationship[];
    public document: DocumentNode;
    private driver?: Driver;
    public config?: Neo4jGraphQLConfig;

    constructor(input: Neo4jGraphQLConstructor) {
        // const { config = {}, driver, schemaDirectives, ...schemaDefinition } = input;
        const { config = {}, driver, ...schemaDefinition } = input;
        const { nodes, relationships, typeDefs, resolvers } = makeAugmentedSchema(input.typeDefs, {
            enableRegex: config.enableRegex,
            skipValidateTypeDefs: config.skipValidateTypeDefs,
        });

        this.driver = driver;
        this.config = config;
        this.nodes = nodes;
        this.relationships = relationships;

        const resolversComposition = {
            "Query.*": [wrapResolver({ driver, config, neoSchema: this })],
            "Mutation.*": [wrapResolver({ driver, config, neoSchema: this })],
        };

        const composedResolvers = composeResolvers(mergeResolvers([resolvers, input.resolvers]), resolversComposition);

        const schema = makeExecutableSchema({
            ...schemaDefinition,
            typeDefs,
            resolvers: composedResolvers,
        });

        // Assign a default field resolver to account for aliasing of fields
        forEachField(schema, (field) => {
            if (!field.resolve) {
                // eslint-disable-next-line no-param-reassign
                field.resolve = defaultFieldResolver;
            }
        });

        this.schema = schema;

        /*
            Order must be:

                addResolversToSchema -> visitSchemaDirectives -> createWrappedSchema

            addResolversToSchema breaks schema directives added before it

            createWrappedSchema must come last so that all requests have context prepared correctly
        */

        // if (schemaDirectives) {
        //     SchemaDirectiveVisitor.visitSchemaDirectives(this.schema, schemaDirectives);
        // }

        this.document = parse(printSchema(schema));
    }

    async checkNeo4jCompat(input: { driver?: Driver; driverConfig?: DriverConfig } = {}): Promise<void> {
        const driver = input.driver || this.driver;
        const driverConfig = input.driverConfig || this.config?.driverConfig;

        if (!driver) {
            throw new Error("neo4j-driver Driver missing");
        }

        return checkNeo4jCompat({ driver, driverConfig });
    }

    async assertIndexesAndConstraints(
        input: { driver?: Driver; driverConfig?: DriverConfig; options?: AssertIndexesAndConstraintsOptions } = {}
    ): Promise<void> {
        const driver = input.driver || this.driver;
        const driverConfig = input.driverConfig || this.config?.driverConfig;

        if (!driver) {
            throw new Error("neo4j-driver Driver missing");
        }

        await assertIndexesAndConstraints({ driver, driverConfig, nodes: this.nodes, options: input.options });
    }
}

export default Neo4jGraphQL;
