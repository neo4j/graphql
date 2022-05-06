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

const debug = Debug(DEBUG_PREFIX);

export interface JWTPluginInput {
    secret: jsonwebtoken.Secret;
    noVerify?: boolean;
    rolesPath?: string;
}

class Neo4jGraphQLAuthJWTPlugin {
    private secret: jsonwebtoken.Secret;
    private noVerify?: boolean;
    rolesPath?: string;

    constructor(input: JWTPluginInput) {
        this.secret = input.secret;
        this.noVerify = input.noVerify;
        this.rolesPath = input.rolesPath;
    }

    /* eslint-disable @typescript-eslint/require-await */
    async decode<T>(token: string): Promise<T | undefined> {
        let result: T | undefined;

        try {
            if (this.noVerify) {
                debug("Skipping verifying JWT as noVerify is not set");

                result = jsonwebtoken.decode(token, { json: true }) as unknown as T;
            }

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
