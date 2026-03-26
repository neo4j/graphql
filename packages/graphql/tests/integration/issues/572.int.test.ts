/*
 * Copyright (c) "Neo4j"
 * Neo4j Sweden AB [http://neo4j.com]
 */

import { gql } from "graphql-tag";
import { TestHelper } from "../../utils/tests-helper";

describe("Revert https://github.com/neo4j/graphql/pull/572", () => {
    const testHelper = new TestHelper();

    beforeEach(() => {});

    afterEach(async () => {
        await testHelper.close();
    });

    test("should create user without related friend in many-to-many relationship", async () => {
        const user = testHelper.createUniqueType("User");

        const typeDefs = gql`
            type ${user.name} @node {
                name: String!
                friends: [${user.name}!]! @relationship(type: "FRIENDS_WITH", direction: OUT)
            }
        `;

        await testHelper.initNeo4jGraphQL({ typeDefs });

        const query = `
            mutation {
                ${user.operations.create}(input: { name: "Ford", friends: { create: { node: { name: "Jane" } } } }) {
                    info {
                        nodesCreated
                    }
                }
            }
        `;

        const gqlResult = await testHelper.executeGraphQL(query);

        expect(gqlResult.errors).toBeFalsy();
        expect(gqlResult.data).toEqual({
            [user.operations.create]: {
                info: {
                    nodesCreated: 2,
                },
            },
        });
    });
});
