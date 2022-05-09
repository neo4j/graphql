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

import * as jsonwebtoken from "jsonwebtoken";
import Neo4jGraphQLAuthJWTPlugin from "./Neo4jGraphQLAuthJWTPlugin";

describe("Neo4jGraphQLAuthJWTPlugin", () => {
    const secret = "secret";

    test("should decode token", async () => {
        const payload = {
            sub: "my-id",
        };

        const encoded = jsonwebtoken.sign(payload, secret);

        const plugin = new Neo4jGraphQLAuthJWTPlugin({
            secret,
        });

        const decoded = await plugin.decode(encoded);

        expect(decoded).toMatchObject(payload);
    });

    test("should decode token when using noVerify", async () => {
        const payload = {
            sub: "my-id",
        };

        const encoded = jsonwebtoken.sign(payload, secret);

        const plugin = new Neo4jGraphQLAuthJWTPlugin({
            secret,
            noVerify: true,
        });

        const decoded = await plugin.decode(encoded);

        expect(decoded).toMatchObject(payload);
    });
});
