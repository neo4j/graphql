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

import type { DocumentNode } from "graphql";
import { Neo4jGraphQL } from "../../../../../src";
import { formatCypher, formatParams, translateQuery } from "../../../utils/tck-test-utils";

describe("Interface Relationships - Create create", () => {
    let typeDefs: string;
    let neoSchema: Neo4jGraphQL;

    beforeAll(() => {
        typeDefs = /* GraphQL */ `
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

            type ActedIn @relationshipProperties {
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

    test("Create create an interface relationship", async () => {
        const query = /* GraphQL */ `
            mutation {
                createActors(
                    input: [
                        {
                            name: "Actor Name"
                            actedIn: {
                                create: {
                                    edge: { screenTime: 90 }
                                    node: { Movie: { title: "Example Film", runtime: 90 } }
                                }
                            }
                        }
                    ]
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
            "CALL {
            CREATE (this0:Actor)
            SET this0.name = $this0_name
            WITH *
            CREATE (this0_actedInMovie0_node:Movie)
            SET this0_actedInMovie0_node.title = $this0_actedInMovie0_node_title
            SET this0_actedInMovie0_node.runtime = $this0_actedInMovie0_node_runtime
            MERGE (this0)-[this0_actedInMovie0_relationship:ACTED_IN]->(this0_actedInMovie0_node)
            SET this0_actedInMovie0_relationship.screenTime = $this0_actedInMovie0_relationship_screenTime
            RETURN this0
            }
            CALL {
                WITH this0
                CALL {
                    WITH this0
                    CALL {
                        WITH *
                        MATCH (this0)-[create_this0:ACTED_IN]->(create_this1:Movie)
                        WITH create_this1 { .title, .runtime, __resolveType: \\"Movie\\", __id: id(create_this1) } AS create_this1
                        RETURN create_this1 AS create_var2
                        UNION
                        WITH *
                        MATCH (this0)-[create_this3:ACTED_IN]->(create_this4:Series)
                        WITH create_this4 { .title, .episodes, __resolveType: \\"Series\\", __id: id(create_this4) } AS create_this4
                        RETURN create_this4 AS create_var2
                    }
                    WITH create_var2
                    RETURN collect(create_var2) AS create_var2
                }
                RETURN this0 { .name, actedIn: create_var2 } AS create_var5
            }
            RETURN [create_var5] AS data"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"this0_name\\": \\"Actor Name\\",
                \\"this0_actedInMovie0_node_title\\": \\"Example Film\\",
                \\"this0_actedInMovie0_node_runtime\\": {
                    \\"low\\": 90,
                    \\"high\\": 0
                },
                \\"this0_actedInMovie0_relationship_screenTime\\": {
                    \\"low\\": 90,
                    \\"high\\": 0
                },
                \\"resolvedCallbacks\\": {}
            }"
        `);
    });
});
