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

describe("https://github.com/neo4j/graphql/issues/4831", () => {
    const testHelper = new TestHelper();
    let Test: UniqueType;

    beforeAll(async () => {
        Test = new UniqueType("Test");
        const typeDefs = /* GraphQL */ `
            type ${Test} {
                testBoolean(value: Boolean): Boolean @cypher(statement: "RETURN $value as value", columnName: "value")
                testString(value: String): String @cypher(statement: "RETURN $value as value", columnName: "value")
            }
        `;

        const neo4jGraphQL = await testHelper.initNeo4jGraphQL({
            typeDefs,
            features: {},
        });
        await neo4jGraphQL.getSchema();
        await testHelper.executeCypher(`CREATE (:${Test.name})`);
    });

    afterAll(async () => {
        await testHelper.close();
    });

    describe("Boolean", () => {
        test("the parameter should be false when the cypher argument is false", async () => {
            const query = /* GraphQL */ `
                query ExampleQuery {
                    ${Test.plural} {
                        testBoolean(value: false)
                    }
                }
            `;

            const queryResults = await testHelper.executeGraphQL(query);
            expect(queryResults.errors).toBeUndefined();
            expect(queryResults.data).toEqual({
                [Test.plural]: [{ testBoolean: false }],
            });
        });

        test("the parameter should be true when the cypher argument is true", async () => {
            const query = /* GraphQL */ `
                query ExampleQuery {
                    ${Test.plural} {
                        testBoolean(value: true)
                    }
                }
            `;

            const queryResults = await testHelper.executeGraphQL(query);
            expect(queryResults.errors).toBeUndefined();
            expect(queryResults.data).toEqual({
                [Test.plural]: [{ testBoolean: true }],
            });
        });

        test("the parameter should be NULL when the cypher argument is not passed", async () => {
            const query = /* GraphQL */ `
                query ExampleQuery {
                    ${Test.plural} {
                        testBoolean
                    }
                }
            `;

            const queryResults = await testHelper.executeGraphQL(query);
            expect(queryResults.errors).toBeUndefined();
            expect(queryResults.data).toEqual({
                [Test.plural]: [{ testBoolean: null }],
            });
        });

        test("the parameter should be NULL when the cypher argument passed is NULL", async () => {
            const query = /* GraphQL */ `
                query ExampleQuery {
                    ${Test.plural} {
                        testBoolean(value: null)
                    }
                }
            `;

            const queryResults = await testHelper.executeGraphQL(query);
            expect(queryResults.errors).toBeUndefined();
            expect(queryResults.data).toEqual({
                [Test.plural]: [{ testBoolean: null }],
            });
        });
    });

    describe("String", () => {
        test("the parameter should be an empty string when the cypher argument is an empty string", async () => {
            const query = /* GraphQL */ `
                query ExampleQuery {
                    ${Test.plural} {
                        testString(value: "")
                    }
                }
            `;

            const queryResults = await testHelper.executeGraphQL(query);
            expect(queryResults.errors).toBeUndefined();
            expect(queryResults.data).toEqual({
                [Test.plural]: [{ testString: "" }],
            });
        });

        test("the parameter should be 'some-string' when the cypher argument is 'some-string'", async () => {
            const query = /* GraphQL */ `
                query ExampleQuery {
                    ${Test.plural} {
                        testString(value: "some-string")
                    }
                }
            `;
            const queryResults = await testHelper.executeGraphQL(query);
            expect(queryResults.errors).toBeUndefined();
            expect(queryResults.data).toEqual({
                [Test.plural]: [{ testString: "some-string" }],
            });
        });

        test("the parameter should be NULL when the cypher argument is not passed", async () => {
            const query = /* GraphQL */ `
                query ExampleQuery {
                    ${Test.plural} {
                        testString
                    }
                }
            `;
            const queryResults = await testHelper.executeGraphQL(query);
            expect(queryResults.errors).toBeUndefined();
            expect(queryResults.data).toEqual({
                [Test.plural]: [{ testString: null }],
            });
        });

        test("the parameter should be NULL when the cypher argument passed is NULL", async () => {
            const query = /* GraphQL */ `
                query ExampleQuery {
                    ${Test.plural} {
                        testString(value: null)
                    }
                }
            `;
            const queryResults = await testHelper.executeGraphQL(query);
            expect(queryResults.errors).toBeUndefined();
            expect(queryResults.data).toEqual({
                [Test.plural]: [{ testString: null }],
            });
        });
    });
});
