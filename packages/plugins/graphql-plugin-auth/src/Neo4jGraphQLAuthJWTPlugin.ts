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

import type { Secret, GetPublicKeyOrSecret, VerifyOptions, VerifyErrors } from "jsonwebtoken";
import { decode, verify } from "jsonwebtoken";
import Debug from "debug";
import { DEBUG_PREFIX } from "./constants";
import type { RequestLike } from "./types";
import { AUTH_JWT_PLUGIN_NULL_SECRET_EXCEPTION } from "./exceptions";

const debug = Debug(DEBUG_PREFIX);

export interface JWTPluginInput {
    secret: Secret | ((req: RequestLike) => Secret)
    noVerify?: boolean
    verifyOptions?: VerifyOptions

    rolesPath?: string
    globalAuthentication?: boolean
    bindPredicate?: "all" | "any"
}

class Neo4jGraphQLAuthJWTPlugin {
    private secret: Secret | ((req: RequestLike) => Secret);
    private noVerify?: boolean;
    private verifyOptions?: VerifyOptions;
    rolesPath?: string;
    isGlobalAuthenticationEnabled: boolean; // default: false
    bindPredicate: "all" | "any"; // default: 'all'

    constructor(input: JWTPluginInput) {
        this.secret = input.secret;
        this.noVerify = input.noVerify;
        this.rolesPath = input.rolesPath;
        this.isGlobalAuthenticationEnabled = input.globalAuthentication || false;
        this.bindPredicate = input.bindPredicate || "all";

        // Specify Verify Options
        this.verifyOptions = {
            ...input.verifyOptions,
            algorithms: input.verifyOptions?.algorithms ?? ["HS256", "RS256"],
        }

        if (this.noVerify && this.isGlobalAuthenticationEnabled) {
            throw new Error(
                "Neo4jGraphQLAuthJWTPlugin, noVerify and globalAuthentication can not both be enabled simultaneously."
            );
        }
    }

    tryToResolveKeys(req: RequestLike): void {
        if (typeof this.secret === "function") {
            this.secret = this.secret(req)
        }
    }

    async decode<T>(token: string): Promise<T | undefined> {
        try {
            if (this.noVerify) {
                debug("Decoding JWT without verifying");
                return decode(token, { json: true }) as unknown as T;
            }

            else if (this.secret) {
                debug("Asyncronously decodes and verifies JWT using secret");
                return new Promise((resolve, reject) => {
                    if (typeof this.secret === "function") {
                        debug("'secret' should not be null, make sure the 'tryToResolveKeys' is ran before the decode method.");
                        throw AUTH_JWT_PLUGIN_NULL_SECRET_EXCEPTION;
                    }
                    verify(
                        token,
                        this.secret,
                        this.verifyOptions,
                        (err, decoded) => {
                            err ? reject(err) : resolve(decoded as unknown as T);
                        }
                    );
                });
            }
        } catch (error) {
            debug("%s", error);
            if (error === AUTH_JWT_PLUGIN_NULL_SECRET_EXCEPTION) {
                throw error;
            }
        }
    }
}

export default Neo4jGraphQLAuthJWTPlugin;
