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

import { IncomingMessage } from "http";
import jsonwebtoken from "jsonwebtoken";
import { JwksClient } from "jwks-rsa";
import Debug from "debug";
import { Context } from "../types";
import { DEBUG_AUTH } from "../constants";

const debug = Debug(DEBUG_AUTH);

function getJWT(context: Context): any {
    const jwtConfig = context.neoSchema.config?.jwt;
    let result;
    let client;

    if (!jwtConfig) {
        debug("JWT not configured");

        return result;
    }

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
        if (jwtConfig.noVerify) {
            debug("Skipping verifying JWT as noVerify is not set");

            result = jsonwebtoken.decode(token);
        } else if (jwtConfig.jwkEndpoint) {
            debug("Verifying JWT using OpenID Public Key Endpoint");

            // Create a JWK Client with a rate limit that
            // limits the number of calls to our JWK endpoint
            client = new JwksClient({
                jwksUri: jwtConfig.jwkEndpoint,
                rateLimit: true,
                jwksRequestsPerMinute: 10, // Default Value
                cache: true, // Default Value
                cacheMaxEntries: 5, // Default value
                cacheMaxAge: 600000, // Defaults to 10m
            });

            /* eslint-disable-next-line no-inner-declarations */
            function getKey(header, callback) {
                client.getSigningKey(header.kid, function (err, key) {
                    const signingKey = key.getPublicKey();
                    callback(null, signingKey);
                });
            }

            result = jsonwebtoken.verify(token, getKey, {
                algorithms: ["HS256", "RS256"],
            });
        } else if (jwtConfig.secret) {
            debug("Verifying JWT using secret");

            result = jsonwebtoken.verify(token, jwtConfig.secret, {
                algorithms: ["HS256", "RS256"],
            });
        }
    } catch (error) {
        debug("%s", error);
    }

    return result;
}

export default getJWT;
