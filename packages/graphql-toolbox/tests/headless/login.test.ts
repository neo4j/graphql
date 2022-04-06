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

import { getBrowser, getPage, Browser } from "./puppeteer";
import { Login } from "./pages/Login";

const { NEO_USER = "admin", NEO_PASSWORD = "password", NEO_URL = "neo4j://localhost:7687/neo4j" } = process.env;

describe("login", () => {
    let browser: Browser;

    beforeAll(async () => {
        browser = await getBrowser();
    });

    afterAll(async () => {
        await browser.close();
    });

    test("should login", async () => {
        const page = await getPage({ browser });
        const login = new Login(page);

        await login.setUsername(NEO_USER);
        await login.setPassword(NEO_PASSWORD);
        await login.setURL(NEO_URL);
        await login.submit();
        await login.awaitSuccess();
    });
});
