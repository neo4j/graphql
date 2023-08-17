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
import type { JWTPayload } from "jose";
import type { ExecutionContext, Neo4jGraphQLSessionConfig } from "../classes/Executor";

export interface Neo4jGraphQLContext {
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
    cypherParams?: Record<string, any>;
    /**
     * Configures which {@link https://neo4j.com/docs/cypher-manual/current/query-tuning/query-options/ | Cypher query options} to use when executing the translated query.
     */
    cypherQueryOptions?: CypherQueryOptions;
    /**
     * The Neo4j driver, session or transaction which will be used to execute the translated query.
     */
    executionContext?: ExecutionContext;
    /**
     * A decoded JWT payload which can be provided for use in authentication and authorization.
     * Takes precedence over {@link token} if both are present in the context.
     *
     * Will be populated with the decoded {@link token} if authorization has been enabled in the library.
     *
     * @example
     * ```
     * {
     *   sub: "1234567890",
     *   name: "John Doe",
     *   iat: 1516239022,
     * }
     * ```
     */
    jwt?: JWTPayload;
    /**
     * Configuration that will be used during session construction if a driver was passed into the library on construction or if {@link executionContext} is an instance of a driver.
     */
    sessionConfig?: Neo4jGraphQLSessionConfig;
    /**
     * The bearer token to be decoded/verified for use in authentication and authorization.
     * Normally found in the Authorization HTTP header. Can be provided with or without authentication scheme.
     *
     * @example
     * With authentication scheme (standard when used in Authorization header):
     * ```
     * Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c
     * ```
     * @example
     * Without authentication scheme:
     * ```
     * eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c
     * ```
     */
    token?: string;
}
