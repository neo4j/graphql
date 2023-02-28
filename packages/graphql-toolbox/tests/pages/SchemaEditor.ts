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

import { SCHEMA_EDITOR_INPUT } from "../../src/constants";
import { Screen } from "./Screen";

export class SchemaEditor extends Screen {
    public async setTypeDefs(typeDefs: string) {
        await this.page.waitForSelector("[data-test-schema-editor-build-button]");
        await this.page.evaluate(
            ({ id, typeDefs }) => {
                // @ts-ignore -Find a better solution
                document[`${id}`].setValue(typeDefs);
            },
            { typeDefs, id: SCHEMA_EDITOR_INPUT },
        );
    }

    public async buildSchema() {
        await this.page.waitForSelector("[data-test-schema-editor-build-button]");
        await this.page.click("[data-test-schema-editor-build-button]");
    }

    public async getTypeDefs(): Promise<string> {
        const output = await this.page.$eval(`#${SCHEMA_EDITOR_INPUT}`, (el) => {
            // @ts-ignore - Injected in html
            return document.CodeMirror.fromTextArea(el).getValue();
        });

        return output as unknown as string;
    }

    public async introspect() {
        await this.page.waitForSelector("[data-test-schema-editor-introspect-button]");
        await this.page.click("[data-test-schema-editor-introspect-button]");
    }

    public async goToEditorView() {
        await this.page.waitForSelector("[data-test-view-selector-editor]");
        await this.page.click("[data-test-view-selector-editor]");
    }
}
