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

import type { JWTPayload } from "jose";

/**
 * A type containing context values which are common for both Query/Mutation and Subscription operations.
 */
export interface Neo4jGraphQLContextInterface {
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
