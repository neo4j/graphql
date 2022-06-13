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

import { EventEmitter } from "events";
import { Neo4jGraphQLSubscriptionsAMQPPlugin } from ".";

describe("index", () => {
    test("Neo4jGraphQLSubscriptionsAMQPPlugin", () => {
        expect(Neo4jGraphQLSubscriptionsAMQPPlugin).toBeDefined();
    });

    test("Neo4jGraphQLSubscriptionsAMQPPlugin plugin interface", () => {
        const plugin = new Neo4jGraphQLSubscriptionsAMQPPlugin({
            connection: "",
        });

        expect(plugin.events).toBeInstanceOf(EventEmitter);
        expect(typeof plugin.publish).toBe("function");
    });
});
