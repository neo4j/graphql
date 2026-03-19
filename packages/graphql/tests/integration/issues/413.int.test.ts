/*
 * Copyright (c) "Neo4j"
 * Neo4j Sweden AB [http://neo4j.com]
 */

import { gql } from "graphql-tag";
import { generate } from "randomstring";
import { createBearerToken } from "../../utils/create-bearer-token";
import type { UniqueType } from "../../utils/graphql-types";
import { TestHelper } from "../../utils/tests-helper";

describe("https://github.com/neo4j/graphql/issues/413", () => {
    const testHelper = new TestHelper();
    let JobPlan: UniqueType;

    beforeAll(() => {
        JobPlan = testHelper.createUniqueType("JobPlan");
    });

    afterAll(async () => {
        await testHelper.close();
    });

    // NOTE: this test was updated to use aggregate instead of count
    test("should recreate issue and return correct count as an aggregation", async () => {
        const typeDefs = gql`
            type JWTPayload @jwt {
                tenant_id: String!
            }

            type ${JobPlan} @node {
                id: ID! @id
                tenantID: ID!
                name: String!
            }

            extend type ${JobPlan}
                @authorization(
                    validate: [
                        { when: [AFTER], operations: [CREATE, UPDATE], where: { node: { tenantID_EQ: "$jwt.tenant_id" } } }
                        {
                            when: [BEFORE]
                            operations: [READ, UPDATE, CREATE_RELATIONSHIP, DELETE_RELATIONSHIP, DELETE]
                            where: { node: { tenantID_EQ: "$jwt.tenant_id" } }
                        }
                    ]
                )
        `;

        const tenantID = generate({
            charset: "alphabetic",
        });

        const secret = "secret";

        await testHelper.initNeo4jGraphQL({ typeDefs, features: { authorization: { key: secret } } });

        const query = `
            query {
                ${JobPlan.operations.connection}(where: {tenantID_EQ: "${tenantID}"}) {
                    aggregate {
                        count {
                            nodes
                        }
                    }
                }
            }
        `;

        await testHelper.executeCypher(
            `
                    CREATE (:${JobPlan} {tenantID: $tenantID})
                    CREATE (:${JobPlan} {tenantID: $tenantID})
                    CREATE (:${JobPlan} {tenantID: $tenantID})
                `,
            { tenantID }
        );

        const token = createBearerToken(secret, {
            tenant_id: tenantID,
        });

        const result = await testHelper.executeGraphQLWithToken(query, token);

        expect(result.errors).toBeFalsy();

        expect(result.data).toEqual({
            [JobPlan.operations.connection]: {
                aggregate: {
                    count: {
                        nodes: 3,
                    },
                },
            },
        });
    });
});
