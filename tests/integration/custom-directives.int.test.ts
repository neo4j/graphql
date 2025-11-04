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

import { MapperKind, getDirective, mapSchema } from "@graphql-tools/utils";
import type { GraphQLSchema } from "graphql";
import { defaultFieldResolver, graphql } from "graphql";
import { gql } from "graphql-tag";
import { generate } from "randomstring";
import type { UniqueType } from "../utils/graphql-types";
import { TestHelper } from "../utils/tests-helper";

describe("Custom Directives", () => {
    const testHelper = new TestHelper();
    let Movie: UniqueType;

    beforeAll(() => {
        Movie = testHelper.createUniqueType("Movie");
    });

    afterAll(async () => {
        await testHelper.close();
    });

    test("should define a custom schemaDirective and resolve it", async () => {
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

        const neoSchema = await testHelper.initNeo4jGraphQL({
            typeDefs: [
                upperDirectiveTypeDefs,
                gql`
                    directive @uppercase on FIELD_DEFINITION

                    type ${Movie} {
                        name: String @uppercase
                    }
                `,
            ],
        });

        const schema = upperDirectiveTransformer(await neoSchema.getSchema());

        const name = generate({
            charset: "alphabetic",
        }).toLowerCase();

        const create = `
            mutation {
                ${Movie.operations.create}(input:[{name: "${name}"}]) {
                    ${Movie.plural} {
                        name
                    }
                }
            }
        `;

        // Using graphql directly here as part of the test
        const gqlResult = await graphql({
            schema,
            source: create,
            contextValue: await testHelper.getContextValue(),
        });

        expect(gqlResult.errors).toBeFalsy();

        expect((gqlResult.data as any)[Movie.operations.create][Movie.plural][0]).toEqual({
            name: name.toUpperCase(),
        });
    });
});
