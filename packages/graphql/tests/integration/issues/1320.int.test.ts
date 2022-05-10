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

import { graphql, GraphQLSchema } from "graphql";
import { gql } from "apollo-server";
import { Driver } from "neo4j-driver";
import { Neo4jGraphQLAuthJWTPlugin } from "@neo4j/graphql-plugin-auth";
import neo4j from "../neo4j";
import { Neo4jGraphQL } from "../../../src";
import { generateUniqueType } from "../../utils/graphql-types";

describe("https://github.com/neo4j/graphql/issues/1320", () => {
    const riskType = generateUniqueType("Risk");
    const teamType = generateUniqueType("Team");
    const mitigationStateType = generateUniqueType("MitigationState");

    const secret = "secret";
    let schema: GraphQLSchema;
    let driver: Driver;

    beforeAll(async () => {
        driver = await neo4j();

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
        const neoGraphql = new Neo4jGraphQL({
            typeDefs,
            driver,
            plugins: {
                auth: new Neo4jGraphQLAuthJWTPlugin({
                    secret,
                }),
            },
        });
        schema = await neoGraphql.getSchema();
    });

    afterAll(async () => {
        await driver.close();
    });

    test("multiple aggregations in the same query should return the same results as if were written separately", async () => {
        const session = driver.session();
        const cypherInsert = `
            CREATE
            (team1: ${teamType.name} {code: 'team-1'}),
            (risk1: ${riskType.name} {code: 'risk-1', mitigationState: 'Accepted'}),
            (team1)-[:OWNS_RISK]->(risk1)
        `;
        try {
            await session.run(cypherInsert);
        } finally {
            await session.close();
        }

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
        const res = await graphql({
            schema,
            source: query,
            contextValue: {
                driver
            },
        });

        expect(res.errors).toBeUndefined();
        const expectedReturn = { 
            "stats": [
                {
                    "accepted": {
                        "count": 1
                    },
                    "identified": {
                        "count": 0
                    }
                }
            ]
        };
        expect(res.data).toEqual(expectedReturn);
    });
});
