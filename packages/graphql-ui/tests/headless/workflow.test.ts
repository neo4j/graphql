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

import { generate } from "randomstring";
import * as neo4j from "neo4j-driver";
import { getBrowser, getPage, Browser } from "./puppeteer";
import { Login } from "./pages/Login";
import { SchemaEditor } from "./pages/SchemaEditor";
import { Editor } from "./pages/Editor";

const { NEO_USER = "admin", NEO_PASSWORD = "password", NEO_URL = "neo4j://localhost:7687/neo4j" } = process.env;

describe("workflow", () => {
    const id = generate({
        charset: "alphabetic",
    });
    const typeDefs = `
        type Movie {
            id: ID!
        }
    `;
    const query = `
        query {
            movies(where: { id: "${id}" }) {
                id
            }
        }
    `;
    let browser: Browser;
    let driver: neo4j.Driver;

    beforeAll(async () => {
        driver = neo4j.driver(NEO_URL, neo4j.auth.basic(NEO_USER, NEO_PASSWORD));
        browser = await getBrowser();
    });

    afterAll(async () => {
        await browser.close();
        await driver.close();
    });

    test("should perform e2e workflow", async () => {
        const page = await getPage({ browser });

        const login = new Login(page);
        await login.setUsername(NEO_USER);
        await login.setPassword(NEO_PASSWORD);
        await login.setURL(NEO_URL);
        await login.submit();
        await login.awaitSuccess();

        const schemaEditor = new SchemaEditor(page);
        await schemaEditor.setTypeDefs(typeDefs);
        await schemaEditor.buildSchema();

        const editor = new Editor(page);
        await editor.setQuery(query);

        const session = await driver.session();
        try {
            await session.run(`
                CREATE (:Movie { id: "${id}" })
            `);
        } finally {
            await session.close();
        }

        await editor.submitQuery();
        await page.waitForNetworkIdle();
        await page.waitForTimeout(2000);

        const output = await editor.getOutput();

        expect(JSON.parse(output)).toMatchObject({
            data: {
                movies: [{ id }],
            },
        });
    });
});
