/*
 * Copyright (c) "Neo4j"
 * Neo4j Sweden AB [http://neo4j.com]
 */

import { createBearerToken } from "../../utils/create-bearer-token";
import type { UniqueType } from "../../utils/graphql-types";
import { TestHelper } from "../../utils/tests-helper";

describe("https://github.com/neo4j/graphql/issues/4110", () => {
    const testHelper = new TestHelper();
    const secret = "secret";

    let Company: UniqueType;
    let InBetween: UniqueType;

    beforeAll(() => {});

    beforeEach(async () => {
        Company = testHelper.createUniqueType("User");
        InBetween = testHelper.createUniqueType("Person");

        const typeDefs = /* GraphQL */ `
            type ${Company} @node
                @authorization(
                    filter: [{ operations: [READ], where: { node: { inBetween_SOME: { company_SOME: { id_EQ: "example" } } } } }]
                ) {
                id: ID @id
                inBetween: [${InBetween}!]! @relationship(type: "CONNECT_TO", direction: OUT)
            }
            type ${InBetween} @node {
                id: ID @id
                company: [${Company}!]! @relationship(type: "CONNECT_TO", direction: IN)
            }
        `;

        await testHelper.initNeo4jGraphQL({
            typeDefs,
            features: {
                authorization: {
                    key: secret,
                },
            },
        });
    });

    beforeEach(async () => {
        await testHelper.executeCypher(`
            CREATE (c1:${Company} { id: "example" })
            CREATE (c2:${Company} { id: "another" })

            CREATE (ib1:${InBetween} {id: "id1"})
            CREATE (ib2:${InBetween} {id: "id2"})

            CREATE(ib1)<-[:CONNECT_TO]-(c1)
            CREATE(ib2)<-[:CONNECT_TO]-(c2)
        `);
    });

    afterEach(async () => {
        await testHelper.close();
    });

    test("filters companies on nested auth where", async () => {
        const query = /* GraphQL */ `
            query {
                ${Company.plural} {
                    id
                    inBetween {
                        company {
                            id
                        }
                    }
                }
            }
        `;

        const token = createBearerToken(secret);

        const result = await testHelper.executeGraphQLWithToken(query, token);

        expect(result.errors).toBeUndefined();
        expect((result.data as any)[Company.plural]).toEqual([
            {
                id: "example",
                inBetween: [
                    {
                        company: [
                            {
                                id: "example",
                            },
                        ],
                    },
                ],
            },
        ]);
    });
});
