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

import { expect } from "@playwright/test";
import { Screen } from "./Screen";

export class TopBar extends Screen {
    public async waitForTopBarVisibility() {
        await this.page.locator("[data-test-topbar-connection-information]").waitFor({ state: "visible" });
        const topBarConnectionInfo = this.page.locator("[data-test-topbar-connection-information]");
        await expect(topBarConnectionInfo).toBeVisible();
    }

    public async getSelectedDatabase(): Promise<string> {
        const element = this.page.locator("[data-test-topbar-selected-database]");
        const text = await element.innerText();
        return text;
    }

    public async clickConnectionInformation() {
        await this.page.waitForSelector("[data-test-topbar-connection-information]");
        await this.page.click("[data-test-topbar-connection-information]");
    }

    public async selectDatabaseByName(name: string) {
        await this.page.waitForSelector(`[data-test-topbar-database="${name}"]`);
        await this.page.click(`[data-test-topbar-database="${name}"]`);
    }

    public async clickDisconnect() {
        await this.page.waitForSelector(`[data-test-topbar-disconnect]`);
        await this.page.click(`[data-test-topbar-disconnect]`);
    }
}
