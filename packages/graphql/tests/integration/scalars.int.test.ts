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
import { graphql, GraphQLScalarType } from "graphql";
import { Kind } from "graphql/language";
import { generate } from "randomstring";
import Neo4j from "./neo4j";
import { Neo4jGraphQL } from "../../src/classes";
import { UniqueType } from "../utils/graphql-types";

const GraphQLUpperCaseString = new GraphQLScalarType({
    name: "UpperCaseString",
    description: "The `UpperCaseString` scalar type returns all strings in lower case",
    serialize: (value) => {
        if (typeof value === "string") {
            return value.toUpperCase();
        }

        throw new Error("Unknown type");
    },
    parseValue: (value) => {
        if (typeof value === "string") {
            return value.toUpperCase();
        }

        throw new Error("Unknown type");
    },
    parseLiteral: (ast) => {
        if (ast.kind === Kind.STRING) {
            return ast.value.toUpperCase();
        }

        return undefined;
    },
});

describe("scalars", () => {
    let driver: Driver;
    let neo4j: Neo4j;

    beforeAll(async () => {
        neo4j = new Neo4j();
        driver = await neo4j.getDriver();
    });

    afterAll(async () => {
        await driver.close();
    });

    test("should create a movie (with a custom scalar)", async () => {
        const session = await neo4j.getSession();

        const typeDefs = `
            scalar UpperCaseString

            type Movie {
              id: ID
              name: UpperCaseString
            }
        `;

        const neoSchema = new Neo4jGraphQL({
            typeDefs,
            resolvers: { UpperCaseString: GraphQLUpperCaseString },
        });

        const id = generate({
            charset: "alphabetic",
        });

        const initialName = "dan";
        const expectedName = "DAN";

        const create = `
            mutation {
                createMovies(input:[{id: "${id}", name: "${initialName}"}]) {
                    movies {
                        id
                    }
                }
            }
        `;

        try {
            const gqlResult = await graphql({
                schema: await neoSchema.getSchema(),
                source: create,
                contextValue: neo4j.getContextValuesWithBookmarks(session.lastBookmark()),
            });

            expect(gqlResult.errors).toBeFalsy();

            const result = await session.run(`
                MATCH (m:Movie {id: "${id}"})
                RETURN m {.id, .name} as m
            `);

            expect((result.records[0]?.toObject() as any).m).toEqual({ id, name: expectedName });
        } finally {
            await session.close();
        }
    });

    test("should serialize a id correctly", async () => {
        const session = await neo4j.getSession();

        const typeDefs = `
            type Movie {
              id: ID
            }
        `;

        const neoSchema = new Neo4jGraphQL({
            typeDefs,
        });

        const id = Math.floor(Math.random() * 1000);

        const query = `
            {
                movies(where: {id: ${id}}) {
                    id
                }
            }
        `;

        try {
            await session.run(`
                CREATE (m:Movie {id: "${id}"})
                RETURN m {.id} as m
            `);

            const gqlResult = await graphql({
                schema: await neoSchema.getSchema(),
                source: query,
                contextValue: neo4j.getContextValuesWithBookmarks(session.lastBookmark()),
            });

            expect(gqlResult.errors).toBeFalsy();

            expect((gqlResult.data as any).movies[0]).toEqual({ id: id.toString() });
        } finally {
            await session.close();
        }
    });

    test("should serialize a list of integers correctly", async () => {
        const type = new UniqueType("Type");

        const typeDefs = `
            type ${type.name} {
              integers: [Int!]!
            }
        `;

        const neoSchema = new Neo4jGraphQL({
            typeDefs,
        });

        const integers = [1, 2, 3, 4, 5];

        const mutation = `
          mutation($input: [${type.name}CreateInput!]!) {
            ${type.operations.create}(input: $input) {
              ${type.plural} {
                integers
              }
            }
          }
        `;

        const gqlResult = await graphql({
            schema: await neoSchema.getSchema(),
            source: mutation,
            contextValue: neo4j.getContextValues(),
            variableValues: {
                input: [{ integers }],
            },
        });

        expect(gqlResult.errors).toBeFalsy();

        expect((gqlResult.data as any)[type.operations.create][type.plural][0]).toEqual({ integers });
    });

    test("should serialize a list of floats correctly", async () => {
        const type = new UniqueType("Type");

        const typeDefs = `
            type ${type.name} {
              floats: [Float!]!
            }
        `;

        const neoSchema = new Neo4jGraphQL({
            typeDefs,
        });

        const floats = [1.1, 2.2, 3.3, 4.4, 5.5];

        const mutation = `
          mutation($input: [${type.name}CreateInput!]!) {
            ${type.operations.create}(input: $input) {
              ${type.plural} {
                floats
              }
            }
          }
        `;

        const gqlResult = await graphql({
            schema: await neoSchema.getSchema(),
            source: mutation,
            contextValue: neo4j.getContextValues(),
            variableValues: {
                input: [{ floats }],
            },
        });

        expect(gqlResult.errors).toBeFalsy();

        expect((gqlResult.data as any)[type.operations.create][type.plural][0]).toEqual({ floats });
    });
});
