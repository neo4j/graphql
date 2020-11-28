import { describe, expect, test, afterAll, beforeAll } from "@jest/globals";
import { Driver } from "neo4j-driver";
import { generate } from "randomstring";
import { graphql } from "graphql";
import pluralize from "pluralize";
import neo4j from "./neo4j";
import makeAugmentedSchema from "../../src/schema/make-augmented-schema";

describe("Advanced Filtering", () => {
    let driver: Driver;

    beforeAll(async () => {
        driver = await neo4j();
    });

    afterAll(async () => {
        await driver.close();
    });

    describe("String/ID Filtering", () => {
        test("should find Movies IN strings", async () => {
            await Promise.all(
                ["ID", "String"].map(async (type) => {
                    const session = driver.session();

                    const typeDefs = `
                        type Movie {
                            property: ${type}
                        }
                    `;

                    const neoSchema = makeAugmentedSchema({ typeDefs });

                    const value = generate({
                        charset: "alphabetic",
                    });

                    const randomValue1 = generate({
                        charset: "alphabetic",
                    });

                    const randomValue2 = generate({
                        charset: "alphabetic",
                    });

                    try {
                        await session.run(
                            `
                            CREATE (:Movie {property: $value})
                        `,
                            { value }
                        );

                        const query = `
                            { 
                                Movies(where: { property_IN: ["${value}", "${randomValue1}", "${randomValue2}"] }) {
                                    property
                                }
                            }
                        `;

                        const gqlResult = await graphql({
                            schema: neoSchema.schema,
                            source: query,
                            contextValue: { driver },
                        });

                        expect(gqlResult.errors).toEqual(undefined);

                        expect((gqlResult.data as any).Movies.length).toEqual(1);

                        expect((gqlResult.data as any).Movies[0].property).toEqual(value);
                    } finally {
                        session.close();
                    }
                })
            );
        });

        test("should find Movies NOT string", async () => {
            await Promise.all(
                ["ID", "String"].map(async (type) => {
                    const session = driver.session();

                    const randomType = generate({
                        charset: "alphabetic",
                    });

                    const pluralRandomType = pluralize(randomType);

                    const typeDefs = `
                        type ${randomType} {
                            property: ${type}
                        }
                    `;

                    const neoSchema = makeAugmentedSchema({ typeDefs });

                    const value = generate({
                        charset: "alphabetic",
                    });

                    const randomValue1 = generate({
                        charset: "alphabetic",
                    });

                    try {
                        await session.run(
                            `
                            CREATE (:${randomType} {property: $value})
                            CREATE (:${randomType} {property: $randomValue1})
                        `,
                            { value, randomValue1 }
                        );

                        const query = `
                            { 
                                ${pluralRandomType}(where: { property_NOT: "${randomValue1}" }) {
                                    property
                                }
                            }
                        `;

                        const gqlResult = await graphql({
                            schema: neoSchema.schema,
                            source: query,
                            contextValue: { driver },
                        });

                        expect(gqlResult.errors).toEqual(undefined);

                        expect((gqlResult.data as any)[pluralRandomType].length).toEqual(1);

                        expect((gqlResult.data as any)[pluralRandomType][0].property).toEqual(value);
                    } finally {
                        session.close();
                    }
                })
            );
        });

        test("should find Movies NOT_IN strings", async () => {
            await Promise.all(
                ["ID", "String"].map(async (type) => {
                    const session = driver.session();

                    const randomType = generate({
                        charset: "alphabetic",
                    });

                    const pluralRandomType = pluralize(randomType);

                    const typeDefs = `
                        type ${randomType} {
                            property: ${type}
                        }
                    `;

                    const neoSchema = makeAugmentedSchema({ typeDefs });

                    const value = generate({
                        charset: "alphabetic",
                    });

                    const randomValue1 = generate({
                        charset: "alphabetic",
                    });

                    const randomValue2 = generate({
                        charset: "alphabetic",
                    });

                    try {
                        await session.run(
                            `
                            CREATE (:${randomType} {property: $value})
                            CREATE (:${randomType} {property: $randomValue1})
                            CREATE (:${randomType} {property: $randomValue2})
                        `,
                            { value, randomValue1, randomValue2 }
                        );

                        const query = `
                            { 
                                ${pluralRandomType}(where: { property_NOT_IN: ["${randomValue1}", "${randomValue2}"] }) {
                                    property
                                }
                            }
                        `;

                        const gqlResult = await graphql({
                            schema: neoSchema.schema,
                            source: query,
                            contextValue: { driver },
                        });

                        expect(gqlResult.errors).toEqual(undefined);

                        expect((gqlResult.data as any)[pluralRandomType].length).toEqual(1);

                        expect((gqlResult.data as any)[pluralRandomType][0].property).toEqual(value);
                    } finally {
                        session.close();
                    }
                })
            );
        });

        test("should find Movies CONTAINS string", async () => {
            await Promise.all(
                ["ID", "String"].map(async (type) => {
                    const session = driver.session();

                    const randomType = generate({
                        charset: "alphabetic",
                    });

                    const pluralRandomType = pluralize(randomType);

                    const typeDefs = `
                        type ${randomType} {
                            property: ${type}
                        }
                    `;

                    const neoSchema = makeAugmentedSchema({ typeDefs });

                    const value = generate({
                        charset: "alphabetic",
                    });

                    const superValue = value + value;

                    try {
                        await session.run(
                            `
                            CREATE (:${randomType} {property: $superValue})
                            CREATE (:${randomType} {property: $superValue})
                            CREATE (:${randomType} {property: $superValue})
                        `,
                            { superValue }
                        );

                        const query = `
                            { 
                                ${pluralRandomType}(where: { property_CONTAINS: "${value}" }) {
                                    property
                                }
                            }
                        `;

                        const gqlResult = await graphql({
                            schema: neoSchema.schema,
                            source: query,
                            contextValue: { driver },
                        });

                        expect(gqlResult.errors).toEqual(undefined);

                        expect((gqlResult.data as any)[pluralRandomType].length).toEqual(3);

                        expect((gqlResult.data as any)[pluralRandomType][0].property).toEqual(superValue);
                    } finally {
                        session.close();
                    }
                })
            );
        });

        test("should find Movies NOT_CONTAINS string", async () => {
            await Promise.all(
                ["ID", "String"].map(async (type) => {
                    const session = driver.session();

                    const randomType = generate({
                        charset: "alphabetic",
                    });

                    const pluralRandomType = pluralize(randomType);

                    const typeDefs = `
                        type ${randomType} {
                            property: ${type}
                        }
                    `;

                    const neoSchema = makeAugmentedSchema({ typeDefs });

                    const value = generate({
                        charset: "alphabetic",
                    });

                    const notValue = generate({
                        charset: "alphabetic",
                    });

                    try {
                        await session.run(
                            `
                            CREATE (:${randomType} {property: $value})
                            CREATE (:${randomType} {property: $notValue})
                            CREATE (:${randomType} {property: $notValue})
                        `,
                            { value, notValue }
                        );

                        const query = `
                            { 
                                ${pluralRandomType}(where: { property_NOT_CONTAINS: "${notValue}" }) {
                                    property
                                }
                            }
                        `;

                        const gqlResult = await graphql({
                            schema: neoSchema.schema,
                            source: query,
                            contextValue: { driver },
                        });

                        expect(gqlResult.errors).toEqual(undefined);

                        expect((gqlResult.data as any)[pluralRandomType].length).toEqual(1);

                        expect((gqlResult.data as any)[pluralRandomType][0].property).toEqual(value);
                    } finally {
                        session.close();
                    }
                })
            );
        });

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
