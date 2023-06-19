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
import type { DocumentNode } from "graphql";
import { Neo4jGraphQL } from "../../../../../src";
import { formatCypher, translateQuery, formatParams } from "../../../utils/tck-test-utils";

describe("Cypher -> Connections -> Filtering -> Relationship -> Temporal", () => {
    let typeDefs: DocumentNode;
    let neoSchema: Neo4jGraphQL;

    beforeAll(() => {
        typeDefs = gql`
            type Movie {
                title: String!
                actors: [Actor!]! @relationship(type: "ACTED_IN", properties: "ActedIn", direction: IN)
            }

            type Actor {
                name: String!
                movies: [Movie!]! @relationship(type: "ACTED_IN", properties: "ActedIn", direction: OUT)
            }

            interface ActedIn {
                startDate: Date
                endDateTime: DateTime
            }
        `;

        neoSchema = new Neo4jGraphQL({
            typeDefs,
        });
    });

    test("GT and LT", async () => {
        const query = gql`
            query {
                movies {
                    title
                    actorsConnection(
                        where: { edge: { startDate_GT: "2000-01-01", endDateTime_LT: "2010-01-01T00:00:00.000Z" } }
                    ) {
                        edges {
                            startDate
                            endDateTime
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
            "MATCH (this:\`Movie\`)
            CALL {
                WITH this
                MATCH (this)<-[this0:ACTED_IN]-(this1:\`Actor\`)
                WHERE (this0.startDate > $param0 AND this0.endDateTime < $param1)
                WITH { startDate: this0.startDate, endDateTime: apoc.date.convertFormat(toString(this0.endDateTime), \\"iso_zoned_date_time\\", \\"iso_offset_date_time\\"), node: { name: this1.name } } AS edge
                WITH collect(edge) AS edges
                WITH edges, size(edges) AS totalCount
                RETURN { edges: edges, totalCount: totalCount } AS var2
            }
            RETURN this { .title, actorsConnection: var2 } AS this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"param0\\": {
                    \\"year\\": 2000,
                    \\"month\\": 1,
                    \\"day\\": 1
                },
                \\"param1\\": {
                    \\"year\\": 2010,
                    \\"month\\": 1,
                    \\"day\\": 1,
                    \\"hour\\": 0,
                    \\"minute\\": 0,
                    \\"second\\": 0,
                    \\"nanosecond\\": 0,
                    \\"timeZoneOffsetSeconds\\": 0
                }
            }"
        `);
    });
});
