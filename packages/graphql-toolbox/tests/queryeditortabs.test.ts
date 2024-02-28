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
import { expect, test } from "./utils/pagemodel";

dotenv.config();

test.describe("query editor tabs", () => {
    const typeDefs = /* GraphQL */ `
        type Movie {
            id: ID!
        }
    `;

    const queryOne = /* GraphQL */ `
        query MyTest1 {
            movies {
                id
            }
        }
    `;

    const queryTwo = /* GraphQL */ `
        query MyTest2 {
            movies {
                id
            }
        }
    `;

    test("should be able to add a new tab including a query and then remove it again", async ({
        page,
        loginPage,
        schemaEditorPage,
        editorPage,
    }) => {
        await loginPage.loginDismissIntrospection();

        await schemaEditorPage.setTypeDefs(typeDefs);
        await schemaEditorPage.buildSchema();

        await editorPage.addNewTab();
        await editorPage.setQuery(queryOne);
        await editorPage.closeTabByTabName("MyTest1");

        await expect(page.getByRole("tab", { name: "Unnamed" })).toBeVisible();
        await expect(page.getByRole("tab", { name: "MyTest1" })).not.toBeVisible();
    });

    test("create a tab, set two queries and delete one of them", async ({
        page,
        loginPage,
        schemaEditorPage,
        editorPage,
    }) => {
        await loginPage.loginDismissIntrospection();

        await schemaEditorPage.setTypeDefs(typeDefs);
        await schemaEditorPage.buildSchema();

        await editorPage.addNewTab();
        await editorPage.setQuery(queryOne);
        await editorPage.selectTabByTabName("Unnamed");
        await editorPage.setQuery(queryTwo);
        await editorPage.closeTabByTabName("MyTest2");

        await expect(page.getByRole("tab", { name: "MyTest1" })).toBeVisible();
        await expect(page.getByRole("tab", { name: "MyTest2" })).not.toBeVisible();
    });
});
