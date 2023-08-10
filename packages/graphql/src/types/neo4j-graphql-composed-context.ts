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

import type { AuthorizationContext, ContextFeatures, FulltextContext } from ".";
import type { Neo4jDatabaseInfo, Node, Relationship } from "../classes";
import type { Executor } from "../classes/Executor";
import type { Neo4jGraphQLSchemaModel } from "../schema-model/Neo4jGraphQLSchemaModel";
import type { Neo4jGraphQLContext } from "./neo4j-graphql-context";

export interface Neo4jGraphQLInternalComposedContext {
    /**
     * @deprecated
     */
    nodes: Node[];
    /**
     * @deprecated
     */
    relationships: Relationship[];
    schemaModel: Neo4jGraphQLSchemaModel;
    features: ContextFeatures;
    subscriptionsEnabled: boolean;
    executor: Executor;
    authorization: AuthorizationContext;
    neo4jDatabaseInfo?: Neo4jDatabaseInfo;
    fulltext?: FulltextContext;
}

export interface Neo4jGraphQLComposedContext extends Neo4jGraphQLContext {
    /**
     * @internal
     */
    _neo4j: Neo4jGraphQLInternalComposedContext;
}
