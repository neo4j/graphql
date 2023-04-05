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

import { EDITOR_PARAMS_INPUT, EDITOR_QUERY_INPUT, EDITOR_RESPONSE_OUTPUT } from "../../src/constants";
import { Screen } from "./Screen";

export class Editor extends Screen {
    public async setQuery(query: string) {
        await this.page.waitForSelector("[data-test-editor-query-button]");
        await this.page.evaluate(
            ({ id, query }) => {
                // @ts-ignore -Find a better solution
                document[`${id}`].setValue(query);
            },
            { query, id: EDITOR_QUERY_INPUT }
        );
    }

    public async setParams(params: string) {
        await this.page.waitForSelector("[data-test-editor-query-button]");
        await this.page.evaluate(
            ({ id, params }) => {
                // @ts-ignore -Find a better solution
                document[`${id}`].setValue(params);
            },
            { params, id: EDITOR_PARAMS_INPUT }
        );
    }

    public async submitQuery() {
        await this.page.waitForSelector("[data-test-editor-query-button]");
        await this.page.click("[data-test-editor-query-button]");
    }

    public async getOutput(): Promise<string> {
        const output = await this.page.evaluate((id) => {
            // @ts-ignore -Find a better solution
            return document[`${id}`].getValue();
        }, EDITOR_RESPONSE_OUTPUT);

        return output as unknown as string;
    }

    public async showSchemaDocs() {
        await this.page.waitForSelector("[data-test-explorer-show-docs-switch]");
        await this.page.check("[data-test-explorer-show-docs-switch]");
        await this.page.waitForSelector(".graphiql-doc-explorer");
    }

    public async hideSchemaDocs() {
        await this.page.waitForSelector(".graphiql-doc-explorer");
        await this.page.uncheck("[data-test-explorer-show-docs-switch]");
    }

    public async awaitSuccess() {
        await this.page.waitForSelector("[data-test-schema-editor-build-button]");
    }

    public async goToTypeDefinitionView() {
        await this.page.waitForSelector("[data-test-view-selector-type-defs]");
        await this.page.click("[data-test-view-selector-type-defs]");
    }
}
