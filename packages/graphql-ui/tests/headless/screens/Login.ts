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
                // @ts-ignore
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
                // @ts-ignore
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
                // @ts-ignore
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
