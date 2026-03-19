/*
 * Copyright (c) "Neo4j"
 * Neo4j Sweden AB [http://neo4j.com]
 */

import { Neo4jGraphQL, Neo4jGraphQLConstructor } from "./classes";
import { Neo4jGraphQLSubscriptionsCDCEngine } from "./classes/subscription/Neo4jGraphQLSubscriptionsCDCEngine";
import * as directives from "./graphql/directives";
import { CartesianPoint } from "./graphql/objects/CartesianPoint";
import { Point } from "./graphql/objects/Point";
import * as scalars from "./graphql/scalars";
import { Neo4jGraphQLCallback } from "./types";
import { Neo4jGraphQLContext } from "./types/neo4j-graphql-context";

const objects = { Point, CartesianPoint };

/**
 * Core library functionality.
 */
export { Neo4jGraphQL, Neo4jGraphQLCallback, Neo4jGraphQLConstructor, Neo4jGraphQLContext };

/**
 * Library built-in GraphQL types.
 */
export { directives, objects, scalars };

export { Neo4jGraphQLSubscriptionsCDCEngine };
