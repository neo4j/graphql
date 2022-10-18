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

import type { Driver } from "neo4j-driver";
import { graphql } from "graphql";

import Neo4j from "./neo4j";
import { Neo4jGraphQL } from "../../src/classes";
import { generateUniqueType } from "../utils/graphql-types";

describe("Custom Scalar Filtering", () => {
    let driver: Driver;
    let neo4j: Neo4j;

    beforeAll(async () => {
        neo4j = new Neo4j();
        driver = await neo4j.getDriver();
    });

    afterAll(async () => {
        await driver.close();
    });

    describe("Single Value Custom Scalar", () => {
        test("Filter NOT CustomScalar - expect return value", async () => {
            const session = await neo4j.getSession();
            const randomType = generateUniqueType("Movie");

            const typeDefs = `
                scalar CustomScalar

                type ${randomType.name} {
                    property: CustomScalar
                }
            `;

            const neoSchema = new Neo4jGraphQL({ typeDefs });

            const value = 1;
            const unwantedValue = 2;

            try {
                await session.run(
                    `
                    CREATE (:${randomType.name} {property: $value})
                    CREATE (:${randomType.name} {property: $unwantedValue})
                `,
                    { value, unwantedValue }
                );

                const query = `
                    {
                        ${randomType.plural}(where: { property_NOT: ${unwantedValue} }) {
                            property
                        }
                    }
                `;

                const gqlResult = await graphql({
                    schema: await neoSchema.getSchema(),
                    source: query,
                    contextValue: neo4j.getContextValuesWithBookmarks(session.lastBookmark()),
                });

                expect(gqlResult.errors).toBeUndefined();
                expect((gqlResult.data as any)[randomType.plural]).toHaveLength(1);
                expect((gqlResult.data as any)[randomType.plural][0].property).toEqual(value);
            } finally {
                await session.close();
            }
        });
        test("Filter NOT CustomScalar - expect array of return values", async () => {
            const session = await neo4j.getSession();
            const randomType = generateUniqueType("Movie");

            const typeDefs = `
                scalar CustomScalar

                type ${randomType.name} {
                    property: CustomScalar
                }
            `;

            const neoSchema = new Neo4jGraphQL({ typeDefs });

            const value1 = 1;
            const value2 = 202;
            const unwantedValue = 2;

            try {
                await session.run(
                    `
                    CREATE (:${randomType.name} {property: $value1})
                    CREATE (:${randomType.name} {property: $value2})
                    CREATE (:${randomType.name} {property: $unwantedValue})
                `,
                    { value1, value2, unwantedValue }
                );

                const query = `
                    {
                        ${randomType.plural}(where: { property_NOT: ${unwantedValue} }) {
                            property
                        }
                    }
                `;

                const gqlResult = await graphql({
                    schema: await neoSchema.getSchema(),
                    source: query,
                    contextValue: neo4j.getContextValuesWithBookmarks(session.lastBookmark()),
                });

                expect(gqlResult.errors).toBeUndefined();
                expect((gqlResult.data as any)[randomType.plural]).toHaveLength(2);
                expect((gqlResult.data as any)[randomType.plural][0].property).toEqual(value1);
                expect((gqlResult.data as any)[randomType.plural][1].property).toEqual(value2);
            } finally {
                await session.close();
            }
        });
        test("Filter NOT CustomScalar - expect no return values", async () => {
            const session = await neo4j.getSession();
            const randomType = generateUniqueType("Movie");

            const typeDefs = `
                scalar CustomScalar

                type ${randomType.name} {
                    property: CustomScalar
                }
            `;

            const neoSchema = new Neo4jGraphQL({ typeDefs });

            const value = 11;

            try {
                await session.run(
                    `
                    CREATE (:${randomType.name} {property: $value})
                `,
                    { value }
                );

                const query = `
                    {
                        ${randomType.plural}(where: { property_NOT: ${value} }) {
                            property
                        }
                    }
                `;

                const gqlResult = await graphql({
                    schema: await neoSchema.getSchema(),
                    source: query,
                    contextValue: neo4j.getContextValuesWithBookmarks(session.lastBookmark()),
                });

                expect(gqlResult.errors).toBeUndefined();
                expect((gqlResult.data as any)[randomType.plural]).toHaveLength(0);
            } finally {
                await session.close();
            }
        });
        test("Filter IN CustomScalar - expect return value", async () => {
            const session = await neo4j.getSession();
            const randomType = generateUniqueType("Movie");

            const typeDefs = `
                scalar CustomScalar

                type ${randomType.name} {
                    property: CustomScalar
                }
            `;

            const neoSchema = new Neo4jGraphQL({ typeDefs });

            const value = "someValue";
            const unknownValue1 = "foo";
            const unknownValue2 = "bar";

            try {
                await session.run(
                    `
                    CREATE (:${randomType.name} {property: $value})
                `,
                    { value }
                );

                const query = `
                    {
                        ${randomType.plural}(where: { 
                                property_IN: ["${value}", "${unknownValue1}", "${unknownValue2}"]
                        }) {
                            property
                        }
                    }
                `;

                const gqlResult = await graphql({
                    schema: await neoSchema.getSchema(),
                    source: query,
                    contextValue: neo4j.getContextValuesWithBookmarks(session.lastBookmark()),
                });

                expect(gqlResult.errors).toBeUndefined();
                expect((gqlResult.data as any)[randomType.plural]).toHaveLength(1);
                expect((gqlResult.data as any)[randomType.plural][0].property).toEqual(value);
            } finally {
                await session.close();
            }
        });
        test("Filter IN CustomScalar - expect array of return values", async () => {
            const session = await neo4j.getSession();
            const randomType = generateUniqueType("Movie");

            const typeDefs = `
                scalar CustomScalar

                type ${randomType.name} {
                    property: CustomScalar
                }
            `;

            const neoSchema = new Neo4jGraphQL({ typeDefs });

            const value1 = "someValue";
            const value2 = "someOtherValue";
            const unwantedValue = "foo";

            try {
                await session.run(
                    `
                    CREATE (:${randomType.name} {property: $value1})
                    CREATE (:${randomType.name} {property: $value2})
                    CREATE (:${randomType.name} {property: $unwantedValue})
                `,
                    { value1, value2, unwantedValue }
                );

                const query = `
                    {
                        ${randomType.plural}(where: { 
                                property_IN: ["${value1}", "${value2}"]
                        }) {
                            property
                        }
                    }
                `;

                const gqlResult = await graphql({
                    schema: await neoSchema.getSchema(),
                    source: query,
                    contextValue: neo4j.getContextValuesWithBookmarks(session.lastBookmark()),
                });

                expect(gqlResult.errors).toBeUndefined();
                expect((gqlResult.data as any)[randomType.plural]).toHaveLength(2);
                expect((gqlResult.data as any)[randomType.plural][0].property).toEqual(value1);
                expect((gqlResult.data as any)[randomType.plural][1].property).toEqual(value2);
            } finally {
                await session.close();
            }
        });
        test("Filter IN CustomScalar - expect no return values", async () => {
            const session = await neo4j.getSession();
            const randomType = generateUniqueType("Movie");

            const typeDefs = `
                scalar CustomScalar

                type ${randomType.name} {
                    property: CustomScalar
                }
            `;

            const neoSchema = new Neo4jGraphQL({ typeDefs });

            const value = "someValue";
            const unknownValue = "someUnknownValue";

            try {
                await session.run(
                    `
                    CREATE (:${randomType.name} {property: $value})
                `,
                    { value }
                );

                const query = `
                    {
                        ${randomType.plural}(where: { property_IN: ["${unknownValue}"] }) {
                            property
                        }
                    }
                `;

                const gqlResult = await graphql({
                    schema: await neoSchema.getSchema(),
                    source: query,
                    contextValue: neo4j.getContextValuesWithBookmarks(session.lastBookmark()),
                });

                expect(gqlResult.errors).toBeUndefined();
                expect((gqlResult.data as any)[randomType.plural]).toHaveLength(0);
            } finally {
                await session.close();
            }
        });
        test("Filter NOT_IN CustomScalar - expect return value", async () => {
            const session = await neo4j.getSession();
            const randomType = generateUniqueType("Movie");

            const typeDefs = `
                scalar CustomScalar

                type ${randomType.name} {
                    property: CustomScalar
                }
            `;

            const neoSchema = new Neo4jGraphQL({ typeDefs });

            const value = "someValue";
            const unwantedValue1 = "foo";
            const unwantedValue2 = "bar";

            try {
                await session.run(
                    `
                    CREATE (:${randomType.name} {property: $value})
                    CREATE (:${randomType.name} {property: $unwantedValue1})
                    CREATE (:${randomType.name} {property: $unwantedValue2})
                `,
                    { value, unwantedValue1, unwantedValue2 }
                );

                const query = `
                    {
                        ${randomType.plural}(where: { property_NOT_IN: ["${unwantedValue1}", "${unwantedValue2}"] }) {
                            property
                        }
                    }
                `;

                const gqlResult = await graphql({
                    schema: await neoSchema.getSchema(),
                    source: query,
                    contextValue: neo4j.getContextValuesWithBookmarks(session.lastBookmark()),
                });

                expect(gqlResult.errors).toBeUndefined();
                expect((gqlResult.data as any)[randomType.plural]).toHaveLength(1);
                expect((gqlResult.data as any)[randomType.plural][0].property).toEqual(value);
            } finally {
                await session.close();
            }
        });
        test("Filter NOT_IN CustomScalar - expect array of return values", async () => {
            const session = await neo4j.getSession();
            const randomType = generateUniqueType("Movie");

            const typeDefs = `
                scalar CustomScalar

                type ${randomType.name} {
                    property: CustomScalar
                }
            `;

            const neoSchema = new Neo4jGraphQL({ typeDefs });

            const value1 = "someValue";
            const value2 = "differentValue";
            const unwantedValue = "foo";

            try {
                await session.run(
                    `
                    CREATE (:${randomType.name} {property: $value1})
                    CREATE (:${randomType.name} {property: $value2})
                    CREATE (:${randomType.name} {property: $unwantedValue})
                `,
                    { value1, value2, unwantedValue }
                );

                const query = `
                    {
                        ${randomType.plural}(where: { property_NOT_IN: ["${unwantedValue}"] }) {
                            property
                        }
                    }
                `;

                const gqlResult = await graphql({
                    schema: await neoSchema.getSchema(),
                    source: query,
                    contextValue: neo4j.getContextValuesWithBookmarks(session.lastBookmark()),
                });

                expect(gqlResult.errors).toBeUndefined();
                expect((gqlResult.data as any)[randomType.plural]).toHaveLength(2);
                expect((gqlResult.data as any)[randomType.plural][0].property).toEqual(value1);
                expect((gqlResult.data as any)[randomType.plural][1].property).toEqual(value2);
            } finally {
                await session.close();
            }
        });
        test("Filter NOT_IN CustomScalar - expect no return values", async () => {
            const session = await neo4j.getSession();
            const randomType = generateUniqueType("Movie");

            const typeDefs = `
                scalar CustomScalar

                type ${randomType.name} {
                    property: CustomScalar
                }
            `;

            const neoSchema = new Neo4jGraphQL({ typeDefs });

            const value = "someValue";

            try {
                await session.run(
                    `
                    CREATE (:${randomType.name} {property: $value})
                `,
                    { value }
                );

                const query = `
                    {
                        ${randomType.plural}(where: { property_NOT_IN: ["${value}"] }) {
                            property
                        }
                    }
                `;

                const gqlResult = await graphql({
                    schema: await neoSchema.getSchema(),
                    source: query,
                    contextValue: neo4j.getContextValuesWithBookmarks(session.lastBookmark()),
                });

                expect(gqlResult.errors).toBeUndefined();
                expect((gqlResult.data as any)[randomType.plural]).toHaveLength(0);
            } finally {
                await session.close();
            }
        });
    });
    describe("List Custom Scalar Filtering", () => {
        test("Filter NOT CustomListScalar - expect return value", async () => {
            const session = await neo4j.getSession();
            const randomType = generateUniqueType("Movie");

            const typeDefs = `
                scalar CustomListScalar

                type ${randomType.name} {
                    property: [CustomListScalar!]
                }
            `;

            const neoSchema = new Neo4jGraphQL({ typeDefs });

            const value = [1, 2, 3];
            const unwantedValue = [2, 3];

            try {
                await session.run(
                    `
                    CREATE (:${randomType.name} {property: $value})
                    CREATE (:${randomType.name} {property: $unwantedValue})
                `,
                    { value, unwantedValue }
                );

                const query = `
                    query($unwantedValue: [CustomListScalar!]!){
                        ${randomType.plural}(where: { property_NOT: $unwantedValue }) {
                            property
                        }
                    }
                `;

                const gqlResult = await graphql({
                    schema: await neoSchema.getSchema(),
                    source: query,
                    contextValue: neo4j.getContextValuesWithBookmarks(session.lastBookmark()),
                    variableValues: { unwantedValue },
                });

                expect(gqlResult.errors).toBeUndefined();
                expect((gqlResult.data as any)[randomType.plural]).toHaveLength(1);
                expect((gqlResult.data as any)[randomType.plural][0].property).toEqual(value);
            } finally {
                await session.close();
            }
        });
        test("Filter NOT CustomListScalar - expect array of return values", async () => {
            const session = await neo4j.getSession();
            const randomType = generateUniqueType("Movie");

            const typeDefs = `
                scalar CustomListScalar

                type ${randomType.name} {
                    property: [CustomListScalar!]
                }
            `;

            const neoSchema = new Neo4jGraphQL({ typeDefs });

            const value1 = [1, 2, 3];
            const value2 = ["someValue"];
            const unwantedValue = [2, 3];

            try {
                await session.run(
                    `
                    CREATE (:${randomType.name} {property: $value1})
                    CREATE (:${randomType.name} {property: $value2})
                    CREATE (:${randomType.name} {property: $unwantedValue})
                `,
                    { value1, value2, unwantedValue }
                );

                const query = `
                    query($unwantedValue: [CustomListScalar!]!){
                        ${randomType.plural}(where: { property_NOT: $unwantedValue }) {
                            property
                        }
                    }
                `;

                const gqlResult = await graphql({
                    schema: await neoSchema.getSchema(),
                    source: query,
                    contextValue: neo4j.getContextValuesWithBookmarks(session.lastBookmark()),
                    variableValues: { unwantedValue },
                });

                expect(gqlResult.errors).toBeUndefined();
                expect((gqlResult.data as any)[randomType.plural]).toHaveLength(2);
                expect((gqlResult.data as any)[randomType.plural][0].property).toEqual(value1);
                expect((gqlResult.data as any)[randomType.plural][1].property).toEqual(value2);
            } finally {
                await session.close();
            }
        });
        test("Filter NOT CustomListScalar - expect no return values", async () => {
            const session = await neo4j.getSession();
            const randomType = generateUniqueType("Movie");

            const typeDefs = `
                scalar CustomListScalar

                type ${randomType.name} {
                    property: [CustomListScalar!]
                }
            `;

            const neoSchema = new Neo4jGraphQL({ typeDefs });

            const value = [1, 2, 3];

            try {
                await session.run(
                    `
                    CREATE (:${randomType.name} {property: $value})
                `,
                    { value }
                );

                const query = `
                    query($value: [CustomListScalar!]!){
                        ${randomType.plural}(where: { property_NOT: $value }) {
                            property
                        }
                    }
                `;

                const gqlResult = await graphql({
                    schema: await neoSchema.getSchema(),
                    source: query,
                    contextValue: neo4j.getContextValuesWithBookmarks(session.lastBookmark()),
                    variableValues: { value },
                });

                expect(gqlResult.errors).toBeUndefined();
                expect((gqlResult.data as any)[randomType.plural]).toHaveLength(0);
            } finally {
                await session.close();
            }
        });
        test("Filter INCLUDES CustomListScalar - expect return value", async () => {
            const session = await neo4j.getSession();
            const randomType = generateUniqueType("Movie");

            const typeDefs = `
                scalar CustomListScalar

                type ${randomType.name} {
                    property: [CustomListScalar!]
                }
            `;

            const neoSchema = new Neo4jGraphQL({ typeDefs });

            const value = ["val1", "val2", "val3"];
            const unwantedValue = ["foo", "bar"];

            try {
                await session.run(
                    `
                    CREATE (:${randomType.name} {property: $value})
                    CREATE (:${randomType.name} {property: $unwantedValue})
                `,
                    { value, unwantedValue }
                );

                const query = `
                    {
                        ${randomType.plural}(where: { property_INCLUDES: ${value[0]} }) {
                            property
                        }
                    }
                `;

                const gqlResult = await graphql({
                    schema: await neoSchema.getSchema(),
                    source: query,
                    contextValue: neo4j.getContextValuesWithBookmarks(session.lastBookmark()),
                });

                expect(gqlResult.errors).toBeUndefined();
                expect((gqlResult.data as any)[randomType.plural]).toHaveLength(1);
                expect((gqlResult.data as any)[randomType.plural][0].property).toEqual(value);
            } finally {
                await session.close();
            }
        });
        test("Filter INCLUDES CustomListScalar - expect array of return values", async () => {
            const session = await neo4j.getSession();
            const randomType = generateUniqueType("Movie");

            const typeDefs = `
                scalar CustomListScalar

                type ${randomType.name} {
                    property: [CustomListScalar!]
                }
            `;

            const neoSchema = new Neo4jGraphQL({ typeDefs });

            const value1 = ["val1", "val2", "val3"];
            const value2 = [value1[0]];
            const unwantedValue = ["foo", "bar"];

            try {
                await session.run(
                    `
                    CREATE (:${randomType.name} {property: $value1})
                    CREATE (:${randomType.name} {property: $value2})
                    CREATE (:${randomType.name} {property: $unwantedValue})
                `,
                    { value1, value2, unwantedValue }
                );

                const query = `
                    {
                        ${randomType.plural}(where: { property_INCLUDES: ${value1[0]} }) {
                            property
                        }
                    }
                `;

                const gqlResult = await graphql({
                    schema: await neoSchema.getSchema(),
                    source: query,
                    contextValue: neo4j.getContextValuesWithBookmarks(session.lastBookmark()),
                });

                expect(gqlResult.errors).toBeUndefined();
                expect((gqlResult.data as any)[randomType.plural]).toHaveLength(2);
                expect((gqlResult.data as any)[randomType.plural][0].property).toEqual(value1);
                expect((gqlResult.data as any)[randomType.plural][1].property).toEqual(value2);
            } finally {
                await session.close();
            }
        });
        test("Filter INCLUDES CustomListScalar - expect no return values", async () => {
            const session = await neo4j.getSession();
            const randomType = generateUniqueType("Movie");

            const typeDefs = `
                scalar CustomListScalar

                type ${randomType.name} {
                    property: [CustomListScalar!]
                }
            `;

            const neoSchema = new Neo4jGraphQL({ typeDefs });

            const value = ["val1", "val2", "val3"];
            const unknownValue = "foo";

            try {
                await session.run(
                    `
                    CREATE (:${randomType.name} {property: $value})
                `,
                    { value }
                );

                const query = `
                    {
                        ${randomType.plural}(where: { property_INCLUDES: ${unknownValue[0]} }) {
                            property
                        }
                    }
                `;

                const gqlResult = await graphql({
                    schema: await neoSchema.getSchema(),
                    source: query,
                    contextValue: neo4j.getContextValuesWithBookmarks(session.lastBookmark()),
                });

                expect(gqlResult.errors).toBeUndefined();
                expect((gqlResult.data as any)[randomType.plural]).toHaveLength(0);
            } finally {
                await session.close();
            }
        });
        test("Filter NOT_INCLUDES CustomListScalar - expect return value", async () => {
            const session = await neo4j.getSession();
            const randomType = generateUniqueType("Movie");

            const typeDefs = `
                scalar CustomListScalar

                type ${randomType.name} {
                    property: [CustomListScalar!]
                }
            `;

            const neoSchema = new Neo4jGraphQL({ typeDefs });

            const value = ["val1", "val2", "val3"];
            const unwantedValue = ["foo", "bar"];

            try {
                await session.run(
                    `
                    CREATE (:${randomType.name} {property: $value})
                    CREATE (:${randomType.name} {property: $unwantedValue})
                `,
                    { value, unwantedValue }
                );

                const query = `
                    {
                        ${randomType.plural}(where: { property_NOT_INCLUDES: ${unwantedValue[0]} }) {
                            property
                        }
                    }
                `;

                const gqlResult = await graphql({
                    schema: await neoSchema.getSchema(),
                    source: query,
                    contextValue: neo4j.getContextValuesWithBookmarks(session.lastBookmark()),
                });

                expect(gqlResult.errors).toBeUndefined();
                expect((gqlResult.data as any)[randomType.plural]).toHaveLength(1);
                expect((gqlResult.data as any)[randomType.plural][0].property).toEqual(value);
            } finally {
                await session.close();
            }
        });
        test("Filter NOT_INCLUDES CustomListScalar - expect array of return values", async () => {
            const session = await neo4j.getSession();
            const randomType = generateUniqueType("Movie");

            const typeDefs = `
                scalar CustomListScalar

                type ${randomType.name} {
                    property: [CustomListScalar!]
                }
            `;

            const neoSchema = new Neo4jGraphQL({ typeDefs });

            const value1 = ["val1", "val2", "val3"];
            const value2 = [1];
            const unwantedValue = ["foo", "bar"];

            try {
                await session.run(
                    `
                    CREATE (:${randomType.name} {property: $value1})
                    CREATE (:${randomType.name} {property: $value2})
                    CREATE (:${randomType.name} {property: $unwantedValue})
                `,
                    { value1, value2, unwantedValue }
                );

                const query = `
                    {
                        ${randomType.plural}(where: { property_NOT_INCLUDES: ${unwantedValue[0]} }) {
                            property
                        }
                    }
                `;

                const gqlResult = await graphql({
                    schema: await neoSchema.getSchema(),
                    source: query,
                    contextValue: neo4j.getContextValuesWithBookmarks(session.lastBookmark()),
                });

                expect(gqlResult.errors).toBeUndefined();
                expect((gqlResult.data as any)[randomType.plural]).toHaveLength(2);
                expect((gqlResult.data as any)[randomType.plural][0].property).toEqual(value1);
                expect((gqlResult.data as any)[randomType.plural][1].property).toEqual(value2);
            } finally {
                await session.close();
            }
        });
        test("Filter NOT_INCLUDES CustomListScalar - expect no return values", async () => {
            const session = await neo4j.getSession();
            const randomType = generateUniqueType("Movie");

            const typeDefs = `
                scalar CustomListScalar

                type ${randomType.name} {
                    property: [CustomListScalar!]
                }
            `;

            const neoSchema = new Neo4jGraphQL({ typeDefs });

            const value = ["val1", "val2", "val3"];

            try {
                await session.run(
                    `
                    CREATE (:${randomType.name} {property: $value})
                `,
                    { value }
                );

                const query = `
                    {
                        ${randomType.plural}(where: { property_NOT_INCLUDES: ${value[0]} }) {
                            property
                        }
                    }
                `;

                const gqlResult = await graphql({
                    schema: await neoSchema.getSchema(),
                    source: query,
                    contextValue: neo4j.getContextValuesWithBookmarks(session.lastBookmark()),
                });

                expect(gqlResult.errors).toBeUndefined();
                expect((gqlResult.data as any)[randomType.plural]).toHaveLength(0);
            } finally {
                await session.close();
            }
        });
    });
});
