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
