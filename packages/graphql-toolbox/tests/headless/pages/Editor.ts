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

import {
    EDITOR_QUERY_BUTTON,
    EDITOR_QUERY_INPUT,
    EDITOR_RESPONSE_OUTPUT,
    SCHEMA_EDITOR_BUILD_BUTTON,
} from "../../../src/constants";
import { Screen } from "./Screen";

export class Editor extends Screen {
    public async setQuery(query: string) {
        await this.page.waitForSelector(`#${EDITOR_QUERY_BUTTON}`);
        await this.page.evaluate(
            ({ id, query }) => {
                // @ts-ignore -Find a better solution
                document[`${id}`].setValue(query);
            },
            { query, id: EDITOR_QUERY_INPUT }
        );
    }

    public async submitQuery() {
        await this.page.waitForSelector(`#${EDITOR_QUERY_BUTTON}`);
        await this.page.click(`#${EDITOR_QUERY_BUTTON}`);
    }

    public async getOutput(): Promise<string> {
        const output = await this.page.evaluate((id) => {
            // @ts-ignore -Find a better solution
            return document[`${id}`].getValue();
        }, EDITOR_RESPONSE_OUTPUT);

        return output as unknown as string;
    }

    public async awaitSuccess() {
        await this.page.waitForSelector(`#${SCHEMA_EDITOR_BUILD_BUTTON}`);
    }
}
