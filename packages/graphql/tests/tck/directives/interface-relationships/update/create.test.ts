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

describe("Interface Relationships - Update create", () => {
    let typeDefs: string;
    let neoSchema: Neo4jGraphQL;

    beforeAll(() => {
        typeDefs = /* GraphQL */ `
            interface Production {
                title: String!
            }

            type Movie implements Production @node {
                title: String!
                runtime: Int!
            }

            type Series implements Production @node {
                title: String!
                episodes: Int!
            }

            type ActedIn @relationshipProperties {
                screenTime: Int!
            }

            type Actor @node {
                name: String!
                actedIn: [Production!]! @relationship(type: "ACTED_IN", direction: OUT, properties: "ActedIn")
            }
        `;

        neoSchema = new Neo4jGraphQL({
            typeDefs,
        });
    });

    test("Update create an interface relationship", async () => {
        const query = /* GraphQL */ `
            mutation {
                updateActors(
                    update: {
                        actedIn: {
                            create: {
                                edge: { screenTime: 90 }
                                node: { Movie: { title: "Example Film", runtime: 90 } }
                            }
                        }
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
            "MATCH (this:Actor)
            WITH this
            CALL {
            	 WITH this
            WITH this
            CREATE (this_actedIn0_create0_node:Movie)
            SET this_actedIn0_create0_node.title = $this_actedIn0_create0_node_title
            SET this_actedIn0_create0_node.runtime = $this_actedIn0_create0_node_runtime
            MERGE (this)-[this_actedIn0_create0_relationship:ACTED_IN]->(this_actedIn0_create0_node)
            SET this_actedIn0_create0_relationship.screenTime = $updateActors.args.update.actedIn[0].create[0].edge.screenTime
            RETURN count(*) AS update_this_Movie
            }
            CALL {
            	 WITH this
            	WITH this
            RETURN count(*) AS update_this_Series
            }
            WITH *
            CALL {
                WITH this
                CALL {
                    WITH *
                    MATCH (this)-[update_this0:ACTED_IN]->(update_this1:Movie)
                    WITH update_this1 { .title, .runtime, __resolveType: \\"Movie\\", __id: id(update_this1) } AS update_this1
                    RETURN update_this1 AS update_var2
                    UNION
                    WITH *
                    MATCH (this)-[update_this3:ACTED_IN]->(update_this4:Series)
                    WITH update_this4 { .title, .episodes, __resolveType: \\"Series\\", __id: id(update_this4) } AS update_this4
                    RETURN update_this4 AS update_var2
                }
                WITH update_var2
                RETURN collect(update_var2) AS update_var2
            }
            RETURN collect(DISTINCT this { .name, actedIn: update_var2 }) AS data"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"this_actedIn0_create0_node_title\\": \\"Example Film\\",
                \\"this_actedIn0_create0_node_runtime\\": {
                    \\"low\\": 90,
                    \\"high\\": 0
                },
                \\"updateActors\\": {
                    \\"args\\": {
                        \\"update\\": {
                            \\"actedIn\\": [
                                {
                                    \\"create\\": [
                                        {
                                            \\"edge\\": {
                                                \\"screenTime\\": {
                                                    \\"low\\": 90,
                                                    \\"high\\": 0
                                                }
                                            },
                                            \\"node\\": {
                                                \\"Movie\\": {
                                                    \\"title\\": \\"Example Film\\",
                                                    \\"runtime\\": {
                                                        \\"low\\": 90,
                                                        \\"high\\": 0
                                                    }
                                                }
                                            }
                                        }
                                    ]
                                }
                            ]
                        }
                    }
                },
                \\"resolvedCallbacks\\": {}
            }"
        `);
    });
});
