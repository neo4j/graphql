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

const fetch = require("node-fetch");
// eslint-disable-next-line import/no-unresolved
const { getIntrospectionQuery, buildClientSchema, printSchema } = require("graphql");
const server = require("./server");

const { GRAPHQL_URL = "http://localhost:4000/graphql" } = process.env;

async function main() {
    try {
        await server.start();

        const result = await fetch(GRAPHQL_URL, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({ query: getIntrospectionQuery() }),
        });

        const json = await result.json();

        const { errors } = json;
        if (errors) {
            throw new Error(errors[0].message);
        }

        const { data } = json;

        const schema = buildClientSchema(data);

        const printed = printSchema(schema);

        // A "Movies" query should have been generated
        const generatedTypeDefsMatch = /Movies/;

        // If not, throw to exit process with 1 and include stack trace
        if (!generatedTypeDefsMatch.test(printed)) {
            throw new Error(`${generatedTypeDefsMatch} was not found in generated typeDefs`);
        }

        console.log("Passed");

        server.stop();
    } catch (error) {
        console.error(error);
        process.exit(1);
    }
}

main();
