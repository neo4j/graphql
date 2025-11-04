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

import type { ResolveTree } from "graphql-parse-resolve-info";
import type { Neo4jGraphQLComposedContext } from "../schema/resolvers/composition/wrap-query-and-mutation";

/**
 * A small extension to {@link Neo4jGraphQLComposedContext}, adding the {@link resolveTree} field.
 * This field cannot be added during resolvers composition, because it gets overridden if executing multiple queries under the same operation.
 * Each individual resolver populates this field.
 */
export interface Neo4jGraphQLTranslationContext extends Neo4jGraphQLComposedContext {
    resolveTree: ResolveTree;
}
