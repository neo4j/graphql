/*
 * Copyright (c) "Neo4j"
 * Neo4j Sweden AB [http://neo4j.com]
 */

import { fieldExtensionsEstimator, simpleEstimator } from "graphql-query-complexity";

export * from "./Error";
export { Neo4jDatabaseInfo } from "./Neo4jDatabaseInfo";
export { default as Neo4jGraphQL, Neo4jGraphQLConstructor } from "./Neo4jGraphQL";
export const DefaultComplexityEstimators = [fieldExtensionsEstimator(), simpleEstimator({ defaultComplexity: 1 })];
