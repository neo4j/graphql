/*
 * Copyright (c) "Neo4j"
 * Neo4j Sweden AB [http://neo4j.com]
 */

import type { UniqueType } from "../../utils/graphql-types";
import { TestHelper } from "../../utils/tests-helper";

describe("https://github.com/neo4j/graphql/issues/2652", () => {
    const testHelper = new TestHelper();

    let Location: UniqueType;
    let Review: UniqueType;

    beforeEach(async () => {
        Location = testHelper.createUniqueType("Location");
        Review = testHelper.createUniqueType("Review");

        const typeDefs = `
            type ${Location} @node {
                id: ID!
                reviews: [${Review}!]! @relationship(type: "HAS_REVIEW", direction: OUT)
            }

            type ${Review} @node {
                id: ID!
                rating: Int!
            }
        `;

        await testHelper.initNeo4jGraphQL({
            typeDefs,
        });
    });

    afterEach(async () => {
        await testHelper.close();
    });

    test("Does not throw error when count and node aggregations in selection set", async () => {
        const query = `
            query ReviewsAggregate {
                ${Location.plural} {
                    reviewsConnection {
                        aggregate {
                            count {
                                nodes
                            }
                            node {
                                rating {
                                    average
                                }
                            }    
                        }
                    }
                }
            }
        `;

        const result = await testHelper.executeGraphQL(query);

        expect(result.errors).toBeFalsy();
    });
});
