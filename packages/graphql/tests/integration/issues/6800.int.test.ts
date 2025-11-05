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

import { UniqueType } from "../../utils/graphql-types";
import { TestHelper } from "../../utils/tests-helper";

describe("https://github.com/neo4j/graphql/issues/6800", () => {
    const testHelper = new TestHelper();
    let typeDefs: string;

    let Person: UniqueType;

    beforeAll(async () => {
        Person = new UniqueType("Person");
        typeDefs = /* GraphQL */ `
            type ${Person} @node {
                name: String
                nickname: String!
                    @cypher(
                        statement: """
                        RETURN this.name AS result
                        """
                        columnName: "result"
                    )
            }
        `;

        await testHelper.initNeo4jGraphQL({
            typeDefs,
            features: {
                filters: {
                    String: {
                        CASE_INSENSITIVE: true,
                    },
                },
            },
        });

        await testHelper.executeCypher(`
            CREATE (:${Person} { name: "Toyota" })
            CREATE (:${Person} { name: "Marvin" })
        `);
    });

    afterAll(async () => {
        await testHelper.close();
    });

    test("should filter string field using case insensitive", async () => {
        const query = /* GraphQL */ `
            query {
                eq: ${Person.plural}(where: { name: { caseInsensitive: { eq: "toyota" } } }) {
                    name
                }
                contains: ${Person.plural}(where: { name: { caseInsensitive: { contains: "YO" } } }) {
                    name
                }
                startsWith: ${Person.plural}(where: { name: { caseInsensitive: { startsWith: "to" } } }) {
                    name
                }
                endsWith: ${Person.plural}(where: { name: { caseInsensitive: { endsWith: "tA" } } }) {
                    name
                }
                in: ${Person.plural}(where: { name: { caseInsensitive: { in: ["toyota"] } } }) {
                    name
                }
            }
        `;

        const queryResult = await testHelper.executeGraphQL(query);

        expect(queryResult.errors).toBeUndefined();
        expect(queryResult.data).toEqual({
            eq: [
                {
                    name: "Toyota",
                },
            ],
            contains: [
                {
                    name: "Toyota",
                },
            ],
            startsWith: [
                {
                    name: "Toyota",
                },
            ],
            endsWith: [
                {
                    name: "Toyota",
                },
            ],
            in: [
                {
                    name: "Toyota",
                },
            ],
        });
    });

    test("should filter cypher field using case insensitive", async () => {
        const query = /* GraphQL */ `
            query {
                eq: ${Person.plural}(where: { nickname: { caseInsensitive: { eq: "toyota" } } }) {
                    name
                }
                contains: ${Person.plural}(where: { nickname: { caseInsensitive: { contains: "YO" } } }) {
                    name
                }
                startsWith: ${Person.plural}(where: { nickname: { caseInsensitive: { startsWith: "to" } } }) {
                    name
                }
                endsWith: ${Person.plural}(where: { nickname: { caseInsensitive: { endsWith: "tA" } } }) {
                    name
                }
                in: ${Person.plural}(where: { nickname: { caseInsensitive: { in: ["toyota"] } } }) {
                    name
                }
            }
        `;

        const queryResult = await testHelper.executeGraphQL(query);

        expect(queryResult.errors).toBeUndefined();
        expect(queryResult.data).toEqual({
            eq: [
                {
                    name: "Toyota",
                },
            ],
            contains: [
                {
                    name: "Toyota",
                },
            ],
            startsWith: [
                {
                    name: "Toyota",
                },
            ],
            endsWith: [
                {
                    name: "Toyota",
                },
            ],
            in: [
                {
                    name: "Toyota",
                },
            ],
        });
    });
});
