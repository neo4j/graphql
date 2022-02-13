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

import { Neo4jGraphQLAuthenticationError, Neo4jGraphQLJWTPlugin } from "@neo4j/graphql";
import { IncomingMessage } from "http";
import jsonwebtoken from "jsonwebtoken";
import { JwksClient } from "jwks-rsa";
import Debug from "debug";
import { DEBUG_PREFIX } from "./constants";
import { Secret, JwtPayload } from "jsonwebtoken";

const debug = Debug(DEBUG_PREFIX);

type Result = JwtPayload | undefined;

async function verifyJWKS(client: JwksClient, token: string): Promise<Result> {
    function getKey(header, callback) {
        client.getSigningKey(header.kid, (err, key) => {
            const signingKey = key?.getPublicKey();
            callback(null, signingKey);
        });
    }

    // Returns a Promise with verification result or error
    return new Promise((resolve, reject) =>
        jsonwebtoken.verify(
            token,
            getKey,
            {
                algorithms: ["HS256", "RS256"],
            },
            function verifyCallback(err, decoded) {
                return err ? reject(err) : resolve(decoded as Result);
            }
        )
    );
}

function verifyToken(token: string, secret: Secret): Result {
    const result = jsonwebtoken.verify(token, secret, {
        algorithms: ["HS256", "RS256"],
    });

    if (typeof result === "string") {
        throw new Neo4jGraphQLAuthenticationError("JWT payload cannot be a string");
    }

    return result;
}

export interface JWTPluginInput {
    jwksEndpoint?: string;
    secret?: string;
    noVerify?: boolean;
    rolesPath?: string;
}

class JWTPlugin extends Neo4jGraphQLJWTPlugin {
    jwksEndpoint?: string;
    secret?: string;
    noVerify?: boolean;
    rolesPath?: string;

    constructor(input: JWTPluginInput = {}) {
        super();
        this.jwksEndpoint = input.jwksEndpoint;
        this.secret = input.secret;
        this.noVerify = input.noVerify;
        this.rolesPath = input.rolesPath;
    }

    async decode(context: any): Promise<any> {
        let result: Result;

        const req = context instanceof IncomingMessage ? context : context.req || context.request;

        if (!req) {
            debug("Could not get .req or .request from context");

            return result;
        }

        if (!req.headers && !req.cookies) {
            debug(".headers or .cookies not found on req");

            return result;
        }

        const authorization = (req.headers.authorization || req.headers.Authorization || req.cookies?.token) as string;
        if (!authorization) {
            debug("Could not get .authorization, .Authorization or .cookies.token from req");

            return result;
        }

        const token = authorization.split("Bearer ")[1];
        if (!token) {
            debug("Authorization header was not in expected format 'Bearer <token>'");

            return result;
        }

        try {
            if (this.noVerify) {
                debug("Skipping verifying JWT as noVerify is not set");

                result = jsonwebtoken.decode(token, { json: true }) || undefined;
            } else if (this.jwksEndpoint) {
                debug("Verifying JWT using OpenID Public Key Set Endpoint");

                const client = new JwksClient({
                    jwksUri: this.jwksEndpoint,
                    rateLimit: true,
                    jwksRequestsPerMinute: 10,
                    cache: true,
                    cacheMaxEntries: 5,
                    cacheMaxAge: 600000,
                });

                result = await verifyJWKS(client, token);
            } else if (this.secret) {
                debug("Verifying JWT using secret");

                result = verifyToken(token, this.secret);
            }
        } catch (error) {
            debug("%s", error);
        }

        return result;
    }
}

export default JWTPlugin;
