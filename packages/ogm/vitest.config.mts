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

import path from "node:path";
import { defineConfig, mergeConfig } from "vitest/config";
import { sharedConfig } from "../../vitest.shared.mts";

export default mergeConfig(
    sharedConfig,
    defineConfig({
        resolve: {
            // Test against the library source, as the tsconfig paths do
            alias: [{ find: /^@neo4j\/graphql$/, replacement: path.join(import.meta.dirname, "../graphql/src") }],
        },
        test: {
            projects: [
                { extends: true, test: { name: "unit", include: ["src/**/*.test.ts"] } },
                { extends: true, test: { name: "integration", include: ["tests/integration/**/*.test.ts"] } },
                { extends: true, test: { name: "issues", include: ["tests/issues/**/*.test.ts"] } },
            ],
        },
    })
);
