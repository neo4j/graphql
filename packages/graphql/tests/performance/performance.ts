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

import * as fs from "fs/promises";
import * as path from "path";
import { Driver, ProfiledPlan } from "neo4j-driver";
import neo4j from "./utils/neo4j";
import { setDb, cleanDb } from "./utils/setup-database";
import { Neo4jGraphQL } from "../../src";
import { gql } from "apollo-server";
import { DocumentNode } from "graphql";
import { createJwtRequest } from "../utils/create-jwt-request";
import { translateQuery } from "../tck/utils/tck-test-utils";
import assert from "assert";

let driver: Driver;

const typeDefs = gql`
    type Person {
        name: String!
        born: Int!
        movies: [Movie!]! @relationship(type: "ACTED_IN", direction: OUT)
        directed: [Movie!]! @relationship(type: "DIRECTED", direction: OUT)
    }

    type Movie {
        id: ID!
        title: String!
        tagline: String
        actors: [Person!]! @relationship(type: "ACTED_IN", direction: IN)
        directors: [Person!]! @relationship(type: "DIRECTED", direction: IN)
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
        await cleanDb(session);
    } finally {
        session.close();
        driver.close();
    }
}

async function dbReset() {
    const session = driver.session();
    try {
        await setDb(session);
    } finally {
        session.close();
    }
}

async function main() {
    try {
        await beforeAll();
        await runTests();
    } finally {
        await afterAll();
    }
}

main();

async function runTests() {
    const tests = await collectTests(__dirname);

    const results: Array<[string, any]> = [];
    for (const test of tests) {
        const perfResult = await runPerformanceTest(gql(test.query));
        results.push([test.name, perfResult]);
    }

    console.log(results);
}

async function runPerformanceTest(query: DocumentNode, expectedResultCount?: number): Promise<ProfileResult> {
    const session = driver.session();
    try {
        const req = createJwtRequest("secret", {});
        const cypherQuery = await translateQuery(neoSchema, query, {
            req,
        });

        const profiledQuery = wrapQueryInProfile(cypherQuery.cypher);
        const result = await session.run(profiledQuery, cypherQuery.params);

        const profiledPlan = result.summary.profile as ProfiledPlan;
        if (expectedResultCount) {
            expect(result.records).toHaveLength(expectedResultCount); // Test database query result
        }

        // Check for the profile plan to have the correct settings
        assert.ok(profiledPlan);
        assert.strictEqual(profiledPlan.arguments.runtime, "PIPELINED");
        assert.strictEqual(profiledPlan.arguments.planner, "COST");

        return aggregateProfile(profiledPlan);
    } finally {
        session.close();
    }
}

function wrapQueryInProfile(query: string): string {
    return `PROFILE ${query}`;
}

type ProfileResult = {
    maxRows: number;
    dbHits: number;
    cache: {
        hits: number;
        misses: number;
    };
};

function aggregateProfile(plan: ProfiledPlan): ProfileResult {
    const nodeResult: ProfileResult = {
        maxRows: plan.rows,
        dbHits: plan.dbHits,
        cache: {
            hits: plan.pageCacheHits,
            misses: plan.pageCacheMisses,
            // hitRatio: plan.pageCacheHitRatio,
        },
    };

    const result = plan.children.reduce((agg, plan) => {
        const childResult = aggregateProfile(plan);

        return {
            maxRows: Math.max(agg.maxRows, childResult.maxRows),
            dbHits: agg.dbHits + childResult.dbHits,
            cache: {
                hits: agg.cache.hits + childResult.cache.hits,
                misses: agg.cache.misses + childResult.cache.misses,
            },
        };
    }, nodeResult);

    return result;
}

async function fromDir(startPath: string, filter: string): Promise<string[]> {
    var files = await fs.readdir(startPath);
    const filenames = await Promise.all(
        files.map(async (file) => {
            var filename = path.join(startPath, file);
            var stat = await fs.lstat(filename);
            if (stat.isDirectory()) {
                return fromDir(filename, filter); //recurse
            } else if (filename.indexOf(filter) >= 0) {
                return [filename];
            } else return [];
        })
    );
    return filenames.flat();
}

async function collectTests(path: string): Promise<Array<{ query: string; name: string; filename: string }>> {
    const files = await fromDir(path, ".graphql");

    const result = await Promise.all(
        files.map(async (filePath) => {
            const fileData = await fs.readFile(filePath, "utf-8");
            const result = fileData.split(/^query\s/gm);
            result.shift();
            return result.map((query: string) => {
                const name = query.split(" {")[0];
                return {
                    query: `query ${query}`,
                    name: name,
                    filename: filePath,
                };
            });
        })
    );

    return result.flat();
}
