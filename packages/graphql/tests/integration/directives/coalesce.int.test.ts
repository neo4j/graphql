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
import pluralize from "pluralize";
import camelCase from "camelcase";
import { Neo4jGraphQL } from "../../../src/classes";
import neo4j from "../neo4j";

describe("@coalesce directive", () => {
    let driver: Driver;

    beforeAll(async () => {
        driver = await neo4j();
    });

    afterAll(async () => {
        await driver.close();
    });

    test("on non-primitive field should throw an error", () => {
        const typeDefs = `
            type User {
                name: String!
                location: Point! @coalesce(value: "default")
            }
        `;

        expect(
            () =>
                new Neo4jGraphQL({
                    typeDefs,
                })
        ).toThrow("@coalesce directive can only be used on primitive type fields");
    });

    test("on DateTime field should throw an error", () => {
        const typeDefs = `
            type User {
                name: String!
                createdAt: DateTime! @coalesce(value: "1970-01-01T00:00:00.000Z")
            }
        `;

        expect(
            () =>
                new Neo4jGraphQL({
                    typeDefs,
                })
        ).toThrow("@coalesce is not supported by DateTime fields at this time");
    });

    test("with an argument with a type which doesn't match the field should throw an error", () => {
        const typeDefs = `
            type User {
                name: String! @coalesce(value: 2)
            }
        `;

        expect(
            () =>
                new Neo4jGraphQL({
                    typeDefs,
                })
        ).toThrow("coalesce() value for User.name does not have matching type String");
    });

    test("allows querying with null properties without affecting the returned result", async () => {
        const type = `${generate({
            charset: "alphabetic",
        })}Movie`;
        const pluralType = pluralize(camelCase(type));

        const typeDefs = `
            type ${type} {
                id: ID!
                classification: String @coalesce(value: "Unrated")
            }
        `;

        const neoSchema = new Neo4jGraphQL({
            typeDefs,
        });

        const query = `
            query {
                ${pluralType}(where: {classification: "Unrated"}){
                    id
                    classification
                }
            }
        `;

        const session = driver.session();

        const id = generate({
            charset: "alphabetic",
        });

        try {
            await session.run(`
                CREATE (:${type} {id: "${id}"})
            `);

            const gqlResult = await graphql({
                schema: neoSchema.schema,
                source: query,
                contextValue: { driver, driverConfig: { bookmarks: session.lastBookmark() } },
            });

            expect(gqlResult.errors).toBeFalsy();

            expect((gqlResult.data as any)[pluralType][0]).toEqual({
                id,
                classification: null,
            });
        } finally {
            await session.close();
        }
    });
});
