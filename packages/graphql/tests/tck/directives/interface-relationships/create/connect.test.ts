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
import type { DocumentNode } from "graphql";
import { Neo4jGraphQL } from "../../../../../src";
import { createJwtRequest } from "../../../../utils/create-jwt-request";
import { formatCypher, translateQuery, formatParams } from "../../../utils/tck-test-utils";

describe("Interface Relationships - Create connect", () => {
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

    test("Create connect to an interface relationship", async () => {
        const query = gql`
            mutation {
                createActors(
                    input: [
                        {
                            name: "Actor Name"
                            actedIn: {
                                connect: { edge: { screenTime: 90 }, where: { node: { title_STARTS_WITH: "The " } } }
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

        const req = createJwtRequest("secret", {});
        const result = await translateQuery(neoSchema, query, {
            req,
        });

        expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
            "CALL {
            CREATE (this0:Actor)
            SET this0.name = $this0_name
            WITH this0
            CALL {
            	WITH this0
            	OPTIONAL MATCH (this0_actedIn_connect0_node:Movie)
            	WHERE this0_actedIn_connect0_node.title STARTS WITH $this0_actedIn_connect0_node_param0
            	CALL {
            		WITH *
            		WITH collect(this0_actedIn_connect0_node) as connectedNodes, collect(this0) as parentNodes
            		CALL {
            			WITH connectedNodes, parentNodes
            			UNWIND parentNodes as this0
            			UNWIND connectedNodes as this0_actedIn_connect0_node
            			MERGE (this0)-[this0_actedIn_connect0_relationship:\`ACTED_IN\`]->(this0_actedIn_connect0_node)
            			SET this0_actedIn_connect0_relationship.screenTime = $this0_actedIn_connect0_relationship_screenTime
            		}
            	}
            WITH this0, this0_actedIn_connect0_node
            	RETURN count(*) AS connect_this0_actedIn_connect_Movie
            }
            CALL {
            		WITH this0
            	OPTIONAL MATCH (this0_actedIn_connect1_node:Series)
            	WHERE this0_actedIn_connect1_node.title STARTS WITH $this0_actedIn_connect1_node_param0
            	CALL {
            		WITH *
            		WITH collect(this0_actedIn_connect1_node) as connectedNodes, collect(this0) as parentNodes
            		CALL {
            			WITH connectedNodes, parentNodes
            			UNWIND parentNodes as this0
            			UNWIND connectedNodes as this0_actedIn_connect1_node
            			MERGE (this0)-[this0_actedIn_connect1_relationship:\`ACTED_IN\`]->(this0_actedIn_connect1_node)
            			SET this0_actedIn_connect1_relationship.screenTime = $this0_actedIn_connect1_relationship_screenTime
            		}
            	}
            WITH this0, this0_actedIn_connect1_node
            	RETURN count(*) AS connect_this0_actedIn_connect_Series
            }
            RETURN this0
            }
            CALL {
                WITH this0
                CALL {
                    WITH *
                    MATCH (this0)-[create_this0:\`ACTED_IN\`]->(create_this1:\`Movie\`)
                    WITH create_this1 { __resolveType: \\"Movie\\", __id: id(this0), .runtime, .title } AS create_this1
                    RETURN create_this1 AS create_var2
                    UNION
                    WITH *
                    MATCH (this0)-[create_this3:\`ACTED_IN\`]->(create_this4:\`Series\`)
                    WITH create_this4 { __resolveType: \\"Series\\", __id: id(this0), .episodes, .title } AS create_this4
                    RETURN create_this4 AS create_var2
                }
                WITH create_var2
                RETURN collect(create_var2) AS create_var2
            }
            RETURN [ this0 { .name, actedIn: create_var2 } ] AS data"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"this0_name\\": \\"Actor Name\\",
                \\"this0_actedIn_connect0_node_param0\\": \\"The \\",
                \\"this0_actedIn_connect0_relationship_screenTime\\": {
                    \\"low\\": 90,
                    \\"high\\": 0
                },
                \\"this0_actedIn_connect1_node_param0\\": \\"The \\",
                \\"this0_actedIn_connect1_relationship_screenTime\\": {
                    \\"low\\": 90,
                    \\"high\\": 0
                },
                \\"resolvedCallbacks\\": {}
            }"
        `);
    });
});
