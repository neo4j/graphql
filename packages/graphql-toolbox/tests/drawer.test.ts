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
import { test } from "./utils/pagemodel";

base.test.describe("drawer", () => {
    const typeDefs = `
        type Movie {
            name: String!
        }
    `;

    test("should show the Help and learn drawer and its content", async ({
        loginPage,
        helpDrawerPage,
        schemaEditorPage,
    }) => {
        await loginPage.loginDismissIntrospection();

        await helpDrawerPage.openHelpDrawer();
        await helpDrawerPage.displaysSchemaViewContent();
        await helpDrawerPage.displaysKeybindingsInSchemaView();

        await schemaEditorPage.setTypeDefs(typeDefs);
        await schemaEditorPage.buildSchema();

        await helpDrawerPage.displaysEditorViewContent();
        await helpDrawerPage.displaysSchemaDocumentation();
        await helpDrawerPage.displaysKeybindingsInEditorView();
        await helpDrawerPage.closeHelpDrawer();
    });

    test("should show the schema docs next to the Explorer component", async ({
        loginPage,
        editorPage,
        schemaEditorPage,
    }) => {
        await loginPage.loginDismissIntrospection();

        await schemaEditorPage.setTypeDefs(typeDefs);
        await schemaEditorPage.buildSchema();

        await editorPage.showSchemaDocs();
        await editorPage.hideSchemaDocs();
    });
});
