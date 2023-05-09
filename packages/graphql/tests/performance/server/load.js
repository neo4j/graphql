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
import { check, sleep } from "k6";
// eslint-disable-next-line import/no-unresolved
import { Trend } from "k6/metrics";
import { queries } from "./queries.js";

const CONFIG = {
    maxVUs: 100,
    duration: 30,
    query: queries.simpleQuery,
};

export const options = {
    stages: [
        { duration: "5s", target: CONFIG.maxVUs }, // Ramp up
        { duration: `${CONFIG.duration}s`, target: CONFIG.maxVUs },
        { duration: "10s", target: 0 }, // Cooldown
    ],
};

const dbQueryTrend = new Trend("neo4j/gaphql_database_query_time", true);

export default function () {
    const headers = {
        "Content-Type": "application/json",
    };
    const res = http.post("http://localhost:4000/graphql", JSON.stringify({ query: CONFIG.query }), {
        headers: headers,
    });

    const body = JSON.parse(res.body);
    // TODO: check
    check(res, {
        "status was 200": (r) => r.status == 200,
        "response has no error": () => {
            if (body.errors && body.errors.length > 0) return false;
            return true;
        },
    });

    const measurements = body.extensions && body.extensions.measurements;
    if (measurements) {
        dbQueryTrend.add(measurements.databaseQueryTime);
    }

    sleep(0.3);
}
