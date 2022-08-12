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

import { Screen } from "./Screen";

export class HelpDrawer extends Screen {
    public async openHelpDrawer() {
        await this.page.waitForSelector("[data-test-topbar-help-button]");
        await this.page.click("[data-test-topbar-help-button]");
        await this.page.waitForSelector("[data-test-help-drawer]");
    }

    public async closeHelpDrawer() {
        await this.page.waitForSelector("[data-test-help-drawer]");
        await this.page.waitForSelector("[data-test-help-drawer-close]");
        await this.page.click("[data-test-help-drawer-close]");
    }

    public async displaysSchemaViewContent() {
        await this.page.waitForSelector("[data-test-help-drawer-title]");
        await this.page.waitForSelector("[data-test-help-drawer-resources-list]");
        await this.page.waitForSelector("[data-test-help-drawer-canny-button]");
    }

    public async displaysEditorViewContent() {
        await this.page.waitForSelector("[data-test-help-drawer-title]");
        await this.page.waitForSelector("[data-test-help-drawer-resources-list]");
        await this.page.waitForSelector("[data-test-help-drawer-schema-doc-tile]");
        await this.page.waitForSelector("[data-test-help-drawer-canny-button]");
    }

    public async displaysSchemaDocumentation() {
        await this.page.waitForSelector("[data-test-help-drawer-schema-doc-tile]");
        await this.page.click("[data-test-help-drawer-schema-doc-tile]");
        await this.page.waitForSelector("[data-test-doc-explorer-close-button]");
        await this.page.waitForSelector("[data-test-doc-explorer-back-button]");
        await this.page.click("[data-test-doc-explorer-back-button]");
        await this.page.waitForSelector("[data-test-help-drawer-title]");
    }

    public async displaysKeybindingsInEditorView() {
        await this.page.waitForSelector("[data-test-help-drawer-keybindings-tile-editor-view]");
        await this.page.click("[data-test-help-drawer-keybindings-tile-editor-view]");
        await this.page.waitForSelector("[data-test-help-drawer-keybindings-list]");
        await this.page.waitForSelector("[data-test-help-drawer-keybindings-back]");
        await this.page.waitForSelector("[data-test-help-drawer-keybindings-close]");
        await this.page.click("[data-test-help-drawer-keybindings-back]");
        await this.page.waitForSelector("[data-test-help-drawer-title]");
    }

    public async displaysKeybindingsInSchemaView() {
        await this.page.waitForSelector("[data-test-help-drawer-keybindings-tile-schema-view]");
        await this.page.click("[data-test-help-drawer-keybindings-tile-schema-view]");
        await this.page.waitForSelector("[data-test-help-drawer-keybindings-list]");
        await this.page.waitForSelector("[data-test-help-drawer-keybindings-back]");
        await this.page.waitForSelector("[data-test-help-drawer-keybindings-close]");
        await this.page.click("[data-test-help-drawer-keybindings-back]");
        await this.page.waitForSelector("[data-test-help-drawer-title]");
    }
}
