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

import type { UniqueType } from "../../../utils/graphql-types";
import { TestHelper } from "../../../utils/tests-helper";

describe("Cypher directive modelling a single relationship", () => {
    let A: UniqueType;
    let B: UniqueType;
    let C: UniqueType;

    const testHelper = new TestHelper();

    beforeAll(async () => {
        A = testHelper.createUniqueType("A");
        B = testHelper.createUniqueType("B");
        C = testHelper.createUniqueType("C");

        const typeDefs = /* GraphQL */ `
            type ${A} @node {
                hasB: ${B} @cypher(statement: "MATCH (this)-[:HAS]->(b:${B}) RETURN b", columnName: "b")
                name: String!
            }

            type ${B} @node {
                hasC: ${C} @cypher(statement: "MATCH (this)-[:HAS]->(c:${C}) RETURN c", columnName: "c")
                name: String!
            }

            type ${C} @node {
                name: String!
                someField: String @cypher(statement: "RETURN this.name AS x", columnName: "x") 
                hasB: ${B} @cypher(statement: "MATCH (this)<-[:HAS]-(b:${B}) RETURN b", columnName: "b")
            }
        `;

        await testHelper.initNeo4jGraphQL({
            typeDefs,
        });

        await testHelper.executeCypher(`
            CREATE(:${A} {name: "A1"})-[:HAS]->(:${B} {name: "B1"})-[:HAS]->(:${C} {name: "C1"})
            CREATE(:${A} {name: "A2"})-[:HAS]->(:${B} {name: "B2"})-[:HAS]->(:${C} {name: "test"})
        `);
    });

    afterAll(async () => {
        await testHelper.close();
    });

    test("should combine filters correctly", async () => {
        const query = /* GraphQL */ `
            query {
                ${A.plural}(where: { hasB: { name: { eq: "B1" }, hasC: { name: { eq: "test" } } } }) {
                    name
                }
            }
        `;

        const result = await testHelper.executeGraphQL(query);
        expect(result.errors).toBeUndefined();
        expect(result.data as any).toEqual({
            [A.plural]: [],
        });
    });

    test("should apply cypher filters correctly", async () => {
        const query = /* GraphQL */ `
            query {
                ${A.plural}(where: { hasB: { hasC: { name: { eq: "test" }, someField: { eq: "test" } } } }) {
                    name
                }
            }
        `;

        const result = await testHelper.executeGraphQL(query);
        expect(result.errors).toBeUndefined();
        expect(result.data as any).toEqual({
            [A.plural]: [
                {
                    name: "A2",
                },
            ],
        });
    });

    test("should apply cypher filters correctly, different order", async () => {
        const query = /* GraphQL */ `
            query {
                ${C.plural}(where: { someField: { eq: "test" }, hasB: { hasC: { someField: { eq: "test" } } } }) {
                    name
                }
            }
        `;

        const result = await testHelper.executeGraphQL(query);
        expect(result.errors).toBeUndefined();
        expect(result.data as any).toEqual({
            [C.plural]: [
                {
                    name: "test",
                },
            ],
        });
    });

    test("should return correct results with expanded selection set", async () => {
        const query = /* GraphQL */ `
            query {
                ${C.plural}(where: { someField: { eq: "test" }, hasB: { hasC: { someField: { eq: "test" } } } }) {
                    someField
                    hasB {
                        name
                        hasC {
                            someField
                            name
                        }
                    }
                }
            }
        `;

        const result = await testHelper.executeGraphQL(query);
        expect(result.errors).toBeUndefined();
        expect(result.data as any).toEqual({
            [C.plural]: [
                {
                    someField: "test",
                    hasB: {
                        name: "B2",
                        hasC: {
                            someField: "test",
                            name: "test",
                        },
                    },
                },
            ],
        });
    });
});
