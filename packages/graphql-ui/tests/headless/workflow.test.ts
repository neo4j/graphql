import { getBrowser, getPage, Browser } from "./puppeteer";
import {
    EDITOR_QUERY_BUTTON,
    EDITOR_QUERY_INPUT,
    EDITOR_RESPONSE_OUTPUT,
    LOGIN_BUTTON,
    LOGIN_PASSWORD_INPUT,
    LOGIN_URL_INPUT,
    LOGIN_USERNAME_INPUT,
    SCHEMA_EDITOR_BUILD_BUTTON,
    SCHEMA_EDITOR_INPUT,
} from "../../src/constants";
import { generate } from "randomstring";
import * as neo4j from "neo4j-driver";

const { NEO_USER = "admin", NEO_PASSWORD = "password", NEO_URL = "neo4j://localhost:7687/neo4j" } = process.env;

describe("workflow", () => {
    const id = generate({
        charset: "alphabetic",
    });
    const typeDefs = `
        type Movie {
            id: ID!
        }
    `;
    const query = `
        query {
            movies(where: { id: "${id}" }) {
                id
            }
        }
    `;
    let browser: Browser;
    let driver: neo4j.Driver;

    beforeAll(async () => {
        driver = neo4j.driver(NEO_URL, neo4j.auth.basic(NEO_USER, NEO_PASSWORD));
        browser = await getBrowser();
    });

    afterAll(async () => {
        await browser.close();
        await driver.close();
    });

    test("should perform e2e workflow", async () => {
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
        await page.$eval(
            `#${SCHEMA_EDITOR_INPUT}`,
            (el, injected) => {
                // @ts-ignore
                el.value = injected;
            },
            typeDefs
        );

        await page.waitForSelector(`#${SCHEMA_EDITOR_BUILD_BUTTON}`);
        await page.click(`#${SCHEMA_EDITOR_BUILD_BUTTON}`);

        await page.waitForSelector(`#${EDITOR_QUERY_BUTTON}`);

        await page.evaluate(
            (injected) => {
                // @ts-ignore
                document[`${injected.id}`].setValue(injected.query);
            },
            { query, id: EDITOR_QUERY_INPUT }
        );

        const session = await driver.session();
        try {
            await session.run(`
                CREATE (:Movie { id: "${id}" })
            `);
        } finally {
            await session.close();
        }

        await page.click(`#${EDITOR_QUERY_BUTTON}`);
        await page.waitForNetworkIdle();
        await page.waitFor(2000); // - Wait for Response
        const response = await page.evaluate((injected) => {
            // @ts-ignore
            return document[`${injected}`].getValue();
        }, EDITOR_RESPONSE_OUTPUT);

        expect(JSON.parse(response)).toMatchObject({
            data: {
                movies: [{ id }],
            },
        });
    });
});
