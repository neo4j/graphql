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

// eslint-disable-next-line import/no-unresolved
import http from "k6/http";
// eslint-disable-next-line import/no-unresolved
import { check } from "k6";
// eslint-disable-next-line import/no-unresolved
import { Trend } from "k6/metrics";
import { queries } from "./queries.js";

const CONFIG = {
    maxVUs: 10,
    duration: 30,
    skipChecks: false,
    query: queries.highComplexityQuery,
    api: "http://localhost:4000/graphql",
};

const dbQueryTrend = new Trend("neo4j_graphql_database_query_time", true);
const translationTimeTrend = new Trend("neo4j_graphql_translation_time", true);
const wrapperTimeTrend = new Trend("neo4j_graphql_wrapper_time", true);

export const options = {
    scenarios: {
        default: {
            executor: "ramping-vus",
            stages: [
                { duration: "5s", target: CONFIG.maxVUs }, // Ramp up
                { duration: `${CONFIG.duration}s`, target: CONFIG.maxVUs },
                { duration: "10s", target: 0 }, // Cooldown
            ],
        },
    },
};

export function setup() {
    return {
        query: CONFIG.query,
        headers: {
            "Content-Type": "application/json",
        },
    };
}

export default function (config) {
    const res = http.post(CONFIG.api, JSON.stringify({ query: config.query }), {
        headers: config.headers,
    });

    if (!config.skipChecks) {
        const body = JSON.parse(res.body);
        check(res, {
            "status was 200": (r) => r.status == 200,
            "response has body": (r) => r.body,
            "response has data": () => body && body.data,
            "response has no error": () => {
                if (body && body.errors && body.errors.length > 0) {
                    console.error(body.errors);
                    return false;
                }
                return true;
            },
        });
        const measurements = body.extensions && body.extensions.measurements;
        if (measurements) {
            dbQueryTrend.add(measurements.databaseQueryTime);
            translationTimeTrend.add(measurements.translationTime);
            wrapperTimeTrend.add(measurements.wrapperTime);
        }
    }
}
