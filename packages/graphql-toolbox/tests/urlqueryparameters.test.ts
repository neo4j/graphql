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

import * as neo4j from "neo4j-driver";
import { Login } from "./pages/Login";
import { test, describe, expect, beforeAll, afterAll } from "./utils/pagemodel";

const { NEO_USER = "admin", NEO_PASSWORD = "password", NEO_URL = "neo4j://localhost:7687/neo4j" } = process.env;

const DATABASE_NAME = "graphqltoolboxe2etestdatabase";

describe("URL query parameters", () => {
    let driver: neo4j.Driver;

    beforeAll(async () => {
        driver = neo4j.driver(NEO_URL, neo4j.auth.basic(NEO_USER, NEO_PASSWORD));
        const session = await driver.session();
        try {
            await session.run(`CREATE OR REPLACE DATABASE ${DATABASE_NAME}`);
        } catch (err) {
            throw new Error(`Failed to create database for test run. Error: ${err}`);
        } finally {
            await session.close();
        }
    });

    afterAll(async () => {
        const session = await driver.session();
        try {
            await session.run(`DROP DATABASE ${DATABASE_NAME} IF EXISTS`);
        } catch (err) {
            throw new Error(`Failed to drop database after test run. Error: ${err}`);
        } finally {
            await session.close();
            await driver.close();
        }
    });

    test("should pre-fill connection URI and username input fields with values from url query parameter", async ({
        page,
    }) => {
        await page.goto("/?connectURL=bolt%2Bs://testuser@abcd22.databases.neo4j.io");
        const login = new Login(page);

        const username = await login.getUsername();
        const connectURI = await login.getURL();

        expect(username).toEqual("testuser");
        expect(connectURI).toEqual("bolt+s://abcd22.databases.neo4j.io");
    });

    test("should select the database from provided url query parameter", async ({ page, topBarPage }) => {
        await page.goto(`/?db=${DATABASE_NAME}`);

        const login = new Login(page);
        await login.login();

        // We need some waiting time after loading the application for a dbms query checking for available databases to resolve.
        await page.waitForTimeout(1000);

        const selectedDatabase = await topBarPage.getSelectedDatabase();

        expect(selectedDatabase).toEqual(DATABASE_NAME);
    });
});
