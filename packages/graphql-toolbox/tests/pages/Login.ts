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
        await this.page.fill("[data-test-login-username]", username);
    }

    public async getUsername(): Promise<string> {
        await this.page.waitForSelector("[data-test-login-username]");
        return await this.page.inputValue("[data-test-login-username]");
    }

    public async setPassword(password: string) {
        await this.page.waitForSelector("[data-test-login-password]");
        await this.page.fill("[data-test-login-password]", password);
    }

    public async getPassword(): Promise<string> {
        await this.page.waitForSelector("[data-test-login-password]");
        return await this.page.inputValue("[data-test-login-password]");
    }

    public async setURL(url: string) {
        await this.page.waitForSelector("[data-test-login-url]");
        await this.page.fill("[data-test-login-url]", url);
    }

    public async getURL(): Promise<string> {
        await this.page.waitForSelector("[data-test-login-url]");
        return await this.page.inputValue("[data-test-login-url]");
    }

    public async submit() {
        await this.page.waitForSelector("[data-test-login-button]");
        await this.page.click("[data-test-login-button]");
    }

    public async dismissIntrospectionPrompt() {
        await this.page.waitForSelector("[data-test-introspect-prompt-cancel]");
        await this.page.click("[data-test-introspect-prompt-cancel]");
    }

    public async introspectionPromptIntrospect() {
        await this.page.waitForSelector("[data-test-introspect-prompt-introspect]");
        await this.page.click("[data-test-introspect-prompt-introspect]");
    }

    public async introspectionPromptLogout() {
        await this.page.waitForSelector("[data-test-introspect-prompt-logout]");
        await this.page.click("[data-test-introspect-prompt-logout]");
    }

    public async getIsIntrospectionPromptHidden() {
        return this.page.isHidden("[data-test-introspect-prompt]");
    }

    public async awaitSuccess() {
        await this.page.waitForSelector("[data-test-schema-editor-build-button]");
    }

    public async getIsLoginWindowVisible() {
        return this.page.isVisible("[data-test-login-form]");
    }

    public async loginDismissIntrospection(
        username: string = NEO_USER,
        password: string = NEO_PASSWORD,
        url: string = NEO_URL
    ) {
        await this.setUsername(username);
        await this.setPassword(password);
        await this.setURL(url);
        await this.submit();
        await this.dismissIntrospectionPrompt();
        await this.awaitSuccess();
    }

    public async login(username: string = NEO_USER, password: string = NEO_PASSWORD, url: string = NEO_URL) {
        await this.setUsername(username);
        await this.setPassword(password);
        await this.setURL(url);
        await this.submit();
        await this.awaitSuccess();
    }

    public async logout() {
        await this.page.waitForSelector("[data-test-topbar-disconnect-button]");
        await this.page.click("[data-test-topbar-disconnect-button]");
    }
}
