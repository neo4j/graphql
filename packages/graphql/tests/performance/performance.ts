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

import { Driver, ProfiledPlan } from "neo4j-driver";
import neo4j from "./utils/neo4j";
import { setDb, cleanDb } from "./utils/setup-database";
import { Neo4jGraphQL } from "../../src";
import { gql } from "apollo-server";
import { DocumentNode } from "graphql";
import { createJwtRequest } from "../utils/create-jwt-request";
import { translateQuery } from "../tck/utils/tck-test-utils";
import assert from "assert";
import { collectTests } from "./utils/collect-files";
import Debug from "debug";
import { DEBUG_EXECUTE } from "../../src/constants";

const debug = Debug(DEBUG_EXECUTE);
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
        await runTests(true);
    } finally {
        await afterAll();
    }
}

main();

async function runTests(display: boolean) {
    const tests = await collectTests(__dirname);

    const results: Array<any> = [];
    for (const test of tests) {
        const perfResult = await runPerformanceTest(gql(test.query));
        results.push({ name: test.name, result: perfResult, file: test.filename });
    }

    const ResetTTYColor = "\x1b[0m";
    const FgYellowTTYColor = "\x1b[33m";
    const FgCyanTTYColor = "\x1b[36m";
    if (display) {
        console.table(
            results.reduce((acc, { name, result, file }) => {
                const coloredFile = `${FgYellowTTYColor}${file}${ResetTTYColor}`;
                const coloredName = name.replace(/_only$/i, `${FgCyanTTYColor}_only${ResetTTYColor}`);

                acc[`${coloredFile}.${coloredName}`] = result;
                return acc;
            }, {})
        );
    }

    return results;
}

async function runPerformanceTest(
    query: DocumentNode,
    expectedResultCount?: number
): Promise<ProfileResult & { time: number }> {
    const session = driver.session();
    try {
        const req = createJwtRequest("secret", {});
        const cypherQuery = await translateQuery(neoSchema, query, {
            req,
        });

        const profiledQuery = wrapQueryInProfile(cypherQuery.cypher);
        debug(
            "%s",
            `About to profile and execute Cypher:\nCypher:\n${cypherQuery.cypher}\nParams:\n${JSON.stringify(
                cypherQuery.params,
                null,
                2
            )}`
        );

        const t1 = new Date().getTime();
        const result = await session.run(profiledQuery, cypherQuery.params);
        const t2 = new Date().getTime();

        const profiledPlan = result.summary.profile as ProfiledPlan;
        if (expectedResultCount) {
            expect(result.records).toHaveLength(expectedResultCount); // Test database query result
        }

        // Check for the profile plan to have the correct settings
        assert.ok(profiledPlan);
        assert.strictEqual(profiledPlan.arguments.runtime, "PIPELINED");
        assert.strictEqual(profiledPlan.arguments.planner, "COST");

        const aggregatedProfile = aggregateProfile(profiledPlan);
        return { ...aggregatedProfile, time: t2 - t1 };
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
