import { defineConfig, mergeConfig } from "vitest/config";
import { sharedConfig } from "../../vitest.shared.mts";

const dbGlobalSetup = ["./vitest.global-setup.ts"];

export default mergeConfig(
    sharedConfig,
    defineConfig({
        test: {
            setupFiles: ["./vitest.setup.ts"],
            // Test files share one module graph per worker instead of loading the library again
            // for every file. Every suite is faster for it, and the ones without a database are
            // several times faster. A test file must leave no state behind: restore its mocks,
            // spies and environment variables, and do not change globals or module state that it
            // does not reset.
            isolate: false,
            projects: [
                { extends: true, test: { name: "unit", include: ["src/**/*.test.ts"] } },
                { extends: true, test: { name: "schema", include: ["tests/schema/**/*.test.ts"] } },
                { extends: true, test: { name: "tck", include: ["tests/tck/**/*.test.ts"] } },
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
    })
);
