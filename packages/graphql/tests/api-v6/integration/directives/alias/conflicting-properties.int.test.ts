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

import { GraphQLError } from "graphql";
import type { UniqueType } from "../../../../utils/graphql-types";
import { TestHelper } from "../../../../utils/tests-helper";

describe("conflicting properties", () => {
    const testHelper = new TestHelper({ v6Api: true });

    let typeMovie: UniqueType;
    let typeDirector: UniqueType;

    beforeEach(async () => {
        typeMovie = testHelper.createUniqueType("Movie");
        typeDirector = testHelper.createUniqueType("Director");

        const typeDefs = /* GraphQL */ `
            type ${typeDirector} @node {
                name: String
                nameAgain: String @alias(property: "name")
                movies: [${typeMovie}!]! @relationship(direction: OUT, type: "DIRECTED", properties: "Directed")
            }

            type Directed @relationshipProperties {
                year: Int!
                movieYear: Int @alias(property: "year")
            }

            type ${typeMovie} @node {
                title: String
                titleAgain: String @alias(property: "title")
                directors: [${typeDirector}!]! @relationship(direction: IN, type: "DIRECTED", properties: "Directed")
            }
        `;

        await testHelper.initNeo4jGraphQL({
            typeDefs,
        });
    });

    afterEach(async () => {
        await testHelper.close();
    });

    test("Create mutation with alias referring to existing field, include both fields as inputs", async () => {
        const userMutation = /* GraphQL */ `
            mutation {
                ${typeDirector.operations.create}(input: [{ node: { name: "Tim Burton", nameAgain: "Timmy Burton" }}]) {
                    ${typeDirector.plural} {
                        name
                        nameAgain
                    }
                }
            }
        `;

        const gqlResult = await testHelper.executeGraphQL(userMutation);

        expect(gqlResult.errors).toBeDefined();
        expect(gqlResult.errors).toHaveLength(1);
        expect(gqlResult.errors).toEqual([
            new GraphQLError(`Conflicting modification of [[name]], [[nameAgain]] on type ${typeDirector.name}`),
        ]);
        expect(gqlResult?.data).toEqual({
            [typeDirector.operations.create]: null,
        });
    });

    test("Create mutation with alias referring to existing field, include only field as inputs", async () => {
        const userMutation = /* GraphQL */ `
            mutation {
                ${typeDirector.operations.create}(input: [{ node: {name: "Tim Burton"} }]) {
                    ${typeDirector.plural} {
                        name
                        nameAgain
                    }
                }
            }
        `;

        const gqlResult = await testHelper.executeGraphQL(userMutation);

        expect(gqlResult.errors).toBeUndefined();
        expect(gqlResult?.data).toEqual({
            [typeDirector.operations.create]: {
                [typeDirector.plural]: [
                    {
                        name: "Tim Burton",
                        nameAgain: "Tim Burton",
                    },
                ],
            },
        });
    });

    test("Create mutation with alias referring to existing field, include only alias field as inputs", async () => {
        const userMutation = /* GraphQL */ `
            mutation {
                ${typeDirector.operations.create}(input: [{ node: { nameAgain: "Tim Burton" } }]) {
                    ${typeDirector.plural} {
                        name
                        nameAgain
                    }
                }
            }
        `;

        const gqlResult = await testHelper.executeGraphQL(userMutation);

        expect(gqlResult.errors).toBeUndefined();
        expect(gqlResult?.data).toEqual({
            [typeDirector.operations.create]: {
                [typeDirector.plural]: [
                    {
                        name: "Tim Burton",
                        nameAgain: "Tim Burton",
                    },
                ],
            },
        });
    });

    test("Create mutation with alias referring to existing field, include both bad and good inputs", async () => {
        const userMutation = /* GraphQL */ `
            mutation {
                ${typeDirector.operations.create}(input: [{ node: {name: "Tim Burton", nameAgain: "Timmy Burton"} }, { node: { name: "Someone" }}]) {
                    ${typeDirector.plural} {
                        name
                        nameAgain
                    }
                }
            }
        `;

        const gqlResult = await testHelper.executeGraphQL(userMutation);

        expect(gqlResult.errors).toBeDefined();
        expect(gqlResult.errors).toHaveLength(1);
        expect(gqlResult.errors).toEqual([
            new GraphQLError(`Conflicting modification of [[name]], [[nameAgain]] on type ${typeDirector.name}`),
        ]);
        expect(gqlResult?.data).toEqual({
            [typeDirector.operations.create]: null,
        });
    });
});
