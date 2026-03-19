/*
 * Copyright (c) "Neo4j"
 * Neo4j Sweden AB [http://neo4j.com]
 */

import type { UniqueType } from "../../utils/graphql-types";
import { TestHelper } from "../../utils/tests-helper";

describe("https://github.com/neo4j/graphql/issues/2250", () => {
    const testHelper = new TestHelper({ cdc: true });

    let Movie: UniqueType;
    let Person: UniqueType;
    let Actor: UniqueType;

    beforeAll(async () => {
        await testHelper.assertCDCEnabled();
    });

    beforeEach(async () => {
        Movie = testHelper.createUniqueType("Movie");
        Person = testHelper.createUniqueType("Person");
        Actor = testHelper.createUniqueType("Actor");

        const typeDefs = /* GraphQL */ `
            type ${Movie} @node {
                title: String!
                actors: [${Actor}!]! @relationship(type: "ACTED_IN", properties: "ActedIn", direction: IN)
                directors: [Director!]! @relationship(type: "DIRECTED", properties: "Directed", direction: IN)
            }

            type ${Actor} @node {
                name: String!
                movies: [${Movie}!]! @relationship(type: "ACTED_IN", properties: "ActedIn", direction: OUT)
            }

            type ActedIn @relationshipProperties {
                screenTime: Int!
            }

            type Directed @relationshipProperties {
                year: Int!
            }

            type ${Person} @node {
                name: String!
                reputation: Int!
            }

            union Director = ${Person} | ${Actor}
        `;

        await testHelper.initNeo4jGraphQL({
            typeDefs,
            features: {
                subscriptions: await testHelper.getSubscriptionEngine(),
            },
        });
    });

    afterEach(async () => {
        await testHelper.close();
    });

    test("nested update with create while using subscriptions should generate valid Cypher", async () => {
        const mutation = /* GraphQL */ `
            mutation {
                ${Movie.operations.update}(
                    update: {
                        directors: {
                            ${Actor}: [
                                {
                                    update: {
                                        where: { node: { name_EQ: "Keanu Reeves" } }
                                        edge: { year_SET: 2020 }
                                        node: {
                                            name_SET: "KEANU Reeves"
                                            movies: [
                                                {
                                                    create: [
                                                        { edge: { screenTime: 2345 }, node: { title: "Constantine" } }
                                                    ]
                                                }
                                            ]
                                        }
                                    }
                                }
                            ]
                        }
                    }
                ) {
                    ${Movie.plural} {
                        title
                    }
                }
            }
        `;

        const mutationResult = await testHelper.executeGraphQL(mutation);

        expect(mutationResult.errors).toBeFalsy();
    });
});
