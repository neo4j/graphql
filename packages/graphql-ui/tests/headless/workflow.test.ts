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
import {
    EDITOR_QUERY_BUTTON,
    EDITOR_QUERY_INPUT,
    EDITOR_RESPONSE_OUTPUT,
    SCHEMA_EDITOR_BUILD_BUTTON,
    SCHEMA_EDITOR_INPUT,
} from "../../src/constants";
import { generate } from "randomstring";
import * as neo4j from "neo4j-driver";
import { Login } from "./screens/Login";
import { SchemaEditor } from "./screens/SchemaEditor";

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

        await page.waitForSelector(`#${EDITOR_QUERY_BUTTON}`);

        await page.evaluate(
            (injected) => {
                // @ts-ignore
                document[`${injected.id}`].setValue(injected.query);
            },
            { query, id: EDITOR_QUERY_INPUT }
        );

        const session = await driver.session();
        try {
            await session.run(`
                CREATE (:Movie { id: "${id}" })
            `);
        } finally {
            await session.close();
        }

        await page.click(`#${EDITOR_QUERY_BUTTON}`);
        await page.waitForNetworkIdle();
        await page.waitForTimeout(2000); // - Wait for Response
        const response = await page.evaluate((injected) => {
            // @ts-ignore
            return document[`${injected}`].getValue();
        }, EDITOR_RESPONSE_OUTPUT);

        expect(JSON.parse(response)).toMatchObject({
            data: {
                movies: [{ id }],
            },
        });
    });
});
