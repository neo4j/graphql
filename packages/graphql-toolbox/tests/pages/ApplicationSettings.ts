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

export class ApplicationSettings extends Screen {
    public async openSettingsDrawer() {
        await this.page.waitForSelector("[data-test-topbar-settings-button]");
        await this.page.click("[data-test-topbar-settings-button]");
        await this.page.waitForSelector("[data-test-settings-close-button]");
    }

    public async closeSettingsDrawer() {
        await this.page.waitForSelector("[data-test-settings-close-button]");
        await this.page.click("[data-test-settings-close-button]");
    }

    public async enableProductUsageTracking() {
        await this.page.waitForSelector("[data-test-enable-product-usage-tracking]");
        await this.page.click("[data-test-enable-product-usage-tracking]");
    }

    public async isProductUsageTrackingChecked() {
        await this.page.waitForSelector("[data-test-enable-product-usage-tracking]");
        expect(
            await this.page.$eval("[data-test-enable-product-usage-tracking]", (el) =>
                el.classList.contains("data-test-enable-product-usage-tracking-checked"),
            ),
        ).toBeTruthy();
    }

    public async disableProductUsageTracking() {
        await this.page.waitForSelector("[data-test-enable-product-usage-tracking]");
        await this.page.click("[data-test-enable-product-usage-tracking]");
    }

    public async isProductUsageTrackingNotChecked() {
        await this.page.waitForSelector("[data-test-enable-product-usage-tracking]");
        expect(
            await this.page.$eval("[data-test-enable-product-usage-tracking]", (el) =>
                el.classList.contains("data-test-enable-product-usage-tracking-checked"),
            ),
        ).toBeFalsy();
    }
}
