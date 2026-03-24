/*
 * Copyright (c) "Neo4j"
 * Neo4j Sweden AB [http://neo4j.com]
 */

import type { UniqueType } from "../../utils/graphql-types";
import { TestHelper } from "../../utils/tests-helper";

describe("https://github.com/neo4j/graphql/issues/3912", () => {
    const testHelper = new TestHelper();

    let Event: UniqueType;

    beforeAll(async () => {
        Event = testHelper.createUniqueType("Event");

        const typeDefs = /* GraphQL */ `
            enum EventPrivacy {
                PRIVATE
                VISIBLE
                PUBLIC
            }

            type ${Event} @node {
                id: ID! @id
                name: String!
                # The Privacy for the Event --> See Enum
                privacy: EventPrivacy @default(value: PRIVATE)
            }
        `;

        await testHelper.initNeo4jGraphQL({
            typeDefs,
        });
    });

    afterEach(async () => {
        await testHelper.close();
    });

    test("Create sets default enum value correctly", async () => {
        const query = `#graphql
            mutation {
                ${Event.operations.create}(input: [{ name: "Event" }]) {
                    ${Event.plural} {
                        name
                        privacy
                    }
                }
            }
        `;

        const gqlResult = await testHelper.executeGraphQL(query);

        expect(gqlResult.errors).toBeFalsy();
        expect(gqlResult.data).toEqual({
            [Event.operations.create]: {
                [Event.plural]: [
                    {
                        name: "Event",
                        privacy: "PRIVATE",
                    },
                ],
            },
        });
    });
});
