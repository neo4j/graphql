/*
 * Copyright (c) "Neo4j"
 * Neo4j Sweden AB [http://neo4j.com]
 */

import type { UniqueType } from "../../utils/graphql-types";
import { TestHelper } from "../../utils/tests-helper";

describe("https://github.com/neo4j/graphql/issues/7026", () => {
    let Actor: UniqueType;

    const testHelper = new TestHelper();

    beforeAll(async () => {
        Actor = testHelper.createUniqueType("Actor");

        const typeDefs = /* GraphQL */ `
            type ${Actor} @node {
                name: String!
            }
        `;

        await testHelper.initNeo4jGraphQL({
            typeDefs,
        });

        await testHelper.executeCypher(`
            CREATE(:${Actor} {name: "Keanu"})
            CREATE(:${Actor} {name: "Pepe"})
        `);
    });

    afterAll(async () => {
        await testHelper.close();
    });

    test("should return totalCount and aggregate, without edges", async () => {
        const query = /* GraphQL */ `
            query {
                ${Actor.operations.connection} {
                    totalCount
                    aggregate {
                        node {
                            name {
                                shortest
                            }
                        }
                        count {
                            nodes
                        }
                    }
                }
            }
        `;

        const result = await testHelper.executeGraphQL(query);
        expect(result.errors).toBeUndefined();
        expect(result.data as any).toEqual({
            [Actor.operations.connection]: {
                totalCount: 2,
                aggregate: {
                    node: {
                        name: {
                            shortest: "Pepe",
                        },
                    },
                    count: {
                        nodes: 2,
                    },
                },
            },
        });
    });
});
