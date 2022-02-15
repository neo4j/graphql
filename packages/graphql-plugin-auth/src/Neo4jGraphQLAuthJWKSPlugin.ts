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
import JwksRsa, { JwksClient } from "jwks-rsa";
import Debug from "debug";
import { DEBUG_PREFIX } from "./constants";

const debug = Debug(DEBUG_PREFIX);

export interface JWKSPluginInput {
    jwksEndpoint: string;
    rolesPath?: string;
}

class Neo4jGraphQLAuthJWKSPlugin {
    rolesPath?: string;
    client: JwksClient;

    constructor(input: JWKSPluginInput) {
        this.rolesPath = input.rolesPath;

        const options: JwksRsa.Options = {
            jwksUri: input.jwksEndpoint,
            rateLimit: true,
            jwksRequestsPerMinute: 10,
            cache: true,
            cacheMaxEntries: 5,
            cacheMaxAge: 600000,
        };

        this.client = new JwksClient(options);
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
            const kid: string = header.kid || "";

            this.client.getSigningKey(kid, (err, key) => {
                const signingKey = key?.getPublicKey();
                callback(err, signingKey);
            });
        };

        return new Promise((resolve, reject) => {
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
