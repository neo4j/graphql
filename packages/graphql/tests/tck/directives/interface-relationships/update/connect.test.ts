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

describe("Interface Relationships - Update connect", () => {
    let typeDefs: DocumentNode;
    let neoSchema: Neo4jGraphQL;

    beforeAll(() => {
        typeDefs = gql`
            interface Production {
                title: String!
                actors: [Actor!]! @relationship(type: "ACTED_IN", direction: IN, properties: "ActedIn")
            }

            type Movie implements Production {
                title: String!
                runtime: Int!
                actors: [Actor!]!
            }

            type Series implements Production {
                title: String!
                episodes: Int!
                actors: [Actor!]!
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

    test("Update connect to an interface relationship", async () => {
        const query = gql`
            mutation {
                updateActors(
                    connect: { actedIn: { edge: { screenTime: 90 }, where: { node: { title_STARTS_WITH: "The " } } } }
                ) {
                    actors {
                        name
                    }
                }
            }
        `;

        const result = await translateQuery(neoSchema, query);

        expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
            "MATCH (this:\`Actor\`)
            WITH this
            CALL {
            	WITH this
            	OPTIONAL MATCH (this_connect_actedIn0_node:Movie)
            	WHERE this_connect_actedIn0_node.title STARTS WITH $this_connect_actedIn0_node_param0
            	CALL {
            		WITH *
            		WITH collect(this_connect_actedIn0_node) as connectedNodes, collect(this) as parentNodes
            		CALL {
            			WITH connectedNodes, parentNodes
            			UNWIND parentNodes as this
            			UNWIND connectedNodes as this_connect_actedIn0_node
            			MERGE (this)-[this_connect_actedIn0_relationship:ACTED_IN]->(this_connect_actedIn0_node)
            			SET this_connect_actedIn0_relationship.screenTime = $this_connect_actedIn0_relationship_screenTime
            			RETURN count(*) AS _
            		}
            		RETURN count(*) AS _
            	}
            WITH this, this_connect_actedIn0_node
            	RETURN count(*) AS connect_this_connect_actedIn_Movie
            }
            CALL {
            		WITH this
            	OPTIONAL MATCH (this_connect_actedIn1_node:Series)
            	WHERE this_connect_actedIn1_node.title STARTS WITH $this_connect_actedIn1_node_param0
            	CALL {
            		WITH *
            		WITH collect(this_connect_actedIn1_node) as connectedNodes, collect(this) as parentNodes
            		CALL {
            			WITH connectedNodes, parentNodes
            			UNWIND parentNodes as this
            			UNWIND connectedNodes as this_connect_actedIn1_node
            			MERGE (this)-[this_connect_actedIn1_relationship:ACTED_IN]->(this_connect_actedIn1_node)
            			SET this_connect_actedIn1_relationship.screenTime = $this_connect_actedIn1_relationship_screenTime
            			RETURN count(*) AS _
            		}
            		RETURN count(*) AS _
            	}
            WITH this, this_connect_actedIn1_node
            	RETURN count(*) AS connect_this_connect_actedIn_Series
            }
            WITH *
            RETURN collect(DISTINCT this { .name }) AS data"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"this_connect_actedIn0_node_param0\\": \\"The \\",
                \\"this_connect_actedIn0_relationship_screenTime\\": {
                    \\"low\\": 90,
                    \\"high\\": 0
                },
                \\"this_connect_actedIn1_node_param0\\": \\"The \\",
                \\"this_connect_actedIn1_relationship_screenTime\\": {
                    \\"low\\": 90,
                    \\"high\\": 0
                },
                \\"resolvedCallbacks\\": {}
            }"
        `);
    });

    test("Update connect to an interface relationship and nested connect", async () => {
        const query = gql`
            mutation {
                updateActors(
                    connect: {
                        actedIn: {
                            edge: { screenTime: 90 }
                            where: { node: { title_STARTS_WITH: "The " } }
                            connect: { actors: { edge: { screenTime: 90 }, where: { node: { name: "Actor" } } } }
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
            "MATCH (this:\`Actor\`)
            WITH this
            CALL {
            	WITH this
            	OPTIONAL MATCH (this_connect_actedIn0_node:Movie)
            	WHERE this_connect_actedIn0_node.title STARTS WITH $this_connect_actedIn0_node_param0
            	CALL {
            		WITH *
            		WITH collect(this_connect_actedIn0_node) as connectedNodes, collect(this) as parentNodes
            		CALL {
            			WITH connectedNodes, parentNodes
            			UNWIND parentNodes as this
            			UNWIND connectedNodes as this_connect_actedIn0_node
            			MERGE (this)-[this_connect_actedIn0_relationship:ACTED_IN]->(this_connect_actedIn0_node)
            			SET this_connect_actedIn0_relationship.screenTime = $this_connect_actedIn0_relationship_screenTime
            			RETURN count(*) AS _
            		}
            		RETURN count(*) AS _
            	}
            WITH this, this_connect_actedIn0_node
            CALL {
            	WITH this, this_connect_actedIn0_node
            	OPTIONAL MATCH (this_connect_actedIn0_node_actors0_node:Actor)
            	WHERE this_connect_actedIn0_node_actors0_node.name = $this_connect_actedIn0_node_actors0_node_param0
            	CALL {
            		WITH *
            		WITH this, collect(this_connect_actedIn0_node_actors0_node) as connectedNodes, collect(this_connect_actedIn0_node) as parentNodes
            		CALL {
            			WITH connectedNodes, parentNodes
            			UNWIND parentNodes as this_connect_actedIn0_node
            			UNWIND connectedNodes as this_connect_actedIn0_node_actors0_node
            			MERGE (this_connect_actedIn0_node)<-[this_connect_actedIn0_node_actors0_relationship:ACTED_IN]-(this_connect_actedIn0_node_actors0_node)
            			SET this_connect_actedIn0_node_actors0_relationship.screenTime = $this_connect_actedIn0_node_actors0_relationship_screenTime
            			RETURN count(*) AS _
            		}
            		RETURN count(*) AS _
            	}
            WITH this, this_connect_actedIn0_node, this_connect_actedIn0_node_actors0_node
            	RETURN count(*) AS connect_this_connect_actedIn0_node_actors_Actor
            }
            	RETURN count(*) AS connect_this_connect_actedIn_Movie
            }
            CALL {
            		WITH this
            	OPTIONAL MATCH (this_connect_actedIn1_node:Series)
            	WHERE this_connect_actedIn1_node.title STARTS WITH $this_connect_actedIn1_node_param0
            	CALL {
            		WITH *
            		WITH collect(this_connect_actedIn1_node) as connectedNodes, collect(this) as parentNodes
            		CALL {
            			WITH connectedNodes, parentNodes
            			UNWIND parentNodes as this
            			UNWIND connectedNodes as this_connect_actedIn1_node
            			MERGE (this)-[this_connect_actedIn1_relationship:ACTED_IN]->(this_connect_actedIn1_node)
            			SET this_connect_actedIn1_relationship.screenTime = $this_connect_actedIn1_relationship_screenTime
            			RETURN count(*) AS _
            		}
            		RETURN count(*) AS _
            	}
            WITH this, this_connect_actedIn1_node
            CALL {
            	WITH this, this_connect_actedIn1_node
            	OPTIONAL MATCH (this_connect_actedIn1_node_actors0_node:Actor)
            	WHERE this_connect_actedIn1_node_actors0_node.name = $this_connect_actedIn1_node_actors0_node_param0
            	CALL {
            		WITH *
            		WITH this, collect(this_connect_actedIn1_node_actors0_node) as connectedNodes, collect(this_connect_actedIn1_node) as parentNodes
            		CALL {
            			WITH connectedNodes, parentNodes
            			UNWIND parentNodes as this_connect_actedIn1_node
            			UNWIND connectedNodes as this_connect_actedIn1_node_actors0_node
            			MERGE (this_connect_actedIn1_node)<-[this_connect_actedIn1_node_actors0_relationship:ACTED_IN]-(this_connect_actedIn1_node_actors0_node)
            			SET this_connect_actedIn1_node_actors0_relationship.screenTime = $this_connect_actedIn1_node_actors0_relationship_screenTime
            			RETURN count(*) AS _
            		}
            		RETURN count(*) AS _
            	}
            WITH this, this_connect_actedIn1_node, this_connect_actedIn1_node_actors0_node
            	RETURN count(*) AS connect_this_connect_actedIn1_node_actors_Actor
            }
            	RETURN count(*) AS connect_this_connect_actedIn_Series
            }
            WITH *
            RETURN collect(DISTINCT this { .name }) AS data"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"this_connect_actedIn0_node_param0\\": \\"The \\",
                \\"this_connect_actedIn0_relationship_screenTime\\": {
                    \\"low\\": 90,
                    \\"high\\": 0
                },
                \\"this_connect_actedIn0_node_actors0_node_param0\\": \\"Actor\\",
                \\"this_connect_actedIn0_node_actors0_relationship_screenTime\\": {
                    \\"low\\": 90,
                    \\"high\\": 0
                },
                \\"this_connect_actedIn1_node_param0\\": \\"The \\",
                \\"this_connect_actedIn1_relationship_screenTime\\": {
                    \\"low\\": 90,
                    \\"high\\": 0
                },
                \\"this_connect_actedIn1_node_actors0_node_param0\\": \\"Actor\\",
                \\"this_connect_actedIn1_node_actors0_relationship_screenTime\\": {
                    \\"low\\": 90,
                    \\"high\\": 0
                },
                \\"resolvedCallbacks\\": {}
            }"
        `);
    });

    test("Update connect to an interface relationship and nested connect using _on to connect only one implementation", async () => {
        const query = gql`
            mutation {
                updateActors(
                    connect: {
                        actedIn: {
                            edge: { screenTime: 90 }
                            where: { node: { title_STARTS_WITH: "The " } }
                            connect: {
                                _on: {
                                    Movie: { actors: { edge: { screenTime: 90 }, where: { node: { name: "Actor" } } } }
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
            "MATCH (this:\`Actor\`)
            WITH this
            CALL {
            	WITH this
            	OPTIONAL MATCH (this_connect_actedIn0_node:Movie)
            	WHERE this_connect_actedIn0_node.title STARTS WITH $this_connect_actedIn0_node_param0
            	CALL {
            		WITH *
            		WITH collect(this_connect_actedIn0_node) as connectedNodes, collect(this) as parentNodes
            		CALL {
            			WITH connectedNodes, parentNodes
            			UNWIND parentNodes as this
            			UNWIND connectedNodes as this_connect_actedIn0_node
            			MERGE (this)-[this_connect_actedIn0_relationship:ACTED_IN]->(this_connect_actedIn0_node)
            			SET this_connect_actedIn0_relationship.screenTime = $this_connect_actedIn0_relationship_screenTime
            			RETURN count(*) AS _
            		}
            		RETURN count(*) AS _
            	}
            WITH this, this_connect_actedIn0_node
            CALL {
            	WITH this, this_connect_actedIn0_node
            	OPTIONAL MATCH (this_connect_actedIn0_node_on_Movie0_actors0_node:Actor)
            	WHERE this_connect_actedIn0_node_on_Movie0_actors0_node.name = $this_connect_actedIn0_node_on_Movie0_actors0_node_param0
            	CALL {
            		WITH *
            		WITH this, collect(this_connect_actedIn0_node_on_Movie0_actors0_node) as connectedNodes, collect(this_connect_actedIn0_node) as parentNodes
            		CALL {
            			WITH connectedNodes, parentNodes
            			UNWIND parentNodes as this_connect_actedIn0_node
            			UNWIND connectedNodes as this_connect_actedIn0_node_on_Movie0_actors0_node
            			MERGE (this_connect_actedIn0_node)<-[this_connect_actedIn0_node_on_Movie0_actors0_relationship:ACTED_IN]-(this_connect_actedIn0_node_on_Movie0_actors0_node)
            			SET this_connect_actedIn0_node_on_Movie0_actors0_relationship.screenTime = $this_connect_actedIn0_node_on_Movie0_actors0_relationship_screenTime
            			RETURN count(*) AS _
            		}
            		RETURN count(*) AS _
            	}
            WITH this, this_connect_actedIn0_node, this_connect_actedIn0_node_on_Movie0_actors0_node
            	RETURN count(*) AS connect_this_connect_actedIn0_node_on_Movie0_actors_Actor
            }
            	RETURN count(*) AS connect_this_connect_actedIn_Movie
            }
            CALL {
            		WITH this
            	OPTIONAL MATCH (this_connect_actedIn1_node:Series)
            	WHERE this_connect_actedIn1_node.title STARTS WITH $this_connect_actedIn1_node_param0
            	CALL {
            		WITH *
            		WITH collect(this_connect_actedIn1_node) as connectedNodes, collect(this) as parentNodes
            		CALL {
            			WITH connectedNodes, parentNodes
            			UNWIND parentNodes as this
            			UNWIND connectedNodes as this_connect_actedIn1_node
            			MERGE (this)-[this_connect_actedIn1_relationship:ACTED_IN]->(this_connect_actedIn1_node)
            			SET this_connect_actedIn1_relationship.screenTime = $this_connect_actedIn1_relationship_screenTime
            			RETURN count(*) AS _
            		}
            		RETURN count(*) AS _
            	}
            WITH this, this_connect_actedIn1_node
            	RETURN count(*) AS connect_this_connect_actedIn_Series
            }
            WITH *
            RETURN collect(DISTINCT this { .name }) AS data"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"this_connect_actedIn0_node_param0\\": \\"The \\",
                \\"this_connect_actedIn0_relationship_screenTime\\": {
                    \\"low\\": 90,
                    \\"high\\": 0
                },
                \\"this_connect_actedIn0_node_on_Movie0_actors0_node_param0\\": \\"Actor\\",
                \\"this_connect_actedIn0_node_on_Movie0_actors0_relationship_screenTime\\": {
                    \\"low\\": 90,
                    \\"high\\": 0
                },
                \\"this_connect_actedIn1_node_param0\\": \\"The \\",
                \\"this_connect_actedIn1_relationship_screenTime\\": {
                    \\"low\\": 90,
                    \\"high\\": 0
                },
                \\"resolvedCallbacks\\": {}
            }"
        `);
    });

    test("Update connect to an interface relationship and nested connect using _on to override connection", async () => {
        const query = gql`
            mutation {
                updateActors(
                    connect: {
                        actedIn: {
                            edge: { screenTime: 90 }
                            where: { node: { title_STARTS_WITH: "The " } }
                            connect: {
                                actors: { edge: { screenTime: 90 }, where: { node: { name: "Actor" } } }
                                _on: {
                                    Movie: {
                                        actors: {
                                            edge: { screenTime: 90 }
                                            where: { node: { name: "Different Actor" } }
                                        }
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
            "MATCH (this:\`Actor\`)
            WITH this
            CALL {
            	WITH this
            	OPTIONAL MATCH (this_connect_actedIn0_node:Movie)
            	WHERE this_connect_actedIn0_node.title STARTS WITH $this_connect_actedIn0_node_param0
            	CALL {
            		WITH *
            		WITH collect(this_connect_actedIn0_node) as connectedNodes, collect(this) as parentNodes
            		CALL {
            			WITH connectedNodes, parentNodes
            			UNWIND parentNodes as this
            			UNWIND connectedNodes as this_connect_actedIn0_node
            			MERGE (this)-[this_connect_actedIn0_relationship:ACTED_IN]->(this_connect_actedIn0_node)
            			SET this_connect_actedIn0_relationship.screenTime = $this_connect_actedIn0_relationship_screenTime
            			RETURN count(*) AS _
            		}
            		RETURN count(*) AS _
            	}
            WITH this, this_connect_actedIn0_node
            CALL {
            	WITH this, this_connect_actedIn0_node
            	OPTIONAL MATCH (this_connect_actedIn0_node_on_Movie0_actors0_node:Actor)
            	WHERE this_connect_actedIn0_node_on_Movie0_actors0_node.name = $this_connect_actedIn0_node_on_Movie0_actors0_node_param0
            	CALL {
            		WITH *
            		WITH this, collect(this_connect_actedIn0_node_on_Movie0_actors0_node) as connectedNodes, collect(this_connect_actedIn0_node) as parentNodes
            		CALL {
            			WITH connectedNodes, parentNodes
            			UNWIND parentNodes as this_connect_actedIn0_node
            			UNWIND connectedNodes as this_connect_actedIn0_node_on_Movie0_actors0_node
            			MERGE (this_connect_actedIn0_node)<-[this_connect_actedIn0_node_on_Movie0_actors0_relationship:ACTED_IN]-(this_connect_actedIn0_node_on_Movie0_actors0_node)
            			SET this_connect_actedIn0_node_on_Movie0_actors0_relationship.screenTime = $this_connect_actedIn0_node_on_Movie0_actors0_relationship_screenTime
            			RETURN count(*) AS _
            		}
            		RETURN count(*) AS _
            	}
            WITH this, this_connect_actedIn0_node, this_connect_actedIn0_node_on_Movie0_actors0_node
            	RETURN count(*) AS connect_this_connect_actedIn0_node_on_Movie0_actors_Actor
            }
            	RETURN count(*) AS connect_this_connect_actedIn_Movie
            }
            CALL {
            		WITH this
            	OPTIONAL MATCH (this_connect_actedIn1_node:Series)
            	WHERE this_connect_actedIn1_node.title STARTS WITH $this_connect_actedIn1_node_param0
            	CALL {
            		WITH *
            		WITH collect(this_connect_actedIn1_node) as connectedNodes, collect(this) as parentNodes
            		CALL {
            			WITH connectedNodes, parentNodes
            			UNWIND parentNodes as this
            			UNWIND connectedNodes as this_connect_actedIn1_node
            			MERGE (this)-[this_connect_actedIn1_relationship:ACTED_IN]->(this_connect_actedIn1_node)
            			SET this_connect_actedIn1_relationship.screenTime = $this_connect_actedIn1_relationship_screenTime
            			RETURN count(*) AS _
            		}
            		RETURN count(*) AS _
            	}
            WITH this, this_connect_actedIn1_node
            CALL {
            	WITH this, this_connect_actedIn1_node
            	OPTIONAL MATCH (this_connect_actedIn1_node_actors0_node:Actor)
            	WHERE this_connect_actedIn1_node_actors0_node.name = $this_connect_actedIn1_node_actors0_node_param0
            	CALL {
            		WITH *
            		WITH this, collect(this_connect_actedIn1_node_actors0_node) as connectedNodes, collect(this_connect_actedIn1_node) as parentNodes
            		CALL {
            			WITH connectedNodes, parentNodes
            			UNWIND parentNodes as this_connect_actedIn1_node
            			UNWIND connectedNodes as this_connect_actedIn1_node_actors0_node
            			MERGE (this_connect_actedIn1_node)<-[this_connect_actedIn1_node_actors0_relationship:ACTED_IN]-(this_connect_actedIn1_node_actors0_node)
            			SET this_connect_actedIn1_node_actors0_relationship.screenTime = $this_connect_actedIn1_node_actors0_relationship_screenTime
            			RETURN count(*) AS _
            		}
            		RETURN count(*) AS _
            	}
            WITH this, this_connect_actedIn1_node, this_connect_actedIn1_node_actors0_node
            	RETURN count(*) AS connect_this_connect_actedIn1_node_actors_Actor
            }
            	RETURN count(*) AS connect_this_connect_actedIn_Series
            }
            WITH *
            RETURN collect(DISTINCT this { .name }) AS data"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"this_connect_actedIn0_node_param0\\": \\"The \\",
                \\"this_connect_actedIn0_relationship_screenTime\\": {
                    \\"low\\": 90,
                    \\"high\\": 0
                },
                \\"this_connect_actedIn0_node_on_Movie0_actors0_node_param0\\": \\"Different Actor\\",
                \\"this_connect_actedIn0_node_on_Movie0_actors0_relationship_screenTime\\": {
                    \\"low\\": 90,
                    \\"high\\": 0
                },
                \\"this_connect_actedIn1_node_param0\\": \\"The \\",
                \\"this_connect_actedIn1_relationship_screenTime\\": {
                    \\"low\\": 90,
                    \\"high\\": 0
                },
                \\"this_connect_actedIn1_node_actors0_node_param0\\": \\"Actor\\",
                \\"this_connect_actedIn1_node_actors0_relationship_screenTime\\": {
                    \\"low\\": 90,
                    \\"high\\": 0
                },
                \\"resolvedCallbacks\\": {}
            }"
        `);
    });
});
