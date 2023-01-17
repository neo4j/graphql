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

import type { VerifyOptions, GetPublicKeyOrSecret } from "jsonwebtoken";
import { verify } from "jsonwebtoken";
import type { Options as JwksOptions} from "jwks-rsa";
import { JwksClient } from "jwks-rsa";
import Debug from "debug";
import { DEBUG_PREFIX } from "./constants";
import type { RequestLike } from "./types";

const debug = Debug(DEBUG_PREFIX);

export type JwksPluginOptions = Omit<JwksOptions, 'jwksUri'> & {
    jwksUri: string | ((req: RequestLike) => string)
};

export interface JwksPluginInput {
    jwksOptions: JwksPluginOptions
    verifyOptions?: VerifyOptions

    rolesPath?: string
    globalAuthentication?: boolean
    bindPredicate?: "all" | "any"
}

class Neo4jGraphQLAuthJWKSPlugin {
    client?: JwksClient = undefined;
    private options: JwksPluginOptions;
    private verifyOptions?: VerifyOptions;
    rolesPath?: string;
    isGlobalAuthenticationEnabled: boolean; // default: false
    bindPredicate: "all" | "any"; // default: 'all'

    constructor(input: JwksPluginInput) {
        this.rolesPath = input.rolesPath;
        this.isGlobalAuthenticationEnabled = input.globalAuthentication || false;
        this.bindPredicate = input.bindPredicate || "all";

        // Include Default JwksRsa if option was not specified
        this.options = {
            ...input.jwksOptions,
            jwksUri: input.jwksOptions.jwksUri,
            rateLimit: input.jwksOptions.rateLimit ?? true,
            jwksRequestsPerMinute: input.jwksOptions.jwksRequestsPerMinute ?? 10,
            cache: input.jwksOptions.cache ?? true,
            cacheMaxEntries: input.jwksOptions.cacheMaxEntries ?? 5,
            cacheMaxAge: input.jwksOptions.cacheMaxAge ?? 600000,
        }

        // Specify Verify Options
        this.verifyOptions = {
            ...input.verifyOptions,
            algorithms: input.verifyOptions?.algorithms ?? ["HS256", "RS256"],
        }

        //If the endpoint is set in the constructor directly we can create the client immediately here
        if (typeof this.options.jwksUri === "string") {
            this.client = new JwksClient(this.options as JwksOptions);
        }
    }

    isClientSet(): boolean {
        return this.client !== undefined
    }

    tryToResolveKeys(req: RequestLike): void {
        // Compute the url using the Request Implementation
        if (typeof this.options.jwksUri === "function") {
            this.client = new JwksClient({
                ...this.options,
                jwksUri: this.options.jwksUri(req),
            });
        }
    }

    async decode<T>(token: string): Promise<T | undefined> {
        let result: T | undefined;

        try {
            debug("Verifying JWT using OpenID Public Key Set Endpoint");
            result = await this.verifyJWKS<T>(token);
        } catch (error) {
            debug("%s", error);
        }

        return result;
    }

    // Verifies the JWKS asynchronously, returns Promise
    private async verifyJWKS<T>(token: string): Promise<T> {
        if (!this.client) {
            debug("Client not created. Make sure the 'tryToResolveKeys' method is called before decoding")
        }

        const getKey: GetPublicKeyOrSecret = (header, callback) => {
            this.client?.getSigningKey(header.kid, (err, key) => {
                var signingKey = key?.getPublicKey();
                callback(err, signingKey);
            });
        };

        // Returns a Promise with verification result or error
        return new Promise((resolve, reject) => {
            verify(
                token,
                getKey,
                this.verifyOptions,
                (err, decoded) => {
                    err ? reject(err) : resolve(decoded as unknown as T);
                }
            );
        });
    }
}

export default Neo4jGraphQLAuthJWKSPlugin;
