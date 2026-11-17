import path from "node:path";
import dotenv from "dotenv";
import { defineConfig } from "vitest/config";

// Set before Vitest forks its workers, so that every test process runs in UTC
process.env.TZ = "Etc/UTC";

dotenv.config({ path: path.join(import.meta.dirname, "../../.env"), quiet: true });

const dbGlobalSetup = ["./vitest.global-setup.ts"];

export default defineConfig({
    resolve: {
        // Try `.js` before `.mjs`, as Node's `require` does. graphql's `main` is "index" with no
        // extension, and Vite's default order picks index.mjs. CommonJS dependencies such as
        // graphql-compose `require` index.js, so graphql would load twice and its `instanceof`
        // checks would fail.
        extensions: [".js", ".mjs", ".ts", ".mts", ".json"],
    },
    test: {
        globals: true,
        setupFiles: ["./vitest.setup.ts"],
        // Integration tests run against a real database, which can be slow
        testTimeout: 120_000,
        hookTimeout: 120_000,
        // Matches the snapshot format the inline snapshots were written with
        snapshotFormat: {
            escapeString: true,
            printBasicPrototype: true,
        },
        coverage: {
            provider: "v8",
            reporter: ["clover", "json", "lcov", "text"],
        },
        projects: [
            // The projects that need no database share one module graph per worker instead of
            // loading the library again for every test file, which makes them several times
            // faster. A test file in these projects must leave no state behind: restore its
            // mocks and spies, and do not change globals or module state that it does not reset.
            { extends: true, test: { name: "unit", include: ["src/**/*.test.ts"], isolate: false } },
            { extends: true, test: { name: "schema", include: ["tests/schema/**/*.test.ts"], isolate: false } },
            { extends: true, test: { name: "tck", include: ["tests/tck/**/*.test.ts"], isolate: false } },
            {
                extends: true,
                test: {
                    name: "integration",
                    include: ["tests/integration/**/*.test.ts"],
                    globalSetup: dbGlobalSetup,
                },
            },
            {
                extends: true,
                test: { name: "e2e", include: ["tests/e2e/**/*.test.ts"], globalSetup: dbGlobalSetup },
            },
        ],
    },
});
