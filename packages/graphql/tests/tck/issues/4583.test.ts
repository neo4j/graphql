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

import { Neo4jGraphQL } from "../../../src";
import { formatCypher, formatParams, translateQuery } from "../utils/tck-test-utils";

describe("https://github.com/neo4j/graphql/issues/4583", () => {
    let typeDefs;
    beforeAll(() => {
        typeDefs = /* GraphQL */ `
            type Episode @node {
                runtime: Int!
                series: [Series!]! @relationship(type: "HAS_EPISODE", direction: IN)
            }

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
                episodeCount: Int!
                episodes: [Episode!]! @relationship(type: "HAS_EPISODE", direction: OUT)
                actors: [Actor!]! @relationship(type: "ACTED_IN", direction: IN, properties: "StarredIn")
            }

            type ActedIn @relationshipProperties {
                screenTime: Int!
            }

            type StarredIn @relationshipProperties {
                episodeNr: Int!
            }

            type Actor @node {
                name: String!
                actedIn: [Production!]! @relationship(type: "ACTED_IN", direction: OUT, properties: "ActedIn")
            }
        `;
    });

    test("typename should work for connect operation", async () => {
        const neoSchema = new Neo4jGraphQL({ typeDefs });

        const mutation = /* GraphQL */ `
            mutation {
                createActors(
                    input: {
                        name: "My Actor"
                        actedIn: {
                            connect: {
                                edge: { screenTime: 10 }
                                where: { node: { title_EQ: "movieTitle", typename_IN: [Movie] } }
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

        const result = await translateQuery(neoSchema, mutation);

        expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
            "CALL {
            CREATE (this0:Actor)
            SET this0.name = $this0_name
            WITH *
            CALL {
            	WITH this0
            	OPTIONAL MATCH (this0_actedIn_connect0_node:Movie)
            	WHERE (this0_actedIn_connect0_node.title = $this0_actedIn_connect0_node_param0 AND this0_actedIn_connect0_node:Movie)
            	CALL {
            		WITH *
            		WITH collect(this0_actedIn_connect0_node) as connectedNodes, collect(this0) as parentNodes
            		CALL {
            			WITH connectedNodes, parentNodes
            			UNWIND parentNodes as this0
            			UNWIND connectedNodes as this0_actedIn_connect0_node
            			MERGE (this0)-[this0_actedIn_connect0_relationship:ACTED_IN]->(this0_actedIn_connect0_node)
            			SET this0_actedIn_connect0_relationship.screenTime = $this0_actedIn_connect0_relationship_screenTime
            		}
            	}
            WITH this0, this0_actedIn_connect0_node
            	RETURN count(*) AS connect_this0_actedIn_connect_Movie0
            }
            CALL {
            		WITH this0
            	OPTIONAL MATCH (this0_actedIn_connect1_node:Series)
            	WHERE (this0_actedIn_connect1_node.title = $this0_actedIn_connect1_node_param0 AND this0_actedIn_connect1_node:Movie)
            	CALL {
            		WITH *
            		WITH collect(this0_actedIn_connect1_node) as connectedNodes, collect(this0) as parentNodes
            		CALL {
            			WITH connectedNodes, parentNodes
            			UNWIND parentNodes as this0
            			UNWIND connectedNodes as this0_actedIn_connect1_node
            			MERGE (this0)-[this0_actedIn_connect1_relationship:ACTED_IN]->(this0_actedIn_connect1_node)
            			SET this0_actedIn_connect1_relationship.screenTime = $this0_actedIn_connect1_relationship_screenTime
            		}
            	}
            WITH this0, this0_actedIn_connect1_node
            	RETURN count(*) AS connect_this0_actedIn_connect_Series1
            }
            RETURN this0
            }
            CALL {
                WITH this0
                RETURN this0 { .name } AS create_var0
            }
            RETURN [create_var0] AS data"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"this0_name\\": \\"My Actor\\",
                \\"this0_actedIn_connect0_node_param0\\": \\"movieTitle\\",
                \\"this0_actedIn_connect0_relationship_screenTime\\": {
                    \\"low\\": 10,
                    \\"high\\": 0
                },
                \\"this0_actedIn_connect1_node_param0\\": \\"movieTitle\\",
                \\"this0_actedIn_connect1_relationship_screenTime\\": {
                    \\"low\\": 10,
                    \\"high\\": 0
                },
                \\"resolvedCallbacks\\": {}
            }"
        `);
    });

    test("typename should work for connect operation, with a logical operator", async () => {
        const neoSchema = new Neo4jGraphQL({ typeDefs });

        const mutation = /* GraphQL */ `
            mutation {
                createActors(
                    input: {
                        name: "My Actor"
                        actedIn: {
                            connect: {
                                edge: { screenTime: 10 }
                                where: { node: { OR: [{ title_EQ: "movieTitle" }, { typename_IN: [Movie] }] } }
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

        const result = await translateQuery(neoSchema, mutation);

        expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
            "CALL {
            CREATE (this0:Actor)
            SET this0.name = $this0_name
            WITH *
            CALL {
            	WITH this0
            	OPTIONAL MATCH (this0_actedIn_connect0_node:Movie)
            	WHERE (this0_actedIn_connect0_node.title = $this0_actedIn_connect0_node_param0 OR this0_actedIn_connect0_node:Movie)
            	CALL {
            		WITH *
            		WITH collect(this0_actedIn_connect0_node) as connectedNodes, collect(this0) as parentNodes
            		CALL {
            			WITH connectedNodes, parentNodes
            			UNWIND parentNodes as this0
            			UNWIND connectedNodes as this0_actedIn_connect0_node
            			MERGE (this0)-[this0_actedIn_connect0_relationship:ACTED_IN]->(this0_actedIn_connect0_node)
            			SET this0_actedIn_connect0_relationship.screenTime = $this0_actedIn_connect0_relationship_screenTime
            		}
            	}
            WITH this0, this0_actedIn_connect0_node
            	RETURN count(*) AS connect_this0_actedIn_connect_Movie0
            }
            CALL {
            		WITH this0
            	OPTIONAL MATCH (this0_actedIn_connect1_node:Series)
            	WHERE (this0_actedIn_connect1_node.title = $this0_actedIn_connect1_node_param0 OR this0_actedIn_connect1_node:Movie)
            	CALL {
            		WITH *
            		WITH collect(this0_actedIn_connect1_node) as connectedNodes, collect(this0) as parentNodes
            		CALL {
            			WITH connectedNodes, parentNodes
            			UNWIND parentNodes as this0
            			UNWIND connectedNodes as this0_actedIn_connect1_node
            			MERGE (this0)-[this0_actedIn_connect1_relationship:ACTED_IN]->(this0_actedIn_connect1_node)
            			SET this0_actedIn_connect1_relationship.screenTime = $this0_actedIn_connect1_relationship_screenTime
            		}
            	}
            WITH this0, this0_actedIn_connect1_node
            	RETURN count(*) AS connect_this0_actedIn_connect_Series1
            }
            RETURN this0
            }
            CALL {
                WITH this0
                RETURN this0 { .name } AS create_var0
            }
            RETURN [create_var0] AS data"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"this0_name\\": \\"My Actor\\",
                \\"this0_actedIn_connect0_node_param0\\": \\"movieTitle\\",
                \\"this0_actedIn_connect0_relationship_screenTime\\": {
                    \\"low\\": 10,
                    \\"high\\": 0
                },
                \\"this0_actedIn_connect1_node_param0\\": \\"movieTitle\\",
                \\"this0_actedIn_connect1_relationship_screenTime\\": {
                    \\"low\\": 10,
                    \\"high\\": 0
                },
                \\"resolvedCallbacks\\": {}
            }"
        `);
    });

    test("typename should work for nested connect operation", async () => {
        const neoSchema = new Neo4jGraphQL({ typeDefs });

        const mutation = /* GraphQL */ `
            mutation {
                createActors(
                    input: {
                        name: "My Actor"
                        actedIn: {
                            connect: {
                                edge: { screenTime: 10 }
                                where: { node: { title_EQ: "movieTitle", typename_IN: [Movie] } }
                                connect: {
                                    actors: {
                                        edge: { StarredIn: { episodeNr: 10 }, ActedIn: { screenTime: 25 } }
                                        where: { node: { name_EQ: "Second Actor" } }
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

        const result = await translateQuery(neoSchema, mutation);

        expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
            "CALL {
            CREATE (this0:Actor)
            SET this0.name = $this0_name
            WITH *
            CALL {
            	WITH this0
            	OPTIONAL MATCH (this0_actedIn_connect0_node:Movie)
            	WHERE (this0_actedIn_connect0_node.title = $this0_actedIn_connect0_node_param0 AND this0_actedIn_connect0_node:Movie)
            	CALL {
            		WITH *
            		WITH collect(this0_actedIn_connect0_node) as connectedNodes, collect(this0) as parentNodes
            		CALL {
            			WITH connectedNodes, parentNodes
            			UNWIND parentNodes as this0
            			UNWIND connectedNodes as this0_actedIn_connect0_node
            			MERGE (this0)-[this0_actedIn_connect0_relationship:ACTED_IN]->(this0_actedIn_connect0_node)
            			SET this0_actedIn_connect0_relationship.screenTime = $this0_actedIn_connect0_relationship_screenTime
            		}
            	}
            WITH this0, this0_actedIn_connect0_node
            CALL {
            	WITH this0, this0_actedIn_connect0_node
            	OPTIONAL MATCH (this0_actedIn_connect0_node_actors0_node:Actor)
            	WHERE this0_actedIn_connect0_node_actors0_node.name = $this0_actedIn_connect0_node_actors0_node_param0
            	CALL {
            		WITH *
            		WITH this0, collect(this0_actedIn_connect0_node_actors0_node) as connectedNodes, collect(this0_actedIn_connect0_node) as parentNodes
            		CALL {
            			WITH connectedNodes, parentNodes
            			UNWIND parentNodes as this0_actedIn_connect0_node
            			UNWIND connectedNodes as this0_actedIn_connect0_node_actors0_node
            			MERGE (this0_actedIn_connect0_node)<-[this0_actedIn_connect0_node_actors0_relationship:ACTED_IN]-(this0_actedIn_connect0_node_actors0_node)
            			SET this0_actedIn_connect0_node_actors0_relationship.screenTime = $this0_actedIn_connect0_node_actors0_relationship_ActedIn_screenTime
            		}
            	}
            WITH this0, this0_actedIn_connect0_node, this0_actedIn_connect0_node_actors0_node
            	RETURN count(*) AS connect_this0_actedIn_connect0_node_actors_Actor0
            }
            	RETURN count(*) AS connect_this0_actedIn_connect_Movie0
            }
            CALL {
            		WITH this0
            	OPTIONAL MATCH (this0_actedIn_connect1_node:Series)
            	WHERE (this0_actedIn_connect1_node.title = $this0_actedIn_connect1_node_param0 AND this0_actedIn_connect1_node:Movie)
            	CALL {
            		WITH *
            		WITH collect(this0_actedIn_connect1_node) as connectedNodes, collect(this0) as parentNodes
            		CALL {
            			WITH connectedNodes, parentNodes
            			UNWIND parentNodes as this0
            			UNWIND connectedNodes as this0_actedIn_connect1_node
            			MERGE (this0)-[this0_actedIn_connect1_relationship:ACTED_IN]->(this0_actedIn_connect1_node)
            			SET this0_actedIn_connect1_relationship.screenTime = $this0_actedIn_connect1_relationship_screenTime
            		}
            	}
            WITH this0, this0_actedIn_connect1_node
            CALL {
            	WITH this0, this0_actedIn_connect1_node
            	OPTIONAL MATCH (this0_actedIn_connect1_node_actors0_node:Actor)
            	WHERE this0_actedIn_connect1_node_actors0_node.name = $this0_actedIn_connect1_node_actors0_node_param0
            	CALL {
            		WITH *
            		WITH this0, collect(this0_actedIn_connect1_node_actors0_node) as connectedNodes, collect(this0_actedIn_connect1_node) as parentNodes
            		CALL {
            			WITH connectedNodes, parentNodes
            			UNWIND parentNodes as this0_actedIn_connect1_node
            			UNWIND connectedNodes as this0_actedIn_connect1_node_actors0_node
            			MERGE (this0_actedIn_connect1_node)<-[this0_actedIn_connect1_node_actors0_relationship:ACTED_IN]-(this0_actedIn_connect1_node_actors0_node)
            			SET this0_actedIn_connect1_node_actors0_relationship.episodeNr = $this0_actedIn_connect1_node_actors0_relationship_StarredIn_episodeNr
            		}
            	}
            WITH this0, this0_actedIn_connect1_node, this0_actedIn_connect1_node_actors0_node
            	RETURN count(*) AS connect_this0_actedIn_connect1_node_actors_Actor0
            }
            	RETURN count(*) AS connect_this0_actedIn_connect_Series1
            }
            RETURN this0
            }
            CALL {
                WITH this0
                RETURN this0 { .name } AS create_var0
            }
            RETURN [create_var0] AS data"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"this0_name\\": \\"My Actor\\",
                \\"this0_actedIn_connect0_node_param0\\": \\"movieTitle\\",
                \\"this0_actedIn_connect0_relationship_screenTime\\": {
                    \\"low\\": 10,
                    \\"high\\": 0
                },
                \\"this0_actedIn_connect0_node_actors0_node_param0\\": \\"Second Actor\\",
                \\"this0_actedIn_connect0_node_actors0_relationship_ActedIn_screenTime\\": {
                    \\"low\\": 25,
                    \\"high\\": 0
                },
                \\"this0_actedIn_connect1_node_param0\\": \\"movieTitle\\",
                \\"this0_actedIn_connect1_relationship_screenTime\\": {
                    \\"low\\": 10,
                    \\"high\\": 0
                },
                \\"this0_actedIn_connect1_node_actors0_node_param0\\": \\"Second Actor\\",
                \\"this0_actedIn_connect1_node_actors0_relationship_StarredIn_episodeNr\\": {
                    \\"low\\": 10,
                    \\"high\\": 0
                },
                \\"resolvedCallbacks\\": {}
            }"
        `);
    });
});
