/*
 * Copyright (c) "Neo4j"
 * Neo4j Sweden AB [http://neo4j.com]
 */

import type { UniqueType } from "../../utils/graphql-types";
import { TestHelper } from "../../utils/tests-helper";

describe("https://github.com/neo4j/graphql/issues/3932", () => {
    const testHelper = new TestHelper();

    let Image: UniqueType;
    let Invite: UniqueType;

    beforeAll(async () => {
        Image = testHelper.createUniqueType("Image");
        Invite = testHelper.createUniqueType("Invite");

        const typeDefs = /* GraphQL */ `
            enum ImageStatus {
                PENDING
                UPLOADED
            }

            type ${Image} @node {
                status: ImageStatus! @default(value: PENDING)
            }

            enum InviteStatus {
                PENDING
                ACCEPTED
            }

            type ${Invite} @node {
                status: InviteStatus! @default(value: PENDING)
            }
        `;

        await testHelper.initNeo4jGraphQL({
            typeDefs,
        });
    });

    afterAll(async () => {
        await testHelper.close();
    });

    test("Server starts up and defaults work", async () => {
        const query = `#graphql
            mutation {
                ${Image.operations.create}(input: [{}]) {
                    ${Image.plural} {
                        status
                    }
                }
            }
        `;

        const gqlResult = await testHelper.executeGraphQL(query);

        expect(gqlResult.errors).toBeFalsy();
        expect(gqlResult.data).toEqual({
            [Image.operations.create]: {
                [Image.plural]: [
                    {
                        status: "PENDING",
                    },
                ],
            },
        });
    });
});
