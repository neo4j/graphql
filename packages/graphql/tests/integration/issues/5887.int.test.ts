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

import type { UniqueType } from "../../utils/graphql-types";
import { TestHelper } from "../../utils/tests-helper";

describe("https://github.com/neo4j/graphql/issues/5887", () => {
    let Base: UniqueType;
    let A: UniqueType;
    let B: UniqueType;
    let Test: UniqueType;

    const testHelper = new TestHelper();

    beforeEach(async () => {
        Base = testHelper.createUniqueType("Base");
        A = testHelper.createUniqueType("A");
        B = testHelper.createUniqueType("B");
        Test = testHelper.createUniqueType("Test");

        const typeDefs = /* GraphQL */ `
            interface ${Base} {
                id: ID!
            }

            type ${A} implements ${Base} {
                id: ID!
            }

            type ${B} implements ${Base} {
                id: ID!
            }

            type ${Test} {
                base: ${Base}! @relationship(type: "HAS", direction: OUT)
            }
        `;

        await testHelper.initNeo4jGraphQL({
            typeDefs,
        });

        await testHelper.executeCypher(`
            CREATE (:${Test})-[:HAS]->(:${A} {id: "1"})
            CREATE (:${Test})-[:HAS]->(:${B} {id: "2"})
        `);
    });

    afterEach(async () => {
        await testHelper.close();
    });

    test("should return relationship when first interface matches", async () => {
        const query = /* GraphQL */ `
            query {
                ${Test.plural}(where: { base: { id: "1" } }) {
                    base {
                        id
                    }
                }
            }
        `;

        const result = await testHelper.executeGraphQL(query);
        expect(result.errors).toBeUndefined();
        expect(result.data).toEqual({
            [Test.plural]: [
                {
                    base: {
                        id: "1",
                    },
                },
            ],
        });
    });

    test("should return relationship when second interface matches", async () => {
        const query = /* GraphQL */ `
            query {
                ${Test.plural}(where: { base: { id: "2" } }) {
                    base {
                        id
                    }
                }
            }
        `;

        const result = await testHelper.executeGraphQL(query);
        expect(result.errors).toBeUndefined();
        expect(result.data).toEqual({
            [Test.plural]: [
                {
                    base: {
                        id: "2",
                    },
                },
            ],
        });
    });

    test("should not return relationship when no interface match", async () => {
        const query = /* GraphQL */ `
            query {
                ${Test.plural}(where: { base: { id: "x" } }) {
                    base {
                        id
                    }
                }
            }
        `;

        const result = await testHelper.executeGraphQL(query);
        expect(result.errors).toBeUndefined();
        expect(result.data).toEqual({
            [Test.plural]: [],
        });
    });
});

describe("https://github.com/neo4j/graphql/issues/5887 list relationship", () => {
    let House: UniqueType;
    let Animal: UniqueType;
    let Cat: UniqueType;
    let Dog: UniqueType;

    const testHelper = new TestHelper();

    beforeEach(async () => {
        House = testHelper.createUniqueType("House");
        Animal = testHelper.createUniqueType("Animal");
        Cat = testHelper.createUniqueType("Cat");
        Dog = testHelper.createUniqueType("Dog");

        const typeDefs = /* GraphQL */ `
            type ${House} {
                address: String!
                animals: [${Animal}!]! @relationship(type: "LIVES_IN", direction: IN)
            }

            interface ${Animal} {
                name: String!
            }

            type ${Dog} implements ${Animal} {
                name: String!
            }

            type ${Cat} implements ${Animal} {
                name: String!
            }
        `;
        await testHelper.initNeo4jGraphQL({
            typeDefs,
        });
    });

    afterEach(async () => {
        await testHelper.close();
    });

    test("should return relationship when first interface match", async () => {
        await testHelper.executeCypher(`
            CREATE (:${Dog} {name: "Roxy"})-[:LIVES_IN]->(h:${House} {address: "Toulouse"})
            CREATE (:${Cat} {name: "Nala"})-[:LIVES_IN]->(h)
        `);

        const query = /* GraphQL */ `
            query {
                ${House.plural}(where: { animals: { name: "Roxy" } }) {
                    address
                }
            }
        `;

        const result = await testHelper.executeGraphQL(query);
        expect(result.errors).toBeUndefined();
        expect(result.data).toEqual({
            [House.plural]: [{ address: "Toulouse" }],
        });
    });

    test("should return relationship when second interface match", async () => {
        await testHelper.executeCypher(`
            CREATE (:${Dog} {name: "Roxy"})-[:LIVES_IN]->(h:${House} {address: "Toulouse"})
            CREATE (:${Cat} {name: "Nala"})-[:LIVES_IN]->(h)
        `);

        const query = /* GraphQL */ `
            query {
                ${House.plural}(where: { animals: { name: "Nala" } }) {
                    address
                }
            }
        `;

        const result = await testHelper.executeGraphQL(query);
        expect(result.errors).toBeUndefined();
        expect(result.data).toEqual({
            [House.plural]: [{ address: "Toulouse" }],
        });
    });

    test("should not return relationship when no interface match", async () => {
        await testHelper.executeCypher(`
            CREATE (:${Dog} {name: "Roxy"})-[:LIVES_IN]->(h:${House} {address: "Toulouse"})
            CREATE (:${Cat} {name: "Nala"})-[:LIVES_IN]->(h)
        `);

        const query = /* GraphQL */ `
            query {
                ${House.plural}(where: { animals: { name: "Other" } }) {
                    address
                }
            }
        `;

        const result = await testHelper.executeGraphQL(query);
        expect(result.errors).toBeUndefined();
        expect(result.data).toEqual({
            [House.plural]: [],
        });
    });
});
