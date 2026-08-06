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
import type { Neo4jGraphQLContextInterface } from "./neo4j-graphql-context-interface";

export interface Neo4jGraphQLSubscriptionsConnectionParams extends Neo4jGraphQLContextInterface {}

export interface Neo4jGraphQLSubscriptionsContext {
    /**
     * A pre-decoded JWT payload set by the server developer (for example, in the
     * `useServer` `context` callback). It is trusted as ALREADY-VERIFIED and is the
     * sanctioned channel for a developer-injected identity on subscriptions, symmetric
     * with the top-level `jwt` available on the HTTP context.
     *
     * It MUST NOT be populated from the client's `connection_init` payload (see
     * {@link connectionParams}), which is untrusted client input. A JWT that needs
     * verifying must instead be supplied as a bearer token via
     * {@link Neo4jGraphQLSubscriptionsConnectionParams.token}.
     */
    jwt?: JWTPayload;
    /**
     * The raw payload the client sends in the WebSocket `connection_init` message. This is
     * UNTRUSTED client input: a `jwt` carried here is never trusted, and only a bearer
     * `token` on it is honoured — and only after it is cryptographically verified. For a
     * trusted, developer-verified identity, set the top-level {@link jwt} instead.
     */
    connectionParams?: Neo4jGraphQLSubscriptionsConnectionParams;
}
