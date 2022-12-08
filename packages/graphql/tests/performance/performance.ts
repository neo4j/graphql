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

import type { Driver } from "neo4j-driver";
import path from "path";

import { gql } from "apollo-server";
import neo4j from "./utils/neo4j";
import { setupDatabase, cleanDatabase } from "./utils/setup-database";
import { Neo4jGraphQL } from "../../src";
import { collectTests, collectCypherTests } from "./utils/collect-test-files";
import { ResultsWriter } from "./utils/ResultsWriter";
import { TestRunner } from "./utils/TestRunner";
import type * as Performance from "./types";
import { schemaPerformance } from "./schema-performance";
import { MarkdownFormatter } from "./utils/formatters/MarkdownFormatter";
import { TTYFormatter } from "./utils/formatters/TTYFormatter";

let driver: Driver;

const typeDefs = gql`
    union Likable = Person | Movie

    type Person {
        name: String!
        born: Int!
        movies: [Movie!]! @relationship(type: "ACTED_IN", direction: OUT)
        directed: [Movie!]! @relationship(type: "DIRECTED", direction: OUT)
        reviewed: [Movie!]! @relationship(type: "REVIEWED", direction: OUT)
        produced: [Movie!]! @relationship(type: "PRODUCED", direction: OUT)
        likes: [Likable!]! @relationship(type: "LIKES", direction: OUT)
    }

    type Movie
        @fulltext(
            indexes: [
                { queryName: "movieTaglineFulltextQuery", name: "MovieTaglineFulltextIndex", fields: ["tagline"] }
            ]
        ) {
        id: ID!
        title: String!
        tagline: String
        released: Int
        actors: [Person!]! @relationship(type: "ACTED_IN", direction: IN)
        directors: [Person!]! @relationship(type: "DIRECTED", direction: IN)
        reviewers: [Person!]! @relationship(type: "REVIEWED", direction: IN)
        producers: [Person!]! @relationship(type: "PRODUCED", direction: IN)
        likedBy: [User!]! @relationship(type: "LIKES", direction: IN)
        oneActorName: String @cypher(statement: "MATCH (this)<-[:ACTED_IN]-(a:Person) RETURN a.name")
    }

    type User {
        name: String!
        likes: [Likable!]! @relationship(type: "LIKES", direction: OUT)
    }
`;

let neoSchema: Neo4jGraphQL;

async function beforeAll() {
    driver = await neo4j();
    neoSchema = new Neo4jGraphQL({
        typeDefs,
    });
    await resetDb();
}

function beforeEach(_testInfo: Performance.TestInfo): Promise<void> {
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
    } else {
        await queryPerformance();
    }
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
            console.log(await resultsDisplay.format(results, oldResults));
        } else {
            const resultsDisplay = new TTYFormatter();
            console.table(await resultsDisplay.format(results, oldResults));
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

// eslint-disable-next-line @typescript-eslint/no-floating-promises
main();

async function runTests(cypher: boolean) {
    const gqltests = await collectTests(path.join(__dirname, "graphql"));
    const runner = new TestRunner(driver, neoSchema);

    const gqlTestsResuts = await runner.runTests(gqltests, { beforeEach, afterEach });
    if (cypher) {
        const cypherTests = await collectCypherTests(path.join(__dirname, "cypher"));
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
