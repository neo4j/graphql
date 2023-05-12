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
import { gql } from "graphql-tag";
import type { GraphQLSchema } from "graphql";
import { graphql, defaultFieldResolver } from "graphql";
import { getDirective, MapperKind, mapSchema } from "@graphql-tools/utils";
import { generate } from "randomstring";
import { Neo4jGraphQL } from "../../src/classes";
import Neo4j from "./neo4j";

describe("Custom Directives", () => {
    let driver: Driver;
    let neo4j: Neo4j;

    beforeAll(async () => {
        neo4j = new Neo4j();
        driver = await neo4j.getDriver();
    });

    afterAll(async () => {
        await driver.close();
    });

    test("should define a custom schemaDirective and resolve it", async () => {
        const session = await neo4j.getSession();

        function upperDirective(directiveName: string) {
            return {
                upperDirectiveTypeDefs: `directive @${directiveName} on FIELD_DEFINITION`,
                upperDirectiveTransformer: (schema: GraphQLSchema) =>
                    mapSchema(schema, {
                        [MapperKind.OBJECT_FIELD]: (fieldConfig) => {
                            const fieldDirective = getDirective(schema, fieldConfig, directiveName)?.[0];
                            if (fieldDirective) {
                                const { resolve = defaultFieldResolver } = fieldConfig;

                                fieldConfig.resolve = async (source, args, context, info) => {
                                    const result = await resolve(source, args, context, info);
                                    if (typeof result === "string") {
                                        return result.toUpperCase();
                                    }
                                    return result;
                                };
                            }
                            return fieldConfig;
                        },
                    }),
            };
        }

        const { upperDirectiveTypeDefs, upperDirectiveTransformer } = upperDirective("uppercase");

        const neoSchema = new Neo4jGraphQL({
            typeDefs: [
                upperDirectiveTypeDefs,
                gql`
                    directive @uppercase on FIELD_DEFINITION

                    type Movie {
                        name: String @uppercase
                    }
                `,
            ],
            driver,
        });

        const schema = upperDirectiveTransformer(await neoSchema.getSchema());

        const name = generate({
            charset: "alphabetic",
        }).toLowerCase();

        const create = `
            mutation {
                createMovies(input:[{name: "${name}"}]) {
                    movies {
                        name
                    }
                }
            }
        `;

        try {
            const gqlResult = await graphql({
                schema,
                source: create,
                contextValue: neo4j.getContextValuesWithBookmarks(session.lastBookmark()),
            });

            expect(gqlResult.errors).toBeFalsy();

            expect((gqlResult.data as any).createMovies.movies[0]).toEqual({
                name: name.toUpperCase(),
            });
        } finally {
            await session.close();
        }
    });
});
