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
import type { Key, Neo4jAuthorizationSettings, RequestLike } from "../../types";
import { Neo4jError } from "neo4j-driver";
import { AUTH_FORBIDDEN_ERROR, DEBUG_AUTH } from "../../constants";
import { createRemoteJWKSet, decodeJwt, jwtVerify, errors } from "jose";
import type { JWTPayload } from "jose";
import { getToken, parseBearerToken } from "./parse-request-token";

const debug = Debug(DEBUG_AUTH);

export class Neo4jGraphQLAuthorization {
    private authorization: Neo4jAuthorizationSettings;

    constructor(authorization: Neo4jAuthorizationSettings) {
        this.authorization = authorization;
    }

    public async decode(req: RequestLike): Promise<JWTPayload | undefined> {
        const bearerToken = getToken(req);
        if (!bearerToken) {
            return;
        }
        const token = parseBearerToken(bearerToken);
        try {
            if (this.authorization.verify === false) {
                debug("Skipping verifying JWT as verify is set to false");
                return decodeJwt(token);
            }
            const secret = this.resolveKey(req);
            return await this.verify(token, secret);
        } catch (error) {
            debug("%s", error);
            if (error instanceof errors.JWSInvalid) {
                throw new Neo4jError("Unauthenticated", AUTH_FORBIDDEN_ERROR);
            }
            throw new Neo4jError("Forbidden", AUTH_FORBIDDEN_ERROR);
        }
    }

    public decodeBearerToken(bearerToken: string): JWTPayload | undefined {
        const token = parseBearerToken(bearerToken);
        return decodeJwt(token);
    }

    private resolveKey(req: RequestLike): Key {
        if (typeof this.authorization.key === "function") {
            return this.authorization.key(req);
        } else {
            return this.authorization.key;
        }
    }

    private async verify(token: string, secret: Key): Promise<JWTPayload> {
        if (typeof secret === "string") {
            debug("Verifying JWT using secret");
            const { payload } = await jwtVerify(token, Buffer.from(secret), this.authorization.verifyOptions);
            return payload;
        }
        debug("Verifying JWKS using url");
        const { url, options } = secret;
        const JWKS = createRemoteJWKSet(new URL(url), options);
        const { payload } = await jwtVerify(token, JWKS, this.authorization.verifyOptions);
        return payload;
    }
}
