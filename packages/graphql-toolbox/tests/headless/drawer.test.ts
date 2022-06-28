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
import { Login } from "./pages/Login";
import { SchemaEditor } from "./pages/SchemaEditor";
import { HelpDrawer } from "./pages/HelpDrawer";

describe("drawer", () => {
    const typeDefs = `
        type Movie {
            name: String!
        }
    `;
    let browser: Browser;

    beforeAll(async () => {
        browser = await getBrowser();
    });

    afterAll(async () => {
        await browser.close();
    });

    test("should show the Help and learn drawer and its content", async () => {
        const page = await getPage({ browser });

        const login = new Login(page);
        await login.login();

        const helpDrawer = new HelpDrawer(page);
        await helpDrawer.openHelpDrawer();
        await helpDrawer.displaysSchemaViewContent();
        await helpDrawer.displaysKeybindingsInSchemaView();

        const schemaEditor = new SchemaEditor(page);
        await schemaEditor.setTypeDefs(typeDefs);
        await schemaEditor.buildSchema();

        await helpDrawer.displaysEditorViewContent();
        await helpDrawer.displaysSchemaDocumentation();
        await helpDrawer.displaysKeybindingsInEditorView();
        await helpDrawer.closeHelpDrawer();
    });
});
