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

import { Neo4jGraphQL } from "../../../../../src";
import { formatCypher, translateQuery } from "../../../utils/tck-test-utils";

describe("cypher directive in relationship properties", () => {
    let typeDefs: string;
    let neoSchema: Neo4jGraphQL;

    beforeAll(() => {
        typeDefs = /* GraphQL */ `
            type Movie @node {
                title: String!
                actors: [Actor!]! @relationship(type: "ACTED_IN", direction: IN, properties: "ActedIn")
            }

            type Actor @node {
                name: String!
                actedIn: [Movie!]! @relationship(type: "ACTED_IN", direction: OUT, properties: "ActedIn")
            }

            type ActedIn @relationshipProperties {
                screenTimeHours: Float
                    @cypher(
                        statement: """
                        RETURN this.screenTimeMinutes / 60 AS c
                        """
                        columnName: "c"
                    )
                screenTimeMinutes: Int
            }
        `;

        neoSchema = new Neo4jGraphQL({
            typeDefs,
        });
    });

    test("cypher field in relationship", async () => {
        const query = /* GraphQL */ `
            query {
                movies {
                    title
                    actorsConnection {
                        edges {
                            properties {
                                screenTimeHours
                            }
                            node {
                                name
                            }
                        }
                    }
                }
            }
        `;

        const result = await translateQuery(neoSchema, query);

        expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
            "CYPHER 5
            MATCH (this:Movie)
            CALL (this) {
                MATCH (this)<-[this0:ACTED_IN]-(this1:Actor)
                WITH collect({ node: this1, relationship: this0 }) AS edges
                CALL (edges) {
                    UNWIND edges AS edge
                    WITH edge.node AS this1, edge.relationship AS this0
                    CALL (this0) {
                        CALL (this0) {
                            WITH this0 AS this
                            RETURN this.screenTimeMinutes / 60 AS c
                        }
                        WITH c AS this2
                        RETURN this2 AS var3
                    }
                    RETURN collect({ properties: { screenTimeHours: var3, __resolveType: \\"ActedIn\\" }, node: { name: this1.name, __resolveType: \\"Actor\\" } }) AS var4
                }
                RETURN { edges: var4 } AS var5
            }
            RETURN this { .title, actorsConnection: var5 } AS this"
        `);
    });
});
