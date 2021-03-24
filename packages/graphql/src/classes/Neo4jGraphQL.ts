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

import { Driver } from "neo4j-driver";
import { DocumentNode, GraphQLSchema, parse } from "graphql";
import { ITypeDefinitions, IResolvers } from "@graphql-tools/utils";
import { IExecutableSchemaDefinition } from "@graphql-tools/schema";
import { DriverConfig } from "../types";
import { makeAugmentedSchema } from "../schema";
import Node from "./Node";
import { verifyDatabase } from "../utils";

// export type SchemaDirectives = Record<string, typeof SchemaDirectiveVisitor> | undefined;
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
