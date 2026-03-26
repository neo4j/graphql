/*
 * Copyright (c) "Neo4j"
 * Neo4j Sweden AB [http://neo4j.com]
 */

import type { UniqueType } from "../../utils/graphql-types";
import { TestHelper } from "../../utils/tests-helper";

describe("https://github.com/neo4j/graphql/issues/4477", () => {
    const testHelper = new TestHelper();

    let Brand: UniqueType;
    let Service: UniqueType;
    let Collection: UniqueType;

    beforeAll(async () => {
        Brand = testHelper.createUniqueType("Brand");
        Service = testHelper.createUniqueType("Service");
        Collection = testHelper.createUniqueType("Collection");

        const typeDefs = /* GraphQL */ `
            type ${Brand} @node {
                services: [${Service}!]! @relationship(type: "HAS_SERVICE", direction: OUT)
                name: String!
            }

            type ${Collection} @node {
                services: [${Service}!]! @relationship(type: "HAS_SERVICE", direction: OUT)
            }

            type ${Service} @node {
                collection: [${Collection}!]! @relationship(type: "HAS_SERVICE", direction: IN)
            }
        `;

        await testHelper.initNeo4jGraphQL({
            typeDefs,
        });

        await testHelper.executeCypher(
            `
                    CREATE
                        (brand1:${Brand} {name: 'brand1'}),
                        (brand2:${Brand} {name: 'brand2'}),
                        (collection1:${Collection}),
                        (collection2:${Collection}),
                        (service1:${Service}),
                        (service2:${Service}),
                        (service3:${Service}),
                        (service4:${Service}),
                        (brand1)-[:HAS_SERVICE]->(service1),
                        (brand1)-[:HAS_SERVICE]->(service2),
                        (brand2)-[:HAS_SERVICE]->(service3),
                        (brand2)-[:HAS_SERVICE]->(service4),
                        (collection1)-[:HAS_SERVICE]->(service1),
                        (collection1)-[:HAS_SERVICE]->(service2),
                        (collection2)-[:HAS_SERVICE]->(service3)
                `,
            {}
        );
    });

    afterAll(async () => {
        await testHelper.close();
    });

    test("filtering by count on an aggregate should work", async () => {
        const query = /* GraphQL */ `
            query {
                ${Brand.plural} {
                    name
                    services(where: { collectionAggregate: { count_EQ: 1 } }) {
                        collectionConnection {
                            aggregate {
                                count {
                                    nodes
                                }
                            }
                        }
                    }
                }
            }
        `;

        const response = await testHelper.executeGraphQL(query);

        expect(response.errors).toBeFalsy();
        expect(response.data).toEqual({
            [Brand.plural]: expect.toIncludeSameMembers([
                {
                    name: "brand1",
                    services: [
                        {
                            collectionConnection: {
                                aggregate: {
                                    count: {
                                        nodes: 1,
                                    },
                                },
                            },
                        },
                        {
                            collectionConnection: {
                                aggregate: {
                                    count: {
                                        nodes: 1,
                                    },
                                },
                            },
                        },
                    ],
                },
                {
                    name: "brand2",
                    services: [
                        {
                            collectionConnection: {
                                aggregate: {
                                    count: {
                                        nodes: 1,
                                    },
                                },
                            },
                        },
                    ],
                },
            ]),
        });
    });
});
