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

import type { Driver } from "neo4j-driver";
import { graphql } from "graphql";
import { generate } from "randomstring";
import Neo4jHelper from "../neo4j";
import { Neo4jGraphQL } from "../../../src/classes";
import { UniqueType } from "../../utils/graphql-types";

describe("https://github.com/neo4j/graphql/issues/227", () => {
    let driver: Driver;
    let neo4j: Neo4jHelper;
    let Member: UniqueType;
    let Gender: UniqueType;
    let Town: UniqueType;

    beforeAll(async () => {
        neo4j = new Neo4jHelper();
        driver = await neo4j.getDriver();
        Member = new UniqueType("Member");
        Gender = new UniqueType("Gender");
        Town = new UniqueType("Town");
    });

    afterAll(async () => {
        await driver.close();
    });

    test("Return relationship data on custom query", async () => {
        const session = await neo4j.getSession();

        const memberId = generate({
            charset: "alphabetic",
        });
        const gender = generate({
            charset: "alphabetic",
        });
        const townId = generate({
            charset: "alphabetic",
        });

        const typeDefs = `
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

        const neoSchema = new Neo4jGraphQL({ typeDefs });

        const source = `
                    query($id: ID!) {
                        townMemberList(id: $id) {
                          id
                          gender {
                            gender
                          }
                        }
                    }
                `;

        try {
            await session.run(
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

            const gqlResult = await graphql({
                schema: await neoSchema.getSchema(),
                source,
                contextValue: neo4j.getContextValues(),
                variableValues: { id: townId },
            });

            expect(gqlResult.errors).toBeFalsy();

            expect((gqlResult?.data as any).townMemberList).toEqual([{ id: memberId, gender: { gender } }]);
        } finally {
            await session.close();
        }
    });
});