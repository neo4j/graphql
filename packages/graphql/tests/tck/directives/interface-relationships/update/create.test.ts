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

describe("Interface Relationships - Update create", () => {
    let typeDefs: DocumentNode;
    let neoSchema: Neo4jGraphQL;

    beforeAll(() => {
        typeDefs = gql`
            interface Production {
                title: String!
            }

            type Movie implements Production {
                title: String!
                runtime: Int!
            }

            type Series implements Production {
                title: String!
                episodes: Int!
            }

            interface ActedIn @relationshipProperties {
                screenTime: Int!
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

    test("Update create an interface relationship", async () => {
        const query = gql`
            mutation {
                updateActors(
                    create: {
                        actedIn: { edge: { screenTime: 90 }, node: { Movie: { title: "Example Film", runtime: 90 } } }
                    }
                ) {
                    actors {
                        name
                        actedIn {
                            title
                            ... on Movie {
                                runtime
                            }
                            ... on Series {
                                episodes
                            }
                        }
                    }
                }
            }
        `;

        const result = await translateQuery(neoSchema, query);

        expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
            "MATCH (this:\`Actor\`)
            CREATE (this_create_actedIn_Movie0_node_Movie:Movie)
            SET this_create_actedIn_Movie0_node_Movie.title = $this_create_actedIn_Movie0_node_Movie_title
            SET this_create_actedIn_Movie0_node_Movie.runtime = $this_create_actedIn_Movie0_node_Movie_runtime
            MERGE (this)-[this_create_actedIn_Movie0_relationship:ACTED_IN]->(this_create_actedIn_Movie0_node_Movie)
            SET this_create_actedIn_Movie0_relationship.screenTime = $this_create_actedIn_Movie0_relationship_screenTime
            WITH *
            CALL {
                WITH this
                CALL {
                    WITH *
                    MATCH (this)-[update_this0:ACTED_IN]->(update_this1:\`Movie\`)
                    WITH update_this1 { __resolveType: \\"Movie\\", __id: id(this), .runtime, .title } AS update_this1
                    RETURN update_this1 AS update_var2
                    UNION
                    WITH *
                    MATCH (this)-[update_this3:ACTED_IN]->(update_this4:\`Series\`)
                    WITH update_this4 { __resolveType: \\"Series\\", __id: id(this), .episodes, .title } AS update_this4
                    RETURN update_this4 AS update_var2
                }
                WITH update_var2
                RETURN collect(update_var2) AS update_var2
            }
            RETURN collect(DISTINCT this { .name, actedIn: update_var2 }) AS data"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"this_create_actedIn_Movie0_node_Movie_title\\": \\"Example Film\\",
                \\"this_create_actedIn_Movie0_node_Movie_runtime\\": {
                    \\"low\\": 90,
                    \\"high\\": 0
                },
                \\"this_create_actedIn_Movie0_relationship_screenTime\\": {
                    \\"low\\": 90,
                    \\"high\\": 0
                },
                \\"resolvedCallbacks\\": {}
            }"
        `);
    });
});
