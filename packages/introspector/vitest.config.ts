import path from "node:path";
import dotenv from "dotenv";
import { defineConfig } from "vitest/config";

// Set before Vitest forks its workers, so that every test process runs in UTC
process.env.TZ = "Etc/UTC";

dotenv.config({ path: path.join(__dirname, "../../.env"), quiet: true });

export default defineConfig({
    resolve: {
        // Test against the library source, as the tsconfig paths do
        alias: [{ find: /^@neo4j\/graphql$/, replacement: path.join(__dirname, "../graphql/src") }],
    },
    test: {
        globals: true,
        testTimeout: 120_000,
        hookTimeout: 120_000,
        snapshotFormat: {
            escapeString: true,
            printBasicPrototype: true,
        },
        coverage: {
            provider: "v8",
            reporter: ["clover", "json", "lcov", "text"],
        },
        projects: [
            { extends: true, test: { name: "unit", include: ["src/**/*.test.ts"] } },
            { extends: true, test: { name: "integration", include: ["tests/integration/**/*.test.ts"] } },
        ],
    },
});
