/*
 * Copyright (c) "Neo4j"
 * Neo4j Sweden AB [http://neo4j.com]
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
