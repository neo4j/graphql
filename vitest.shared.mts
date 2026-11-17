/*
 * Copyright (c) "Neo4j"
 * Neo4j Sweden AB [http://neo4j.com]
 */

import { createRequire, isBuiltin } from "node:module";
import path from "node:path";
import dotenv from "dotenv";
import type { Plugin } from "vite";
import { defineConfig } from "vitest/config";

// Set before Vitest forks its workers, so that every test process runs in UTC
process.env.TZ = "Etc/UTC";

dotenv.config({ path: path.join(import.meta.dirname, ".env"), quiet: true });

/**
 * Resolves the packages that the source and tests import the way Node's `require` does, because
 * the library ships as CommonJS. Vite would otherwise pick the ESM build of a dual package, and
 * load a second copy of it next to the copy that CommonJS dependencies `require`: graphql's
 * `instanceof` checks then fail, and patches to `require("http")`, such as the JWKS mock's, miss
 * the ESM build of jose.
 */
function resolveLikeRequire(): Plugin {
    // Vitest must load as ESM: its CommonJS entry point only throws an error. The oxc runtime
    // holds the helpers, such as decorators, that Vite's transform adds, so Vite resolves it.
    const isTestRunnerPackage = (source: string): boolean =>
        source === "vitest" ||
        source.startsWith("vitest/") ||
        source.startsWith("@vitest/") ||
        source === "vite" ||
        source.startsWith("@oxc-project/");

    return {
        name: "neo4j-graphql:resolve-like-require",
        enforce: "pre",
        resolveId(source, importer) {
            const isBarePackage = !source.startsWith(".") && !path.isAbsolute(source) && !source.startsWith("\0");
            if (
                !importer ||
                !isBarePackage ||
                isBuiltin(source) ||
                importer.includes("/node_modules/") ||
                isTestRunnerPackage(source)
            ) {
                return null;
            }
            try {
                return createRequire(importer).resolve(source);
            } catch {
                // Packages without a CommonJS entry point resolve as usual
                return null;
            }
        },
    };
}

export const sharedConfig = defineConfig({
    plugins: [resolveLikeRequire()],
    test: {
        globals: true,
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
