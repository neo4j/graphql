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

import { Driver } from "neo4j-driver";
import path from "path";
// eslint-disable-next-line import/no-extraneous-dependencies
import { gql } from "apollo-server";
import neo4j from "./utils/neo4j";
import { setupDatabase, cleanDatabase } from "./utils/setup-database";
import { Neo4jGraphQL } from "../../src";
import { collectTests } from "./utils/collect-test-files";
import { ResultsWriter } from "./utils/ResultsWriter";
import { ResultsDisplay } from "./utils/ResultsDisplay";
import { TestRunner } from "./utils/TestRunner";

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
    }

    type Movie {
        id: ID!
        title: String!
        tagline: String
        actors: [Person!]! @relationship(type: "ACTED_IN", direction: IN)
        directors: [Person!]! @relationship(type: "DIRECTED", direction: IN)
        reviewers: [Person!]! @relationship(type: "REVIEWED", direction: IN)
        producers: [Person!]! @relationship(type: "PRODUCED", direction: IN)
    }

    type User {
        name: String!
        liked: [Likable!]! @relationship(type: "LIKES", direction: OUT)
    }
`;

let neoSchema: Neo4jGraphQL;

async function beforeAll() {
    driver = await neo4j();
    neoSchema = new Neo4jGraphQL({
        typeDefs,
    });
    await dbReset();
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
    try {
        await beforeAll();
        const resultsWriter = new ResultsWriter(path.join(__dirname, "/performance.json"));
        const oldResults = await resultsWriter.readPreviousResults();
        const results = await runTests();

        const resultsDisplay = new ResultsDisplay();
        await resultsDisplay.display(results, oldResults);

        const updateSnapshot = process.argv.includes("-u");
        if (updateSnapshot) {
            await resultsWriter.writeResult(results);
        }
    } finally {
        await afterAll();
    }
}

// eslint-disable-next-line @typescript-eslint/no-floating-promises
main();

async function runTests() {
    const tests = await collectTests(__dirname);

    const runner = new TestRunner(driver, neoSchema);
    return runner.runTests(tests);
}

async function dbReset() {
    const session = driver.session();
    try {
        await setupDatabase(session);
    } finally {
        await session.close();
    }
}
