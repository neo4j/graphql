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

import { Driver } from "neo4j-driver";
import { generate } from "randomstring";
import { graphql } from "graphql";
import neo4j from "./neo4j";
import { Neo4jGraphQL } from "../../src/classes";
import { generateUniqueType } from "../utils/graphql-types";

describe("Advanced Filtering", () => {
    let driver: Driver;

    beforeAll(async () => {
        driver = await neo4j();
        process.env.NEO4J_GRAPHQL_ENABLE_REGEX = "true";
    });

    afterAll(async () => {
        await driver.close();
        delete process.env.NEO4J_GRAPHQL_ENABLE_REGEX;
    });

    describe("String/ID Filtering", () => {
        test("should find Movies IN strings", async () => {
            await Promise.all(
                ["ID", "String"].map(async (type) => {
                    const session = driver.session();
                    const randomType = generateUniqueType("Movie");

                    const typeDefs = `
                        type ${randomType.name} {
                            property: ${type}
                        }
                    `;

                    const neoSchema = new Neo4jGraphQL({ typeDefs });

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
                            CREATE (:${randomType.name} {property: $value})
                        `,
                            { value }
                        );

                        const query = `
                            {
                                ${randomType.plural}(where: { property_IN: ["${value}", "${randomValue1}", "${randomValue2}"] }) {
                                    property
                                }
                            }
                        `;

                        const gqlResult = await graphql({
                            schema: neoSchema.schema,
                            source: query,
                            contextValue: { driver, driverConfig: { bookmarks: session.lastBookmark() } },
                        });

                        if (gqlResult.errors) {
                            console.log(JSON.stringify(gqlResult.errors, null, 2));
                        }

                        expect(gqlResult.errors).toBeUndefined();
                        expect((gqlResult.data as any)[randomType.plural]).toHaveLength(1);
                        expect((gqlResult.data as any)[randomType.plural][0].property).toEqual(value);
                    } finally {
                        await session.close();
                    }
                })
            );
        });

        test("should find Movies REGEX", async () => {
            await Promise.all(
                ["ID", "String"].map(async (type) => {
                    const session = driver.session();

                    const randomType = generateUniqueType("Movie");

                    const typeDefs = `
                        type ${randomType.name} {
                            property: ${type}
                        }
                    `;

                    const neoSchema = new Neo4jGraphQL({ typeDefs, config: { enableRegex: true } });

                    const value = generate({
                        readable: true,
                        charset: "alphabetic",
                    });

                    try {
                        await session.run(
                            `
                            CREATE (:${randomType.name} {property: $value})
                        `,
                            { value: `${value}${value}` }
                        );

                        const query = `
                            {
                                ${randomType.plural}(where: { property_MATCHES: "(?i)${value}.*" }) {
                                    property
                                }
                            }
                        `;

                        const gqlResult = await graphql({
                            schema: neoSchema.schema,
                            source: query,
                            contextValue: { driver, driverConfig: { bookmarks: session.lastBookmark() } },
                        });

                        if (gqlResult.errors) {
                            console.log(JSON.stringify(gqlResult.errors, null, 2));
                        }

                        expect(gqlResult.errors).toBeUndefined();
                        expect((gqlResult.data as any)[randomType.plural]).toHaveLength(1);
                        expect((gqlResult.data as any)[randomType.plural][0].property).toBe(`${value}${value}`);
                    } finally {
                        await session.close();
                    }
                })
            );
        });

        test("should find Movies NOT string", async () => {
            await Promise.all(
                ["ID", "String"].map(async (type) => {
                    const session = driver.session();

                    const randomType = generateUniqueType("Movie");

                    const typeDefs = `
                        type ${randomType.name} {
                            property: ${type}
                        }
                    `;

                    const neoSchema = new Neo4jGraphQL({ typeDefs });

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
                            CREATE (:${randomType.name} {property: $value})
                            CREATE (:${randomType.name} {property: $randomValue1})
                        `,
                            { value, randomValue1 }
                        );

                        const query = `
                            {
                                ${randomType.plural}(where: { property_NOT: "${randomValue1}" }) {
                                    property
                                }
                            }
                        `;

                        const gqlResult = await graphql({
                            schema: neoSchema.schema,
                            source: query,
                            contextValue: { driver, driverConfig: { bookmarks: session.lastBookmark() } },
                        });

                        if (gqlResult.errors) {
                            console.log(JSON.stringify(gqlResult.errors, null, 2));
                        }

                        expect(gqlResult.errors).toBeUndefined();

                        expect((gqlResult.data as any)[randomType.plural]).toHaveLength(1);

                        expect((gqlResult.data as any)[randomType.plural][0].property).toEqual(value);
                    } finally {
                        await session.close();
                    }
                })
            );
        });

        test("should find Movies NOT_IN strings", async () => {
            await Promise.all(
                ["ID", "String"].map(async (type) => {
                    const session = driver.session();

                    const randomType = generateUniqueType("Movie");

                    const typeDefs = `
                        type ${randomType.name} {
                            property: ${type}
                        }
                    `;

                    const neoSchema = new Neo4jGraphQL({ typeDefs });

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
                            CREATE (:${randomType.name} {property: $value})
                            CREATE (:${randomType.name} {property: $randomValue1})
                            CREATE (:${randomType.name} {property: $randomValue2})
                        `,
                            { value, randomValue1, randomValue2 }
                        );

                        const query = `
                            {
                                ${randomType.plural}(where: { property_NOT_IN: ["${randomValue1}", "${randomValue2}"] }) {
                                    property
                                }
                            }
                        `;

                        const gqlResult = await graphql({
                            schema: neoSchema.schema,
                            source: query,
                            contextValue: { driver, driverConfig: { bookmarks: session.lastBookmark() } },
                        });

                        if (gqlResult.errors) {
                            console.log(JSON.stringify(gqlResult.errors, null, 2));
                        }

                        expect(gqlResult.errors).toBeUndefined();

                        expect((gqlResult.data as any)[randomType.plural]).toHaveLength(1);

                        expect((gqlResult.data as any)[randomType.plural][0].property).toEqual(value);
                    } finally {
                        await session.close();
                    }
                })
            );
        });

        test("should find Movies CONTAINS string", async () => {
            await Promise.all(
                ["ID", "String"].map(async (type) => {
                    const session = driver.session();

                    const randomType = generateUniqueType("Movie");

                    const typeDefs = `
                        type ${randomType.name} {
                            property: ${type}
                        }
                    `;

                    const neoSchema = new Neo4jGraphQL({ typeDefs });

                    const value = generate({
                        readable: true,
                        charset: "alphabetic",
                    });

                    const superValue = `${value}${value}`;

                    try {
                        await session.run(
                            `
                            CREATE (:${randomType.name} {property: $superValue})
                            CREATE (:${randomType.name} {property: $superValue})
                            CREATE (:${randomType.name} {property: $superValue})
                        `,
                            { superValue }
                        );

                        const query = `
                            {
                                ${randomType.plural}(where: { property_CONTAINS: "${value}" }) {
                                    property
                                }
                            }
                        `;

                        const gqlResult = await graphql({
                            schema: neoSchema.schema,
                            source: query,
                            contextValue: { driver, driverConfig: { bookmarks: session.lastBookmark() } },
                        });

                        if (gqlResult.errors) {
                            console.log(JSON.stringify(gqlResult.errors, null, 2));
                        }

                        expect(gqlResult.errors).toBeUndefined();

                        expect((gqlResult.data as any)[randomType.plural]).toHaveLength(3);

                        expect((gqlResult.data as any)[randomType.plural][0].property).toEqual(superValue);
                    } finally {
                        await session.close();
                    }
                })
            );
        });

        test("should find Movies NOT_CONTAINS string", async () => {
            await Promise.all(
                ["ID", "String"].map(async (type) => {
                    const session = driver.session();

                    const randomType = generateUniqueType("Movie");

                    const typeDefs = `
                        type ${randomType.name} {
                            property: ${type}
                        }
                    `;

                    const neoSchema = new Neo4jGraphQL({ typeDefs });

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
                            CREATE (:${randomType.name} {property: $value})
                            CREATE (:${randomType.name} {property: $notValue})
                            CREATE (:${randomType.name} {property: $notValue})
                        `,
                            { value, notValue }
                        );

                        const query = `
                            {
                                ${randomType.plural}(where: { property_NOT_CONTAINS: "${notValue}" }) {
                                    property
                                }
                            }
                        `;

                        const gqlResult = await graphql({
                            schema: neoSchema.schema,
                            source: query,
                            contextValue: { driver, driverConfig: { bookmarks: session.lastBookmark() } },
                        });

                        if (gqlResult.errors) {
                            console.log(JSON.stringify(gqlResult.errors, null, 2));
                        }

                        expect(gqlResult.errors).toBeUndefined();

                        expect((gqlResult.data as any)[randomType.plural]).toHaveLength(1);

                        expect((gqlResult.data as any)[randomType.plural][0].property).toEqual(value);
                    } finally {
                        await session.close();
                    }
                })
            );
        });

        test("should find Movies STARTS_WITH string", async () => {
            await Promise.all(
                ["ID", "String"].map(async (type) => {
                    const session = driver.session();

                    const randomType = generateUniqueType("Movie");

                    const typeDefs = `
                        type ${randomType.name} {
                            property: ${type}
                        }
                    `;

                    const neoSchema = new Neo4jGraphQL({ typeDefs });

                    const value = generate({
                        readable: true,
                        charset: "alphabetic",
                    });

                    const superValue = `${value}${value}`;

                    try {
                        await session.run(
                            `
                            CREATE (:${randomType.name} {property: $superValue})
                            CREATE (:${randomType.name} {property: $superValue})
                            CREATE (:${randomType.name} {property: $superValue})
                        `,
                            { superValue }
                        );

                        const query = `
                            {
                                ${randomType.plural}(where: { property_STARTS_WITH: "${value}" }) {
                                    property
                                }
                            }
                        `;

                        const gqlResult = await graphql({
                            schema: neoSchema.schema,
                            source: query,
                            contextValue: { driver, driverConfig: { bookmarks: session.lastBookmark() } },
                        });

                        if (gqlResult.errors) {
                            console.log(JSON.stringify(gqlResult.errors, null, 2));
                        }

                        expect(gqlResult.errors).toBeUndefined();

                        expect((gqlResult.data as any)[randomType.plural]).toHaveLength(3);

                        ((gqlResult.data as any)[randomType.plural] as any[]).forEach((x) => {
                            expect(x.property).toEqual(superValue);
                        });
                    } finally {
                        await session.close();
                    }
                })
            );
        });

        test("should find Movies NOT_STARTS_WITH string", async () => {
            await Promise.all(
                ["ID", "String"].map(async (type) => {
                    const session = driver.session();

                    const randomType = generateUniqueType("Movie");

                    const typeDefs = `
                        type ${randomType.name} {
                            property: ${type}
                        }
                    `;

                    const neoSchema = new Neo4jGraphQL({ typeDefs });

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
                            CREATE (:${randomType.name} {property: $value})
                            CREATE (:${randomType.name} {property: $notValue})
                            CREATE (:${randomType.name} {property: $notValue})
                        `,
                            { value, notValue }
                        );

                        const query = `
                            {
                                ${randomType.plural}(where: { property_NOT_STARTS_WITH: "${notValue}" }) {
                                    property
                                }
                            }
                        `;

                        const gqlResult = await graphql({
                            schema: neoSchema.schema,
                            source: query,
                            contextValue: { driver, driverConfig: { bookmarks: session.lastBookmark() } },
                        });

                        if (gqlResult.errors) {
                            console.log(JSON.stringify(gqlResult.errors, null, 2));
                        }

                        expect(gqlResult.errors).toBeUndefined();

                        expect((gqlResult.data as any)[randomType.plural]).toHaveLength(1);
                    } finally {
                        await session.close();
                    }
                })
            );
        });

        test("should find Movies ENDS_WITH string", async () => {
            await Promise.all(
                ["ID", "String"].map(async (type) => {
                    const session = driver.session();

                    const randomType = generateUniqueType("Movie");

                    const typeDefs = `
                        type ${randomType.name} {
                            property: ${type}
                        }
                    `;

                    const neoSchema = new Neo4jGraphQL({ typeDefs });

                    const value = generate({
                        readable: true,
                        charset: "alphabetic",
                    });

                    const notValue = generate({
                        readable: true,
                        charset: "alphabetic",
                    });

                    const superValue = `${value}${value}`;

                    try {
                        await session.run(
                            `
                            CREATE (:${randomType.name} {property: $value})
                            CREATE (:${randomType.name} {property: $notValue})
                            CREATE (:${randomType.name} {property: $superValue})
                        `,
                            { value, notValue, superValue }
                        );

                        const query = `
                            {
                                ${randomType.plural}(where: { property_ENDS_WITH: "${value}" }) {
                                    property
                                }
                            }
                        `;

                        const gqlResult = await graphql({
                            schema: neoSchema.schema,
                            source: query,
                            contextValue: { driver, driverConfig: { bookmarks: session.lastBookmark() } },
                        });

                        if (gqlResult.errors) {
                            console.log(JSON.stringify(gqlResult.errors, null, 2));
                        }

                        expect(gqlResult.errors).toBeUndefined();

                        expect((gqlResult.data as any)[randomType.plural]).toHaveLength(2);
                    } finally {
                        await session.close();
                    }
                })
            );
        });

        test("should find Movies NOT_ENDS_WITH string", async () => {
            await Promise.all(
                ["ID", "String"].map(async (type) => {
                    const session = driver.session();

                    const randomType = generateUniqueType("Movie");

                    const typeDefs = `
                        type ${randomType.name} {
                            property: ${type}
                        }
                    `;

                    const neoSchema = new Neo4jGraphQL({ typeDefs });

                    const value = generate({
                        readable: true,
                        charset: "alphabetic",
                    });

                    const notValue = generate({
                        readable: true,
                        charset: "alphabetic",
                    });

                    const superValue = `${value}${value}`;

                    try {
                        await session.run(
                            `
                            CREATE (:${randomType.name} {property: $value})
                            CREATE (:${randomType.name} {property: $notValue})
                            CREATE (:${randomType.name} {property: $superValue})
                        `,
                            { value, notValue, superValue }
                        );

                        const query = `
                            {
                                ${randomType.plural}(where: { property_NOT_ENDS_WITH: "${value}" }) {
                                    property
                                }
                            }
                        `;

                        const gqlResult = await graphql({
                            schema: neoSchema.schema,
                            source: query,
                            contextValue: { driver, driverConfig: { bookmarks: session.lastBookmark() } },
                        });

                        if (gqlResult.errors) {
                            console.log(JSON.stringify(gqlResult.errors, null, 2));
                        }

                        expect(gqlResult.errors).toBeUndefined();

                        expect((gqlResult.data as any)[randomType.plural]).toHaveLength(1);
                        expect((gqlResult.data as any)[randomType.plural][0].property).toEqual(notValue);
                    } finally {
                        await session.close();
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

                    const randomType = generateUniqueType("Movie");

                    const typeDefs = `
                        type ${randomType.name} {
                            property: ${type}
                        }
                    `;

                    const neoSchema = new Neo4jGraphQL({ typeDefs });

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
                            CREATE (:${randomType.name} {property: $property})
                            CREATE (:${randomType.name} {property: $notProperty})
                        `,
                            { property, notProperty }
                        );

                        const query = `
                            {
                                ${randomType.plural}(where: { property_NOT: ${notProperty} }) {
                                    property
                                }
                            }
                        `;

                        const gqlResult = await graphql({
                            schema: neoSchema.schema,
                            source: query,
                            contextValue: { driver, driverConfig: { bookmarks: session.lastBookmark() } },
                        });

                        if (gqlResult.errors) {
                            console.log(JSON.stringify(gqlResult.errors, null, 2));
                        }

                        expect(gqlResult.errors).toBeUndefined();

                        expect((gqlResult.data as any)[randomType.plural]).toHaveLength(1);
                        expect((gqlResult.data as any)[randomType.plural][0].property).toEqual(property);
                    } finally {
                        await session.close();
                    }
                })
            );
        });

        test("should find Movies IN numbers", async () => {
            await Promise.all(
                ["Int", "Float"].map(async (type) => {
                    const session = driver.session();

                    const randomType = generateUniqueType("Movie");

                    const typeDefs = `
                        type ${randomType.name} {
                            property: ${type}
                        }
                    `;

                    const neoSchema = new Neo4jGraphQL({ typeDefs });

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
                            CREATE (:${randomType.name} {property: $value})
                        `,
                            { value }
                        );

                        const query = `
                            {
                                ${randomType.plural}(where: { property_IN: [${value}, ${randomValue1}, ${randomValue2}] }) {
                                    property
                                }
                            }
                        `;

                        const gqlResult = await graphql({
                            schema: neoSchema.schema,
                            source: query,
                            contextValue: { driver, driverConfig: { bookmarks: session.lastBookmark() } },
                        });

                        if (gqlResult.errors) {
                            console.log(JSON.stringify(gqlResult.errors, null, 2));
                        }

                        expect(gqlResult.errors).toBeUndefined();

                        expect((gqlResult.data as any)[randomType.plural]).toHaveLength(1);
                        expect((gqlResult.data as any)[randomType.plural][0].property).toEqual(value);
                    } finally {
                        await session.close();
                    }
                })
            );
        });

        test("should find Movies NOT_IN numbers", async () => {
            await Promise.all(
                ["Int", "Float"].map(async (type) => {
                    const session = driver.session();

                    const randomType = generateUniqueType("Movie");

                    const typeDefs = `
                        type ${randomType.name} {
                            property: ${type}
                        }
                    `;

                    const neoSchema = new Neo4jGraphQL({ typeDefs });

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
                            CREATE (:${randomType.name} {property: $value})
                            CREATE (:${randomType.name} {property: $randomValue1})
                            CREATE (:${randomType.name} {property: $randomValue2})
                        `,
                            { value, randomValue1, randomValue2 }
                        );

                        const query = `
                            {
                                ${randomType.plural}(where: { property_NOT_IN: [${randomValue1}, ${randomValue2}] }) {
                                    property
                                }
                            }
                        `;

                        const gqlResult = await graphql({
                            schema: neoSchema.schema,
                            source: query,
                            contextValue: { driver, driverConfig: { bookmarks: session.lastBookmark() } },
                        });

                        if (gqlResult.errors) {
                            console.log(JSON.stringify(gqlResult.errors, null, 2));
                        }

                        expect(gqlResult.errors).toBeUndefined();

                        expect((gqlResult.data as any)[randomType.plural]).toHaveLength(1);
                        expect((gqlResult.data as any)[randomType.plural][0].property).toEqual(value);
                    } finally {
                        await session.close();
                    }
                })
            );
        });

        test("should find Movies LT number", async () => {
            await Promise.all(
                ["Int", "Float"].map(async (type) => {
                    const session = driver.session();

                    const randomType = generateUniqueType("Movie");

                    const typeDefs = `
                        type ${randomType.name} {
                            property: ${type}
                        }
                    `;

                    const neoSchema = new Neo4jGraphQL({ typeDefs });

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
                            CREATE (:${randomType.name} {property: $value})
                            CREATE (:${randomType.name} {property: $lessThanValue})
                        `,
                            { value, lessThanValue }
                        );

                        const query = `
                            {
                                ${randomType.plural}(where: { property_LT: ${lessThanValue + 1} }) {
                                    property
                                }
                            }
                        `;

                        const gqlResult = await graphql({
                            schema: neoSchema.schema,
                            source: query,
                            contextValue: { driver, driverConfig: { bookmarks: session.lastBookmark() } },
                        });

                        if (gqlResult.errors) {
                            console.log(JSON.stringify(gqlResult.errors, null, 2));
                        }

                        expect(gqlResult.errors).toBeUndefined();

                        expect((gqlResult.data as any)[randomType.plural]).toHaveLength(1);
                        expect((gqlResult.data as any)[randomType.plural][0].property).toEqual(lessThanValue);
                    } finally {
                        await session.close();
                    }
                })
            );
        });

        test("should find Movies LTE number", async () => {
            await Promise.all(
                ["Int", "Float"].map(async (type) => {
                    const session = driver.session();

                    const randomType = generateUniqueType("Movie");

                    const typeDefs = `
                        type ${randomType.name} {
                            property: ${type}
                        }
                    `;

                    const neoSchema = new Neo4jGraphQL({ typeDefs });

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
                            CREATE (:${randomType.name} {property: $value})
                            CREATE (:${randomType.name} {property: $lessThanValue})
                        `,
                            { value, lessThanValue }
                        );

                        const query = `
                            {
                                ${randomType.plural}(where: { property_LTE: ${value} }) {
                                    property
                                }
                            }
                        `;

                        const gqlResult = await graphql({
                            schema: neoSchema.schema,
                            source: query,
                            contextValue: { driver, driverConfig: { bookmarks: session.lastBookmark() } },
                        });

                        if (gqlResult.errors) {
                            console.log(JSON.stringify(gqlResult.errors, null, 2));
                        }

                        expect(gqlResult.errors).toBeUndefined();

                        expect((gqlResult.data as any)[randomType.plural]).toHaveLength(2);
                    } finally {
                        await session.close();
                    }
                })
            );
        });

        test("should find Movies GT number", async () => {
            await Promise.all(
                ["Int", "Float"].map(async (type) => {
                    const session = driver.session();

                    const randomType = generateUniqueType("Movie");

                    const typeDefs = `
                        type ${randomType.name} {
                            property: ${type}
                        }
                    `;

                    const neoSchema = new Neo4jGraphQL({ typeDefs });

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
                            CREATE (:${randomType.name} {property: $value})
                            CREATE (:${randomType.name} {property: $graterThanValue})
                        `,
                            { value, graterThanValue }
                        );

                        const query = `
                            {
                                ${randomType.plural}(where: { property_GT: ${graterThanValue - 1} }) {
                                    property
                                }
                            }
                        `;

                        const gqlResult = await graphql({
                            schema: neoSchema.schema,
                            source: query,
                            contextValue: { driver, driverConfig: { bookmarks: session.lastBookmark() } },
                        });

                        if (gqlResult.errors) {
                            console.log(JSON.stringify(gqlResult.errors, null, 2));
                        }

                        expect(gqlResult.errors).toBeUndefined();

                        expect((gqlResult.data as any)[randomType.plural]).toHaveLength(1);
                        expect((gqlResult.data as any)[randomType.plural][0].property).toEqual(graterThanValue);
                    } finally {
                        await session.close();
                    }
                })
            );
        });

        test("should find Movies GTE number", async () => {
            await Promise.all(
                ["Int", "Float"].map(async (type) => {
                    const session = driver.session();

                    const randomType = generateUniqueType("Movie");

                    const typeDefs = `
                        type ${randomType.name} {
                            property: ${type}
                        }
                    `;

                    const neoSchema = new Neo4jGraphQL({ typeDefs });

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
                            CREATE (:${randomType.name} {property: $value})
                            CREATE (:${randomType.name} {property: $greaterThan})
                        `,
                            { value, greaterThan }
                        );

                        const query = `
                            {
                                ${randomType.plural}(where: { property_GTE: ${value} }) {
                                    property
                                }
                            }
                        `;

                        const gqlResult = await graphql({
                            schema: neoSchema.schema,
                            source: query,
                            contextValue: { driver, driverConfig: { bookmarks: session.lastBookmark() } },
                        });

                        if (gqlResult.errors) {
                            console.log(JSON.stringify(gqlResult.errors, null, 2));
                        }

                        expect(gqlResult.errors).toBeUndefined();

                        expect((gqlResult.data as any)[randomType.plural]).toHaveLength(2);
                    } finally {
                        await session.close();
                    }
                })
            );
        });
    });

    describe("Boolean Filtering", () => {
        test("should find Movies equality equality", async () => {
            const session = driver.session();

            const randomType = generateUniqueType("Movie");

            const typeDefs = `
                        type ${randomType.name} {
                            property: Boolean
                        }
                    `;

            const neoSchema = new Neo4jGraphQL({ typeDefs });

            const value = false;

            try {
                await session.run(
                    `
                            CREATE (:${randomType.name} {property: $value})
                        `,
                    { value }
                );

                const query = `
                            {
                                ${randomType.plural}(where: { property: false }) {
                                    property
                                }
                            }
                        `;

                const gqlResult = await graphql({
                    schema: neoSchema.schema,
                    source: query,
                    contextValue: { driver, driverConfig: { bookmarks: session.lastBookmark() } },
                });

                if (gqlResult.errors) {
                    console.log(JSON.stringify(gqlResult.errors, null, 2));
                }

                expect(gqlResult.errors).toBeUndefined();

                expect((gqlResult.data as any)[randomType.plural]).toHaveLength(1);
            } finally {
                await session.close();
            }
        });

        test("should find Movies NOT boolean", async () => {
            const session = driver.session();

            const randomType = generateUniqueType("Movie");

            const typeDefs = `
                        type ${randomType.name} {
                            property: Boolean
                        }
                    `;

            const neoSchema = new Neo4jGraphQL({ typeDefs });

            const value = false;

            try {
                await session.run(
                    `
                            CREATE (:${randomType.name} {property: $value})
                        `,
                    { value }
                );

                const query = `
                            {
                                ${randomType.plural}(where: { property_NOT: false }) {
                                    property
                                }
                            }
                        `;

                const gqlResult = await graphql({
                    schema: neoSchema.schema,
                    source: query,
                    contextValue: { driver, driverConfig: { bookmarks: session.lastBookmark() } },
                });

                if (gqlResult.errors) {
                    console.log(JSON.stringify(gqlResult.errors, null, 2));
                }

                expect(gqlResult.errors).toBeUndefined();

                expect((gqlResult.data as any)[randomType.plural]).toHaveLength(0);
            } finally {
                await session.close();
            }
        });
    });

    describe("Relationship/Connection Filtering", () => {
        describe("equality", () => {
            test("should find using relationship equality on node", async () => {
                const session = driver.session();

                const randomType1 = generateUniqueType("Movie");
                const randomType2 = generateUniqueType("Genre");

                const typeDefs = `
                        type ${randomType1.name} {
                            id: ID
                            ${randomType2.plural}: [${randomType2.name}] @relationship(type: "IN_GENRE", direction: OUT)
                        }

                        type ${randomType2.name} {
                            id: ID
                        }
                `;

                const neoSchema = new Neo4jGraphQL({ typeDefs });

                const rootId = generate({
                    charset: "alphabetic",
                });

                const relationId = generate({
                    charset: "alphabetic",
                });

                const randomId = generate({
                    charset: "alphabetic",
                });

                try {
                    await session.run(
                        `
                                CREATE (root:${randomType1.name} {id: $rootId})
                                CREATE (:${randomType1.name} {id: $randomId})
                                CREATE (relation:${randomType2.name} {id: $relationId})
                                CREATE (:${randomType2.name} {id: $randomId})
                                MERGE (root)-[:IN_GENRE]->(relation)
                            `,
                        { rootId, relationId, randomId }
                    );

                    const query = `
                        {
                            ${randomType1.plural}(where: { ${randomType2.plural}: { id: "${relationId}" } }) {
                                id
                                ${randomType2.plural} {
                                    id
                                }
                            }
                        }
                    `;

                    const gqlResult = await graphql({
                        schema: neoSchema.schema,
                        source: query,
                        contextValue: { driver, driverConfig: { bookmarks: session.lastBookmark() } },
                    });

                    if (gqlResult.errors) {
                        console.log(JSON.stringify(gqlResult.errors, null, 2));
                    }

                    expect(gqlResult.errors).toBeUndefined();

                    expect((gqlResult.data as any)[randomType1.plural]).toHaveLength(1);
                    expect((gqlResult.data as any)[randomType1.plural][0]).toMatchObject({
                        id: rootId,
                        [randomType2.plural]: [{ id: relationId }],
                    });
                } finally {
                    await session.close();
                }
            });

            test("should find using equality on node using connection", async () => {
                const session = driver.session();
                const typeDefs = `
                        type Movie {
                            id: ID
                            genres: [Genre] @relationship(type: "IN_GENRE", direction: OUT)
                        }

                        type Genre {
                            id: ID
                        }
                `;

                const neoSchema = new Neo4jGraphQL({ typeDefs });

                const movieId = generate({
                    charset: "alphabetic",
                });

                const genreId = generate({
                    charset: "alphabetic",
                });

                try {
                    await session.run(
                        `
                            CREATE (movie:Movie {id: $movieId})-[:IN_GENRE]->(:Genre {id:$genreId})
                        `,
                        { movieId, genreId }
                    );

                    const query = `
                        {
                            movies(where: { genresConnection: { node: { id: "${genreId}" } } }) {
                                id
                                genres {
                                    id
                                }
                            }
                        }
                    `;

                    const gqlResult = await graphql({
                        schema: neoSchema.schema,
                        source: query,
                        contextValue: { driver, driverConfig: { bookmarks: session.lastBookmark() } },
                    });

                    if (gqlResult.errors) {
                        console.log(JSON.stringify(gqlResult.errors, null, 2));
                    }

                    expect(gqlResult.errors).toBeUndefined();

                    expect((gqlResult.data as any).movies).toHaveLength(1);
                    expect((gqlResult.data as any).movies[0]).toMatchObject({
                        id: movieId,
                        genres: [{ id: genreId }],
                    });
                } finally {
                    await session.close();
                }
            });

            test("should find using equality on relationship using connection", async () => {
                const session = driver.session();
                const typeDefs = `
                        type Movie {
                            id: ID
                            genres: [Genre] @relationship(type: "IN_GENRE", direction: OUT, properties: "ActedIn")
                        }

                        type Genre {
                            id: ID
                        }

                        interface ActedIn {
                            id: String
                        }
                `;

                const neoSchema = new Neo4jGraphQL({ typeDefs });

                const movieId = generate({
                    charset: "alphabetic",
                });

                const genreId = generate({
                    charset: "alphabetic",
                });

                const actedInId = generate({
                    charset: "alphabetic",
                });

                try {
                    await session.run(
                        `
                            CREATE (movie:Movie {id: $movieId})-[:IN_GENRE {id:$actedInId}]->(:Genre {id:$genreId})
                        `,
                        { movieId, genreId, actedInId }
                    );

                    const query = `
                        {
                            movies(where: { genresConnection: { edge: { id: "${actedInId}" } } }) {
                                id
                                genres {
                                    id
                                }
                            }
                        }
                    `;

                    const gqlResult = await graphql({
                        schema: neoSchema.schema,
                        source: query,
                        contextValue: { driver, driverConfig: { bookmarks: session.lastBookmark() } },
                    });

                    if (gqlResult.errors) {
                        console.log(JSON.stringify(gqlResult.errors, null, 2));
                    }

                    expect(gqlResult.errors).toBeUndefined();

                    expect((gqlResult.data as any).movies).toHaveLength(1);
                    expect((gqlResult.data as any).movies[0]).toMatchObject({
                        id: movieId,
                        genres: [{ id: genreId }],
                    });
                } finally {
                    await session.close();
                }
            });

            test("should find relationship and node property equality using connection", async () => {
                const session = driver.session();
                const typeDefs = `
                        type Movie {
                            id: ID
                            genres: [Genre] @relationship(type: "IN_GENRE", direction: OUT, properties: "ActedIn")
                        }

                        type Genre {
                            id: ID
                        }

                        interface ActedIn {
                            id: String
                        }
                `;

                const neoSchema = new Neo4jGraphQL({ typeDefs });

                const movieId = generate({
                    charset: "alphabetic",
                });

                const genreId = generate({
                    charset: "alphabetic",
                });

                const actedInId = generate({
                    charset: "alphabetic",
                });

                try {
                    await session.run(
                        `
                            CREATE (movie:Movie {id: $movieId})-[:IN_GENRE {id:$actedInId}]->(:Genre {id:$genreId})
                        `,
                        { movieId, genreId, actedInId }
                    );

                    const query = `
                        {
                            movies(where: { genresConnection: { node: { id: "${genreId}" } edge: { id: "${actedInId}" } } }) {
                                id
                                genres {
                                    id
                                }
                            }
                        }
                    `;

                    const gqlResult = await graphql({
                        schema: neoSchema.schema,
                        source: query,
                        contextValue: { driver, driverConfig: { bookmarks: session.lastBookmark() } },
                    });

                    if (gqlResult.errors) {
                        console.log(JSON.stringify(gqlResult.errors, null, 2));
                    }

                    expect(gqlResult.errors).toBeUndefined();

                    expect((gqlResult.data as any).movies).toHaveLength(1);
                    expect((gqlResult.data as any).movies[0]).toMatchObject({
                        id: movieId,
                        genres: [{ id: genreId }],
                    });
                } finally {
                    await session.close();
                }
            });
        });

        describe("NOT", () => {
            test("should find using NOT on relationship", async () => {
                const session = driver.session();

                const randomType1 = generateUniqueType("Movie");
                const randomType2 = generateUniqueType("Genre");

                const typeDefs = `
                        type ${randomType1.name} {
                            id: ID
                            ${randomType2.plural}: [${randomType2.name}] @relationship(type: "IN_GENRE", direction: OUT)
                        }

                        type ${randomType2.name} {
                            id: ID
                        }
                `;

                const neoSchema = new Neo4jGraphQL({ typeDefs });

                const rootId1 = generate({
                    charset: "alphabetic",
                });
                const rootId2 = generate({
                    charset: "alphabetic",
                });

                const relationId1 = generate({
                    charset: "alphabetic",
                });
                const relationId2 = generate({
                    charset: "alphabetic",
                });

                try {
                    await session.run(
                        `
                                CREATE (root1:${randomType1.name} {id: $rootId1})
                                CREATE (root2:${randomType1.name} {id: $rootId2})
                                CREATE (relation1:${randomType2.name} {id: $relationId1})
                                CREATE (relation2:${randomType2.name} {id: $relationId2})
                                MERGE (root1)-[:IN_GENRE]->(relation1)
                                MERGE (root2)-[:IN_GENRE]->(relation2)
                            `,
                        { rootId1, rootId2, relationId1, relationId2 }
                    );

                    const query = `
                        {
                            ${randomType1.plural}(where: { ${randomType2.plural}_NOT: { id: "${relationId2}" } }) {
                                id
                                ${randomType2.plural} {
                                    id
                                }
                            }
                        }
                    `;

                    const gqlResult = await graphql({
                        schema: neoSchema.schema,
                        source: query,
                        contextValue: { driver, driverConfig: { bookmarks: session.lastBookmark() } },
                    });

                    if (gqlResult.errors) {
                        console.log(JSON.stringify(gqlResult.errors, null, 2));
                    }

                    expect(gqlResult.errors).toBeUndefined();

                    expect((gqlResult.data as any)[randomType1.plural]).toHaveLength(1);
                    expect((gqlResult.data as any)[randomType1.plural][0]).toMatchObject({
                        id: rootId1,
                        [randomType2.plural]: [{ id: relationId1 }],
                    });
                } finally {
                    await session.close();
                }
            });

            test("should find using NOT on connections", async () => {
                const session = driver.session();

                const randomType1 = generateUniqueType("Movie");
                const randomType2 = generateUniqueType("Genre");

                const typeDefs = `
                        type ${randomType1.name} {
                            id: ID
                            ${randomType2.plural}: [${randomType2.name}] @relationship(type: "IN_GENRE", direction: OUT)
                        }

                        type ${randomType2.name} {
                            id: ID
                        }
                `;

                const neoSchema = new Neo4jGraphQL({ typeDefs });

                const rootId1 = generate({
                    charset: "alphabetic",
                });
                const rootId2 = generate({
                    charset: "alphabetic",
                });

                const relationId1 = generate({
                    charset: "alphabetic",
                });
                const relationId2 = generate({
                    charset: "alphabetic",
                });

                try {
                    await session.run(
                        `
                            CREATE (root1:${randomType1.name} {id: $rootId1})-[:IN_GENRE]->(relation1:${randomType2.name} {id: $relationId1})
                            CREATE (root2:${randomType1.name} {id: $rootId2})-[:IN_GENRE]->(relation2:${randomType2.name} {id: $relationId2})
                        `,
                        { rootId1, rootId2, relationId1, relationId2 }
                    );

                    const query = `
                        {
                            ${randomType1.plural}(where: { ${randomType2.plural}Connection_NOT: { node: { id: "${relationId2}" } } }) {
                                id
                                ${randomType2.plural} {
                                    id
                                }
                            }
                        }
                    `;

                    const gqlResult = await graphql({
                        schema: neoSchema.schema,
                        source: query,
                        contextValue: { driver, driverConfig: { bookmarks: session.lastBookmark() } },
                    });

                    if (gqlResult.errors) {
                        console.log(JSON.stringify(gqlResult.errors, null, 2));
                    }

                    expect(gqlResult.errors).toBeUndefined();

                    expect((gqlResult.data as any)[randomType1.plural]).toHaveLength(1);
                    expect((gqlResult.data as any)[randomType1.plural][0]).toMatchObject({
                        id: rootId1,
                        [randomType2.plural]: [{ id: relationId1 }],
                    });
                } finally {
                    await session.close();
                }
            });

            test("should find using relationship properties and connections", async () => {
                const session = driver.session();

                const randomType1 = generateUniqueType("Movie");
                const randomType2 = generateUniqueType("Genre");

                const typeDefs = `
                        type ${randomType1.name} {
                            id: ID
                            ${randomType2.plural}: [${randomType2.name}] @relationship(type: "IN_GENRE", direction: OUT, properties: "ActedIn")
                        }

                        type ${randomType2.name} {
                            id: ID
                        }

                        interface ActedIn {
                            id: ID
                        }
                `;

                const neoSchema = new Neo4jGraphQL({ typeDefs });

                const rootId1 = generate({
                    charset: "alphabetic",
                });
                const rootId2 = generate({
                    charset: "alphabetic",
                });

                const relationId1 = generate({
                    charset: "alphabetic",
                });
                const relationId2 = generate({
                    charset: "alphabetic",
                });
                const actedInId = generate({
                    charset: "alphabetic",
                });

                try {
                    await session.run(
                        `
                            CREATE (:${randomType1.name} {id: $rootId1})-[:IN_GENRE {id: $actedInId}]->(:${randomType2.name} {id: $relationId1})
                            CREATE (:${randomType1.name} {id: $rootId2})-[:IN_GENRE {id: randomUUID()}]->(:${randomType2.name} {id: $relationId2})
                        `,
                        { rootId1, rootId2, relationId1, relationId2, actedInId }
                    );

                    const query = `
                        {
                            ${randomType1.plural}(where: { ${randomType2.plural}Connection_NOT: { edge: { id: "${actedInId}" } } }) {
                                id
                                ${randomType2.plural} {
                                    id
                                }
                            }
                        }
                    `;

                    const gqlResult = await graphql({
                        schema: neoSchema.schema,
                        source: query,
                        contextValue: { driver, driverConfig: { bookmarks: session.lastBookmark() } },
                    });

                    if (gqlResult.errors) {
                        console.log(JSON.stringify(gqlResult.errors, null, 2));
                    }

                    expect(gqlResult.errors).toBeUndefined();

                    expect((gqlResult.data as any)[randomType1.plural]).toHaveLength(1);
                    expect((gqlResult.data as any)[randomType1.plural][0]).toMatchObject({
                        id: rootId2,
                        [randomType2.plural]: [{ id: relationId2 }],
                    });
                } finally {
                    await session.close();
                }
            });
        });

        describe("List Predicates", () => {
            const testLabel = generate({ charset: "alphabetic" });

            const typeDefs = `
                type Movie {
                    id: ID! @id
                    budget: Int!
                    actors: [Actor!]! @relationship(type: "ACTED_IN", direction: IN)
                }

                type Actor {
                    id: ID! @id
                    flag: Boolean!
                    actedIn: [Movie!]! @relationship(type: "ACTED_IN", direction: OUT)
                }
            `;

            const { schema } = new Neo4jGraphQL({ typeDefs, driver });

            const movies = [
                ...Array(4)
                    .fill(null)
                    .map((_, i) => ({ id: generate(), budget: (i + 1) ** 2 })),
            ];
            const actors = [
                ...Array(4)
                    .fill(null)
                    .map((_, i) => ({ id: generate(), flag: i % 2 === 0 })),
            ];

            beforeAll(async () => {
                const session = driver.session();
                await session.run(
                    `
                    CREATE (m1:Movie:${testLabel}) SET m1 = $movies[0]
                    CREATE (m2:Movie:${testLabel}) SET m2 = $movies[1]
                    CREATE (m3:Movie:${testLabel}) SET m3 = $movies[2]
                    CREATE (m4:Movie:${testLabel}) SET m4 = $movies[3]
                    CREATE (a1:Actor:${testLabel}) SET a1 = $actors[0]
                    CREATE (a2:Actor:${testLabel}) SET a2 = $actors[1]
                    CREATE (a3:Actor:${testLabel}) SET a3 = $actors[2]
                    CREATE (a4:Actor:${testLabel}) SET a4 = $actors[3]
                    MERGE (a1)-[:ACTED_IN]->(m1)<-[:ACTED_IN]-(a3)
                    MERGE (a2)-[:ACTED_IN]->(m2)<-[:ACTED_IN]-(a3)
                    MERGE (a2)-[:ACTED_IN]->(m3)<-[:ACTED_IN]-(a4)
                    MERGE (a1)-[:ACTED_IN]->(m4)<-[:ACTED_IN]-(a2)
                    MERGE (a3)-[:ACTED_IN]->(m4)
                `,
                    { movies, actors }
                );
            });

            afterAll(async () => {
                const session = driver.session();
                await session.run(`MATCH (n:${testLabel}) DETACH DELETE n`);
                await session.close();
            });

            describe("on relationship", () => {
                const generateQuery = (predicate: "ALL" | "NONE" | "SINGLE" | "SOME") => `
                    query($movieIds: [ID!]!) {
                        movies(where: { AND: [{ id_IN: $movieIds }, { actors_${predicate}: { flag_NOT: false } }] }) {
                            id
                            actors(where: { flag_NOT: false }) {
                                id
                                flag
                            }
                        }
                    }
                `;
                test("ALL", async () => {
                    const gqlResult = await graphql({
                        schema,
                        source: generateQuery("ALL"),
                        contextValue: { driver },
                        variableValues: { movieIds: movies.map(({ id }) => id) },
                    });

                    expect(gqlResult.errors).toBeUndefined();

                    const gqlMovies: { id: string; actors: { id: string; flag: boolean }[] }[] = gqlResult.data?.movies;

                    expect(gqlMovies).toHaveLength(1);
                    expect(gqlMovies).toContainEqual({
                        id: movies[0].id,
                        actors: expect.arrayContaining([actors[0], actors[2]]),
                    });
                });

                test("NONE", async () => {
                    const gqlResult = await graphql({
                        schema,
                        source: generateQuery("NONE"),
                        contextValue: { driver },
                        variableValues: { movieIds: movies.map(({ id }) => id) },
                    });

                    expect(gqlResult.errors).toBeUndefined();

                    const gqlMovies: { id: string; actors: { id: string; flag: boolean }[] }[] = gqlResult.data?.movies;

                    expect(gqlMovies).toHaveLength(1);
                    expect(gqlMovies).toContainEqual({
                        id: movies[2].id,
                        actors: [],
                    });
                });

                test("SINGLE", async () => {
                    const gqlResult = await graphql({
                        schema,
                        source: generateQuery("SINGLE"),
                        contextValue: { driver },
                        variableValues: { movieIds: movies.map(({ id }) => id) },
                    });

                    expect(gqlResult.errors).toBeUndefined();

                    const gqlMovies: { id: string; actors: { id: string; flag: boolean }[] }[] = gqlResult.data?.movies;

                    expect(gqlMovies).toHaveLength(1);
                    expect(gqlMovies).toContainEqual({
                        id: movies[1].id,
                        actors: expect.arrayContaining([actors[2]]),
                    });
                });

                test("SOME", async () => {
                    const gqlResult = await graphql({
                        schema,
                        source: generateQuery("SOME"),
                        contextValue: { driver },
                        variableValues: { movieIds: movies.map(({ id }) => id) },
                    });

                    expect(gqlResult.errors).toBeUndefined();

                    const gqlMovies: { id: string; actors: { id: string; flag: boolean }[] }[] = gqlResult.data?.movies;

                    expect(gqlMovies).toHaveLength(3);
                    expect(gqlMovies).toContainEqual({
                        id: movies[0].id,
                        actors: expect.arrayContaining([actors[0], actors[2]]),
                    });
                    expect(gqlMovies).toContainEqual({
                        id: movies[1].id,
                        actors: expect.arrayContaining([actors[2]]),
                    });
                    expect(gqlMovies).toContainEqual({
                        id: movies[3].id,
                        actors: expect.arrayContaining([actors[0], actors[2]]),
                    });
                });
            });

            describe("on connection", () => {
                const generateQuery = (predicate: "ALL" | "NONE" | "SINGLE" | "SOME") => `
                    query($movieIds: [ID!]!) {
                        movies(where: { AND: [{ id_IN: $movieIds }, { actorsConnection_${predicate}: { node: { flag_NOT: false } } }] }) {
                            id
                            actors(where: {flag_NOT: false}) {
                                id
                                flag
                            }
                        }
                    }
                `;

                test("ALL", async () => {
                    const gqlResult = await graphql({
                        schema,
                        source: generateQuery("ALL"),
                        contextValue: { driver },
                        variableValues: { movieIds: movies.map(({ id }) => id) },
                    });

                    expect(gqlResult.errors).toBeUndefined();

                    const gqlMovies: { id: string; actors: { id: string; flag: boolean }[] }[] = gqlResult.data?.movies;

                    expect(gqlMovies).toHaveLength(1);
                    expect(gqlMovies).toContainEqual({
                        id: movies[0].id,
                        actors: expect.arrayContaining([actors[0], actors[2]]),
                    });
                });

                test("NONE", async () => {
                    const gqlResult = await graphql({
                        schema,
                        source: generateQuery("NONE"),
                        contextValue: { driver },
                        variableValues: { movieIds: movies.map(({ id }) => id) },
                    });

                    expect(gqlResult.errors).toBeUndefined();

                    const gqlMovies: { id: string; actors: { id: string; flag: boolean }[] }[] = gqlResult.data?.movies;

                    expect(gqlMovies).toHaveLength(1);
                    expect(gqlMovies).toContainEqual({
                        id: movies[2].id,
                        actors: [],
                    });
                });

                test("SINGLE", async () => {
                    const gqlResult = await graphql({
                        schema,
                        source: generateQuery("SINGLE"),
                        contextValue: { driver },
                        variableValues: { movieIds: movies.map(({ id }) => id) },
                    });

                    expect(gqlResult.errors).toBeUndefined();

                    const gqlMovies: { id: string; actors: { id: string; flag: boolean }[] }[] = gqlResult.data?.movies;

                    expect(gqlMovies).toHaveLength(1);
                    expect(gqlMovies).toContainEqual({
                        id: movies[1].id,
                        actors: expect.arrayContaining([actors[2]]),
                    });
                });

                test("SOME", async () => {
                    const gqlResult = await graphql({
                        schema,
                        source: generateQuery("SOME"),
                        contextValue: { driver },
                        variableValues: { movieIds: movies.map(({ id }) => id) },
                    });

                    expect(gqlResult.errors).toBeUndefined();

                    const gqlMovies: { id: string; actors: { id: string; flag: boolean }[] }[] = gqlResult.data?.movies;

                    expect(gqlMovies).toHaveLength(3);
                    expect(gqlMovies).toContainEqual({
                        id: movies[0].id,
                        actors: expect.arrayContaining([actors[0], actors[2]]),
                    });
                    expect(gqlMovies).toContainEqual({
                        id: movies[1].id,
                        actors: expect.arrayContaining([actors[2]]),
                    });
                    expect(gqlMovies).toContainEqual({
                        id: movies[3].id,
                        actors: expect.arrayContaining([actors[0], actors[2]]),
                    });
                });
            });
        });

        test("should test for not null", async () => {
            const session = driver.session();

            const randomType1 = generateUniqueType("Movie");
            const randomType2 = generateUniqueType("Genre");

            const typeDefs = `
                    type ${randomType1.name} {
                        id: ID
                        ${randomType2.plural}: [${randomType2.name}] @relationship(type: "IN_GENRE", direction: OUT)
                    }

                    type ${randomType2.name} {
                        id: ID
                    }
            `;

            const neoSchema = new Neo4jGraphQL({ typeDefs });

            const rootId = generate({
                charset: "alphabetic",
            });

            const relationId = generate({
                charset: "alphabetic",
            });

            const randomId = generate({
                charset: "alphabetic",
            });

            try {
                await session.run(
                    `
                            CREATE (root:${randomType1.name} {id: $rootId})
                            CREATE (:${randomType1.name} {id: $randomId})
                            CREATE (relation:${randomType2.name} {id: $relationId})
                            CREATE (:${randomType2.name} {id: $randomId})
                            MERGE (root)-[:IN_GENRE]->(relation)
                        `,
                    { rootId, relationId, randomId }
                );

                const nullQuery = `
                    {
                        ${randomType1.plural}(where: { ${randomType2.plural}: null }) {
                            id
                        }
                    }
                `;

                // Test null checking (nodes without any related nodes on the specified field)

                const nullResult = await graphql({
                    schema: neoSchema.schema,
                    source: nullQuery,
                    contextValue: { driver, driverConfig: { bookmarks: session.lastBookmark() } },
                });

                if (nullResult.errors) {
                    console.log(JSON.stringify(nullResult.errors, null, 2));
                }

                expect(nullResult.errors).toBeUndefined();

                expect((nullResult.data as any)[randomType1.plural]).toHaveLength(1);
                expect((nullResult.data as any)[randomType1.plural][0]).toMatchObject({
                    id: randomId,
                });

                // Test not null checking (nodes without any related nodes on the specified field)

                const notNullQuery = `
                    {
                        ${randomType1.plural}(where: { ${randomType2.plural}_NOT: null }) {
                            id
                        }
                    }
                `;

                const notNullResult = await graphql({
                    schema: neoSchema.schema,
                    source: notNullQuery,
                    contextValue: { driver, driverConfig: { bookmarks: session.lastBookmark() } },
                });

                if (notNullResult.errors) {
                    console.log(JSON.stringify(notNullResult.errors, null, 2));
                }

                expect(notNullResult.errors).toBeUndefined();

                expect((notNullResult.data as any)[randomType1.plural]).toHaveLength(1);
                expect((notNullResult.data as any)[randomType1.plural][0]).toMatchObject({
                    id: rootId,
                });
            } finally {
                await session.close();
            }
        });
    });

    describe("NULL Filtering", () => {
        test("should work for existence and non-existence", async () => {
            const session = driver.session();

            const randomType = generateUniqueType("Movie");

            const typeDefs = `
                type ${randomType.name} {
                    id: String!
                    optional: String
                }
            `;

            const neoSchema = new Neo4jGraphQL({ typeDefs });

            const id1 = generate({
                readable: true,
                charset: "alphabetic",
            });

            const id2 = generate({
                readable: true,
                charset: "alphabetic",
            });

            const optionalValue = generate({
                readable: true,
                charset: "alphabetic",
            });

            try {
                await session.run(
                    `
                        CREATE (:${randomType.name} {id: $id1})
                        CREATE (:${randomType.name} {id: $id2, optional: $optionalValue})
                    `,
                    { id1, id2, optionalValue }
                );

                // Test NULL checking

                const nullQuery = `
                    {
                        ${randomType.plural}(where: { optional: null }) {
                            id
                        }
                    }
                `;

                const nullResult = await graphql({
                    schema: neoSchema.schema,
                    source: nullQuery,
                    contextValue: { driver, driverConfig: { bookmarks: session.lastBookmark() } },
                });

                if (nullResult.errors) {
                    console.log(JSON.stringify(nullResult.errors, null, 2));
                }

                expect(nullResult.errors).toBeUndefined();

                expect((nullResult.data as any)[randomType.plural]).toHaveLength(1);

                expect((nullResult.data as any)[randomType.plural][0].id).toEqual(id1);

                // Test NOT NULL checking

                const notNullQuery = `
                    {
                        ${randomType.plural}(where: { optional_NOT: null }) {
                            id
                        }
                    }
                `;

                const notNullResult = await graphql({
                    schema: neoSchema.schema,
                    source: notNullQuery,
                    contextValue: { driver, driverConfig: { bookmarks: session.lastBookmark() } },
                });

                if (notNullResult.errors) {
                    console.log(JSON.stringify(notNullResult.errors, null, 2));
                }

                expect(notNullResult.errors).toBeUndefined();

                expect((notNullResult.data as any)[randomType.plural]).toHaveLength(1);

                expect((notNullResult.data as any)[randomType.plural][0].id).toEqual(id2);
            } finally {
                await session.close();
            }
        });
    });
});
