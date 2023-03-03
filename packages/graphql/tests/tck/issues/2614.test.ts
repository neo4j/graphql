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
import { Neo4jGraphQL } from "../../../src";
import { formatCypher, translateQuery, formatParams } from "../utils/tck-test-utils";

describe("https://github.com/neo4j/graphql/issues/2614", () => {
    let typeDefs: string;
    let neoSchema: Neo4jGraphQL;

    beforeAll(() => {
        typeDefs = `
            interface Production {
                title: String!
                actors: [Actor!]!
            }
            
            type Movie implements Production @node(labels:["Film"]){
                title: String!
                actors: [Actor!]! @relationship(type: "ACTED_IN", direction: IN, properties: "ActedIn")
                runtime: Int!
            }
            
            type Series implements Production {
                title: String!
                actors: [Actor!]! @relationship(type: "ACTED_IN", direction: IN, properties: "ActedIn")
                episodes: Int!
            }
            
            interface ActedIn @relationshipProperties {
                role: String!
            }
            
            type Actor {
                name: String!
                actedIn: [Production!]! @relationship(type: "ACTED_IN", direction: OUT, properties: "ActedIn")
            }
        `;

        neoSchema = new Neo4jGraphQL({
            typeDefs,
        });
    });

    test("should use the provided node directive label in the call subquery", async () => {
        const query = gql`
            query GetProductionsMovie {
                actors {
                    actedIn(where: { _on: { Movie: { title: "Test Movie" } } }) {
                        title
                    }
                }
            }
        `;
        const result = await translateQuery(neoSchema, query);

        expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
            "MATCH (this:\`Actor\`)
            CALL {
                WITH this
                CALL {
                    WITH *
                    MATCH (this)-[this0:\`ACTED_IN\`]->(this1:\`Film\`)
                    WHERE this1.\`title\` = $param0
                    WITH this1 { __resolveType: \\"Movie\\", __id: id(this), .title } AS this1
                    RETURN this1 AS var2
                }
                WITH var2
                RETURN collect(var2) AS var2
            }
            RETURN this { actedIn: var2 } AS this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"param0\\": \\"Test Movie\\"
            }"
        `);
    });
});
