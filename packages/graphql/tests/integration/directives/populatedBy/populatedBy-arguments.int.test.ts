/*
 * Copyright (c) "Neo4j"
 * Neo4j Sweden AB [http://neo4j.com]
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
            expect.objectContaining({
                populatedByOperation: "CREATE",
            })
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
            expect.objectContaining({
                populatedByOperation: "UPDATE",
            })
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
            expect.objectContaining({
                populatedByOperation: "CREATE",
            })
        );
        expect(edgeMockCallback).toHaveBeenCalledWith(
            {},
            {},
            expect.objectContaining({
                populatedByOperation: "CREATE",
            })
        );
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
            expect.objectContaining({
                populatedByOperation: "UPDATE",
            })
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

        expect(nodeMockCallback).toHaveBeenCalledWith(
            {},
            {},
            expect.objectContaining({
                populatedByOperation: "CREATE",
            })
        );
        expect(edgeMockCallback).toHaveBeenCalledWith(
            {
                screenTime: new neo4j.Integer(10),
            },
            {},
            expect.objectContaining({
                populatedByOperation: "CREATE",
            })
        );
    });

    test("nested update -> create", async () => {
        const query = /* GraphQL */ `
            mutation {
                updatePeople(update: { actedIn: { create: [{ node: { title: "Matrix" } }] } }) {
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
            expect.objectContaining({
                populatedByOperation: "CREATE",
            })
        );
        expect(edgeMockCallback).toHaveBeenCalledWith(
            {},
            {},
            expect.objectContaining({
                populatedByOperation: "CREATE",
            })
        );
    });

    test("update relationships", async () => {
        const query = /* GraphQL */ `
            mutation {
                updatePeople(
                    update: {
                        actedIn: [{ update: { node: { title: { set: "Test" } }, edge: { screenTime: { set: 100 } } } }]
                    }
                ) {
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
                title: { set: "Test" },
            },
            {},
            expect.objectContaining({
                populatedByOperation: "UPDATE",
            })
        );
        expect(edgeMockCallback).toHaveBeenCalledWith(
            {
                screenTime: { set: new neo4j.Integer(100) },
            },
            {},
            expect.objectContaining({
                populatedByOperation: "UPDATE",
            })
        );
    });
});
