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
import * as dotenv from "dotenv";
import * as base from "@playwright/test";
import { generate } from "randomstring";
import { Login } from "./pages/Login";
import { test, expect, beforeAll, afterAll } from "./utils/pagemodel";

dotenv.config();

const { NEO_USER = "admin", NEO_PASSWORD = "password", NEO_URL = "neo4j://localhost:7687/neo4j" } = process.env;

base.test.describe("URL query parameters", () => {
    const randomString = generate({
        charset: "alphabetic",
        length: 8,
        capitalization: "lowercase",
    });
    const databaseName = `graphqltoolboxe2etestdb${randomString}`;

    let driver: neo4j.Driver;

    beforeAll(async () => {
        driver = neo4j.driver(NEO_URL, neo4j.auth.basic(NEO_USER, NEO_PASSWORD));
        const session = driver.session();
        try {
            await session.run(`CREATE OR REPLACE DATABASE ${databaseName} WAIT`);
        } catch (err) {
            throw new Error(`Failed to create database for test run. Error: ${err}`);
        } finally {
            await session.close();
        }
    });

    afterAll(async () => {
        const session = driver.session();
        try {
            await session.run(`DROP DATABASE ${databaseName} IF EXISTS`);
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

    test("should pre-fill connection URI input field with values from url query parameter, no username provided in query parameter", async ({
        page,
    }) => {
        await page.goto("/?connectURL=bolt%2Bs://abcd22.databases.neo4j.io");
        const login = new Login(page);

        const username = await login.getUsername();
        const connectURI = await login.getURL();

        expect(username).toEqual("neo4j");
        expect(connectURI).toEqual("bolt+s://abcd22.databases.neo4j.io");
    });

    test("should pre-fill password input field from url query parameter, incorrect password provided", async ({
        page,
    }) => {
        await page.goto("/?connectURL=bolt%2Bs://neo4j:myincorrectpassword@abcd22.databases.neo4j.io");
        const login = new Login(page);

        const username = await login.getUsername();
        const password = await login.getPassword();
        const connectURI = await login.getURL();

        expect(username).toEqual("neo4j");
        expect(password).toEqual("myincorrectpassword");
        expect(connectURI).toEqual("bolt+s://abcd22.databases.neo4j.io");
    });

    test("should auto-login when providing complete connectURL parameter including password", async ({ page }) => {
        const [protocol, host] = NEO_URL.split(/:\/\//);
        if (!protocol || !host) {
            throw new Error(`Invalid NEO_URL value. Got "${NEO_URL}"`);
        }
        const connectURL = encodeURIComponent(`${protocol}://${NEO_USER}:${NEO_PASSWORD}@${host}`);

        await page.goto(`/?connectURL=${connectURL}`);
        const login = new Login(page);

        await login.dismissIntrospectionPrompt();
        await login.awaitSuccess();
    });

    test("should select the database from provided url query parameter", async ({ page, topBarPage }) => {
        await page.goto(`/?db=${databaseName}`);

        const login = new Login(page);
        await login.login();

        // We need some waiting time after loading the application for a dbms query checking for available databases to resolve.
        await page.waitForTimeout(2000);

        const selectedDatabase = await topBarPage.getSelectedDatabase();

        expect(selectedDatabase).toEqual(databaseName);
    });
});
