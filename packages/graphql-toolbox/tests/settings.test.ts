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
import { test } from "./utils/pagemodel";

dotenv.config();

base.test.describe("settings", () => {
    test("should be able to enable and disable product usage tracking", async ({
        loginPage,
        applicationSettingsPage,
    }) => {
        await loginPage.loginDismissIntrospection();

        await applicationSettingsPage.openSettingsDrawer();

        await applicationSettingsPage.isProductUsageTrackingChecked();
        await applicationSettingsPage.disableProductUsageTracking();
        await applicationSettingsPage.isProductUsageTrackingNotChecked();
        await applicationSettingsPage.enableProductUsageTracking();

        await applicationSettingsPage.closeSettingsDrawer();
    });

    test("should show the current year in the copyright information", async ({
        loginPage,
        applicationSettingsPage,
    }) => {
        await loginPage.loginDismissIntrospection();

        await applicationSettingsPage.openSettingsDrawer();
        await applicationSettingsPage.verifyCopyrightCurrentYear();
        await applicationSettingsPage.closeSettingsDrawer();
    });
});
