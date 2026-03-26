/*
 * Copyright (c) "Neo4j"
 * Neo4j Sweden AB [http://neo4j.com]
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
            type ${riskType.name} @node {
                code: String!
                ownedBy: [${teamType.name}!]! @relationship(type: "OWNS_RISK", direction: IN)
                mitigationState: [${mitigationStateType.name}!] 
            }
        
            type ${teamType.name} @node {
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
                    accepted: ownsRisksConnection(
                      where: { node: { mitigationState: { includes: Accepted } } }
                    ) {
                        aggregate {
                            count {
                                nodes
                            }
                        }
                    }

                    identified: ownsRisksConnection(
                        where: { node: { mitigationState: { includes: Identified } } }
                    ) {
                        aggregate {
                            count {
                                nodes
                            }
                        }
                    }
                }
            }
        `;
        const res = await testHelper.executeGraphQL(query);

        expect(res.errors).toBeUndefined();
        expect(res.data).toEqual({
            stats: [
                {
                    accepted: {
                        aggregate: {
                            count: {
                                nodes: 1,
                            },
                        },
                    },
                    identified: {
                        aggregate: {
                            count: {
                                nodes: 0,
                            },
                        },
                    },
                },
            ],
        });
    });
});
