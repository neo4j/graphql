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
    test("should construct", () => {
        const plugin = new Neo4jGraphQLAuthJWKSPlugin({
            jwksEndpoint: "endpoint.com",
        });

        expect(plugin).toBeInstanceOf(Neo4jGraphQLAuthJWKSPlugin);
        expect(plugin.client).not.toBeNull();
    });
    test("client should be null when jwksEndpoint is a function", () => {
        const plugin = new Neo4jGraphQLAuthJWKSPlugin({
            jwksEndpoint: () => {
                return "https://my-dummy-identity:8080/tenant1";
            }
        });
        expect(plugin.client).toBeNull();
    });
    test("tryToResolveKeys should run the jwksEndpoint as function", () => {
        const expectedEndpoint = "https://my-dummy-identity:8080/tenant1";
        const plugin = new Neo4jGraphQLAuthJWKSPlugin({
            jwksEndpoint: () => {
                return expectedEndpoint;
            }
        });
        //How we use the headers or request inside the jwksFunction is not the logic of `tryToResolveKeys` method
        plugin.tryToResolveKeys({
            headers: {
                "test": "test_header"
            }
        });

        expect(plugin.options.jwksUri).toBe(expectedEndpoint);
        expect(plugin.client).not.toBeNull();
    });
});
