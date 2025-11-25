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

import { Neo4jGraphQL } from "../../../../src";
import { formatCypher, formatParams, translateQuery } from "../../utils/tck-test-utils";

describe("Cypher -> Connections -> Relationship Properties -> Update", () => {
    let typeDefs: string;
    let neoSchema: Neo4jGraphQL;

    beforeAll(() => {
        typeDefs = /* GraphQL */ `
            type Movie @node {
                title: String!
                actors: [Actor!]! @relationship(type: "ACTED_IN", properties: "ActedIn", direction: IN)
            }

            type Actor @node {
                name: String!
                movies: [Movie!]! @relationship(type: "ACTED_IN", properties: "ActedIn", direction: OUT)
            }

            type ActedIn @relationshipProperties {
                screenTime: Int!
            }
        `;

        neoSchema = new Neo4jGraphQL({
            typeDefs,
        });
    });

    test("Update a relationship property on a relationship between two specified nodes (update -> update)", async () => {
        const query = /* GraphQL */ `
            mutation {
                updateMovies(
                    where: { title: { eq: "Forrest Gump" } }
                    update: {
                        actors: [
                            { update: { where: { node: { name: { eq: "Tom Hanks" } } }, edge: { screenTime_SET: 60 } } }
                        ]
                    }
                ) {
                    movies {
                        title
                    }
                }
            }
        `;

        const result = await translateQuery(neoSchema, query);

        expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
            "CYPHER 5
            MATCH (this:Movie)
            WITH *
            WHERE this.title = $param0
            WITH *
            CALL (*) {
                MATCH (this)<-[this0:ACTED_IN]-(this1:Actor)
                WITH *
                WHERE this1.name = $param1
                SET
                    this0.screenTime = $param2
            }
            WITH this
            RETURN this { .title } AS this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"param0\\": \\"Forrest Gump\\",
                \\"param1\\": \\"Tom Hanks\\",
                \\"param2\\": {
                    \\"low\\": 60,
                    \\"high\\": 0
                }
            }"
        `);
    });

    test("Update properties on both the relationship and end node in a nested update (update -> update)", async () => {
        const query = /* GraphQL */ `
            mutation {
                updateMovies(
                    where: { title: { eq: "Forrest Gump" } }
                    update: {
                        actors: [
                            {
                                update: {
                                    where: { node: { name: { eq: "Tom Hanks" } } }
                                    edge: { screenTime_SET: 60 }
                                    node: { name_SET: "Tom Hanks" }
                                }
                            }
                        ]
                    }
                ) {
                    movies {
                        title
                    }
                }
            }
        `;

        const result = await translateQuery(neoSchema, query);

        expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
            "CYPHER 5
            MATCH (this:Movie)
            WITH *
            WHERE this.title = $param0
            WITH *
            CALL (*) {
                MATCH (this)<-[this0:ACTED_IN]-(this1:Actor)
                WITH *
                WHERE this1.name = $param1
                SET
                    this1.name = $param2,
                    this0.screenTime = $param3
            }
            WITH this
            RETURN this { .title } AS this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"param0\\": \\"Forrest Gump\\",
                \\"param1\\": \\"Tom Hanks\\",
                \\"param2\\": \\"Tom Hanks\\",
                \\"param3\\": {
                    \\"low\\": 60,
                    \\"high\\": 0
                }
            }"
        `);
    });
});
