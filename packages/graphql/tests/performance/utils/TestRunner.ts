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
// eslint-disable-next-line import/no-extraneous-dependencies
import { gql } from "apollo-server-express";
import { Driver, ProfiledPlan } from "neo4j-driver";
import { DocumentNode } from "graphql";
import * as Performance from "../types";
import { createJwtRequest } from "../../utils/create-jwt-request";
import { translateQuery } from "../../tck/utils/tck-test-utils";
import Neo4jGraphQL from "../../../src/classes/Neo4jGraphQL";

export class TestRunner {
    private driver: Driver;
    private schema: Neo4jGraphQL;

    constructor(driver: Driver, schema: Neo4jGraphQL) {
        this.driver = driver;
        this.schema = schema;
    }

    public async runTests(tests: Array<Performance.TestInfo>): Promise<Array<Performance.TestDisplayData>> {
        const results: Array<any> = [];
        for (const test of tests) {
            // eslint-disable-next-line no-await-in-loop -- We want to run tests sequentially
            const perfResult = await this.runPerformanceTest(gql(test.query));
            results.push({ name: test.name, result: perfResult, file: test.filename });
        }

        return results;
    }

    private async runPerformanceTest(query: DocumentNode): Promise<Performance.Result> {
        const session = this.driver.session();
        try {
            const req = createJwtRequest("secret", {});
            const cypherQuery = await translateQuery(this.schema, query, {
                req,
            });
            const profiledQuery = this.wrapQueryInProfile(cypherQuery.cypher);

            const t1 = new Date().getTime();
            const result = await session.run(profiledQuery, cypherQuery.params);
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
        assert.strictEqual(profiledPlan.arguments.runtime, "INTERPRETED");
        assert.strictEqual(profiledPlan.arguments.planner, "COST");
        assert.strictEqual(profiledPlan.arguments["planner-impl"], "DP");
    }

    private wrapQueryInProfile(query: string): string {
        // planner and runtime options are needed to ensure consistent results on our query plan
        return `CYPHER
        planner=dp
        runtime=interpreted
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
