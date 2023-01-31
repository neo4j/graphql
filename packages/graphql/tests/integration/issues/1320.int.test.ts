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

import type { GraphQLSchema } from "graphql";
import { graphql } from "graphql";
import { gql } from "apollo-server";
import type { Driver } from "neo4j-driver";
import { Neo4jGraphQLAuthJWTPlugin } from "@neo4j/graphql-plugin-auth";
import Neo4j from "../neo4j";
import { Neo4jGraphQL } from "../../../src";
import { UniqueType } from "../../utils/graphql-types";

describe("https://github.com/neo4j/graphql/issues/1320", () => {
    const riskType = new UniqueType("Risk");
    const teamType = new UniqueType("Team");
    const mitigationStateType = new UniqueType("MitigationState");

    const secret = "secret";
    let schema: GraphQLSchema;
    let driver: Driver;
    let neo4j: Neo4j;

    beforeAll(async () => {
        neo4j = new Neo4j();
        driver = await neo4j.getDriver();

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
        const session = await neo4j.getSession();
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
            contextValue: neo4j.getContextValues(),
        });

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
