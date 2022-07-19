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

export class SchemaSettings extends Screen {
    public async enableDebug() {
        await this.page.waitForSelector("[data-test-schema-debug-checkbox]");
        await this.page.check("[data-test-schema-debug-checkbox]");
    }

    public async isDebugChecked() {
        await this.page.waitForSelector("[data-test-schema-debug-checkbox]");
        expect(await this.page.isChecked("[data-test-schema-debug-checkbox]")).toBeTruthy();
    }

    public async disableDebug() {
        await this.page.waitForSelector("[data-test-schema-debug-checkbox]");
        await this.page.uncheck("[data-test-schema-debug-checkbox]");
    }
}
