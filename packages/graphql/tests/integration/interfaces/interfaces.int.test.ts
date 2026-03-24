/*
 * Copyright (c) "Neo4j"
 * Neo4j Sweden AB [http://neo4j.com]
 */

import { createBearerToken } from "../../utils/create-bearer-token";
import { TestHelper } from "../../utils/tests-helper";

describe("Interfaces tests", () => {
    const secret = "the-secret";

    const testHelper = new TestHelper();

    const SomeNodeType = testHelper.createUniqueType("SomeNode");
    const OtherNodeType = testHelper.createUniqueType("OtherNode");
    const MyImplementationType = testHelper.createUniqueType("MyImplementation");

    beforeAll(async () => {
        const typeDefs = `
            type ${SomeNodeType} @node {
                id: ID! @id
                other: [${OtherNodeType}!]! @relationship(type: "HAS_OTHER_NODES", direction: OUT)
            }
            type ${OtherNodeType} @node {
                id: ID! @id
                interfaceField: [MyInterface!]! @relationship(type: "HAS_INTERFACE_NODES", direction: OUT)
            }
            interface MyInterface {
                id: ID!
            }
            type ${MyImplementationType} implements MyInterface @node {
                id: ID! @id
            }

            extend type ${SomeNodeType} @authentication

            extend type ${OtherNodeType} @authentication
        `;

        await testHelper.executeCypher(`
            CREATE(:${SomeNodeType} { id: "1" })-[:HAS_OTHER_NODES]->(other:${OtherNodeType} { id: "2" })
            CREATE(other)-[:HAS_INTERFACE_NODES]->(:${MyImplementationType} { id: "3" })
        `);

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

    test("should not throw error when querying nested interfaces having auth rules", async () => {
        const query = `
            query {
                ${SomeNodeType.plural} {
                    id
                    other {
                        interfaceField {
                            id
                        }
                    }
                }
            }
        `;

        const token = createBearerToken(secret, {});
        const queryResult = await testHelper.executeGraphQLWithToken(query, token);
        expect(queryResult.errors).toBeUndefined();
        expect(queryResult.data).toEqual({
            [SomeNodeType.plural]: [
                {
                    id: "1",
                    other: [
                        {
                            interfaceField: [
                                {
                                    id: "3",
                                },
                            ],
                        },
                    ],
                },
            ],
        });
    });
});
