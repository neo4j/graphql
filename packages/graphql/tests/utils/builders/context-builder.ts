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

import Cypher from "@neo4j/cypher-builder";
import type { ResolveTree } from "graphql-parse-resolve-info";
import type * as neo4j from "neo4j-driver";
import { Executor } from "../../../src/classes/Executor";
import type { Neo4jDatabaseInfo } from "../../../src/classes/Neo4jDatabaseInfo";
import { Neo4jGraphQLSchemaModel } from "../../../src/schema-model/Neo4jGraphQLSchemaModel";
import type { CompositeEntity } from "../../../src/schema-model/entity/CompositeEntity";
import type { ConcreteEntity } from "../../../src/schema-model/entity/ConcreteEntity";
import type { Neo4jGraphQLTranslationContext } from "../../../src/types/neo4j-graphql-translation-context";
import { Builder } from "./builder";

export class ContextBuilder extends Builder<Neo4jGraphQLTranslationContext, Neo4jGraphQLTranslationContext> {
    constructor(newOptions: Partial<Neo4jGraphQLTranslationContext> = {}) {
        super({
            resolveTree: {} as ResolveTree,
            nodes: [],
            relationships: [],
            schemaModel: new Neo4jGraphQLSchemaModel({
                concreteEntities: [] as ConcreteEntity[],
                compositeEntities: [] as CompositeEntity[],
                operations: {},
                annotations: {},
            }),
            executionContext: {} as neo4j.Driver,
            executor: new Executor({ executionContext: {} as neo4j.Driver }),
            neo4jDatabaseInfo: {} as Neo4jDatabaseInfo,
            features: {},
            authorization: {
                jwtParam: new Cypher.Param({}),
                isAuthenticated: true,
                isAuthenticatedParam: new Cypher.Param(true),
            },
            ...newOptions,
        });
    }

    public with(newOptions: Partial<Neo4jGraphQLTranslationContext>): ContextBuilder {
        this.options = { ...this.options, ...newOptions };
        return this;
    }

    public instance(): Neo4jGraphQLTranslationContext {
        return this.options;
    }
}
