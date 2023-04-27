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

import { gql } from "apollo-server";
import path from "path";
import { Neo4jGraphQL } from "../../../src";
import { collectTests } from "../utils/collect-test-files";
import { translateQuery } from "./utils/translate-query";
import type * as Performance from "../types";
import { colorText, TTYColors } from "../utils/formatters/color-tty-text";
type TranslateTestConfig = {
    runs: number;
    neoSchema: Neo4jGraphQL;
    sync: boolean;
};

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
        favouriteActor: Person @relationship(type: "FAV", direction: OUT)
    }

    type MovieClone {
        title: String!
        favouriteActor: Person! @relationship(type: "FAV", direction: OUT)
    }
    type PersonClone {
        name: String!
        movies: [MovieClone!]! @relationship(type: "FAV", direction: IN)
    }

    type User {
        name: String!
        likes: [Likable!]! @relationship(type: "LIKES", direction: OUT)
    }
`;

async function runTest(test: Performance.TestInfo, config: TranslateTestConfig) {
    const query = gql(test.query);
    const schema = config.neoSchema;
    // const req = createJwtRequest("secret", {});
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
            runs.map((r) => {
                return translateQuery(schema, query);
            })
        );

        const timeEnd = performance.now();
        duration = Math.round(timeEnd - timeZero);
    }

    let name = `${test.filename}.${test.name}`;
    if (duration > totalThreshold) name = colorText(name, TTYColors.red);
    if (duration < totalThreshold / 2) name = colorText(name, TTYColors.green);
    const syncTag = config.sync ? "[SYNC]" : "[ASYNC]";
    console.log(name, `${duration} ms on ${config.runs} runs ${syncTag}`);

    performance.clearMarks();
    performance.clearMeasures();
}

async function main() {
    let runs = 100;
    if (process.argv.includes("--single")) {
        runs = 1;
    }
    const gqltests = await collectTests(path.join(__dirname, "graphql"));
    const neoSchema = new Neo4jGraphQL({
        typeDefs,
    });

    for (const test of gqltests) {
        await runTest(test, {
            runs,
            neoSchema,
            sync: true,
        });
        await runTest(test, {
            runs,
            neoSchema,
            sync: false,
        });
    }
}

main()
    .then(() => {
        console.log("Fin");
    })
    .catch((err) => {
        console.error(err);
    });
