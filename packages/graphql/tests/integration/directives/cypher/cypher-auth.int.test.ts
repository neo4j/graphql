/*
 * Copyright (c) "Neo4j"
 * Neo4j Sweden AB [http://neo4j.com]
 */

import { createBearerToken } from "../../../utils/create-bearer-token";
import type { UniqueType } from "../../../utils/graphql-types";
import { TestHelper } from "../../../utils/tests-helper";

describe("https://github.com/neo4j/graphql/issues/5270", () => {
    let User: UniqueType;
    let UserBlockedUser: UniqueType;
    let Thing: UniqueType;

    const secret = "secret";
    const testHelper = new TestHelper();

    beforeEach(async () => {
        User = testHelper.createUniqueType("User");
        UserBlockedUser = testHelper.createUniqueType("UserBlockedUser");
        Thing = testHelper.createUniqueType("Thing");

        const typeDefs = /* GraphQL */ `
            type ${User} @node(labels: ["${User}"]) @authorization(
                filter: [
                    { where: { node: { NOT: { blockedUsers_SOME: { to_SINGLE: { id_EQ: "$jwt.sub" } } } } } },
                ]
            ) {
                id: ID! @id
                blockedUsers: [${UserBlockedUser}!]! @relationship(type: "HAS_BLOCKED", direction: OUT)
            }
        
            type ${UserBlockedUser} @node(labels: ["${UserBlockedUser}"]) @authorization(
                filter: [
                    { where: { node: { from_SINGLE: { id_EQ: "$jwt.sub" } } } }
                ]
            ) {
                id: ID! @id
                from: [${User}!]! @relationship(type: "HAS_BLOCKED", direction: IN) @settable(onCreate: true, onUpdate: false)
                to: [${User}!]! @relationship(type: "IS_BLOCKING", direction: OUT) @settable(onCreate: true, onUpdate: false)
            }

            type ${Thing} @node {
                user: ${User} @cypher(statement: "OPTIONAL MATCH (u:${User} {id: $jwt.sub}) RETURN u", columnName: "u")
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

    afterEach(async () => {
        await testHelper.close();
    });

    test("should nested users with cypher directive filtered according to authorization rule", async () => {
        const query = `
            query GetMe {
                ${Thing.plural} {
                    user {
                        id
                        __typename
                    }
                }
            }
        `;

        const userId = "my-user-id";

        await testHelper.executeCypher(`
                CREATE (:${User} {id: "${userId}"})
                CREATE (:${User} {id: "1234"})
                CREATE (:${Thing})
            `);

        const token = createBearerToken(secret, {
            sub: userId,
            name: "John Doe",
            iat: 1516239022,
        });

        const gqlResult = await testHelper.executeGraphQLWithToken(query, token);
        expect(gqlResult.errors).toBeFalsy();
        expect(gqlResult.data).toEqual({ [Thing.plural]: [{ user: { id: userId, __typename: User.name } }] });
    });
});
