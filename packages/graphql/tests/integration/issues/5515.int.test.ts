/*
 * Copyright (c) "Neo4j"
 * Neo4j Sweden AB [http://neo4j.com]
 */

import { createBearerToken } from "../../utils/create-bearer-token";
import type { UniqueType } from "../../utils/graphql-types";
import { TestHelper } from "../../utils/tests-helper";

describe("https://github.com/neo4j/graphql/issues/5515", () => {
    const testHelper = new TestHelper();

    const secret = "dontpanic";

    let User: UniqueType;
    let Cabinet: UniqueType;
    let Category: UniqueType;
    let File: UniqueType;

    beforeAll(async () => {
        User = testHelper.createUniqueType("User");
        Cabinet = testHelper.createUniqueType("Cabinet");
        Category = testHelper.createUniqueType("Category");
        File = testHelper.createUniqueType("File");

        const typeDefs = /* GraphQL */ `
            type JWT @jwt {
                roles: [String!]!
            }

            type ${User} @node
                @authorization(
                    validate: [
                        { operations: [CREATE, DELETE], where: { jwt: { roles_INCLUDES: "admin" } } }
                        { operations: [READ, UPDATE], where: { node: { id_EQ: "$jwt.sub" } } }
                    ]
                    filter: [{ where: { node: { id_EQ: "$jwt.sub" } } }]
                ) {
                id: ID!
                cabinets: [${Cabinet}!]! @relationship(type: "HAS_CABINET", direction: OUT)
            }

            type ${Cabinet} @authorization(filter: [{ where: { node: { user_SINGLE: { id_EQ: "$jwt.sub" } } } }]) @node {
                id: ID! @id
                categories: [${Category}!]! @relationship(type: "HAS_CATEGORY", direction: OUT)
                user: [${User}!]! @relationship(type: "HAS_CABINET", direction: IN)
            }

            type ${Category} @authorization(filter: [{ where: { node: { cabinet_SINGLE: { user_SINGLE: { id_EQ: "$jwt.sub" } } } } }]) @node {
                id: ID! @id
                files: [${File}!]! @relationship(type: "HAS_FILE", direction: OUT)
                cabinet: [${Cabinet}!]! @relationship(type: "HAS_CATEGORY", direction: IN)
            }

            type ${File} @node {
                id: ID!
                category: [${Category}!]! @relationship(type: "HAS_FILE", direction: IN)
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

    afterAll(async () => {
        await testHelper.close();
    });

    test("should delete categories with auth filters", async () => {
        await testHelper.executeCypher(`
            CREATE (:${User} {id: "1234"})-[:HAS_CABINET]->(:${Cabinet})-[:HAS_CATEGORY]->(:${Category} {id: "category-video"})
            CREATE (:${User} {id: "another"})-[:HAS_CABINET]->(:${Cabinet})-[:HAS_CATEGORY]->(:${Category} {id: "category-video"})
            `);

        const query = /* GraphQL */ `
            mutation {
                ${Category.operations.delete}(where: { id_EQ: "category-video" }) {
                    __typename
                    nodesDeleted
                    relationshipsDeleted
                }
            }
        `;

        const token = createBearerToken(secret, { sub: "1234" });

        const response = await testHelper.executeGraphQLWithToken(query, token);

        expect(response.errors).toBeFalsy();
        expect(response.data).toEqual({
            [Category.operations.delete]: {
                __typename: "DeleteInfo",
                nodesDeleted: 1,
                relationshipsDeleted: 1,
            },
        });
    });
});
