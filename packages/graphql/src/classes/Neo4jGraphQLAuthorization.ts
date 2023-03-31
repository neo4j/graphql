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
import { RequestLike } from "../../../plugins/graphql-plugin-auth/src/types";

const debug = Debug(DEBUG_AUTH);

export class Neo4jGraphQLAuthorization {
    private authorization: Neo4jAuthorizationSettings;

    constructor(authorization: Neo4jAuthorizationSettings) {
        this.authorization = authorization;
    }

    public async parseFrom({
        context,
        bearerToken,
    }: {
        context?: Context;
        bearerToken?: string;
    }): Promise<JWTPayload | undefined> {
        try {
            if (context) {
                debug("Verifying incoming request");
                return await this.decode(context);
            }
            if (bearerToken) {
                debug("Verifying Bearer token");
                return this.decodeBearerToken(bearerToken);
            }
        } catch (error) {
            debug("%s", error);
            if (error instanceof errors.JWSInvalid) {
                throw new Neo4jError("Unauthenticated", AUTH_FORBIDDEN_ERROR);
            }
            throw new Neo4jError("Forbidden", AUTH_FORBIDDEN_ERROR);
        }
    }

    private async decode(context: Context): Promise<JWTPayload | undefined> {
        const token = getToken(context);
        if (!token) {
            return;
        }
        if (this.authorization.verify === false) {
            debug("Skipping verifying JWT as verify is set to false");
            return decodeJwt(token);
        }
        const secret = this.resolveKey(context);
        return this.verify(token, secret);
    }

    private decodeBearerToken(bearerToken: string): JWTPayload {
        const token = parseBearerToken(bearerToken);
        return decodeJwt(token);
    }

    private resolveKey(context: Context): Key {
        if (typeof this.authorization.key === "function") {
            const contextRequest = context.req || context.request;
            return this.authorization.key(context instanceof IncomingMessage ? context : contextRequest);
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

// TODO: make these private class members after migrating to new authorization constructor
export function getToken(context: Context): string | undefined {
    const req: RequestLike = context instanceof IncomingMessage ? context : context.req || context.request;

    if (!req) {
        debug("Could not get .req or .request from context");

        return;
    }

    if (!req.headers && !req.cookies) {
        debug(".headers or .cookies not found on req");

        return;
    }

    const authorization = req?.headers?.authorization || req?.headers?.Authorization || req.cookies?.token;

    if (!authorization) {
        debug("Could not get .authorization, .Authorization or .cookies.token from req");

        return;
    }

    const token = authorization.split("Bearer ")[1];

    if (!token) {
        debug("Authorization header was not in expected format 'Bearer <token>'");

        return token;
    }

    return token;
}

export function parseBearerToken(bearerAuth: string): string {
    const token = bearerAuth.split("Bearer ")[1];
    if (!token) {
        debug("Authorization header was not in expected format 'Bearer <token>'");
    }
    return token;
}
