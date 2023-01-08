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

import jsonwebtoken from "jsonwebtoken";
import type JwksRsa from "jwks-rsa";
import { JwksClient } from "jwks-rsa";
import Debug from "debug";
import { DEBUG_PREFIX } from "./constants";
import type { RequestLike } from "./types";

const debug = Debug(DEBUG_PREFIX);

export interface JWKSPluginInput {
    jwksEndpoint: string | ((req: RequestLike) => string);
    rolesPath?: string;
    globalAuthentication?: boolean;
    bindPredicate?: "all" | "any";
}

class Neo4jGraphQLAuthJWKSPlugin {
    rolesPath?: string;
    isGlobalAuthenticationEnabled?: boolean;
    client: JwksClient | null = null;
    options!: JwksRsa.Options;
    bindPredicate: "all" | "any";
    input: JWKSPluginInput;
    constructor(input: JWKSPluginInput) {

        //We are going to use this input later, so we need to save it here.
        this.input = input;

        this.rolesPath = input.rolesPath;
        this.isGlobalAuthenticationEnabled = input.globalAuthentication || false;
        this.bindPredicate = input.bindPredicate || "all";

        //It will be empty string if the endpoint is a function
        //This means the value will be calculated later
        const jwksEndpoint = typeof input.jwksEndpoint === 'string' ? input.jwksEndpoint : '';

        this.options = {
            jwksUri: jwksEndpoint,
            rateLimit: true,
            jwksRequestsPerMinute: 10,
            cache: true,
            cacheMaxEntries: 5,
            cacheMaxAge: 600000,
        };

        //If the endpoint is set in the constructor directly we can create th client immediately here
        if (jwksEndpoint !== '')
            this.client = new JwksClient(this.options);
    }

    tryToResolveKeys(req: RequestLike): void {
        if (typeof this.input.jwksEndpoint === 'string') return;

        //The url will be computed based on the jwksEndpoint implementation
        this.options.jwksUri = this.input.jwksEndpoint(req);

        this.client = new JwksClient(this.options);

        return;
    }

    async decode<T>(token: string): Promise<T | undefined> {
        let result: T | undefined;

        try {
            debug("Verifying JWT using OpenID Public Key Set Endpoint");

            result = await this.verifyJWKS<T>({
                token,
            });
        } catch (error) {
            debug("%s", error);
        }

        return result;
    }

    private async verifyJWKS<T>({ token }: { token: string }): Promise<T> {
        const getKey: jsonwebtoken.GetPublicKeyOrSecret = (header, callback) => {
            if (!this.client) {
                debug("JwksClient should NOT be empty! Make sure the 'tryToResolveKeys' method is called before decoding");
                return;
            }
            const kid: string = header.kid || "";

            this.client.getSigningKey(kid, (err, key) => {
                const signingKey = key?.getPublicKey();
                callback(err, signingKey);
            });
        };

        return new Promise((resolve, reject) => {
            if (!this.client) reject("JwksClient should not be empty! Make sure the 'tryToResolveKeys' method is called before decoding");
            jsonwebtoken.verify(
                token,
                getKey,
                {
                    algorithms: ["HS256", "RS256"],
                },
                (err, decoded) => {
                    if (err) {
                        reject(err);
                    } else {
                        resolve(decoded as unknown as T);
                    }
                }
            );
        });
    }
}

export default Neo4jGraphQLAuthJWKSPlugin;
