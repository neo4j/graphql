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

import { gql } from "apollo-server";
import { DocumentNode } from "graphql";
import { Neo4jGraphQL } from "../../../../src";
import { formatCypher, translateQuery, formatParams } from "../../utils/tck-test-utils";

describe("https://github.com/neo4j/graphql/issues/1320", () => {
    let typeDefs: DocumentNode;
    let neoSchema: Neo4jGraphQL;

    beforeAll(() => {
        
        typeDefs = gql`    
            type Risk {
                code: String!
                ownedBy: Team @relationship(type: "OWNS_RISK", direction: IN)
                mitigationState: [MitigationState] 
            }
        
            type Team {
                code: String!
                ownsRisks: [Risk!]! @relationship(type: "OWNS_RISK", direction: OUT)
            }
        
            enum MitigationState {
                Deferred
                Identified
                Accepted
                Complete
            }
        `;

        neoSchema = new Neo4jGraphQL({
            typeDefs,
        });
    });

    test("multiple aggregations in the same query should return the same results as if were written separately", async () => {
        const query = gql`
            query getAggreationOnTeams {
                stats: teams {
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
        const result = await translateQuery(neoSchema, query);

        expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
        "MATCH (this:Team)
        RETURN this { accepted: { count: head(apoc.cypher.runFirstColumn(\\"MATCH (this)-[r:OWNS_RISK]->(n:Risk) WHERE $this_accepted_n_mitigationState_INCLUDES IN n.mitigationState    RETURN COUNT(n)\\", { this_accepted_n_mitigationState_INCLUDES: $this_accepted_n_mitigationState_INCLUDES, this: this })) }, identified: { count: head(apoc.cypher.runFirstColumn(\\"MATCH (this)-[r:OWNS_RISK]->(n:Risk) WHERE $this_identified_n_mitigationState_INCLUDES IN n.mitigationState    RETURN COUNT(n)\\", { this_identified_n_mitigationState_INCLUDES: $this_identified_n_mitigationState_INCLUDES, this: this })) } } as this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
        "{
            \\"this_accepted_n_mitigationState_INCLUDES\\": \\"Accepted\\",
            \\"this_identified_n_mitigationState_INCLUDES\\": \\"Identified\\"
        }"
        `);
    });
});
