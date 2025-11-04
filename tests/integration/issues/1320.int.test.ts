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

import { gql } from "graphql-tag";
import type { UniqueType } from "../../utils/graphql-types";
import { TestHelper } from "../../utils/tests-helper";

describe("https://github.com/neo4j/graphql/issues/1320", () => {
    let riskType: UniqueType;
    let teamType: UniqueType;
    let mitigationStateType: UniqueType;

    const testHelper = new TestHelper();

    beforeEach(async () => {
        riskType = testHelper.createUniqueType("Risk");
        teamType = testHelper.createUniqueType("Team");
        mitigationStateType = testHelper.createUniqueType("MitigationState");

        const typeDefs = gql`
            type ${riskType.name} {
                code: String!
                ownedBy: ${teamType.name} @relationship(type: "OWNS_RISK", direction: IN)
                mitigationState: [${mitigationStateType.name}] 
            }
        
            type ${teamType.name} {
                code: String!
                ownsRisks: [${riskType.name}!]! @relationship(type: "OWNS_RISK", direction: OUT)
            }
        
            enum ${mitigationStateType.name} {
                Deferred
                Identified
                Accepted
                Complete
            }
        `;
        await testHelper.initNeo4jGraphQL({
            typeDefs,
        });
    });

    afterEach(async () => {
        await testHelper.close();
    });

    test("multiple aggregations in the same query should return the same results as if were written separately", async () => {
        const cypherInsert = `
            CREATE
            (team1: ${teamType.name} {code: 'team-1'}),
            (risk1: ${riskType.name} {code: 'risk-1', mitigationState: 'Accepted'}),
            (team1)-[:OWNS_RISK]->(risk1)
        `;
        await testHelper.executeCypher(cypherInsert);

        const query = `
            query getAggreationOnTeams {
                stats: ${teamType.plural} {
                    accepted: ownsRisksAggregate(
                      where: { mitigationState_INCLUDES: Accepted }
                    ) {
                        count
                    }

                    identified: ownsRisksAggregate(
                        where: { mitigationState_INCLUDES: Identified }
                    ) {
                        count
                    }
                }
            }
        `;
        const res = await testHelper.executeGraphQL(query);

        expect(res.errors).toBeUndefined();
        const expectedReturn = {
            stats: [
                {
                    accepted: {
                        count: 1,
                    },
                    identified: {
                        count: 0,
                    },
                },
            ],
        };
        expect(res.data).toEqual(expectedReturn);
    });
});
