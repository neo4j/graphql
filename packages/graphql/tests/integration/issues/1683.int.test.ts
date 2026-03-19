/*
 * Copyright (c) "Neo4j"
 * Neo4j Sweden AB [http://neo4j.com]
 */

import type { UniqueType } from "../../utils/graphql-types";
import { TestHelper } from "../../utils/tests-helper";

describe("https://github.com/neo4j/graphql/issues/1683", () => {
    let systemType: UniqueType;
    let governedDataTest: UniqueType;

    const testHelper = new TestHelper();

    beforeEach(async () => {
        systemType = testHelper.createUniqueType("System");
        governedDataTest = testHelper.createUniqueType("GovernedData");

        const typeDefs = `
            type ${systemType} @node {
                code: String!
                updatesData: [${governedDataTest}!]! @relationship(type: "UPDATED_BY", direction: IN)
            }
            type ${governedDataTest} @node {
                code: String!
                updatedBy: [${systemType}!]! @relationship(type: "UPDATED_BY", direction: OUT)
            }
        `;
        await testHelper.initNeo4jGraphQL({
            typeDefs,
        });
    });

    afterEach(async () => {
        await testHelper.close();
    });

    test("should return top level entity, even if no connections exist", async () => {
        const query = /* GraphQL */ `
            {
                ${systemType.plural} {
                    code
                    updatesDataConnection {
                        edges {
                            node {
                                code
                            }
                        }
                    }
                }
            }
        `;

        const cypher = `
            CREATE (s:${systemType} { code: "arthur" });
        `;
        await testHelper.executeCypher(cypher);

        const result = await testHelper.executeGraphQL(query);
        expect(result.errors).toBeUndefined();
        expect(result.data as any).toEqual({
            [systemType.plural]: [{ code: "arthur", updatesDataConnection: { edges: [] } }],
        });
    });
});
