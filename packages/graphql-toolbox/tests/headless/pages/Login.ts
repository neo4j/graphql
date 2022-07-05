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
        await this.page.click("[data-test-login-username]", { clickCount: 3 });
        await this.page.focus("[data-test-login-username]");
        await this.page.keyboard.type(username);
    }

    public async getUsername(): Promise<string> {
        const element = await this.page.$("[data-test-login-username]");
        const text = await this.page.evaluate((element) => {
            // @ts-ignore - Find a better solution
            return element.value;
        }, element);

        return text as string;
    }

    public async setPassword(password: string) {
        await this.page.click("[data-test-login-password]", { clickCount: 3 });
        await this.page.focus("[data-test-login-password]");
        await this.page.keyboard.type(password);
    }

    public async setURL(url: string) {
        await this.page.click("[data-test-login-url]", { clickCount: 3 });
        await this.page.focus("[data-test-login-url]");
        await this.page.keyboard.type(url);
    }

    public async getURL(): Promise<string> {
        const element = await this.page.$("[data-test-login-url]");
        const text = await this.page.evaluate((element) => {
            // @ts-ignore - Find a better solution
            return element.value;
        }, element);

        return text as string;
    }

    public async submit() {
        await this.page.waitForSelector("[data-test-login-button]");
        await this.page.click("[data-test-login-button]");
    }

    public async awaitSuccess() {
        await this.page.waitForSelector("[data-test-schema-editor-build-button]");
    }

    public async login(username: string = NEO_USER, password: string = NEO_PASSWORD, url: string = NEO_URL) {
        await this.setUsername(username);
        await this.setPassword(password);
        await this.setURL(url);
        await this.submit();
        await this.awaitSuccess();
    }
}
