import { Page } from "puppeteer";

export abstract class Screen {
    page: Page;

    constructor(p: Page) {
        this.page = p;
    }
}
