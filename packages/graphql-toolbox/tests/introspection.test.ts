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
import { test, expect, beforeAll, afterAll } from "./utils/pagemodel";

dotenv.config();

const { NEO_USER = "admin", NEO_PASSWORD = "password", NEO_URL = "neo4j://localhost:7687/neo4j" } = process.env;

base.test.describe("introspection", () => {
    let driver: neo4j.Driver;

    beforeAll(() => {
        driver = neo4j.driver(NEO_URL, neo4j.auth.basic(NEO_USER, NEO_PASSWORD));
    });

    afterAll(async () => {
        await driver.close();
    });

    test("should introspect database and output result", async ({ page, loginPage, schemaEditorPage }) => {
        await loginPage.loginDismissIntrospection();

        const sessionFactory = () => driver?.session({ defaultAccessMode: neo4j.session.WRITE });
        const session = sessionFactory();

        try {
            await session.run(`
                CREATE (m:MyMovie { id: randomUUID() }) RETURN m
            `);
        } finally {
            await session.close();
        }

        await schemaEditorPage.introspect();
        await page.waitForTimeout(4000);
        const generatedTypeDefs = await schemaEditorPage.getTypeDefs();

        expect(generatedTypeDefs).toContain(`type MyMovie`);
    });
});
