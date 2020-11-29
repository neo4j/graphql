/* eslint-disable no-console */
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
                        readable: true,
                        charset: "alphabetic",
                    });

                    const randomValue1 = generate({
                        readable: true,
                        charset: "alphabetic",
                    });

                    const randomValue2 = generate({
                        readable: true,
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

                        if (gqlResult.errors) {
                            console.log(JSON.stringify(gqlResult.errors, null, 2));
                        }

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

                    const randomType = `${generate({
                        charset: "alphabetic",
                    })}Movie`;

                    const pluralRandomType = pluralize(randomType);

                    const typeDefs = `
                        type ${randomType} {
                            property: ${type}
                        }
                    `;

                    const neoSchema = makeAugmentedSchema({ typeDefs });

                    const value = generate({
                        readable: true,
                        charset: "alphabetic",
                    });

                    const randomValue1 = generate({
                        readable: true,
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

                        if (gqlResult.errors) {
                            console.log(JSON.stringify(gqlResult.errors, null, 2));
                        }

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

                    const randomType = `${generate({
                        charset: "alphabetic",
                    })}Movie`;

                    const pluralRandomType = pluralize(randomType);

                    const typeDefs = `
                        type ${randomType} {
                            property: ${type}
                        }
                    `;

                    const neoSchema = makeAugmentedSchema({ typeDefs });

                    const value = generate({
                        readable: true,
                        charset: "alphabetic",
                    });

                    const randomValue1 = generate({
                        readable: true,
                        charset: "alphabetic",
                    });

                    const randomValue2 = generate({
                        readable: true,
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

                        if (gqlResult.errors) {
                            console.log(JSON.stringify(gqlResult.errors, null, 2));
                        }

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

                    const randomType = `${generate({
                        charset: "alphabetic",
                    })}Movie`;

                    const pluralRandomType = pluralize(randomType);

                    const typeDefs = `
                        type ${randomType} {
                            property: ${type}
                        }
                    `;

                    const neoSchema = makeAugmentedSchema({ typeDefs });

                    const value = generate({
                        readable: true,
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

                        if (gqlResult.errors) {
                            console.log(JSON.stringify(gqlResult.errors, null, 2));
                        }

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

                    const randomType = `${generate({
                        charset: "alphabetic",
                    })}Movie`;

                    const pluralRandomType = pluralize(randomType);

                    const typeDefs = `
                        type ${randomType} {
                            property: ${type}
                        }
                    `;

                    const neoSchema = makeAugmentedSchema({ typeDefs });

                    const value = generate({
                        readable: true,
                        charset: "alphabetic",
                    });

                    const notValue = generate({
                        readable: true,
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

                        if (gqlResult.errors) {
                            console.log(JSON.stringify(gqlResult.errors, null, 2));
                        }

                        expect(gqlResult.errors).toEqual(undefined);

                        expect((gqlResult.data as any)[pluralRandomType].length).toEqual(1);

                        expect((gqlResult.data as any)[pluralRandomType][0].property).toEqual(value);
                    } finally {
                        session.close();
                    }
                })
            );
        });

        test("should find Movies STARTS_WITH string", async () => {
            await Promise.all(
                ["ID", "String"].map(async (type) => {
                    const session = driver.session();

                    const randomType = `${generate({
                        charset: "alphabetic",
                    })}Movie`;

                    const pluralRandomType = pluralize(randomType);

                    const typeDefs = `
                        type ${randomType} {
                            property: ${type}
                        }
                    `;

                    const neoSchema = makeAugmentedSchema({ typeDefs });

                    const value = generate({
                        readable: true,
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
                                ${pluralRandomType}(where: { property_STARTS_WITH: "${value}" }) {
                                    property
                                }
                            }
                        `;

                        const gqlResult = await graphql({
                            schema: neoSchema.schema,
                            source: query,
                            contextValue: { driver },
                        });

                        if (gqlResult.errors) {
                            console.log(JSON.stringify(gqlResult.errors, null, 2));
                        }

                        expect(gqlResult.errors).toEqual(undefined);

                        expect((gqlResult.data as any)[pluralRandomType].length).toEqual(3);

                        ((gqlResult.data as any)[pluralRandomType] as any[]).forEach((x) => {
                            expect(x.property).toEqual(superValue);
                        });
                    } finally {
                        session.close();
                    }
                })
            );
        });

        test("should find Movies NOT_STARTS_WITH string", async () => {
            await Promise.all(
                ["ID", "String"].map(async (type) => {
                    const session = driver.session();

                    const randomType = `${generate({
                        charset: "alphabetic",
                    })}Movie`;

                    const pluralRandomType = pluralize(randomType);

                    const typeDefs = `
                        type ${randomType} {
                            property: ${type}
                        }
                    `;

                    const neoSchema = makeAugmentedSchema({ typeDefs });

                    const value = generate({
                        readable: true,
                        charset: "alphabetic",
                    });

                    const notValue = generate({
                        readable: true,
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
                                ${pluralRandomType}(where: { property_NOT_STARTS_WITH: "${notValue}" }) {
                                    property
                                }
                            }
                        `;

                        const gqlResult = await graphql({
                            schema: neoSchema.schema,
                            source: query,
                            contextValue: { driver },
                        });

                        if (gqlResult.errors) {
                            console.log(JSON.stringify(gqlResult.errors, null, 2));
                        }

                        expect(gqlResult.errors).toEqual(undefined);

                        expect((gqlResult.data as any)[pluralRandomType].length).toEqual(1);
                    } finally {
                        session.close();
                    }
                })
            );
        });

        test("should find Movies ENDS_WITH string", async () => {
            await Promise.all(
                ["ID", "String"].map(async (type) => {
                    const session = driver.session();

                    const randomType = `${generate({
                        charset: "alphabetic",
                    })}Movie`;

                    const pluralRandomType = pluralize(randomType);

                    const typeDefs = `
                        type ${randomType} {
                            property: ${type}
                        }
                    `;

                    const neoSchema = makeAugmentedSchema({ typeDefs });

                    const value = generate({
                        readable: true,
                        charset: "alphabetic",
                    });

                    const notValue = generate({
                        readable: true,
                        charset: "alphabetic",
                    });

                    const superValue = value + value;

                    try {
                        await session.run(
                            `
                            CREATE (:${randomType} {property: $value})
                            CREATE (:${randomType} {property: $notValue})
                            CREATE (:${randomType} {property: $superValue})
                        `,
                            { value, notValue, superValue }
                        );

                        const query = `
                            { 
                                ${pluralRandomType}(where: { property_ENDS_WITH: "${value}" }) {
                                    property
                                }
                            }
                        `;

                        const gqlResult = await graphql({
                            schema: neoSchema.schema,
                            source: query,
                            contextValue: { driver },
                        });

                        if (gqlResult.errors) {
                            console.log(JSON.stringify(gqlResult.errors, null, 2));
                        }

                        expect(gqlResult.errors).toEqual(undefined);

                        expect((gqlResult.data as any)[pluralRandomType].length).toEqual(2);
                    } finally {
                        session.close();
                    }
                })
            );
        });

        test("should find Movies NOT_ENDS_WITH string", async () => {
            await Promise.all(
                ["ID", "String"].map(async (type) => {
                    const session = driver.session();

                    const randomType = `${generate({
                        charset: "alphabetic",
                    })}Movie`;

                    const pluralRandomType = pluralize(randomType);

                    const typeDefs = `
                        type ${randomType} {
                            property: ${type}
                        }
                    `;

                    const neoSchema = makeAugmentedSchema({ typeDefs });

                    const value = generate({
                        readable: true,
                        charset: "alphabetic",
                    });

                    const notValue = generate({
                        readable: true,
                        charset: "alphabetic",
                    });

                    const superValue = value + value;

                    try {
                        await session.run(
                            `
                            CREATE (:${randomType} {property: $value})
                            CREATE (:${randomType} {property: $notValue})
                            CREATE (:${randomType} {property: $superValue})
                        `,
                            { value, notValue, superValue }
                        );

                        const query = `
                            { 
                                ${pluralRandomType}(where: { property_NOT_ENDS_WITH: "${value}" }) {
                                    property
                                }
                            }
                        `;

                        const gqlResult = await graphql({
                            schema: neoSchema.schema,
                            source: query,
                            contextValue: { driver },
                        });

                        if (gqlResult.errors) {
                            console.log(JSON.stringify(gqlResult.errors, null, 2));
                        }

                        expect(gqlResult.errors).toEqual(undefined);

                        expect((gqlResult.data as any)[pluralRandomType].length).toEqual(1);
                        expect((gqlResult.data as any)[pluralRandomType][0].property).toEqual(notValue);
                    } finally {
                        session.close();
                    }
                })
            );
        });
    });

    describe("Number/Float Filtering", () => {
        test("should find Movies NOT number", async () => {
            await Promise.all(
                ["Int", "Float"].map(async (type) => {
                    const session = driver.session();

                    const randomType = `${generate({
                        charset: "alphabetic",
                    })}Movie`;

                    const pluralRandomType = pluralize(randomType);

                    const typeDefs = `
                        type ${randomType} {
                            property: ${type}
                        }
                    `;

                    const neoSchema = makeAugmentedSchema({ typeDefs });

                    let property: number;

                    if (type === "Int") {
                        property = Math.floor(Math.random() * 9999);
                    } else {
                        property = Math.floor(Math.random() * 9999) + 0.5;
                    }

                    let notProperty: number;

                    if (type === "Int") {
                        notProperty = Math.floor(Math.random() * 9999);
                    } else {
                        notProperty = Math.floor(Math.random() * 9999) + 0.5;
                    }

                    try {
                        await session.run(
                            `
                            CREATE (:${randomType} {property: $property})
                            CREATE (:${randomType} {property: $notProperty})
                        `,
                            { property, notProperty }
                        );

                        const query = `
                            { 
                                ${pluralRandomType}(where: { property_NOT: ${notProperty} }) {
                                    property
                                }
                            }
                        `;

                        const gqlResult = await graphql({
                            schema: neoSchema.schema,
                            source: query,
                            contextValue: { driver },
                        });

                        if (gqlResult.errors) {
                            console.log(JSON.stringify(gqlResult.errors, null, 2));
                        }

                        expect(gqlResult.errors).toEqual(undefined);

                        expect((gqlResult.data as any)[pluralRandomType].length).toEqual(1);
                        expect((gqlResult.data as any)[pluralRandomType][0].property).toEqual(property);
                    } finally {
                        session.close();
                    }
                })
            );
        });

        test("should find Movies IN numbers", async () => {
            await Promise.all(
                ["Int", "Float"].map(async (type) => {
                    const session = driver.session();

                    const randomType = `${generate({
                        charset: "alphabetic",
                    })}Movie`;

                    const pluralRandomType = pluralize(randomType);

                    const typeDefs = `
                        type ${randomType} {
                            property: ${type}
                        }
                    `;

                    const neoSchema = makeAugmentedSchema({ typeDefs });

                    let value: number;

                    if (type === "Int") {
                        value = Math.floor(Math.random() * 9999);
                    } else {
                        value = Math.floor(Math.random() * 9999) + 0.5;
                    }

                    let randomValue1: number;

                    if (type === "Int") {
                        randomValue1 = Math.floor(Math.random() * 9999);
                    } else {
                        randomValue1 = Math.floor(Math.random() * 9999) + 0.5;
                    }

                    let randomValue2: number;

                    if (type === "Int") {
                        randomValue2 = Math.floor(Math.random() * 9999);
                    } else {
                        randomValue2 = Math.floor(Math.random() * 9999) + 0.5;
                    }

                    try {
                        await session.run(
                            `
                            CREATE (:${randomType} {property: $value})
                        `,
                            { value }
                        );

                        const query = `
                            { 
                                ${pluralRandomType}(where: { property_IN: [${value}, ${randomValue1}, ${randomValue2}] }) {
                                    property
                                }
                            }
                        `;

                        const gqlResult = await graphql({
                            schema: neoSchema.schema,
                            source: query,
                            contextValue: { driver },
                        });

                        if (gqlResult.errors) {
                            console.log(JSON.stringify(gqlResult.errors, null, 2));
                        }

                        expect(gqlResult.errors).toEqual(undefined);

                        expect((gqlResult.data as any)[pluralRandomType].length).toEqual(1);
                        expect((gqlResult.data as any)[pluralRandomType][0].property).toEqual(value);
                    } finally {
                        session.close();
                    }
                })
            );
        });

        test("should find Movies NOT_IN numbers", async () => {
            await Promise.all(
                ["Int", "Float"].map(async (type) => {
                    const session = driver.session();

                    const randomType = `${generate({
                        charset: "alphabetic",
                    })}Movie`;

                    const pluralRandomType = pluralize(randomType);

                    const typeDefs = `
                        type ${randomType} {
                            property: ${type}
                        }
                    `;

                    const neoSchema = makeAugmentedSchema({ typeDefs });

                    let value: number;

                    if (type === "Int") {
                        value = Math.floor(Math.random() * 9999);
                    } else {
                        value = Math.floor(Math.random() * 9999) + 0.5;
                    }

                    let randomValue1: number;

                    if (type === "Int") {
                        randomValue1 = Math.floor(Math.random() * 99999);
                    } else {
                        randomValue1 = Math.floor(Math.random() * 99999) + 0.5;
                    }

                    let randomValue2: number;

                    if (type === "Int") {
                        randomValue2 = Math.floor(Math.random() * 99999);
                    } else {
                        randomValue2 = Math.floor(Math.random() * 99999) + 0.5;
                    }

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
                                ${pluralRandomType}(where: { property_NOT_IN: [${randomValue1}, ${randomValue2}] }) {
                                    property
                                }
                            }
                        `;

                        const gqlResult = await graphql({
                            schema: neoSchema.schema,
                            source: query,
                            contextValue: { driver },
                        });

                        if (gqlResult.errors) {
                            console.log(JSON.stringify(gqlResult.errors, null, 2));
                        }

                        expect(gqlResult.errors).toEqual(undefined);

                        expect((gqlResult.data as any)[pluralRandomType].length).toEqual(1);
                        expect((gqlResult.data as any)[pluralRandomType][0].property).toEqual(value);
                    } finally {
                        session.close();
                    }
                })
            );
        });

        test("should find Movies LT number", async () => {
            await Promise.all(
                ["Int", "Float"].map(async (type) => {
                    const session = driver.session();

                    const randomType = `${generate({
                        charset: "alphabetic",
                    })}Movie`;

                    const pluralRandomType = pluralize(randomType);

                    const typeDefs = `
                        type ${randomType} {
                            property: ${type}
                        }
                    `;

                    const neoSchema = makeAugmentedSchema({ typeDefs });

                    let value: number;

                    if (type === "Int") {
                        value = Math.floor(Math.random() * 9999);
                    } else {
                        value = Math.floor(Math.random() * 9999) + 0.5;
                    }

                    const lessThanValue = value - (value + 1);

                    try {
                        await session.run(
                            `
                            CREATE (:${randomType} {property: $value})
                            CREATE (:${randomType} {property: $lessThanValue})
                        `,
                            { value, lessThanValue }
                        );

                        const query = `
                            { 
                                ${pluralRandomType}(where: { property_LT: ${lessThanValue + 1} }) {
                                    property
                                }
                            }
                        `;

                        const gqlResult = await graphql({
                            schema: neoSchema.schema,
                            source: query,
                            contextValue: { driver },
                        });

                        if (gqlResult.errors) {
                            console.log(JSON.stringify(gqlResult.errors, null, 2));
                        }

                        expect(gqlResult.errors).toEqual(undefined);

                        expect((gqlResult.data as any)[pluralRandomType].length).toEqual(1);
                        expect((gqlResult.data as any)[pluralRandomType][0].property).toEqual(lessThanValue);
                    } finally {
                        session.close();
                    }
                })
            );
        });

        test("should find Movies LTE number", async () => {
            await Promise.all(
                ["Int", "Float"].map(async (type) => {
                    const session = driver.session();

                    const randomType = `${generate({
                        charset: "alphabetic",
                    })}Movie`;

                    const pluralRandomType = pluralize(randomType);

                    const typeDefs = `
                        type ${randomType} {
                            property: ${type}
                        }
                    `;

                    const neoSchema = makeAugmentedSchema({ typeDefs });

                    let value: number;

                    if (type === "Int") {
                        value = Math.floor(Math.random() * 9999);
                    } else {
                        value = Math.floor(Math.random() * 9999) + 0.5;
                    }

                    const lessThanValue = value - (value + 1);

                    try {
                        await session.run(
                            `
                            CREATE (:${randomType} {property: $value})
                            CREATE (:${randomType} {property: $lessThanValue})
                        `,
                            { value, lessThanValue }
                        );

                        const query = `
                            { 
                                ${pluralRandomType}(where: { property_LTE: ${value} }) {
                                    property
                                }
                            }
                        `;

                        const gqlResult = await graphql({
                            schema: neoSchema.schema,
                            source: query,
                            contextValue: { driver },
                        });

                        if (gqlResult.errors) {
                            console.log(JSON.stringify(gqlResult.errors, null, 2));
                        }

                        expect(gqlResult.errors).toEqual(undefined);

                        expect((gqlResult.data as any)[pluralRandomType].length).toEqual(2);
                    } finally {
                        session.close();
                    }
                })
            );
        });

        test("should find Movies GT number", async () => {
            await Promise.all(
                ["Int", "Float"].map(async (type) => {
                    const session = driver.session();

                    const randomType = `${generate({
                        charset: "alphabetic",
                    })}Movie`;

                    const pluralRandomType = pluralize(randomType);

                    const typeDefs = `
                        type ${randomType} {
                            property: ${type}
                        }
                    `;

                    const neoSchema = makeAugmentedSchema({ typeDefs });

                    let value: number;

                    if (type === "Int") {
                        value = Math.floor(Math.random() * 9999);
                    } else {
                        value = Math.floor(Math.random() * 9999) + 0.5;
                    }

                    const graterThanValue = value + 1;

                    try {
                        await session.run(
                            `
                            CREATE (:${randomType} {property: $value})
                            CREATE (:${randomType} {property: $graterThanValue})
                        `,
                            { value, graterThanValue }
                        );

                        const query = `
                            { 
                                ${pluralRandomType}(where: { property_GT: ${graterThanValue - 1} }) {
                                    property
                                }
                            }
                        `;

                        const gqlResult = await graphql({
                            schema: neoSchema.schema,
                            source: query,
                            contextValue: { driver },
                        });

                        if (gqlResult.errors) {
                            console.log(JSON.stringify(gqlResult.errors, null, 2));
                        }

                        expect(gqlResult.errors).toEqual(undefined);

                        expect((gqlResult.data as any)[pluralRandomType].length).toEqual(1);
                        expect((gqlResult.data as any)[pluralRandomType][0].property).toEqual(graterThanValue);
                    } finally {
                        session.close();
                    }
                })
            );
        });

        test("should find Movies GTE number", async () => {
            await Promise.all(
                ["Int", "Float"].map(async (type) => {
                    const session = driver.session();

                    const randomType = `${generate({
                        charset: "alphabetic",
                    })}Movie`;

                    const pluralRandomType = pluralize(randomType);

                    const typeDefs = `
                        type ${randomType} {
                            property: ${type}
                        }
                    `;

                    const neoSchema = makeAugmentedSchema({ typeDefs });

                    let value: number;

                    if (type === "Int") {
                        value = Math.floor(Math.random() * 9999);
                    } else {
                        value = Math.floor(Math.random() * 9999) + 0.5;
                    }

                    const greaterThan = value + 1;

                    try {
                        await session.run(
                            `
                            CREATE (:${randomType} {property: $value})
                            CREATE (:${randomType} {property: $greaterThan})
                        `,
                            { value, greaterThan }
                        );

                        const query = `
                            { 
                                ${pluralRandomType}(where: { property_GTE: ${value} }) {
                                    property
                                }
                            }
                        `;

                        const gqlResult = await graphql({
                            schema: neoSchema.schema,
                            source: query,
                            contextValue: { driver },
                        });

                        if (gqlResult.errors) {
                            console.log(JSON.stringify(gqlResult.errors, null, 2));
                        }

                        expect(gqlResult.errors).toEqual(undefined);

                        expect((gqlResult.data as any)[pluralRandomType].length).toEqual(2);
                    } finally {
                        session.close();
                    }
                })
            );
        });
    });

    describe("Boolean Filtering", () => {
        test("should find Movies equality equality", async () => {
            const session = driver.session();

            const randomType = `${generate({
                charset: "alphabetic",
            })}Movie`;

            const pluralRandomType = pluralize(randomType);

            const typeDefs = `
                        type ${randomType} {
                            property: Boolean
                        }
                    `;

            const neoSchema = makeAugmentedSchema({ typeDefs });

            const value = false;

            try {
                await session.run(
                    `
                            CREATE (:${randomType} {property: $value})
                        `,
                    { value }
                );

                const query = `
                            { 
                                ${pluralRandomType}(where: { property: false }) {
                                    property
                                }
                            }
                        `;

                const gqlResult = await graphql({
                    schema: neoSchema.schema,
                    source: query,
                    contextValue: { driver },
                });

                if (gqlResult.errors) {
                    console.log(JSON.stringify(gqlResult.errors, null, 2));
                }

                expect(gqlResult.errors).toEqual(undefined);

                expect((gqlResult.data as any)[pluralRandomType].length).toEqual(1);
            } finally {
                session.close();
            }
        });

        test("should find Movies NOT boolean", async () => {
            const session = driver.session();

            const randomType = `${generate({
                charset: "alphabetic",
            })}Movie`;

            const pluralRandomType = pluralize(randomType);

            const typeDefs = `
                        type ${randomType} {
                            property: Boolean
                        }
                    `;

            const neoSchema = makeAugmentedSchema({ typeDefs });

            const value = false;

            try {
                await session.run(
                    `
                            CREATE (:${randomType} {property: $value})
                        `,
                    { value }
                );

                const query = `
                            { 
                                ${pluralRandomType}(where: { property_NOT: false }) {
                                    property
                                }
                            }
                        `;

                const gqlResult = await graphql({
                    schema: neoSchema.schema,
                    source: query,
                    contextValue: { driver },
                });

                if (gqlResult.errors) {
                    console.log(JSON.stringify(gqlResult.errors, null, 2));
                }

                expect(gqlResult.errors).toEqual(undefined);

                expect((gqlResult.data as any)[pluralRandomType].length).toEqual(0);
            } finally {
                session.close();
            }
        });
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
