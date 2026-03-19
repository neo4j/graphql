/*
 * Copyright (c) "Neo4j"
 * Neo4j Sweden AB [http://neo4j.com]
 */

import type { UniqueType } from "../../utils/graphql-types";
import { TestHelper } from "../../utils/tests-helper";

describe("https://github.com/neo4j/graphql/issues/1536", () => {
    const testHelper = new TestHelper();

    let SomeNodeType: UniqueType;
    let OtherNodeType: UniqueType;
    let MyImplementationType: UniqueType;

    beforeAll(async () => {
        SomeNodeType = testHelper.createUniqueType("SomeNode");
        OtherNodeType = testHelper.createUniqueType("OtherNode");
        MyImplementationType = testHelper.createUniqueType("MyImplementation");

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
        `;

        await testHelper.executeCypher(`
            CREATE(:${SomeNodeType} {id: "1"})-[:HAS_OTHER_NODES]->(other:${OtherNodeType} {id: "2"})
            CREATE(other)-[:HAS_INTERFACE_NODES]->(:${MyImplementationType} {id: "3"})
        `);

        await testHelper.initNeo4jGraphQL({ typeDefs });
    });

    afterAll(async () => {
        await testHelper.close();
    });

    test("should not throw error when querying nested interfaces", async () => {
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

        const queryResult = await testHelper.executeGraphQL(query);
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
