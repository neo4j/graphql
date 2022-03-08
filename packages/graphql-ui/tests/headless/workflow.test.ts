import { getBrowser, getPage, Browser } from "./puppeteer";
import {
    LOGIN_BUTTON,
    LOGIN_PASSWORD_INPUT,
    LOGIN_URL_INPUT,
    LOGIN_USERNAME_INPUT,
    SCHEMA_EDITOR_BUILD_BUTTON,
    SCHEMA_EDITOR_INPUT,
} from "../../src/constants";
const { NEO_USER = "admin", NEO_PASSWORD = "password", NEO_URL = "neo4j://localhost:7687/neo4j" } = process.env;

describe("workflow", () => {
    let browser: Browser;

    beforeAll(async () => {
        browser = await getBrowser();
    });

    afterAll(async () => {
        await browser.close();
    });

    test("should wait for username input", async () => {
        const page = await getPage({ browser });

        await page.waitForSelector(`#${LOGIN_USERNAME_INPUT}`);
        await page.$eval(
            `#${LOGIN_USERNAME_INPUT}`,
            (el, injected) => {
                // @ts-ignore
                el.value = injected;
            },
            NEO_USER
        );

        await page.waitForSelector(`#${LOGIN_PASSWORD_INPUT}`);
        await page.$eval(
            `#${LOGIN_PASSWORD_INPUT}`,
            (el, injected) => {
                // @ts-ignore
                el.value = injected;
            },
            NEO_PASSWORD
        );

        await page.waitForSelector(`#${LOGIN_URL_INPUT}`);
        await page.$eval(
            `#${LOGIN_URL_INPUT}`,
            (el, injected) => {
                // @ts-ignore
                el.value = injected;
            },
            NEO_URL
        );

        await page.waitForSelector(`#${LOGIN_BUTTON}`);
        await page.click(`#${LOGIN_BUTTON}`);

        await page.waitForSelector(`#${SCHEMA_EDITOR_INPUT}`);
        await page.waitForSelector(`#${SCHEMA_EDITOR_BUILD_BUTTON}`);
    });
});
