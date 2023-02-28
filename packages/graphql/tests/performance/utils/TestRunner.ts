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

import assert from "assert";
import { gql } from "apollo-server-express";
import type { Driver, ProfiledPlan } from "neo4j-driver";
import type { DocumentNode } from "graphql";
import type * as Performance from "../types";
import { createJwtRequest } from "../../utils/create-jwt-request";
import { translateQuery } from "../../tck/utils/tck-test-utils";
import type Neo4jGraphQL from "../../../src/classes/Neo4jGraphQL";

type ExecutionHook = (info: Performance.TestInfo) => Promise<void>;

export class TestRunner {
    private driver: Driver;
    private schema: Neo4jGraphQL;

    constructor(driver: Driver, schema: Neo4jGraphQL) {
        this.driver = driver;
        this.schema = schema;
    }

    public async runTests(
        tests: Array<Performance.TestInfo>,
        { beforeEach, afterEach }: { beforeEach: ExecutionHook; afterEach: ExecutionHook },
    ): Promise<Array<Performance.TestDisplayData>> {
        const results: Array<Performance.TestDisplayData> = [];
        for (const test of tests) {
            try {
                await beforeEach(test);
                const perfResult = await this.runPerformanceTest(gql(test.query));
                await afterEach(test);
                results.push({ name: test.name, result: perfResult, file: test.filename, type: "graphql" });
            } catch (err) {
                console.error("Error running test", test.filename, test.name);
                console.warn(err);
            }
        }

        return results;
    }

    public async runCypherTests(
        tests: Array<Performance.TestInfo>,
        { beforeEach, afterEach }: { beforeEach: ExecutionHook; afterEach: ExecutionHook },
    ): Promise<Array<Performance.TestDisplayData>> {
        const results: Array<Performance.TestDisplayData> = [];
        for (const test of tests) {
            try {
                await beforeEach(test);
                const perfResult = await this.runCypherQuery(test.query);
                await afterEach(test);
                results.push({ name: test.name, result: perfResult, file: test.filename, type: "cypher" });
            } catch (err) {
                console.error("Error running test", test.filename, test.name);
                console.warn(err);
            }
        }

        return results;
    }

    private async runPerformanceTest(query: DocumentNode): Promise<Performance.Result> {
        const req = createJwtRequest("secret", {});
        const cypherQuery = await translateQuery(this.schema, query, {
            req,
        });

        return this.runCypherQuery(cypherQuery.cypher, cypherQuery.params);
    }

    private async runCypherQuery(cypher: string, params: Record<string, any> = {}): Promise<Performance.Result> {
        const session = this.driver.session();
        try {
            const profiledQuery = this.wrapQueryInProfile(cypher);

            const t1 = new Date().getTime();
            const result = await session.run(profiledQuery, params);
            const t2 = new Date().getTime();

            const profiledPlan = result.summary.profile as ProfiledPlan;

            this.assertQueryOptions(profiledPlan);
            const aggregatedProfile = this.aggregateProfile(profiledPlan);
            return { ...aggregatedProfile, time: t2 - t1 };
        } finally {
            await session.close();
        }
    }

    // Check for the profile plan to have the correct settings
    private assertQueryOptions(profiledPlan: ProfiledPlan): void {
        assert.ok(profiledPlan.arguments);
        assert.strictEqual(profiledPlan.arguments.runtime, "PIPELINED");
        assert.strictEqual(profiledPlan.arguments.planner, "COST");
        assert.strictEqual(profiledPlan.arguments["planner-impl"], "DP");
    }

    private wrapQueryInProfile(query: string): string {
        // planner and runtime options are needed to ensure consistent results on our query plan
        return `CYPHER
        planner=dp
        runtime=pipelined
        PROFILE ${query}`;
    }

    private aggregateProfile(plan: ProfiledPlan): Performance.ProfileResult {
        const nodeResult: Performance.ProfileResult = {
            maxRows: plan.rows,
            dbHits: plan.dbHits,
            cache: {
                hits: plan.pageCacheHits,
                misses: plan.pageCacheMisses,
                // hitRatio: plan.pageCacheHitRatio,
            },
        };

        const result = plan.children.reduce((agg, childPlan) => {
            const childResult = this.aggregateProfile(childPlan);

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
}
