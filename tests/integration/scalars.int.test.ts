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

import { GraphQLScalarType } from "graphql";
import { Kind } from "graphql/language";
import { generate } from "randomstring";
import { TestHelper } from "../utils/tests-helper";

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
    const testHelper = new TestHelper();

    afterEach(async () => {
        await testHelper.close();
    });

    test("should create a movie (with a custom scalar)", async () => {
        const typeDefs = `
            scalar UpperCaseString

            type Movie {
              id: ID
              name: UpperCaseString
            }
        `;

        await testHelper.initNeo4jGraphQL({
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

        const gqlResult = await testHelper.executeGraphQL(create);

        expect(gqlResult.errors).toBeFalsy();

        const result = await testHelper.executeCypher(`
                MATCH (m:Movie {id: "${id}"})
                RETURN m {.id, .name} as m
            `);

        expect((result.records[0]?.toObject() as any).m).toEqual({ id, name: expectedName });
    });

    test("should serialize a id correctly", async () => {
        const typeDefs = `
            type Movie {
              id: ID
            }
        `;

        await testHelper.initNeo4jGraphQL({
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

        await testHelper.executeCypher(`
                CREATE (m:Movie {id: "${id}"})
                RETURN m {.id} as m
            `);

        const gqlResult = await testHelper.executeGraphQL(query);

        expect(gqlResult.errors).toBeFalsy();

        expect((gqlResult.data as any).movies[0]).toEqual({ id: id.toString() });
    });

    test("should serialize a list of integers correctly", async () => {
        const type = testHelper.createUniqueType("Type");

        const typeDefs = `
            type ${type.name} {
              integers: [Int!]!
            }
        `;

        await testHelper.initNeo4jGraphQL({
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

        const gqlResult = await testHelper.executeGraphQL(mutation, {
            variableValues: {
                input: [{ integers }],
            },
        });

        expect(gqlResult.errors).toBeFalsy();

        expect((gqlResult.data as any)[type.operations.create][type.plural][0]).toEqual({ integers });
    });

    test("should serialize a list of floats correctly", async () => {
        const type = testHelper.createUniqueType("Type");

        const typeDefs = `
            type ${type.name} {
              floats: [Float!]!
            }
        `;

        await testHelper.initNeo4jGraphQL({
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

        const gqlResult = await testHelper.executeGraphQL(mutation, {
            variableValues: {
                input: [{ floats }],
            },
        });

        expect(gqlResult.errors).toBeFalsy();

        expect((gqlResult.data as any)[type.operations.create][type.plural][0]).toEqual({ floats });
    });
});
