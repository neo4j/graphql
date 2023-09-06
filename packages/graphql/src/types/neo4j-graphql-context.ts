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

import type { CypherQueryOptions } from ".";
import type { ExecutionContext, Neo4jGraphQLSessionConfig } from "../classes/Executor";
import type { Neo4jGraphQLContextInterface } from "./neo4j-graphql-context-interface";

export interface Neo4jGraphQLContext extends Neo4jGraphQLContextInterface {
    /**
     * Parameters to be used when querying with Cypher.
     *
     * To be used with directives such as `@node` and `@cypher`, and can be used directly as named here.
     *
     * @example
     * Given a `cypherParams` value as follows:
     * ```
     * { title: "The Matrix" }
     * ```
     * This can be referred to like `@cypher(statement: "RETURN $title AS title", columnName: "title")`.
     */
    cypherParams?: Record<string, unknown>;
    /**
     * Configures which {@link https://neo4j.com/docs/cypher-manual/current/query-tuning/query-options/ | Cypher query options} to use when executing the translated query.
     */
    cypherQueryOptions?: CypherQueryOptions;
    /**
     * The Neo4j driver, session or transaction which will be used to execute the translated query.
     */
    executionContext?: ExecutionContext;
    /**
     * Configuration that will be used during session construction if a driver was passed into the library on construction or if {@link executionContext} is an instance of a driver.
     */
    sessionConfig?: Neo4jGraphQLSessionConfig;
    /**
     * Attach metadata to the database transaction.
     * This can be used to output information to the query log not related to the query itself.
     * Will be ignored if {@link executionContext} is an instance of a transaction.
     */
    transactionMetadata?: Record<string, unknown>;
}
