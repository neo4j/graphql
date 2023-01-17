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

import Neo4jGraphQLAuthJWKSPlugin from "./Neo4jGraphQLAuthJWKSPlugin";

describe("Neo4jGraphQLAuthJWKSPlugin", () => {
    test("should construct using URI string", () => {
        const plugin = new Neo4jGraphQLAuthJWKSPlugin({
            jwksOptions: {
                jwksUri: "endpoint.com"
            }
        });

        expect(plugin.isClientSet()).toBeTruthy()
        expect(plugin).toBeInstanceOf(Neo4jGraphQLAuthJWKSPlugin);
    });
    test("should construct using a request like function", () => {
        const plugin = new Neo4jGraphQLAuthJWKSPlugin({
            jwksOptions: {
                jwksUri: () => "endpoint.com"
            }
        });

        expect(plugin.isClientSet()).toBeFalsy()
        expect(plugin).toBeInstanceOf(Neo4jGraphQLAuthJWKSPlugin);
    });
    test("client should fail when jwks uri is a function and tryToResolveKeys was never called", async () => {
        const plugin = new Neo4jGraphQLAuthJWKSPlugin({
            jwksOptions: {
                jwksUri: () => "https://my-dummy-identity:8080/tenant1"
            },
        });
        const token = await plugin.decode<string>('Bearer abc.123.xyz')
        expect(token).toBeFalsy();
    });
    test("tryToResolveKeys should run the jwksEndpoint as function", () => {
        const expectedEndpoint = "https://my-dummy-identity:8080/tenant1";
        const plugin = new Neo4jGraphQLAuthJWKSPlugin({
            jwksOptions: {
                jwksUri: () => {
                    return expectedEndpoint;
                }
            },
        });

        //How we use the headers or request inside the jwksFunction is not the logic of `tryToResolveKeys` method
        plugin.tryToResolveKeys({
            headers: {
                test: "test_header",
            },
        });

        expect(plugin.isClientSet).toBeTruthy()
    });
});
