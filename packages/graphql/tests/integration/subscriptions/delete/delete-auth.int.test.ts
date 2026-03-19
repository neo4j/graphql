/*
 * Copyright (c) "Neo4j"
 * Neo4j Sweden AB [http://neo4j.com]
 */

import console from "console";
import { generate } from "randomstring";
import { createBearerToken } from "../../../utils/create-bearer-token";
import { TestHelper } from "../../../utils/tests-helper";

describe("Subscriptions delete", () => {
    const testHelper = new TestHelper({ cdc: true });
    let cdcEnabled: boolean;

    beforeAll(async () => {
        cdcEnabled = await testHelper.assertCDCEnabled();
    });

    afterAll(async () => {
        await testHelper.close();
    });

    test("should throw Forbidden when deleting a node with invalid allow", async () => {
        if (!cdcEnabled) {
            console.log("CDC NOT AVAILABLE - SKIPPING");
            return;
        }
        const typeUser = testHelper.createUniqueType("User");
        const typeDefs = `
        type ${typeUser.name} @node {
            id: ID
        }

        extend type ${typeUser.name} @authorization(validate: [{ operations: [DELETE], when: [BEFORE], where: { node: { id_EQ: "$jwt.sub" } } }])
    `;

        const userId = generate({
            charset: "alphabetic",
        });

        const query = `
        mutation {
            ${typeUser.operations.delete}(
                where: { id_EQ: "${userId}" }
            ) {
               nodesDeleted
            }
        }
    `;

        await testHelper.initNeo4jGraphQL({
            typeDefs,
            features: {
                authorization: {
                    key: "secret",
                },
                subscriptions: await testHelper.getSubscriptionEngine(),
            },
        });

        await testHelper.executeCypher(`
            CREATE (:${typeUser.name} {id: "${userId}"})
        `);

        const token = createBearerToken("secret", { sub: "invalid" });

        const gqlResult = await testHelper.executeGraphQLWithToken(query, token);

        expect((gqlResult.errors as any[])[0].message).toBe("Forbidden");
    });
});
