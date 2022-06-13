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

const { NEO_USER = "admin", NEO_PASSWORD = "password", NEO_URL = "neo4j://localhost:7687/neo4j" } = process.env;

export class Login extends Screen {
    public async setUsername(username: string) {
        await this.page.waitForSelector("[data-test-login-username]");
        await this.page.$eval(
            "[data-test-login-username]",
            (el, injected) => {
                // @ts-ignore - Find a way to type this
                el.value = injected;
            },
            username
        );
    }

    public async setPassword(password: string) {
        await this.page.waitForSelector("[data-test-login-password]");
        await this.page.$eval(
            "[data-test-login-password]",
            (el, injected) => {
                // @ts-ignore - Find a way to type this
                el.value = injected;
            },
            password
        );
    }

    public async setURL(url: string) {
        await this.page.waitForSelector("[data-test-login-url]");
        await this.page.$eval(
            "[data-test-login-url]",
            (el, injected) => {
                // @ts-ignore - Find a way to type this
                el.value = injected;
            },
            url
        );
    }

    public async submit() {
        await this.page.waitForSelector("[data-test-login-button]");
        await this.page.click("[data-test-login-button]");
    }

    public async awaitSuccess() {
        await this.page.waitForSelector("[data-test-schema-editor-build-button]");
    }

    public async login(username: string = NEO_USER, password: string = NEO_PASSWORD, url: string = NEO_URL,) {
        await this.setUsername(username);
        await this.setPassword(password);
        await this.setURL(url);
        await this.submit();
        await this.awaitSuccess();
    }
}
