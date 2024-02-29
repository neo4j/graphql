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

import * as dotenv from "dotenv";
import * as neo4j from "neo4j-driver";
import { generate } from "randomstring";
import { afterAll, beforeAll, expect, test } from "./utils/pagemodel";

dotenv.config();

const { NEO_USER = "admin", NEO_PASSWORD = "password", NEO_URL = "neo4j://localhost:7687/neo4j" } = process.env;

test.describe("Switch database", () => {
    const randomString = generate({
        charset: "alphabetic",
        length: 8,
        capitalization: "lowercase",
    });
    const databaseName = `graphqltoolboxe2etestdb${randomString}`;

    let driver: neo4j.Driver;

    const typeDefs = /* GraphQL */ `
        type Movie {
            id: ID!
        }
    `;

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

    test("should be able to switch a database and get a cleared schema view editor thereafter", async ({
        loginPage,
        schemaEditorPage,
        topBarPage,
    }) => {
        await loginPage.loginDismissIntrospection();

        await topBarPage.waitForTopBarVisibility();
        await schemaEditorPage.setTypeDefs(typeDefs);
        let currentTypeDefs = await schemaEditorPage.getTypeDefs();
        expect(currentTypeDefs.replaceAll(/\s+/g, "")).toEqual(typeDefs.replaceAll(/\s+/g, ""));

        await topBarPage.clickConnectionInformation();
        await topBarPage.selectDatabaseByName(databaseName);
        await topBarPage.confirmDatabaseSelection();

        await topBarPage.waitForTopBarVisibility();
        currentTypeDefs = await schemaEditorPage.getTypeDefs();
        expect(currentTypeDefs.replaceAll(/\s+/g, "")).toEqual("");
    });

    test("should be able to cancel a switch database dialog causing no changes", async ({
        loginPage,
        schemaEditorPage,
        topBarPage,
    }) => {
        await loginPage.loginDismissIntrospection();

        await topBarPage.waitForTopBarVisibility();
        await schemaEditorPage.setTypeDefs(typeDefs);
        let currentTypeDefs = await schemaEditorPage.getTypeDefs();
        expect(currentTypeDefs.replaceAll(/\s+/g, "")).toEqual(typeDefs.replaceAll(/\s+/g, ""));

        await topBarPage.clickConnectionInformation();
        await topBarPage.selectDatabaseByName(databaseName);
        await topBarPage.cancelDatabaseSelection();

        await topBarPage.waitForTopBarVisibility();
        currentTypeDefs = await schemaEditorPage.getTypeDefs();
        expect(currentTypeDefs.replaceAll(/\s+/g, "")).toEqual(typeDefs.replaceAll(/\s+/g, ""));
    });
});
