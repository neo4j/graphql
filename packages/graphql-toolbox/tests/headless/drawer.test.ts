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

import { toGraphQLTypeDefs } from "@neo4j/introspector";
import * as neo4j from "neo4j-driver";
import { generate } from "randomstring";
import { getBrowser, getPage, Browser } from "./puppeteer";
import { Login } from "./pages/Login";
import { SchemaEditor } from "./pages/SchemaEditor";
import { Editor } from "./pages/Editor";

const { NEO_USER = "admin", NEO_PASSWORD = "password", NEO_URL = "neo4j://localhost:7687/neo4j" } = process.env;

describe("introspection", () => {
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

    test("should show the help and learn drawer", async () => {
        const page = await getPage({ browser });

        const login = new Login(page);
        await login.login();

        // check the drawer

        const schemaEditor = new SchemaEditor(page);
        await schemaEditor.setTypeDefs(typeDefs);
        await schemaEditor.buildSchema();

        // check the drawer
    });
});
