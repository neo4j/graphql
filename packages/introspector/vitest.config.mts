/*
 * Copyright (c) "Neo4j"
 * Neo4j Sweden AB [http://neo4j.com]
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
            ],
        },
    })
);
