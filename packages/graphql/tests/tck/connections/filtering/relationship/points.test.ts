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
import { formatCypher, formatParams, translateQuery } from "../../../utils/tck-test-utils";

describe("Cypher -> Connections -> Filtering -> Relationship -> Points", () => {
    let typeDefs: string;
    let neoSchema: Neo4jGraphQL;

    beforeAll(() => {
        typeDefs = /* GraphQL */ `
            type Movie {
                title: String!
                actors: [Actor!]! @relationship(type: "ACTED_IN", properties: "ActedIn", direction: IN)
            }

            type Actor {
                name: String!
                movies: [Movie!]! @relationship(type: "ACTED_IN", properties: "ActedIn", direction: OUT)
            }

            type ActedIn @relationshipProperties {
                screenTime: Int!
                location: Point!
            }
        `;

        neoSchema = new Neo4jGraphQL({
            typeDefs,
        });
    });

    test("DISTANCE", async () => {
        let verifyTCK;

        if (process.env.VERIFY_TCK) {
            verifyTCK = process.env.VERIFY_TCK;
            delete process.env.VERIFY_TCK;
        }

        const query = /* GraphQL */ `
            query {
                movies {
                    title
                    actorsConnection(
                        where: {
                            edge: { location_DISTANCE: { point: { longitude: 1.0, latitude: 2.0 }, distance: 3.0 } }
                        }
                    ) {
                        edges {
                            properties {
                                screenTime
                                location {
                                    latitude
                                    longitude
                                }
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
            "MATCH (this:Movie)
            CALL {
                WITH this
                MATCH (this)<-[this0:ACTED_IN]-(this1:Actor)
                WHERE point.distance(this0.location, point($param0.point)) = $param0.distance
                WITH collect({ node: this1, relationship: this0 }) AS edges
                WITH edges, size(edges) AS totalCount
                CALL {
                    WITH edges
                    UNWIND edges AS edge
                    WITH edge.node AS this1, edge.relationship AS this0
                    RETURN collect({ properties: { screenTime: this0.screenTime, location: this0.location, __resolveType: \\"ActedIn\\" }, node: { name: this1.name, __resolveType: \\"Actor\\" } }) AS var2
                }
                RETURN { edges: var2, totalCount: totalCount } AS var3
            }
            RETURN this { .title, actorsConnection: var3 } AS this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"param0\\": {
                    \\"point\\": {
                        \\"longitude\\": 1,
                        \\"latitude\\": 2
                    },
                    \\"distance\\": 3
                }
            }"
        `);

        if (verifyTCK) {
            process.env.VERIFY_TCK = verifyTCK;
        }
    });
});
