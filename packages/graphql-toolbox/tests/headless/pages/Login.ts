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
    LOGIN_BUTTON,
    LOGIN_PASSWORD_INPUT,
    LOGIN_URL_INPUT,
    LOGIN_USERNAME_INPUT,
    SCHEMA_EDITOR_BUILD_BUTTON,
} from "../../../src/constants";
import { Screen } from "./Screen";

export class Login extends Screen {
    public async setUsername(username: string) {
        await this.page.waitForSelector(`#${LOGIN_USERNAME_INPUT}`);
        await this.page.$eval(
            `#${LOGIN_USERNAME_INPUT}`,
            (el, injected) => {
                // @ts-ignore - Find a way to type this
                el.value = injected;
            },
            username
        );
    }

    public async setPassword(password: string) {
        await this.page.waitForSelector(`#${LOGIN_PASSWORD_INPUT}`);
        await this.page.$eval(
            `#${LOGIN_PASSWORD_INPUT}`,
            (el, injected) => {
                // @ts-ignore - Find a way to type this
                el.value = injected;
            },
            password
        );
    }

    public async setURL(url: string) {
        await this.page.waitForSelector(`#${LOGIN_URL_INPUT}`);
        await this.page.$eval(
            `#${LOGIN_URL_INPUT}`,
            (el, injected) => {
                // @ts-ignore - Find a way to type this
                el.value = injected;
            },
            url
        );
    }

    public async submit() {
        await this.page.waitForSelector(`#${LOGIN_BUTTON}`);
        await this.page.click(`#${LOGIN_BUTTON}`);
    }

    public async awaitSuccess() {
        await this.page.waitForSelector(`#${SCHEMA_EDITOR_BUILD_BUTTON}`);
    }
}
