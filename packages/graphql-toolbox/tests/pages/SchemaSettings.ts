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

export class SchemaSettings extends Screen {
    public async enableDebug() {
        await this.page.waitForSelector("[data-test-schema-debug-checkbox");
        await this.page.evaluate((selector) => {
            // @ts-ignore -Find a better solution
            document.querySelector(selector).click();
        }, "[data-test-schema-debug-checkbox]");
        const isDebugCheckboxChecked = await this.page.$eval("[data-test-schema-debug-checkbox]", (el) => {
            // @ts-ignore
            return el.checked;
        });
        if (!isDebugCheckboxChecked) throw new Error("Enable Debug checkbox was not checked");
        return true;
    }

    public async disableDebug() {
        const isDebugCheckboxChecked = await this.page.$eval("[data-test-schema-debug-checkbox]", (el) => {
            // @ts-ignore
            return el.checked;
        });
        if (!isDebugCheckboxChecked) return true;
        await this.page.waitForSelector("[data-test-schema-debug-checkbox");
        await this.page.click("[data-test-schema-debug-checkbox]");
    }
}
