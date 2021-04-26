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
import { gql } from "apollo-server";
import { graphql, defaultFieldResolver } from "graphql";
import { SchemaDirectiveVisitor } from "@graphql-tools/utils";
import { generate } from "randomstring";
import { Neo4jGraphQL } from "../../src/classes";
import neo4j from "./neo4j";

describe("Custom Directives", () => {
    let driver: Driver;

    beforeAll(async () => {
        driver = await neo4j();
    });

    afterAll(async () => {
        await driver.close();
    });

    test("should define a custom schemaDirective and resolve it", async () => {
        const session = driver.session();

        class UpperCaseDirective extends SchemaDirectiveVisitor {
            // eslint-disable-next-line class-methods-use-this
            visitFieldDefinition(field) {
                const { resolve = defaultFieldResolver } = field;
                // eslint-disable-next-line no-param-reassign
                field.resolve = async function r(...args) {
                    const result = await resolve.apply(this, args);
                    if (typeof result === "string") {
                        return result.toUpperCase();
                    }
                    return result;
                };
            }
        }

        const neoSchema = new Neo4jGraphQL({
            typeDefs: gql`
                directive @uppercase on FIELD_DEFINITION

                type Movie {
                    name: String @uppercase
                }
            `,
            schemaDirectives: { uppercase: UpperCaseDirective },
            driver,
        });

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
                schema: neoSchema.schema,
                source: create,
                contextValue: { driver },
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
