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
import Debug from "debug";
import { DEBUG_PREFIX } from "./constants";
import type { RequestLike } from "./types";

const debug = Debug(DEBUG_PREFIX);

export interface JWTPluginInput {
    secret: jsonwebtoken.Secret | ((req: RequestLike) => jsonwebtoken.Secret);
    noVerify?: boolean;
    globalAuthentication?: boolean;
    rolesPath?: string;
}

class Neo4jGraphQLAuthJWTPlugin {
    private secret: jsonwebtoken.Secret | null = null;
    private noVerify?: boolean;
    rolesPath?: string;
    isGlobalAuthenticationEnabled?: boolean;
    input: JWTPluginInput;
    constructor(input: JWTPluginInput) {
        this.input = input;

        this.secret = typeof input.secret === 'function' ? null : input.secret;
        this.noVerify = input.noVerify;
        this.rolesPath = input.rolesPath;
        this.isGlobalAuthenticationEnabled = input.globalAuthentication || false;

        if (this.noVerify && this.isGlobalAuthenticationEnabled) {
            throw new Error(
                "Neo4jGraphQLAuthJWTPlugin, noVerify and globalAuthentication can not both be enabled simultaneously."
            );
        }
    }

    tryToResolveKeys(req: RequestLike): void {
        //If the secret is set, we don't need to fetch it again.
        if (this.secret) return;
        if (typeof this.input.secret !== 'function') return;

        this.secret = this.input.secret(req);

        return;
    }


    /* eslint-disable @typescript-eslint/require-await */
    async decode<T>(token: string): Promise<T | undefined> {
        let result: T | undefined;

        try {
            if (this.noVerify) {
                debug("Skipping verifying JWT as noVerify is not set");

                result = jsonwebtoken.decode(token, { json: true }) as unknown as T;
            }
            //In case that the secret is null, make sure the 'tryToResolveKeys' is ran before the decode method.
            if (this.secret) {
                debug("Verifying JWT using secret");

                result = jsonwebtoken.verify(token, this.secret, {
                    algorithms: ["HS256", "RS256"],
                }) as unknown as T;
            }
        } catch (error) {
            debug("%s", error);
        }

        return result;
    }
    /* eslint-enable @typescript-eslint/require-await */
}

export default Neo4jGraphQLAuthJWTPlugin;
