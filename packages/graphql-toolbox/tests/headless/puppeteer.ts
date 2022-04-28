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

import * as path from "path";
import * as fs from "fs";
import puppeteer, { Browser } from "puppeteer";

const bundlePath = path.join(__dirname, "../../dist/index.html");
let browser: puppeteer.Browser | null;
let bundle: string = "";

async function getBundle() {
    if (bundle) {
        return bundle;
    }

    bundle = (await fs.promises.readFile(bundlePath, "utf-8")) as string;

    return bundle;
}

export async function getPage(options: { browser: puppeteer.Browser }): Promise<puppeteer.Page> {
    const bundle = await getBundle();

    const page = await options.browser.newPage();

    await page.setViewport({ width: 1920, height: 1080 });

    await page.setRequestInterception(true);
    page.on("request", (request) => {
        request.respond({ status: 200, contentType: "text/html", body: bundle });
    });
    await page.goto("http://localhost");

    await page.waitForNetworkIdle();

    return page;
}

export async function getBrowser() {
    if (browser) {
        return browser;
    }

    browser = await puppeteer.launch({
        headless: !Boolean(process.env.HEADLESS),
        defaultViewport: null,
        args: ["--disable-web-security"],
    });

    return browser;
}

export { Browser };
