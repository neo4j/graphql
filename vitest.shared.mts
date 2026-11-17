import path from "node:path";
import dotenv from "dotenv";
import { defineConfig } from "vitest/config";

// Set before Vitest forks its workers, so that every test process runs in UTC
process.env.TZ = "Etc/UTC";

dotenv.config({ path: path.join(import.meta.dirname, ".env"), quiet: true });

// The settings that the Vitest config of every package builds on
export const sharedConfig = defineConfig({
    resolve: {
        // Try `.js` before `.mjs`, as Node's `require` does. graphql's `main` is "index" with no
        // extension, and Vite's default order picks index.mjs. CommonJS dependencies such as
        // graphql-compose `require` index.js, so graphql would load twice and its `instanceof`
        // checks would fail.
        extensions: [".js", ".mjs", ".ts", ".mts", ".json"],
    },
    test: {
        globals: true,
        // Undo `vi.stubEnv` after each test, so a failed test leaves no environment change behind
        unstubEnvs: true,
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
    },
});
