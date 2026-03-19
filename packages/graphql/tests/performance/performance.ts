/*
 * Copyright (c) "Neo4j"
 * Neo4j Sweden AB [http://neo4j.com]
 */

import type { Driver } from "neo4j-driver";
import path from "path";

import { Neo4jGraphQL } from "../../src";
import { TestRunner } from "./databaseQuery/TestRunner";
import neo4j from "./databaseQuery/neo4j";
import { cleanDatabase, setupDatabase } from "./databaseQuery/setup-database";
import { schemaPerformance } from "./schema/schema-performance";
import { subgraphSchemaPerformance } from "./schema/subgraph-schema-performance";
import { runTranslationPerformance } from "./translation/translation-performance";
import { typeDefs } from "./typedefs";
import type * as Performance from "./types";
import { ResultsWriter } from "./utils/ResultsWriter";
import { collectCypherTests, collectTests } from "./utils/collect-test-files";
import { MarkdownFormatter } from "./utils/formatters/MarkdownFormatter";
import { TTYFormatter } from "./utils/formatters/TTYFormatter";
import { getArgumentValue } from "./utils/get-argument-value";

let driver: Driver;

let neoSchema: Neo4jGraphQL;

async function beforeAll() {
    driver = await neo4j();
    neoSchema = new Neo4jGraphQL({
        typeDefs,
    });
    await resetDb();
}

function beforeEach(): Promise<void> {
    return Promise.resolve();
}

async function afterEach(testInfo: Performance.TestInfo): Promise<void> {
    if (testInfo.type === "mutation") {
        await resetDb();
    }
}

async function afterAll() {
    const session = driver.session();
    try {
        await cleanDatabase(session);
    } finally {
        await session.close();
        await driver.close();
    }
}

async function main() {
    if (process.argv.includes("--schema")) {
        await schemaPerformance();
    } else if (process.argv.includes("--subgraph-schema")) {
        await subgraphSchemaPerformance();
    } else if (process.argv.includes("--translation")) {
        await translationPerformance();
    } else {
        await queryPerformance();
    }
}

async function translationPerformance() {
    let runs = 100;
    const runsArg = getArgumentValue("--runs");
    if (runsArg) {
        const parsedRuns = Math.trunc(Number(runsArg));
        if (!parsedRuns || parsedRuns < 0) throw new Error("--runs require a positive number");
        runs = parsedRuns;
    }

    if (process.argv.includes("--single")) {
        runs = 1;
    }
    await runTranslationPerformance(runs);
}

async function queryPerformance() {
    try {
        await beforeAll();
        const resultsWriter = new ResultsWriter(path.join(__dirname, "/performance.json"));
        const oldResults = await resultsWriter.readPreviousResults();

        const withCypher = process.argv.includes("--cypher");

        const results = await runTests(withCypher);

        if (process.argv.includes("--markdown")) {
            const resultsDisplay = new MarkdownFormatter();
            console.log(resultsDisplay.format(results, oldResults));
        } else {
            const resultsDisplay = new TTYFormatter();
            console.table(resultsDisplay.format(results, oldResults));
        }

        const updateSnapshot = process.argv.includes("-u");
        if (updateSnapshot) {
            await resultsWriter.writeResult(results);
            console.log(`Performance snapshot written at ${resultsWriter.path}`);
        }
    } finally {
        await afterAll();
    }
}

main().catch((err) => {
    throw err;
});

async function runTests(cypher: boolean) {
    const gqltests = await collectTests(path.join(__dirname, "graphql"));
    const runner = new TestRunner(driver, neoSchema);

    const gqlTestsResuts = await runner.runTests(gqltests, { beforeEach, afterEach });
    if (cypher) {
        const cypherTests = await collectCypherTests(path.join(__dirname, "databaseQuery", "cypher"));
        const cypherTestsResults = await runner.runCypherTests(cypherTests, {
            beforeEach,
            afterEach,
        });
        return [...gqlTestsResuts, ...cypherTestsResults];
    }

    return gqlTestsResuts;
}

async function resetDb() {
    const session = driver.session();
    try {
        await setupDatabase(session);
    } finally {
        await session.close();
    }
}
