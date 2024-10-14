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

describe("Interface Relationships - Update connect", () => {
    let typeDefs: string;
    let neoSchema: Neo4jGraphQL;

    beforeAll(() => {
        typeDefs = /* GraphQL */ `
            interface Production {
                title: String!
                actors: [Actor!]! @declareRelationship
            }

            type Movie implements Production @node {
                title: String!
                runtime: Int!
                actors: [Actor!]! @relationship(type: "ACTED_IN", direction: IN, properties: "ActedIn")
            }

            type Series implements Production @node {
                title: String!
                episodes: Int!
                actors: [Actor!]! @relationship(type: "ACTED_IN", direction: IN, properties: "ActedIn")
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

    test("Update connect to an interface relationship", async () => {
        const query = /* GraphQL */ `
            mutation {
                updateActors(
                    update: {
                        actedIn: {
                            connect: { edge: { screenTime: 90 }, where: { node: { title_STARTS_WITH: "The " } } }
                        }
                    }
                ) {
                    actors {
                        name
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
            WITH *
            CALL {
            	WITH this
            	OPTIONAL MATCH (this_actedIn0_connect0_node:Movie)
            	WHERE this_actedIn0_connect0_node.title STARTS WITH $this_actedIn0_connect0_node_param0
            	CALL {
            		WITH *
            		WITH collect(this_actedIn0_connect0_node) as connectedNodes, collect(this) as parentNodes
            		CALL {
            			WITH connectedNodes, parentNodes
            			UNWIND parentNodes as this
            			UNWIND connectedNodes as this_actedIn0_connect0_node
            			MERGE (this)-[this_actedIn0_connect0_relationship:ACTED_IN]->(this_actedIn0_connect0_node)
            			SET this_actedIn0_connect0_relationship.screenTime = $this_actedIn0_connect0_relationship_screenTime
            		}
            	}
            WITH this, this_actedIn0_connect0_node
            	RETURN count(*) AS connect_this_actedIn0_connect_Movie0
            }
            RETURN count(*) AS update_this_Movie
            }
            CALL {
            	 WITH this
            	WITH *
            CALL {
            	WITH this
            	OPTIONAL MATCH (this_actedIn0_connect0_node:Series)
            	WHERE this_actedIn0_connect0_node.title STARTS WITH $this_actedIn0_connect0_node_param0
            	CALL {
            		WITH *
            		WITH collect(this_actedIn0_connect0_node) as connectedNodes, collect(this) as parentNodes
            		CALL {
            			WITH connectedNodes, parentNodes
            			UNWIND parentNodes as this
            			UNWIND connectedNodes as this_actedIn0_connect0_node
            			MERGE (this)-[this_actedIn0_connect0_relationship:ACTED_IN]->(this_actedIn0_connect0_node)
            			SET this_actedIn0_connect0_relationship.screenTime = $this_actedIn0_connect0_relationship_screenTime
            		}
            	}
            WITH this, this_actedIn0_connect0_node
            	RETURN count(*) AS connect_this_actedIn0_connect_Series0
            }
            RETURN count(*) AS update_this_Series
            }
            RETURN collect(DISTINCT this { .name }) AS data"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"this_actedIn0_connect0_node_param0\\": \\"The \\",
                \\"this_actedIn0_connect0_relationship_screenTime\\": {
                    \\"low\\": 90,
                    \\"high\\": 0
                },
                \\"resolvedCallbacks\\": {}
            }"
        `);
    });

    test("Update connect to an interface relationship and nested connect", async () => {
        const query = /* GraphQL */ `
            mutation {
                updateActors(
                    update: {
                        actedIn: {
                            connect: {
                                edge: { screenTime: 90 }
                                where: { node: { title_STARTS_WITH: "The " } }
                                connect: {
                                    actors: {
                                        edge: { ActedIn: { screenTime: 90 } }
                                        where: { node: { name_EQ: "Actor" } }
                                    }
                                }
                            }
                        }
                    }
                ) {
                    actors {
                        name
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
            WITH *
            CALL {
            	WITH this
            	OPTIONAL MATCH (this_actedIn0_connect0_node:Movie)
            	WHERE this_actedIn0_connect0_node.title STARTS WITH $this_actedIn0_connect0_node_param0
            	CALL {
            		WITH *
            		WITH collect(this_actedIn0_connect0_node) as connectedNodes, collect(this) as parentNodes
            		CALL {
            			WITH connectedNodes, parentNodes
            			UNWIND parentNodes as this
            			UNWIND connectedNodes as this_actedIn0_connect0_node
            			MERGE (this)-[this_actedIn0_connect0_relationship:ACTED_IN]->(this_actedIn0_connect0_node)
            			SET this_actedIn0_connect0_relationship.screenTime = $this_actedIn0_connect0_relationship_screenTime
            		}
            	}
            WITH this, this_actedIn0_connect0_node
            CALL {
            	WITH this, this_actedIn0_connect0_node
            	OPTIONAL MATCH (this_actedIn0_connect0_node_actors0_node:Actor)
            	WHERE this_actedIn0_connect0_node_actors0_node.name = $this_actedIn0_connect0_node_actors0_node_param0
            	CALL {
            		WITH *
            		WITH this, collect(this_actedIn0_connect0_node_actors0_node) as connectedNodes, collect(this_actedIn0_connect0_node) as parentNodes
            		CALL {
            			WITH connectedNodes, parentNodes
            			UNWIND parentNodes as this_actedIn0_connect0_node
            			UNWIND connectedNodes as this_actedIn0_connect0_node_actors0_node
            			MERGE (this_actedIn0_connect0_node)<-[this_actedIn0_connect0_node_actors0_relationship:ACTED_IN]-(this_actedIn0_connect0_node_actors0_node)
            			SET this_actedIn0_connect0_node_actors0_relationship.screenTime = $this_actedIn0_connect0_node_actors0_relationship_screenTime
            		}
            	}
            WITH this, this_actedIn0_connect0_node, this_actedIn0_connect0_node_actors0_node
            	RETURN count(*) AS connect_this_actedIn0_connect0_node_actors_Actor0
            }
            	RETURN count(*) AS connect_this_actedIn0_connect_Movie0
            }
            RETURN count(*) AS update_this_Movie
            }
            CALL {
            	 WITH this
            	WITH *
            CALL {
            	WITH this
            	OPTIONAL MATCH (this_actedIn0_connect0_node:Series)
            	WHERE this_actedIn0_connect0_node.title STARTS WITH $this_actedIn0_connect0_node_param0
            	CALL {
            		WITH *
            		WITH collect(this_actedIn0_connect0_node) as connectedNodes, collect(this) as parentNodes
            		CALL {
            			WITH connectedNodes, parentNodes
            			UNWIND parentNodes as this
            			UNWIND connectedNodes as this_actedIn0_connect0_node
            			MERGE (this)-[this_actedIn0_connect0_relationship:ACTED_IN]->(this_actedIn0_connect0_node)
            			SET this_actedIn0_connect0_relationship.screenTime = $this_actedIn0_connect0_relationship_screenTime
            		}
            	}
            WITH this, this_actedIn0_connect0_node
            CALL {
            	WITH this, this_actedIn0_connect0_node
            	OPTIONAL MATCH (this_actedIn0_connect0_node_actors0_node:Actor)
            	WHERE this_actedIn0_connect0_node_actors0_node.name = $this_actedIn0_connect0_node_actors0_node_param0
            	CALL {
            		WITH *
            		WITH this, collect(this_actedIn0_connect0_node_actors0_node) as connectedNodes, collect(this_actedIn0_connect0_node) as parentNodes
            		CALL {
            			WITH connectedNodes, parentNodes
            			UNWIND parentNodes as this_actedIn0_connect0_node
            			UNWIND connectedNodes as this_actedIn0_connect0_node_actors0_node
            			MERGE (this_actedIn0_connect0_node)<-[this_actedIn0_connect0_node_actors0_relationship:ACTED_IN]-(this_actedIn0_connect0_node_actors0_node)
            			SET this_actedIn0_connect0_node_actors0_relationship.screenTime = $this_actedIn0_connect0_node_actors0_relationship_screenTime
            		}
            	}
            WITH this, this_actedIn0_connect0_node, this_actedIn0_connect0_node_actors0_node
            	RETURN count(*) AS connect_this_actedIn0_connect0_node_actors_Actor0
            }
            	RETURN count(*) AS connect_this_actedIn0_connect_Series0
            }
            RETURN count(*) AS update_this_Series
            }
            RETURN collect(DISTINCT this { .name }) AS data"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"this_actedIn0_connect0_node_param0\\": \\"The \\",
                \\"this_actedIn0_connect0_relationship_screenTime\\": {
                    \\"low\\": 90,
                    \\"high\\": 0
                },
                \\"this_actedIn0_connect0_node_actors0_node_param0\\": \\"Actor\\",
                \\"this_actedIn0_connect0_node_actors0_relationship_screenTime\\": {
                    \\"low\\": 90,
                    \\"high\\": 0
                },
                \\"resolvedCallbacks\\": {}
            }"
        `);
    });
});
