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
import { Neo4jGraphQL } from "../../src/classes";
import neo4j from "./neo4j";

describe("Default values", () => {
    let driver: Driver;

    beforeAll(async () => {
        driver = await neo4j();
        process.env.NEO4j_GRAPHQL_JWT_SECRET = "secret";
    });

    afterAll(async () => {
        await driver.close();
        delete process.env.NEO4j_GRAPHQL_JWT_SECRET;
    });

    test("should allow default value on custom @cypher node field", async () => {
        const session = driver.session();

        const typeDefs = `
            type Movie {
              id: ID
              field(skip: Int = 100): Int
                @cypher(
                    statement: """
                    return $skip
                    """
                )
            }
        `;

        const neoSchema = new Neo4jGraphQL({
            typeDefs,
        });

        const id = generate({
            charset: "alphabetic",
        });

        const create = `
            {
                movies(where: {id: "${id}"}){
                    id
                    field
                }
            }
        `;

        try {
            await session.run(`
                CREATE (:Movie {id: "${id}"})
            `);

            const gqlResult = await graphql({
                schema: neoSchema.schema,
                source: create,
                contextValue: { driver },
            });

            expect(gqlResult.errors).toBeFalsy();

            expect((gqlResult.data as any).movies[0]).toEqual({
                id,
                field: 100,
            });
        } finally {
            await session.close();
        }
    });

    test("should allow default value on custom @cypher custom resolver field", async () => {
        const session = driver.session();

        const typeDefs = `
            type Movie {
                id: ID
            }

            type Query {
                field(skip: Int = 100): Int
                @cypher(
                    statement: """
                    return $skip
                    """
                )
            }
        `;

        const neoSchema = new Neo4jGraphQL({
            typeDefs,
        });

        const create = `
            {
                field
            }
        `;

        try {
            const gqlResult = await graphql({
                schema: neoSchema.schema,
                source: create,
                contextValue: { driver },
            });

            expect(gqlResult.errors).toBeFalsy();

            expect((gqlResult.data as any).field).toEqual(100);
        } finally {
            await session.close();
        }
    });

    test("using @default directive on non-primitive field should throw an error", () => {
        const typeDefs = `
            type User {
                name: String!
                location: Point! @default(value: "default")
            }
        `;

        expect(
            () =>
                new Neo4jGraphQL({
                    typeDefs,
                })
        ).toThrow("@default directive can only be used on primitive type fields");
    });

    test("using @default with an argument with a type which doesn't match the field should throw an error", () => {
        const typeDefs = `
            type User {
                name: String! @default(value: 2)
            }
        `;

        expect(
            () =>
                new Neo4jGraphQL({
                    typeDefs,
                })
        ).toThrow("Default value for User.name does not have matching type String");
    });

    test("using @default on a DateTime with an invalid value should throw an error", () => {
        const typeDefs = `
            type User {
                verifiedAt: DateTime! @default(value: "Not a date")
            }
        `;

        expect(
            () =>
                new Neo4jGraphQL({
                    typeDefs,
                })
        ).toThrow("Default value for User.verifiedAt is not a valid DateTime");
    });

    test("using @coalesce directive on non-primitive field should throw an error", () => {
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

    test("using @coalesce directive on DateTime field should throw an error", () => {
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

    test("using @coalesce with an argument with a type which doesn't match the field should throw an error", () => {
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

    test("using @coalesce allows querying with null properties without affecting the returned result", async () => {
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
                contextValue: { driver },
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
