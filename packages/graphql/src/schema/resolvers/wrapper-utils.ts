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

import { Neo4jGraphQLAuthenticationError } from "../../classes";
import type { SubscriptionContext } from "./subscriptions/types";
import type { Context, Neo4jGraphQLAuthPlugin } from "../../types";
import type { JwtPayload } from "../../types/deprecated/auth/jwt-payload";

export async function decodeToken(
    token: string | undefined,
    plugin: Neo4jGraphQLAuthPlugin | undefined
): Promise<JwtPayload | undefined> {
    if (token && plugin) {
        const jwt = await plugin.decode<JwtPayload>(token);
        if (typeof jwt === "string") {
            throw new Neo4jGraphQLAuthenticationError("JWT payload cannot be a string");
        }
        return jwt;
    }
    return undefined;
}

export function verifyGlobalAuthentication(
    context: SubscriptionContext | Context,
    plugin: Neo4jGraphQLAuthPlugin | undefined
): void {
    if (plugin?.isGlobalAuthenticationEnabled) {
        if (!context.jwt) {
            throw new Neo4jGraphQLAuthenticationError("Unauthenticated");
        }
    }
}
