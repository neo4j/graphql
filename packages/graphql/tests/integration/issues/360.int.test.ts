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
import { graphql } from "graphql";
import { generate } from "randomstring";
import camelcase from "camelcase";
import pluralize from "pluralize";
import { Neo4jGraphQL } from "../../../src/classes";
import neo4j from "../neo4j";

describe("360", () => {
    let driver: Driver;

    beforeAll(async () => {
        driver = await neo4j();
    });

    afterAll(async () => {
        await driver.close();
    });

    test("should return all nodes when AND is used and members are optional", async () => {
        const session = driver.session();

        const type = `${generate({
            charset: "alphabetic",
            readable: true,
        })}Event`;

        const pluralType = pluralize(camelcase(type));

        const typeDefs = `
            type ${type} {
                id: ID!
                name: String
                start: DateTime
                end: DateTime
                activity: String
            }
        `;

        const neoSchema = new Neo4jGraphQL({
            typeDefs,
        });

        const query = `
            query ($rangeStart: DateTime, $rangeEnd: DateTime, $activity: String) {
                ${pluralType}(where: { AND: [{ start_GTE: $rangeStart }, { start_LTE: $rangeEnd }, { activity: $activity }] }) {
                    id
                }
            }
        `;

        try {
            await session.run(
                `
                    CREATE (:${type} {id: randomUUID(), name: randomUUID(), start: datetime(), end: datetime()})
                    CREATE (:${type} {id: randomUUID(), name: randomUUID(), start: datetime(), end: datetime()})
                    CREATE (:${type} {id: randomUUID(), name: randomUUID(), start: datetime(), end: datetime()})
                `
            );

            const gqlResult = await graphql({
                schema: neoSchema.schema,
                source: query,
                contextValue: { driver, driverConfig: { bookmarks: [session.lastBookmark()] } },
            });

            expect(gqlResult.errors).toBeUndefined();
            expect((gqlResult.data as any)[pluralType]).toHaveLength(3);
        } finally {
            await session.close();
        }
    });

    test("should return all nodes when OR is used and members are optional", async () => {
        const session = driver.session();

        const type = `${generate({
            charset: "alphabetic",
            readable: true,
        })}Event`;

        const pluralType = pluralize(camelcase(type));

        const typeDefs = `
            type ${type} {
                id: ID!
                name: String
                start: DateTime
                end: DateTime
                activity: String
            }
        `;

        const neoSchema = new Neo4jGraphQL({
            typeDefs,
        });

        const query = `
            query ($rangeStart: DateTime, $rangeEnd: DateTime, $activity: String) {
                ${pluralType}(where: { OR: [{ start_GTE: $rangeStart }, { start_LTE: $rangeEnd }, { activity: $activity }] }) {
                    id
                }
            }
        `;

        try {
            await session.run(
                `
                    CREATE (:${type} {id: randomUUID(), name: randomUUID(), start: datetime(), end: datetime()})
                    CREATE (:${type} {id: randomUUID(), name: randomUUID(), start: datetime(), end: datetime()})
                    CREATE (:${type} {id: randomUUID(), name: randomUUID(), start: datetime(), end: datetime()})
                `
            );

            const gqlResult = await graphql({
                schema: neoSchema.schema,
                source: query,
                contextValue: { driver, driverConfig: { bookmarks: [session.lastBookmark()] } },
            });

            expect(gqlResult.errors).toBeUndefined();
            expect((gqlResult.data as any)[pluralType]).toHaveLength(3);
        } finally {
            await session.close();
        }
    });

    test("should recreate given test in issue and return correct results", async () => {
        const session = driver.session();

        const type = `${generate({
            charset: "alphabetic",
            readable: true,
        })}Event`;

        const pluralType = pluralize(camelcase(type));

        const typeDefs = `
            type ${type} {
                id: ID!
                name: String
                start: DateTime
                end: DateTime
                activity: String
            }
        `;

        const neoSchema = new Neo4jGraphQL({
            typeDefs,
        });

        const rangeStart = new Date().toISOString();
        const rangeEnd = new Date().toISOString();

        const query = `
            query ($rangeStart: DateTime, $rangeEnd: DateTime, $activity: String) {
                ${pluralType}(where: { OR: [{ start_GTE: $rangeStart }, { start_LTE: $rangeEnd }, { activity: $activity }] }) {
                    id
                }
            }
        `;

        try {
            await session.run(
                `
                    CREATE (:${type} {id: randomUUID(), name: randomUUID(), start: datetime($rangeStart), end: datetime($rangeEnd)})
                    CREATE (:${type} {id: randomUUID(), name: randomUUID(), start: datetime($rangeStart), end: datetime($rangeEnd)})
                    CREATE (:${type} {id: randomUUID(), name: randomUUID(), start: datetime(), end: datetime()})
                `,
                { rangeStart, rangeEnd }
            );

            const gqlResult = await graphql({
                schema: neoSchema.schema,
                source: query,
                contextValue: { driver, driverConfig: { bookmarks: [session.lastBookmark()] } },
                variableValues: { rangeStart, rangeEnd },
            });

            expect(gqlResult.errors).toBeUndefined();
            expect((gqlResult.data as any)[pluralType]).toHaveLength(3);
        } finally {
            await session.close();
        }
    });
});
