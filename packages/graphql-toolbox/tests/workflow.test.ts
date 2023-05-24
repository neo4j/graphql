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
import * as neo4j from "neo4j-driver";
import { generate } from "randomstring";
import { afterAll, beforeAll, expect, test } from "./utils/pagemodel";

dotenv.config();

const { NEO_USER = "admin", NEO_PASSWORD = "password", NEO_URL = "neo4j://localhost:7687/neo4j" } = process.env;

base.test.describe("workflow", () => {
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

    const queryWithVariables = `
        query($moviesWhere: MovieWhere) {
            movies(where: $moviesWhere) {
                id
            }
        }
    `;

    const variables = `
        {
            "moviesWhere": {
                "id": "${id}"
            }
        }
    `;

    let driver: neo4j.Driver;

    beforeAll(() => {
        driver = neo4j.driver(NEO_URL, neo4j.auth.basic(NEO_USER, NEO_PASSWORD));
    });

    afterAll(async () => {
        await driver.close();
    });

    test("should perform workflow end-to-end", async ({ page, loginPage, schemaEditorPage, editorPage }) => {
        await loginPage.loginDismissIntrospection();

        await schemaEditorPage.setTypeDefs(typeDefs);
        await schemaEditorPage.buildSchema();

        await editorPage.setQuery(query);

        const session = driver.session();
        try {
            await session.run(`
                CREATE (:Movie { id: "${id}" })
            `);
        } finally {
            await session.close();
        }

        await editorPage.submitQuery();
        await page.waitForTimeout(2000);

        const outputQuery = await editorPage.getOutput();

        expect(JSON.parse(outputQuery)).toMatchObject({
            data: {
                movies: [{ id }],
            },
        });

        // Testing a query with variables
        await editorPage.setQuery(queryWithVariables);
        await editorPage.setParams(variables);

        await editorPage.submitQuery();
        await page.waitForTimeout(2000);

        const outputQueryWithVariables = await editorPage.getOutput();

        expect(JSON.parse(outputQueryWithVariables)).toMatchObject({
            data: {
                movies: [{ id }],
            },
        });
    });

    test("should be able to switch between type defs view and editor view", async ({
        loginPage,
        schemaEditorPage,
        editorPage,
    }) => {
        await loginPage.loginDismissIntrospection();

        await schemaEditorPage.setTypeDefs(typeDefs);
        await schemaEditorPage.buildSchema();

        await editorPage.goToTypeDefinitionView();
        await schemaEditorPage.goToEditorView();
        await editorPage.goToTypeDefinitionView();
        await schemaEditorPage.goToEditorView();
    });
});
