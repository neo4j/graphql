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
import * as base from "@playwright/test";
import { generate } from "randomstring";
import { test, beforeEach, afterEach, expect } from "./utils/pagemodel";

const { NEO_USER = "admin", NEO_PASSWORD = "password", NEO_URL = "neo4j://localhost:7687/neo4j" } = process.env;

base.test.describe("Introspection prompt", () => {
    let driver: neo4j.Driver;
    const randomString = generate({
        charset: "alphabetic",
        length: 8,
    });
    const label = `TEST${randomString}`;

    beforeEach(async () => {
        driver = neo4j.driver(NEO_URL, neo4j.auth.basic(NEO_USER, NEO_PASSWORD));

        const session = driver.session();
        try {
            await session.run(`
                CREATE (d:${label}) SET d.name = "test" RETURN d
            `);
        } finally {
            await session.close();
        }
    });

    afterEach(async () => {
        const session = driver.session();
        try {
            await session.run(`
                MATCH (d:${label}) DETACH DELETE d
            `);
        } finally {
            await session.close();
            await driver.close();
        }
    });

    test("should log in and introspect via introspection prompt button", async ({
        page,
        loginPage,
        schemaEditorPage,
    }) => {
        await loginPage.setUsername(NEO_USER);
        await loginPage.setPassword(NEO_PASSWORD);
        await loginPage.setURL(NEO_URL);
        await loginPage.submit();
        await loginPage.introspectionPromptIntrospect();
        await loginPage.awaitSuccess();

        // wait for introspection to finish
        await page.waitForTimeout(4000);

        const generatedTypeDefs = await schemaEditorPage.getTypeDefs();
        expect(generatedTypeDefs).toContain(`type ${label}`);
    });
});
