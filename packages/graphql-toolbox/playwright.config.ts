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

import { PlaywrightTestConfig, devices } from "@playwright/test";

const config: PlaywrightTestConfig = {
    webServer: {
        command: "yarn start",
        url: "http://localhost:4242",
        timeout: 120 * 1000,
        reuseExistingServer: !process.env.CI,
    },
    use: {
        trace: "retain-on-failure",
        baseURL: "http://localhost:4242",
    },
    testDir: "tests",
    timeout: process.env.CI ? 120 * 1000 : 30 * 1000,
    forbidOnly: !!process.env.CI,
    retries: process.env.CI ? 2 : 0,
    workers: process.env.CI ? 6 : undefined,
    projects: [
        {
            name: "chromium",
            use: {
                ...devices["Desktop Chrome"],
                viewport: { width: 1920, height: 1080 },
            },
        },
        {
            name: "firefox",
            use: { ...devices["Desktop Firefox"], viewport: { width: 1920, height: 1080 } },
        },
        {
            name: "webkit",
            use: { ...devices["Desktop Safari"], viewport: { width: 1920, height: 1080 } },
        },
    ],
    outputDir: "tests/artifacts/",
};
export default config;
