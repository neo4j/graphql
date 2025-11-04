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

import Debug from "debug";
import type { Key, Neo4jAuthorizationSettings, RemoteJWKS } from "../../types";

import { DEBUG_AUTH } from "../../constants";
import { createRemoteJWKSet, decodeJwt, jwtVerify } from "jose";
import type { JWTPayload, JWTVerifyGetKey } from "jose";
import { parseBearerToken } from "./parse-request-token";
import type { Neo4jGraphQLContext } from "../../types/neo4j-graphql-context";
import type { Neo4jGraphQLSubscriptionsConnectionParams } from "../../types/neo4j-graphql-subscriptions-context";

const debug = Debug(DEBUG_AUTH);

export class Neo4jGraphQLAuthorization {
    private authorization: Neo4jAuthorizationSettings;

    // Assigned if input is a static symmetric secret or JWKS details
    private resolvedKey: Uint8Array | JWTVerifyGetKey | undefined;
    // Assigned if input is dynamic key which needs to be fetched using context details
    private unresolvedKey: ((context: Neo4jGraphQLContext) => Key) | undefined;

    constructor(authorization: Neo4jAuthorizationSettings) {
        if (typeof authorization.key === "function") {
            this.unresolvedKey = authorization.key;
        } else {
            this.resolvedKey = this.serializeKey(authorization.key);
        }

        this.authorization = authorization;
    }

    public async decode(
        context: Neo4jGraphQLContext | Neo4jGraphQLSubscriptionsConnectionParams
    ): Promise<JWTPayload | undefined> {
        const bearerToken = context.token;
        if (!bearerToken) {
            return undefined;
        }
        const token = parseBearerToken(bearerToken);
        if (!token) {
            return undefined;
        }
        try {
            if (this.authorization.verify === false) {
                debug("Skipping verifying JWT as verify is set to false");
                return decodeJwt(token);
            }
            const secret = this.resolveKey(context);
            return await this.verify(token, secret);
        } catch (error) {
            debug("%s", error);
            return undefined;
        }
    }

    private serializeKey(key: string | RemoteJWKS): Uint8Array | JWTVerifyGetKey {
        if (typeof key === "string") {
            return Buffer.from(key);
        } else {
            return createRemoteJWKSet(new URL(key.url), key.options);
        }
    }

    private resolveKey(
        context: Neo4jGraphQLContext | Neo4jGraphQLSubscriptionsConnectionParams
    ): Uint8Array | JWTVerifyGetKey {
        if (this.resolvedKey) {
            return this.resolvedKey;
        } else {
            // this.unresolvedKey is definitely defined due to typings and if/else
            const resolved = this.unresolvedKey!(context);

            return this.serializeKey(resolved);
        }
    }

    private async verify(token: string, secret: Uint8Array | JWTVerifyGetKey): Promise<JWTPayload> {
        if (secret instanceof Uint8Array) {
            debug("Verifying JWT using secret");
            const { payload } = await jwtVerify(token, secret, this.authorization.verifyOptions);
            return payload;
        }
        debug("Verifying JWKS using url");
        const { payload } = await jwtVerify(token, secret, this.authorization.verifyOptions);
        return payload;
    }
}
