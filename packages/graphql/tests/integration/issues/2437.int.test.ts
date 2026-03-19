/*
 * Copyright (c) "Neo4j"
 * Neo4j Sweden AB [http://neo4j.com]
 */

import { createBearerToken } from "../../utils/create-bearer-token";
import type { UniqueType } from "../../utils/graphql-types";
import { TestHelper } from "../../utils/tests-helper";

describe("https://github.com/neo4j/graphql/issues/2437", () => {
    const testHelper = new TestHelper();

    let Agent: UniqueType;
    let Valuation: UniqueType;

    beforeEach(async () => {
        Agent = testHelper.createUniqueType("Agent");
        Valuation = testHelper.createUniqueType("Valuation");

        const typeDefs = `
            type JWT @jwt {
                roles: [String!]!
            }

            type ${Agent} @mutation(operations: [CREATE, UPDATE]) @node {
                uuid: ID! @id
                archivedAt: DateTime

                valuations: [${Valuation}!]! @relationship(type: "IS_VALUATION_AGENT", direction: OUT)
            }

            extend type ${Agent}
                @authorization(validate: [{ operations: [CREATE], where: { jwt: { roles_INCLUDES: "Admin" } } }], filter: [{ where: { node: { archivedAt_EQ: null } } }])

            type ${Valuation} @mutation(operations: [CREATE, UPDATE]) @node {
                uuid: ID! @id
                archivedAt: DateTime

                agent: [${Agent}!]! @relationship(type: "IS_VALUATION_AGENT", direction: IN)
            }

            extend type ${Valuation} @authorization(filter: [{ where: { node: { archivedAt_EQ: null } } }])
        `;

        await testHelper.executeCypher(`
        CREATE(a:${Agent} {uuid: "a1"})
        CREATE(:${Valuation} {uuid: "v1"})<-[:IS_VALUATION_AGENT]-(a)
        CREATE(:${Valuation} {uuid: "v2"})<-[:IS_VALUATION_AGENT]-(a)
        CREATE(:${Valuation} {uuid: "v3"})<-[:IS_VALUATION_AGENT]-(a)
        CREATE(:${Valuation} {uuid: "v4"})<-[:IS_VALUATION_AGENT]-(a)
        CREATE(:${Valuation} {uuid: "v5"})<-[:IS_VALUATION_AGENT]-(a)
        CREATE(:${Valuation} {uuid: "v6"})<-[:IS_VALUATION_AGENT]-(a)
        CREATE(:${Valuation} {uuid: "v7"})<-[:IS_VALUATION_AGENT]-(a)
        CREATE(:${Valuation} {uuid: "v8"})<-[:IS_VALUATION_AGENT]-(a)
        CREATE(:${Valuation} {uuid: "v9"})<-[:IS_VALUATION_AGENT]-(a)
        CREATE(:${Valuation} {uuid: "v10"})<-[:IS_VALUATION_AGENT]-(a)
        CREATE(:${Valuation} {uuid: "v11"})<-[:IS_VALUATION_AGENT]-(a)
        `);

        await testHelper.initNeo4jGraphQL({
            typeDefs,
            features: { authorization: { key: "secret" } },
        });
    });

    afterEach(async () => {
        await testHelper.close();
    });

    test("should return only the first elements", async () => {
        const query = `
            query {
                ${Agent.plural}(where: { uuid_EQ: "a1" }) {
                    uuid
                    valuationsConnection(first: 10) {
                        edges {
                            node {
                                uuid
                            }
                        }
                        pageInfo {
                            hasNextPage
                        }
                    }
                }
            }
        `;

        const result = await testHelper.executeGraphQLWithToken(query, createBearerToken("secret"));

        expect(result.errors).toBeFalsy();
        expect(result.data).toEqual({
            [Agent.plural]: [
                {
                    uuid: "a1",
                    valuationsConnection: {
                        edges: expect.toBeArrayOfSize(10),
                        pageInfo: {
                            hasNextPage: true,
                        },
                    },
                },
            ],
        });
    });
});
