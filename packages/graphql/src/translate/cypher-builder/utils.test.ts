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

import { serializeParameters } from "./utils";

describe("cypher builder utils", () => {
    describe("serializeParameters", () => {
        test("serialize node parameters", () => {
            const result = serializeParameters("this", { param1: "Arthur", param2: "Zaphod" });

            expect(result).toEqual([
                "{ param1: $this_param1, param2: $this_param2 }",
                {
                    this_param1: "Arthur",
                    this_param2: "Zaphod",
                },
            ]);
        });
    });
});
