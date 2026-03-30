/*
 * Copyright (c) "Neo4j"
 * Neo4j Sweden AB [http://neo4j.com]
 */

import path from "path";
import { Neo4jGraphQL } from "../../../src";
import { getLargeSchema } from "../schema/schema-performance";
import { typeDefs } from "../typedefs";
import type * as Performance from "../types";
import { collectTests } from "../utils/collect-test-files";
import { colorText, TTYColors } from "../utils/formatters/color-tty-text";
import { getArgumentValue } from "../utils/get-argument-value";
import { translateQuery } from "./utils/translate-query";

type TranslateTestConfig = {
    runs: number;
    neoSchema: Neo4jGraphQL;
    sync: boolean;
};

async function runTest(test: Performance.TestInfo, config: TranslateTestConfig) {
    const query = test.query;
    const schema = config.neoSchema;
    const THRESHOLD = 1; // Millisecond per translation
    const totalThreshold = THRESHOLD * config.runs;

    // Warmup
    await translateQuery(schema, query);

    let duration: number;
    if (config.sync) {
        const timeZero = performance.now();
        for (let i = 0; i < config.runs; i++) {
            await translateQuery(schema, query);
        }
        const timeEnd = performance.now();
        duration = Math.round(timeEnd - timeZero);
    } else {
        const runs = Array(config.runs).fill(null);
        const timeZero = performance.now();
        await Promise.all(
            runs.map(() => {
                return translateQuery(schema, query);
            })
        );

        const timeEnd = performance.now();
        duration = Math.round(timeEnd - timeZero);
    }

    let name = `${test.filename}.${test.name}`;
    if (duration > totalThreshold) name = colorText(name, TTYColors.red);
    if (duration < totalThreshold / 2) name = colorText(name, TTYColors.green);
    const syncTag = config.sync ? "" : "[ASYNC]";
    console.log(name, `${duration} ms on ${config.runs} runs ${syncTag}`);

    performance.clearMarks();
    performance.clearMeasures();
}

export async function runTranslationPerformance(runs = 100) {
    const gqltests = await collectTests(path.join(__dirname, "..", "graphql"));

    const localTests = await collectTests(path.join(__dirname, "graphql"));

    let testTypeDefs = typeDefs;

    const schemaSizeArg = getArgumentValue("--schemaSize");
    if (schemaSizeArg) {
        const parsedSchemaSize = Math.trunc(Number(schemaSizeArg));
        if (!parsedSchemaSize || parsedSchemaSize < 0) throw new Error("--runs require a positive number");
        testTypeDefs = testTypeDefs + getLargeSchema(parsedSchemaSize);
    }

    const neoSchema = new Neo4jGraphQL({
        typeDefs: testTypeDefs,
    });

    for (const test of [...localTests, ...gqltests]) {
        let sync = true;
        if (process.argv.includes("--async")) {
            sync = false;
        }
        await runTest(test, {
            runs,
            neoSchema,
            sync,
        });
    }
}
