import { getBrowser, getPage, Browser } from "./puppeteer";
import { LOGIN_USERNAME_INPUT } from "../../src/constants";

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
    });
});
