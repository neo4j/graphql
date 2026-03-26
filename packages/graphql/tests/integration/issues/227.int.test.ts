/*
 * Copyright (c) "Neo4j"
 * Neo4j Sweden AB [http://neo4j.com]
 */

import { generate } from "randomstring";
import type { UniqueType } from "../../utils/graphql-types";
import { TestHelper } from "../../utils/tests-helper";

describe("https://github.com/neo4j/graphql/issues/227", () => {
    let Member: UniqueType;
    let Gender: UniqueType;
    let Town: UniqueType;
    const testHelper = new TestHelper();

    beforeAll(() => {
        Member = testHelper.createUniqueType("Member");
        Gender = testHelper.createUniqueType("Gender");
        Town = testHelper.createUniqueType("Town");
    });

    afterAll(async () => {
        await testHelper.close();
    });

    test("Return relationship data on custom query", async () => {
        const memberId = generate({
            charset: "alphabetic",
        });
        const gender = generate({
            charset: "alphabetic",
        });
        const townId = generate({
            charset: "alphabetic",
        });

        const typeDefs = /* GraphQL */ `
                    type ${Member} @node {
                        id: ID!
                        gender: [${Gender}!]! @relationship(type: "HAS_GENDER", direction: OUT)
                    }

                    type ${Gender} @node {
                        gender: String!
                    }

                    type Query {
                        townMemberList(id: ID!): [${Member}] @cypher(statement: """
                            MATCH (town:${Town} {id:$id})
                            OPTIONAL MATCH (town)<-[:BELONGS_TO]-(member:${Member})
                            RETURN member
                        """,
                        columnName: "member")
                    }
                `;

        await testHelper.initNeo4jGraphQL({ typeDefs });

        const source = /* GraphQL */ `
            query ($id: ID!) {
                townMemberList(id: $id) {
                    id
                    gender {
                        gender
                    }
                }
            }
        `;

        await testHelper.executeCypher(
            `
            CREATE (t:${Town} {id: $townId})
            MERGE (t)<-[:BELONGS_TO]-(m:${Member} {id: $memberId})
            MERGE (m)-[:HAS_GENDER]->(:${Gender} {gender: $gender})
                        `,
            {
                memberId,
                gender,
                townId,
            }
        );

        const gqlResult = await testHelper.executeGraphQL(source, {
            variableValues: { id: townId },
        });

        expect(gqlResult.errors).toBeFalsy();

        expect((gqlResult?.data as any).townMemberList).toEqual([{ id: memberId, gender: [{ gender }] }]);
    });
});
