import { describe, expect, test, afterAll, beforeAll } from "@jest/globals";
import { Driver } from "neo4j-driver";
import neo4j from "./neo4j";
import makeAugmentedSchema from "../../src/schema/make-augmented-schema";

describe("Advanced Filtering", () => {
    let driver: Driver;

    beforeAll(async () => {
        driver = await neo4j();
        process.env.JWT_SECRET = "secret";
    });

    afterAll(async () => {
        await driver.close();
        delete process.env.JWT_SECRET;
    });

    describe("String/ID Filtering", () => {
        test.todo("should find Movies IN strings");
        test.todo("should find Movies NOT strings");
        test.todo("should find Movies NOT_IN strings");
        test.todo("should find Movies CONTAINS string");
        test.todo("should find Movies NOT_CONTAINS string");
        test.todo("should find Movies STARTS_WITH string");
        test.todo("should find Movies NOT_STARTS_WITH string");
        test.todo("should find Movies ENDS_WITH string");
        test.todo("should find Movies NOT_ENDS_WITH string");
    });

    describe("Number/Float Filtering", () => {
        test.todo("should find Movies NOT number");
        test.todo("should find Movies IN numbers");
        test.todo("should find Movies NOT_IN numbers");
        test.todo("should find Movies LT number");
        test.todo("should find Movies LTE number");
        test.todo("should find Movies GT number");
        test.todo("should find Movies GTE number");
    });

    describe("Boolean Filtering", () => {
        test.todo("should find Movies equality equality");
        test.todo("should find Movies NOT boolean");
    });

    describe("Relationship Filtering", () => {
        test.todo("should find Movies genres equality");
        test.todo("should find Movies genres_NOT");
        test.todo("should find Movies genres_IN");
        test.todo("should find Movies genres_NOT_IN");
        test.todo("should find Movies genres_SOME");
        test.todo("should find Movies genres_NONE");
        test.todo("should find Movies genres_SINGLE");
        test.todo("should find Movies genres_EVERY");
    });
});
