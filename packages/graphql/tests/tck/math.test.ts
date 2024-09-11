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

import { Neo4jGraphQL } from "../../src";
import { formatCypher, formatParams, translateQuery } from "./utils/tck-test-utils";

describe("Math operators", () => {
    let typeDefs: string;
    let neoSchema: Neo4jGraphQL;

    beforeAll(() => {
        typeDefs = /* GraphQL */ `
            interface Wife {
                marriageLength: Int
            }

            type Star implements Wife @node {
                marriageLength: Int
                marriedWith: Actor @relationship(type: "MARRIED_WITH", direction: IN)
            }

            type Movie @node {
                id: ID! @id @unique
                title: String!
                viewers: Int
                revenue: Float
                actors: [Actor!]! @relationship(type: "ACTED_IN", properties: "ActedIn", direction: IN)
            }

            type Actor @node {
                id: ID!
                name: String!
                actedIn: [Movie!]! @relationship(type: "ACTED_IN", properties: "ActedIn", direction: OUT)
                marriedWith: Wife @relationship(type: "MARRIED_WITH", direction: OUT)
            }

            type ActedIn @relationshipProperties {
                pay: Float
            }
        `;

        neoSchema = new Neo4jGraphQL({
            typeDefs,
        });
    });

    test("Simple Int increment", async () => {
        const query = /* GraphQL */ `
            mutation {
                updateMovies(update: { viewers_INCREMENT: 3 }) {
                    movies {
                        id
                        viewers
                    }
                }
            }
        `;
        const result = await translateQuery(neoSchema, query);

        expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
            "MATCH (this:Movie)
            WITH this
            CALL {
            WITH this
            WITH this
            WHERE apoc.util.validatePredicate(this.viewers IS NULL, 'Cannot %s %s to Nan', [\\"_INCREMENT\\", $this_update_viewers_INCREMENT]) AND apoc.util.validatePredicate(this.viewers IS NOT NULL AND this.viewers + $this_update_viewers_INCREMENT > 2^31-1, 'Overflow: Value returned from operator %s is larger than %s bit', [\\"_INCREMENT\\", \\"32\\"])
            SET this.viewers = this.viewers + $this_update_viewers_INCREMENT
            RETURN this as this_viewers__INCREMENT
            }
            RETURN collect(DISTINCT this { .id, .viewers }) AS data"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"this_update_viewers_INCREMENT\\": {
                    \\"low\\": 3,
                    \\"high\\": 0
                },
                \\"resolvedCallbacks\\": {}
            }"
        `);
    });

    test("Simple Float multiply", async () => {
        const query = /* GraphQL */ `
            mutation {
                updateMovies(update: { revenue_MULTIPLY: 3 }) {
                    movies {
                        id
                        revenue
                    }
                }
            }
        `;
        const result = await translateQuery(neoSchema, query);

        expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
            "MATCH (this:Movie)
            WITH this
            CALL {
            WITH this
            WITH this
            WHERE apoc.util.validatePredicate(this.revenue IS NULL, 'Cannot %s %s to Nan', [\\"_MULTIPLY\\", $this_update_revenue_MULTIPLY]) AND apoc.util.validatePredicate(this.revenue IS NOT NULL AND this.revenue * $this_update_revenue_MULTIPLY > 2^63-1, 'Overflow: Value returned from operator %s is larger than %s bit', [\\"_MULTIPLY\\", \\"64\\"])
            SET this.revenue = this.revenue * $this_update_revenue_MULTIPLY
            RETURN this as this_revenue__MULTIPLY
            }
            RETURN collect(DISTINCT this { .id, .revenue }) AS data"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"this_update_revenue_MULTIPLY\\": 3,
                \\"resolvedCallbacks\\": {}
            }"
        `);
    });

    test("Nested Int increment", async () => {
        const query = /* GraphQL */ `
            mutation {
                updateActors(update: { actedIn: [{ update: { node: { viewers_INCREMENT: 10 } } }] }) {
                    actors {
                        name
                        actedIn {
                            viewers
                        }
                    }
                }
            }
        `;
        const result = await translateQuery(neoSchema, query);

        expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
            "MATCH (this:Actor)
            WITH this
            CALL {
            	WITH this
            	MATCH (this)-[this_acted_in0_relationship:ACTED_IN]->(this_actedIn0:Movie)
            	WITH this_actedIn0, this
            	CALL {
            	WITH this_actedIn0
            	WITH this_actedIn0
            	WHERE apoc.util.validatePredicate(this_actedIn0.viewers IS NULL, 'Cannot %s %s to Nan', [\\"_INCREMENT\\", $this_update_actedIn0_viewers_INCREMENT]) AND apoc.util.validatePredicate(this_actedIn0.viewers IS NOT NULL AND this_actedIn0.viewers + $this_update_actedIn0_viewers_INCREMENT > 2^31-1, 'Overflow: Value returned from operator %s is larger than %s bit', [\\"_INCREMENT\\", \\"32\\"])
            	SET this_actedIn0.viewers = this_actedIn0.viewers + $this_update_actedIn0_viewers_INCREMENT
            	RETURN this_actedIn0 as this_actedIn0_viewers__INCREMENT
            	}
            	RETURN count(*) AS update_this_actedIn0
            }
            WITH *
            CALL {
                WITH this
                MATCH (this)-[update_this0:ACTED_IN]->(update_this1:Movie)
                WITH update_this1 { .viewers } AS update_this1
                RETURN collect(update_this1) AS update_var2
            }
            RETURN collect(DISTINCT this { .name, actedIn: update_var2 }) AS data"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"this_update_actedIn0_viewers_INCREMENT\\": {
                    \\"low\\": 10,
                    \\"high\\": 0
                },
                \\"resolvedCallbacks\\": {}
            }"
        `);
    });

    test("Increment on relationship property", async () => {
        const query = /* GraphQL */ `
            mutation Mutation {
                updateActors(update: { actedIn: [{ update: { edge: { pay_ADD: 100 } } }] }) {
                    actors {
                        name
                        actedIn {
                            title
                        }
                        actedInConnection {
                            edges {
                                properties {
                                    pay
                                }
                            }
                        }
                    }
                }
            }
        `;
        const result = await translateQuery(neoSchema, query);

        expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
            "MATCH (this:Actor)
            WITH this
            CALL {
            	WITH this
            	MATCH (this)-[this_acted_in0_relationship:ACTED_IN]->(this_actedIn0:Movie)
            	WITH this_acted_in0_relationship, this
            	CALL {
            	WITH this_acted_in0_relationship
            	WITH this_acted_in0_relationship
            	WHERE apoc.util.validatePredicate(this_acted_in0_relationship.pay IS NULL, 'Cannot %s %s to Nan', [\\"_ADD\\", $updateActors.args.update.actedIn[0].update.edge.pay_ADD]) AND apoc.util.validatePredicate(this_acted_in0_relationship.pay IS NOT NULL AND this_acted_in0_relationship.pay + $updateActors.args.update.actedIn[0].update.edge.pay_ADD > 2^63-1, 'Overflow: Value returned from operator %s is larger than %s bit', [\\"_ADD\\", \\"64\\"])
            	SET this_acted_in0_relationship.pay = this_acted_in0_relationship.pay + $updateActors.args.update.actedIn[0].update.edge.pay_ADD
            	RETURN this_acted_in0_relationship as this_acted_in0_relationship_pay__ADD
            	}
            	RETURN count(*) AS update_this_actedIn0
            }
            WITH *
            CALL {
                WITH this
                MATCH (this)-[update_this0:ACTED_IN]->(update_this1:Movie)
                WITH update_this1 { .title } AS update_this1
                RETURN collect(update_this1) AS update_var2
            }
            CALL {
                WITH this
                MATCH (this)-[update_this3:ACTED_IN]->(update_this4:Movie)
                WITH collect({ node: update_this4, relationship: update_this3 }) AS edges
                WITH edges, size(edges) AS totalCount
                CALL {
                    WITH edges
                    UNWIND edges AS edge
                    WITH edge.node AS update_this4, edge.relationship AS update_this3
                    RETURN collect({ properties: { pay: update_this3.pay, __resolveType: \\"ActedIn\\" }, node: { __id: id(update_this4), __resolveType: \\"Movie\\" } }) AS update_var5
                }
                RETURN { edges: update_var5, totalCount: totalCount } AS update_var6
            }
            RETURN collect(DISTINCT this { .name, actedIn: update_var2, actedInConnection: update_var6 }) AS data"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"updateActors\\": {
                    \\"args\\": {
                        \\"update\\": {
                            \\"actedIn\\": [
                                {
                                    \\"update\\": {
                                        \\"edge\\": {
                                            \\"pay_ADD\\": 100
                                        }
                                    }
                                }
                            ]
                        }
                    }
                },
                \\"resolvedCallbacks\\": {}
            }"
        `);
    });

    test("Increment on interface property", async () => {
        const query = /* GraphQL */ `
            mutation {
                updateActors(update: { marriedWith: { update: { node: { marriageLength_INCREMENT: 1 } } } }) {
                    actors {
                        name
                        marriedWith {
                            marriageLength
                        }
                    }
                }
            }
        `;
        const result = await translateQuery(neoSchema, query);

        expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
            "MATCH (this:Actor)
            WITH this
            CALL {
            	 WITH this
            WITH this
            CALL {
            	WITH this
            	MATCH (this)-[this_married_with0_relationship:MARRIED_WITH]->(this_marriedWith0:Star)
            	WITH this_marriedWith0, this
            	CALL {
            	WITH this_marriedWith0
            	WITH this_marriedWith0
            	WHERE apoc.util.validatePredicate(this_marriedWith0.marriageLength IS NULL, 'Cannot %s %s to Nan', [\\"_INCREMENT\\", $this_update_marriedWith0_marriageLength_INCREMENT]) AND apoc.util.validatePredicate(this_marriedWith0.marriageLength IS NOT NULL AND this_marriedWith0.marriageLength + $this_update_marriedWith0_marriageLength_INCREMENT > 2^31-1, 'Overflow: Value returned from operator %s is larger than %s bit', [\\"_INCREMENT\\", \\"32\\"])
            	SET this_marriedWith0.marriageLength = this_marriedWith0.marriageLength + $this_update_marriedWith0_marriageLength_INCREMENT
            	RETURN this_marriedWith0 as this_marriedWith0_marriageLength__INCREMENT
            	}
            	WITH this, this_marriedWith0
            	CALL {
            		WITH this_marriedWith0
            		MATCH (this_marriedWith0)<-[this_marriedWith0_marriedWith_Actor_unique:MARRIED_WITH]-(:Actor)
            		WITH count(this_marriedWith0_marriedWith_Actor_unique) as c
            		WHERE apoc.util.validatePredicate(NOT (c <= 1), '@neo4j/graphql/RELATIONSHIP-REQUIREDStar.marriedWith must be less than or equal to one', [0])
            		RETURN c AS this_marriedWith0_marriedWith_Actor_unique_ignored
            	}
            	RETURN count(*) AS update_this_marriedWith0
            }
            RETURN count(*) AS update_this_Star
            }
            WITH *
            CALL {
                WITH this
                CALL {
                    WITH *
                    MATCH (this)-[update_this0:MARRIED_WITH]->(update_this1:Star)
                    WITH update_this1 { .marriageLength, __resolveType: \\"Star\\", __id: id(update_this1) } AS update_this1
                    RETURN update_this1 AS update_var2
                }
                WITH update_var2
                RETURN head(collect(update_var2)) AS update_var2
            }
            RETURN collect(DISTINCT this { .name, marriedWith: update_var2 }) AS data"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"this_update_marriedWith0_marriageLength_INCREMENT\\": {
                    \\"low\\": 1,
                    \\"high\\": 0
                },
                \\"resolvedCallbacks\\": {}
            }"
        `);
    });
});
