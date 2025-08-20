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

import * as neo4j from "neo4j-driver";
import type { UniqueType } from "../../../utils/graphql-types";
import { TestHelper } from "../../../utils/tests-helper";

describe("populatedBy arguments", () => {
    const testHelper = new TestHelper();
    let typeDefs: string;

    const nodeMockCallback = jest.fn((_root) => "slug");
    const edgeMockCallback = jest.fn((_root) => "actedInSlug");

    let SVG: UniqueType;
    let VectorGraphic: UniqueType;

    beforeEach(async () => {
        SVG = testHelper.createUniqueType("SVG");
        VectorGraphic = testHelper.createUniqueType("VectorGraphic");

        typeDefs = /* GraphQL */ `
            type Movie @node {
                title: String
                actors: [Person!]! @relationship(type: "ACTED_IN", direction: IN, properties: "ActedIn")
                slug: String! @populatedBy(callback: "slug", operations: [CREATE, UPDATE])
            }

            type Person @node {
                name: String!
                actedIn: [Movie!]! @relationship(type: "ACTED_IN", direction: OUT, properties: "ActedIn")
            }

            type ActedIn @relationshipProperties {
                screenTime: Int
                actedInSlug: String! @populatedBy(callback: "actedInSlug", operations: [CREATE, UPDATE])
            }
        `;

        await testHelper.executeCypher(`
            CREATE(:${SVG}:${VectorGraphic} { name: "test" })
            CREATE(:${SVG}:${VectorGraphic} { name: "Another" })
        `);

        await testHelper.initNeo4jGraphQL({
            typeDefs,
            features: {
                populatedBy: {
                    callbacks: {
                        slug: nodeMockCallback,
                        actedInSlug: edgeMockCallback,
                    },
                },
            },
        });
    });

    afterEach(async () => {
        await testHelper.close();
        nodeMockCallback.mockClear();
        edgeMockCallback.mockClear();
    });

    test("top level create", async () => {
        const query = /* GraphQL */ `
            mutation {
                createMovies(input: [{ title: "The Matrix" }]) {
                    movies {
                        title
                    }
                }
            }
        `;

        const queryResult = await testHelper.executeGraphQL(query);
        expect(queryResult.errors).toBeUndefined();

        expect(nodeMockCallback).toHaveBeenCalledWith(
            {
                title: "The Matrix",
            },
            {},
            expect.toBeObject()
        );
        expect(edgeMockCallback).not.toHaveBeenCalled();
    });

    test("top level update", async () => {
        const query = /* GraphQL */ `
            mutation {
                updateMovies(update: { title_SET: "The Matrix" }) {
                    movies {
                        title
                    }
                }
            }
        `;

        const queryResult = await testHelper.executeGraphQL(query);
        expect(queryResult.errors).toBeUndefined();

        expect(nodeMockCallback).toHaveBeenCalledWith(
            {
                title_SET: "The Matrix",
            },
            {},
            expect.toBeObject()
        );
        expect(edgeMockCallback).not.toHaveBeenCalled();
    });

    test("nested create", async () => {
        const query = /* GraphQL */ `
            mutation {
                createPeople(input: [{ name: "Keanu", actedIn: { create: [{ node: { title: "Matrix" } }] } }]) {
                    people {
                        name
                    }
                }
            }
        `;

        const queryResult = await testHelper.executeGraphQL(query);
        expect(queryResult.errors).toBeUndefined();

        expect(nodeMockCallback).toHaveBeenCalledWith(
            {
                title: "Matrix",
            },
            {},
            expect.toBeObject()
        );
        expect(edgeMockCallback).toHaveBeenCalledWith({}, {}, expect.toBeObject());
    });

    test("nested update", async () => {
        const query = /* GraphQL */ `
            mutation {
                updatePeople(update: { actedIn: [{ update: { node: { title_SET: "Test" } } }] }) {
                    people {
                        name
                    }
                }
            }
        `;

        const queryResult = await testHelper.executeGraphQL(query);
        expect(queryResult.errors).toBeUndefined();

        expect(nodeMockCallback).toHaveBeenCalledWith(
            {
                title_SET: "Test",
            },
            {},
            expect.toBeObject()
        );
        expect(edgeMockCallback).not.toHaveBeenCalled();
    });

    test("nested create with only relationship fields", async () => {
        const query = /* GraphQL */ `
            mutation {
                createPeople(
                    input: [{ name: "Keanu", actedIn: { create: [{ edge: { screenTime: 10 }, node: {} }] } }]
                ) {
                    people {
                        name
                    }
                }
            }
        `;

        const queryResult = await testHelper.executeGraphQL(query);
        expect(queryResult.errors).toBeUndefined();

        expect(nodeMockCallback).toHaveBeenCalledWith({}, {}, expect.toBeObject());
        expect(edgeMockCallback).toHaveBeenCalledWith(
            {
                screenTime: new neo4j.Integer(10),
            },
            {},
            expect.toBeObject()
        );
    });
});
