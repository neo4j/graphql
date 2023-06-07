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

import * as base from "@playwright/test";
import * as dotenv from "dotenv";
import { expect, test } from "./utils/pagemodel";

dotenv.config();

const { NEO_USER = "admin", NEO_PASSWORD = "password", NEO_URL = "neo4j://localhost:7687/neo4j" } = process.env;

base.test.describe("login", () => {
    test("should be able to connect to database", async ({ loginPage }) => {
        await loginPage.setUsername(NEO_USER);
        await loginPage.setPassword(NEO_PASSWORD);
        await loginPage.setURL(NEO_URL);
        await loginPage.submit();
        await loginPage.dismissIntrospectionPrompt();
        await loginPage.awaitSuccess();
    });

    test("should be able to disconnect from a database", async ({ loginPage, topBarPage }) => {
        await loginPage.loginDismissIntrospection();

        await topBarPage.clickConnectionInformation();
        await topBarPage.clickDisconnect();

        const isVisible = await loginPage.getIsLoginWindowVisible();
        expect(isVisible).toBeTruthy();
    });
});
