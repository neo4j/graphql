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

import type * as neo4j from "neo4j-driver";
import type { ResolveTree } from "graphql-parse-resolve-info";
import { GraphQLSchema } from "graphql";
import { Neo4jGraphQL } from "../../../src/classes";
import type { Neo4jDatabaseInfo } from "../../../src/classes/Neo4jDatabaseInfo";
import type { AuthContext, Context } from "../../../src/types";
import { Builder } from "./builder";
import { Executor } from "../../../src/classes/Executor";
import { Neo4jGraphQLSchemaModel } from "../../../src/schema-model/Neo4jGraphQLSchemaModel";

export class ContextBuilder extends Builder<Context, Context> {
    constructor(newOptions: Partial<Context> = {}) {
        super({
            driver: {} as neo4j.Driver,
            resolveTree: {} as ResolveTree,
            neoSchema: new Neo4jGraphQL({
                typeDefs: "",
            }),
            nodes: [],
            relationships: [],
            schemaModel: new Neo4jGraphQLSchemaModel({ concreteEntities: [], compositeEntities: [] }),
            schema: new GraphQLSchema({}),
            subscriptionsEnabled: false,
            executionContext: {} as neo4j.Driver,
            executor: new Executor({ executionContext: {} as neo4j.Driver, auth: {} as AuthContext }),
            neo4jDatabaseInfo: {} as Neo4jDatabaseInfo,
            ...newOptions,
        });
    }

    public with(newOptions: Partial<Context>): ContextBuilder {
        this.options = { ...this.options, ...newOptions };
        return this;
    }

    public instance(): Context {
        return this.options;
    }
}
