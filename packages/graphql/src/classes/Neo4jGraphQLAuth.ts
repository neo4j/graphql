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
import type { Context, Key, Neo4jAuthorizationSettings } from "../types";
import { Neo4jError } from "neo4j-driver";
import { AUTH_FORBIDDEN_ERROR, DEBUG_AUTH } from "../constants";
import { createRemoteJWKSet, decodeJwt, jwtVerify, errors } from "jose";
import type { JWTPayload } from "jose";
import { IncomingMessage } from "http";
import { getToken } from "../utils/get-token";

const debug = Debug(DEBUG_AUTH);

class Neo4jGraphQLAuth {
    private authorization: Neo4jAuthorizationSettings;

    constructor(authorization: Neo4jAuthorizationSettings) {
        this.authorization = authorization;
    }

    async parse(context: Context): Promise<JWTPayload | undefined> {
        const token = getToken(context);
        if (token) {
            return this.decode(context, token);
        }
    }

    decodeWithoutVerify(token: string): JWTPayload {
        return decodeJwt(token);
    }

    private resolveSecret(context: Context): Key {
        if (typeof this.authorization.key === "function") {
            const contextRequest = context.req || context.request;
            return this.authorization.key(context instanceof IncomingMessage ? context : contextRequest);
        } else {
            return this.authorization.key;
        }
    }

    private async decode(context: Context, token: string): Promise<JWTPayload> {
        try {
            if (this.authorization.verify === false) {
                debug("Skipping verifying JWT as verify is set to false");
                return this.decodeWithoutVerify(token);
            }
            const secret = this.resolveSecret(context);
            if (typeof secret === "string") {
                debug("Verifying JWT using secret");
                const { payload } = await jwtVerify(token, Buffer.from(secret), this.authorization.verifyOptions);
                return payload;
            } else {
                debug("Verifying JWKS using url");
                const { url, options } = secret;
                const JWKS = createRemoteJWKSet(new URL(url), options);
                const { payload } = await jwtVerify(token, JWKS, this.authorization.verifyOptions);
                return payload;
            }
        } catch (error) {
            debug("%s", error);
            if (error instanceof errors.JWSInvalid) {
                throw new Neo4jError("Unauthenticated", AUTH_FORBIDDEN_ERROR);
            }
            throw new Neo4jError("Forbidden", AUTH_FORBIDDEN_ERROR);
        }
    }
}

export default Neo4jGraphQLAuth;
