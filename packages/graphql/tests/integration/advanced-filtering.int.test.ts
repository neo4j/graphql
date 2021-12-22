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

                    const typeDefs = `
                        type Movie {
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
                            CREATE (:Movie {property: $value})
                        `,
                            { value }
                        );

                        const query = `
                            {
                                movies(where: { property_IN: ["${value}", "${randomValue1}", "${randomValue2}"] }) {
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

                        expect((gqlResult.data as any).movies).toHaveLength(1);

                        expect((gqlResult.data as any).movies[0].property).toEqual(value);
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

                    const typeMovie = generateUniqueType("Movie");

                    const typeDefs = `
                        type ${typeMovie.name} {
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
                            CREATE (:${typeMovie.name} {property: $value})
                        `,
                            { value: `${value}${value}` }
                        );

                        const query = `
                            {
                                ${typeMovie.plural}(where: { property_MATCHES: "(?i)${value}.*" }) {
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

                        expect((gqlResult.data as any)[typeMovie.plural]).toHaveLength(1);

                        expect((gqlResult.data as any)[typeMovie.plural][0].property).toEqual(`${value}${value}`);
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

                    const typeMovie = generateUniqueType("Movie");

                    const typeDefs = `
                        type ${typeMovie.name} {
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
                            CREATE (:${typeMovie.name} {property: $value})
                            CREATE (:${typeMovie.name} {property: $randomValue1})
                        `,
                            { value, randomValue1 }
                        );

                        const query = `
                            {
                                ${typeMovie.plural}(where: { property_NOT: "${randomValue1}" }) {
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

                        expect((gqlResult.data as any)[typeMovie.plural]).toHaveLength(1);

                        expect((gqlResult.data as any)[typeMovie.plural][0].property).toEqual(value);
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

                    const typeMovie = generateUniqueType("Movie");

                    const typeDefs = `
                        type ${typeMovie.name} {
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
                            CREATE (:${typeMovie.name} {property: $value})
                            CREATE (:${typeMovie.name} {property: $randomValue1})
                            CREATE (:${typeMovie.name} {property: $randomValue2})
                        `,
                            { value, randomValue1, randomValue2 }
                        );

                        const query = `
                            {
                                ${typeMovie.plural}(where: { property_NOT_IN: ["${randomValue1}", "${randomValue2}"] }) {
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

                        expect((gqlResult.data as any)[typeMovie.plural]).toHaveLength(1);

                        expect((gqlResult.data as any)[typeMovie.plural][0].property).toEqual(value);
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

                    const typeMovie = generateUniqueType("Movie");

                    const typeDefs = `
                        type ${typeMovie.name} {
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
                            CREATE (:${typeMovie.name} {property: $superValue})
                            CREATE (:${typeMovie.name} {property: $superValue})
                            CREATE (:${typeMovie.name} {property: $superValue})
                        `,
                            { superValue }
                        );

                        const query = `
                            {
                                ${typeMovie.plural}(where: { property_CONTAINS: "${value}" }) {
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

                        expect((gqlResult.data as any)[typeMovie.plural]).toHaveLength(3);

                        expect((gqlResult.data as any)[typeMovie.plural][0].property).toEqual(superValue);
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

                    const typeMovie = generateUniqueType("Movie");

                    const typeDefs = `
                        type ${typeMovie.name} {
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
                            CREATE (:${typeMovie.name} {property: $value})
                            CREATE (:${typeMovie.name} {property: $notValue})
                            CREATE (:${typeMovie.name} {property: $notValue})
                        `,
                            { value, notValue }
                        );

                        const query = `
                            {
                                ${typeMovie.plural}(where: { property_NOT_CONTAINS: "${notValue}" }) {
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

                        expect((gqlResult.data as any)[typeMovie.plural]).toHaveLength(1);

                        expect((gqlResult.data as any)[typeMovie.plural][0].property).toEqual(value);
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

                    const typeMovie = generateUniqueType("Movie");

                    const typeDefs = `
                        type ${typeMovie.name} {
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
                            CREATE (:${typeMovie.name} {property: $superValue})
                            CREATE (:${typeMovie.name} {property: $superValue})
                            CREATE (:${typeMovie.name} {property: $superValue})
                        `,
                            { superValue }
                        );

                        const query = `
                            {
                                ${typeMovie.plural}(where: { property_STARTS_WITH: "${value}" }) {
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

                        expect((gqlResult.data as any)[typeMovie.plural]).toHaveLength(3);

                        ((gqlResult.data as any)[typeMovie.plural] as any[]).forEach((x) => {
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

                    const typeMovie = generateUniqueType("Movie");

                    const typeDefs = `
                        type ${typeMovie.name} {
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
                            CREATE (:${typeMovie.name} {property: $value})
                            CREATE (:${typeMovie.name} {property: $notValue})
                            CREATE (:${typeMovie.name} {property: $notValue})
                        `,
                            { value, notValue }
                        );

                        const query = `
                            {
                                ${typeMovie.plural}(where: { property_NOT_STARTS_WITH: "${notValue}" }) {
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

                        expect((gqlResult.data as any)[typeMovie.plural]).toHaveLength(1);
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

                    const typeMovie = generateUniqueType("Movie");

                    const typeDefs = `
                        type ${typeMovie.name} {
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
                            CREATE (:${typeMovie.name} {property: $value})
                            CREATE (:${typeMovie.name} {property: $notValue})
                            CREATE (:${typeMovie.name} {property: $superValue})
                        `,
                            { value, notValue, superValue }
                        );

                        const query = `
                            {
                                ${typeMovie.plural}(where: { property_ENDS_WITH: "${value}" }) {
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

                        expect((gqlResult.data as any)[typeMovie.plural]).toHaveLength(2);
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

                    const typeMovie = generateUniqueType("Movie");

                    const typeDefs = `
                        type ${typeMovie.name} {
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
                            CREATE (:${typeMovie.name} {property: $value})
                            CREATE (:${typeMovie.name} {property: $notValue})
                            CREATE (:${typeMovie.name} {property: $superValue})
                        `,
                            { value, notValue, superValue }
                        );

                        const query = `
                            {
                                ${typeMovie.plural}(where: { property_NOT_ENDS_WITH: "${value}" }) {
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

                        expect((gqlResult.data as any)[typeMovie.plural]).toHaveLength(1);
                        expect((gqlResult.data as any)[typeMovie.plural][0].property).toEqual(notValue);
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

                    const typeMovie = generateUniqueType("Movie");

                    const typeDefs = `
                        type ${typeMovie.name} {
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
                            CREATE (:${typeMovie.name} {property: $property})
                            CREATE (:${typeMovie.name} {property: $notProperty})
                        `,
                            { property, notProperty }
                        );

                        const query = `
                            {
                                ${typeMovie.plural}(where: { property_NOT: ${notProperty} }) {
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

                        expect((gqlResult.data as any)[typeMovie.plural]).toHaveLength(1);
                        expect((gqlResult.data as any)[typeMovie.plural][0].property).toEqual(property);
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

                    const typeMovie = generateUniqueType("Movie");

                    const typeDefs = `
                        type ${typeMovie.name} {
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
                            CREATE (:${typeMovie.name} {property: $value})
                        `,
                            { value }
                        );

                        const query = `
                            {
                                ${typeMovie.plural}(where: { property_IN: [${value}, ${randomValue1}, ${randomValue2}] }) {
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

                        expect((gqlResult.data as any)[typeMovie.plural]).toHaveLength(1);
                        expect((gqlResult.data as any)[typeMovie.plural][0].property).toEqual(value);
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

                    const typeMovie = generateUniqueType("Movie");

                    const typeDefs = `
                        type ${typeMovie.name} {
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
                            CREATE (:${typeMovie.name} {property: $value})
                            CREATE (:${typeMovie.name} {property: $randomValue1})
                            CREATE (:${typeMovie.name} {property: $randomValue2})
                        `,
                            { value, randomValue1, randomValue2 }
                        );

                        const query = `
                            {
                                ${typeMovie.plural}(where: { property_NOT_IN: [${randomValue1}, ${randomValue2}] }) {
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

                        expect((gqlResult.data as any)[typeMovie.plural]).toHaveLength(1);
                        expect((gqlResult.data as any)[typeMovie.plural][0].property).toEqual(value);
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

                    const typeMovie = generateUniqueType("Movie");

                    const typeDefs = `
                        type ${typeMovie.name} {
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
                            CREATE (:${typeMovie.name} {property: $value})
                            CREATE (:${typeMovie.name} {property: $lessThanValue})
                        `,
                            { value, lessThanValue }
                        );

                        const query = `
                            {
                                ${typeMovie.plural}(where: { property_LT: ${lessThanValue + 1} }) {
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

                        expect((gqlResult.data as any)[typeMovie.plural]).toHaveLength(1);
                        expect((gqlResult.data as any)[typeMovie.plural][0].property).toEqual(lessThanValue);
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

                    const typeMovie = generateUniqueType("Movie");

                    const typeDefs = `
                        type ${typeMovie.name} {
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
                            CREATE (:${typeMovie.name} {property: $value})
                            CREATE (:${typeMovie.name} {property: $lessThanValue})
                        `,
                            { value, lessThanValue }
                        );

                        const query = `
                            {
                                ${typeMovie.plural}(where: { property_LTE: ${value} }) {
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

                        expect((gqlResult.data as any)[typeMovie.plural]).toHaveLength(2);
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

                    const typeMovie = generateUniqueType("Movie");

                    const typeDefs = `
                        type ${typeMovie.name} {
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
                            CREATE (:${typeMovie.name} {property: $value})
                            CREATE (:${typeMovie.name} {property: $graterThanValue})
                        `,
                            { value, graterThanValue }
                        );

                        const query = `
                            {
                                ${typeMovie.plural}(where: { property_GT: ${graterThanValue - 1} }) {
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

                        expect((gqlResult.data as any)[typeMovie.plural]).toHaveLength(1);
                        expect((gqlResult.data as any)[typeMovie.plural][0].property).toEqual(graterThanValue);
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

                    const typeMovie = generateUniqueType("Movie");

                    const typeDefs = `
                        type ${typeMovie.name} {
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
                            CREATE (:${typeMovie.name} {property: $value})
                            CREATE (:${typeMovie.name} {property: $greaterThan})
                        `,
                            { value, greaterThan }
                        );

                        const query = `
                            {
                                ${typeMovie.plural}(where: { property_GTE: ${value} }) {
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

                        expect((gqlResult.data as any)[typeMovie.plural]).toHaveLength(2);
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

            const typeMovie = generateUniqueType("Movie");

            const typeDefs = `
                        type ${typeMovie.name} {
                            property: Boolean
                        }
                    `;

            const neoSchema = new Neo4jGraphQL({ typeDefs });

            const value = false;

            try {
                await session.run(
                    `
                            CREATE (:${typeMovie.name} {property: $value})
                        `,
                    { value }
                );

                const query = `
                            {
                                ${typeMovie.plural}(where: { property: false }) {
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

                expect((gqlResult.data as any)[typeMovie.plural]).toHaveLength(1);
            } finally {
                await session.close();
            }
        });

        test("should find Movies NOT boolean", async () => {
            const session = driver.session();

            const typeMovie = generateUniqueType("Movie");

            const typeDefs = `
                        type ${typeMovie.name} {
                            property: Boolean
                        }
                    `;

            const neoSchema = new Neo4jGraphQL({ typeDefs });

            const value = false;

            try {
                await session.run(
                    `
                            CREATE (:${typeMovie.name} {property: $value})
                        `,
                    { value }
                );

                const query = `
                            {
                                ${typeMovie.plural}(where: { property_NOT: false }) {
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

                expect((gqlResult.data as any)[typeMovie.plural]).toHaveLength(0);
            } finally {
                await session.close();
            }
        });
    });

    describe("Relationship Filtering", () => {
        describe("equality", () => {
            test("should find using relationship equality on node", async () => {
                const session = driver.session();

                const typeMovie = generateUniqueType("Movie");
                const typeGenre = generateUniqueType("Genre");

                const typeDefs = `
                        type ${typeMovie.name} {
                            id: ID
                            ${typeGenre.plural}: [${typeGenre.name}] @relationship(type: "IN_GENRE", direction: OUT)
                        }

                        type ${typeGenre.name} {
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
                                CREATE (root:${typeMovie.name} {id: $rootId})
                                CREATE (:${typeMovie.name} {id: $randomId})
                                CREATE (relation:${typeGenre.name} {id: $relationId})
                                CREATE (:${typeGenre.name} {id: $randomId})
                                MERGE (root)-[:IN_GENRE]->(relation)
                            `,
                        { rootId, relationId, randomId }
                    );

                    const query = `
                        {
                            ${typeMovie.plural}(where: { ${typeGenre.plural}: { id: "${relationId}" } }) {
                                id
                                ${typeGenre.plural} {
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

                    expect((gqlResult.data as any)[typeMovie.plural]).toHaveLength(1);
                    expect((gqlResult.data as any)[typeMovie.plural][0]).toMatchObject({
                        id: rootId,
                        [typeGenre.plural]: [{ id: relationId }],
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

                const typeMovie = generateUniqueType("Movie");
                const typeGenre = generateUniqueType("Genre");

                const typeDefs = `
                        type ${typeMovie.name} {
                            id: ID
                            ${typeGenre.plural}: [${typeGenre.name}] @relationship(type: "IN_GENRE", direction: OUT)
                        }

                        type ${typeGenre.name} {
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
                                CREATE (root1:${typeMovie.name} {id: $rootId1})
                                CREATE (root2:${typeMovie.name} {id: $rootId2})
                                CREATE (relation1:${typeGenre.name} {id: $relationId1})
                                CREATE (relation2:${typeGenre.name} {id: $relationId2})
                                MERGE (root1)-[:IN_GENRE]->(relation1)
                                MERGE (root2)-[:IN_GENRE]->(relation2)
                            `,
                        { rootId1, rootId2, relationId1, relationId2 }
                    );

                    const query = `
                        {
                            ${typeMovie.plural}(where: { ${typeGenre.plural}_NOT: { id: "${relationId2}" } }) {
                                id
                                ${typeGenre.plural} {
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

                    expect((gqlResult.data as any)[typeMovie.plural]).toHaveLength(1);
                    expect((gqlResult.data as any)[typeMovie.plural][0]).toMatchObject({
                        id: rootId1,
                        [typeGenre.plural]: [{ id: relationId1 }],
                    });
                } finally {
                    await session.close();
                }
            });

            test("should find using NOT on connections", async () => {
                const session = driver.session();

                const typeMovie = generateUniqueType("Movie");
                const typeGenre = generateUniqueType("Genre");

                const typeDefs = `
                        type ${typeMovie.name} {
                            id: ID
                            ${typeGenre.plural}: [${typeGenre.name}] @relationship(type: "IN_GENRE", direction: OUT)
                        }

                        type ${typeGenre.name} {
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
                            CREATE (root1:${typeMovie.name} {id: $rootId1})-[:IN_GENRE]->(relation1:${typeGenre.name} {id: $relationId1})
                            CREATE (root2:${typeMovie.name} {id: $rootId2})-[:IN_GENRE]->(relation2:${typeGenre.name} {id: $relationId2})
                        `,
                        { rootId1, rootId2, relationId1, relationId2 }
                    );

                    const query = `
                        {
                            ${typeMovie.plural}(where: { ${typeGenre.plural}Connection_NOT: { node: { id: "${relationId2}" } } }) {
                                id
                                ${typeGenre.plural} {
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

                    expect((gqlResult.data as any)[typeMovie.plural]).toHaveLength(1);
                    expect((gqlResult.data as any)[typeMovie.plural][0]).toMatchObject({
                        id: rootId1,
                        [typeGenre.plural]: [{ id: relationId1 }],
                    });
                } finally {
                    await session.close();
                }
            });

            test("should find using relationship properties and connections", async () => {
                const session = driver.session();

                const typeMovie = generateUniqueType("Movie");
                const typeGenre = generateUniqueType("Genre");

                const typeDefs = `
                        type ${typeMovie.name} {
                            id: ID
                            ${typeGenre.plural}: [${typeGenre.name}] @relationship(type: "IN_GENRE", direction: OUT, properties: "ActedIn")
                        }

                        type ${typeGenre.name} {
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
                            CREATE (:${typeMovie.name} {id: $rootId1})-[:IN_GENRE {id: $actedInId}]->(:${typeGenre.name} {id: $relationId1})
                            CREATE (:${typeMovie.name} {id: $rootId2})-[:IN_GENRE {id: randomUUID()}]->(:${typeGenre.name} {id: $relationId2})
                        `,
                        { rootId1, rootId2, relationId1, relationId2, actedInId }
                    );

                    const query = `
                        {
                            ${typeMovie.plural}(where: { ${typeGenre.plural}Connection_NOT: { edge: { id: "${actedInId}" } } }) {
                                id
                                ${typeGenre.plural} {
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

                    expect((gqlResult.data as any)[typeMovie.plural]).toHaveLength(1);
                    expect((gqlResult.data as any)[typeMovie.plural][0]).toMatchObject({
                        id: rootId2,
                        [typeGenre.plural]: [{ id: relationId2 }],
                    });
                } finally {
                    await session.close();
                }
            });
        });

        test("should test for not null", async () => {
            const session = driver.session();

            const typeMovie = generateUniqueType("Movie");
            const typeGenre = generateUniqueType("Genre");

            const typeDefs = `
                    type ${typeMovie.name} {
                        id: ID
                        ${typeGenre.plural}: [${typeGenre.name}] @relationship(type: "IN_GENRE", direction: OUT)
                    }

                    type ${typeGenre.name} {
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
                            CREATE (root:${typeMovie.name} {id: $rootId})
                            CREATE (:${typeMovie.name} {id: $randomId})
                            CREATE (relation:${typeGenre.name} {id: $relationId})
                            CREATE (:${typeGenre.name} {id: $randomId})
                            MERGE (root)-[:IN_GENRE]->(relation)
                        `,
                    { rootId, relationId, randomId }
                );

                const nullQuery = `
                    {
                        ${typeMovie.plural}(where: { ${typeGenre.plural}: null }) {
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

                expect((nullResult.data as any)[typeMovie.plural]).toHaveLength(1);
                expect((nullResult.data as any)[typeMovie.plural][0]).toMatchObject({
                    id: randomId,
                });

                // Test not null checking (nodes without any related nodes on the specified field)

                const notNullQuery = `
                    {
                        ${typeMovie.plural}(where: { ${typeGenre.plural}_NOT: null }) {
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

                expect((notNullResult.data as any)[typeMovie.plural]).toHaveLength(1);
                expect((notNullResult.data as any)[typeMovie.plural][0]).toMatchObject({
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

            const typeMovie = generateUniqueType("Movie");

            const typeDefs = `
                type ${typeMovie.name} {
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
                        CREATE (:${typeMovie.name} {id: $id1})
                        CREATE (:${typeMovie.name} {id: $id2, optional: $optionalValue})
                    `,
                    { id1, id2, optionalValue }
                );

                // Test NULL checking

                const nullQuery = `
                    {
                        ${typeMovie.plural}(where: { optional: null }) {
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

                expect((nullResult.data as any)[typeMovie.plural]).toHaveLength(1);

                expect((nullResult.data as any)[typeMovie.plural][0].id).toEqual(id1);

                // Test NOT NULL checking

                const notNullQuery = `
                    {
                        ${typeMovie.plural}(where: { optional_NOT: null }) {
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

                expect((notNullResult.data as any)[typeMovie.plural]).toHaveLength(1);

                expect((notNullResult.data as any)[typeMovie.plural][0].id).toEqual(id2);
            } finally {
                await session.close();
            }
        });
    });
});
