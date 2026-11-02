/*
 * Copyright (c) "Neo4j"
 * Neo4j Sweden AB [http://neo4j.com]
 */

import assert from "assert";
import type { Driver, Integer, ProfiledPlan } from "neo4j-driver";
import type Neo4jGraphQL from "../../../src/classes/Neo4jGraphQL";
import { translateQuery } from "../../tck/utils/tck-test-utils";
import type * as Performance from "../types";

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
        { beforeEach, afterEach }: { beforeEach: ExecutionHook; afterEach: ExecutionHook }
    ): Promise<Array<Performance.TestDisplayData>> {
        const results: Array<Performance.TestDisplayData> = [];
        for (const test of tests) {
            try {
                await beforeEach(test);
                const perfResult = await this.runPerformanceTest(test.query);
                await afterEach(test);
                results.push({ name: test.name, result: perfResult, file: test.filename, type: "graphql" });
            } catch (err) {
                console.error("Error running test", test.filename, test.name);
                console.warn(err);
                results.push({ name: test.name, error: String(err), file: test.filename, type: "graphql" });
            }
        }

        return results;
    }

    public async runCypherTests(
        tests: Array<Performance.TestInfo>,
        { beforeEach, afterEach }: { beforeEach: ExecutionHook; afterEach: ExecutionHook }
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

    private async runPerformanceTest(query: string): Promise<Performance.Result> {
        const cypherQuery = await translateQuery(this.schema, query);

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
            memory: this.getMemoryFromPlan(plan),
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
                memory: agg.memory + childResult.memory,
                cache: {
                    hits: agg.cache.hits + childResult.cache.hits,
                    misses: agg.cache.misses + childResult.cache.misses,
                },
            };
        }, nodeResult);

        return result;
    }

    private getMemoryFromPlan(plan: ProfiledPlan): number {
        const rawMemory = plan.arguments["Memory"] as Integer | undefined;
        if (!rawMemory) {
            return 0;
        }
        return rawMemory.toInt();
    }
}
