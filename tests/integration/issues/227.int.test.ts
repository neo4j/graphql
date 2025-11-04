/*
 * Copyright (c) "Neo4j"
 * Neo4j Sweden AB [http://neo4j.com]
 *
 * This file is part of Neo4j.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
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
                    type ${Member} {
                        id: ID!
                        gender: ${Gender}! @relationship(type: "HAS_GENDER", direction: OUT)
                    }

                    type ${Gender} {
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

        expect((gqlResult?.data as any).townMemberList).toEqual([{ id: memberId, gender: { gender } }]);
    });
});
