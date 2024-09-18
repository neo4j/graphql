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

describe("Relationship Properties Connect Cypher", () => {
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

    test("Create movie while connecting a relationship that has properties", async () => {
        const query = /* GraphQL */ `
            mutation {
                createMovies(input: [{ title: "Forrest Gump", actors: { connect: [{ edge: { screenTime: 60 } }] } }]) {
                    movies {
                        title
                        actorsConnection {
                            edges {
                                properties {
                                    screenTime
                                }
                                node {
                                    name
                                }
                            }
                        }
                    }
                }
            }
        `;

        const result = await translateQuery(neoSchema, query);

        expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
            "CALL {
            CREATE (this0:Movie)
            SET this0.title = $this0_title
            WITH *
            CALL {
            	WITH this0
            	OPTIONAL MATCH (this0_actors_connect0_node:Actor)
            	CALL {
            		WITH *
            		WITH collect(this0_actors_connect0_node) as connectedNodes, collect(this0) as parentNodes
            		CALL {
            			WITH connectedNodes, parentNodes
            			UNWIND parentNodes as this0
            			UNWIND connectedNodes as this0_actors_connect0_node
            			MERGE (this0)<-[this0_actors_connect0_relationship:ACTED_IN]-(this0_actors_connect0_node)
            			SET this0_actors_connect0_relationship.screenTime = $this0_actors_connect0_relationship_screenTime
            		}
            	}
            WITH this0, this0_actors_connect0_node
            	RETURN count(*) AS connect_this0_actors_connect_Actor0
            }
            RETURN this0
            }
            CALL {
                WITH this0
                CALL {
                    WITH this0
                    MATCH (this0)<-[create_this0:ACTED_IN]-(create_this1:Actor)
                    WITH collect({ node: create_this1, relationship: create_this0 }) AS edges
                    WITH edges, size(edges) AS totalCount
                    CALL {
                        WITH edges
                        UNWIND edges AS edge
                        WITH edge.node AS create_this1, edge.relationship AS create_this0
                        RETURN collect({ properties: { screenTime: create_this0.screenTime, __resolveType: \\"ActedIn\\" }, node: { name: create_this1.name, __resolveType: \\"Actor\\" } }) AS create_var2
                    }
                    RETURN { edges: create_var2, totalCount: totalCount } AS create_var3
                }
                RETURN this0 { .title, actorsConnection: create_var3 } AS create_var4
            }
            RETURN [create_var4] AS data"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"this0_title\\": \\"Forrest Gump\\",
                \\"this0_actors_connect0_relationship_screenTime\\": {
                    \\"low\\": 60,
                    \\"high\\": 0
                },
                \\"resolvedCallbacks\\": {}
            }"
        `);
    });

    test("Create movie while connecting a relationship that has properties(with where on node)", async () => {
        const query = /* GraphQL */ `
            mutation {
                createMovies(
                    input: [
                        {
                            title: "Forrest Gump"
                            actors: { connect: [{ where: { node: { name_EQ: "Tom Hanks" } }, edge: { screenTime: 60 } }] }
                        }
                    ]
                ) {
                    movies {
                        title
                        actorsConnection {
                            edges {
                                properties {
                                    screenTime
                                }
                                node {
                                    name
                                }
                            }
                        }
                    }
                }
            }
        `;

        const result = await translateQuery(neoSchema, query);

        expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
            "CALL {
            CREATE (this0:Movie)
            SET this0.title = $this0_title
            WITH *
            CALL {
            	WITH this0
            	OPTIONAL MATCH (this0_actors_connect0_node:Actor)
            	WHERE this0_actors_connect0_node.name = $this0_actors_connect0_node_param0
            	CALL {
            		WITH *
            		WITH collect(this0_actors_connect0_node) as connectedNodes, collect(this0) as parentNodes
            		CALL {
            			WITH connectedNodes, parentNodes
            			UNWIND parentNodes as this0
            			UNWIND connectedNodes as this0_actors_connect0_node
            			MERGE (this0)<-[this0_actors_connect0_relationship:ACTED_IN]-(this0_actors_connect0_node)
            			SET this0_actors_connect0_relationship.screenTime = $this0_actors_connect0_relationship_screenTime
            		}
            	}
            WITH this0, this0_actors_connect0_node
            	RETURN count(*) AS connect_this0_actors_connect_Actor0
            }
            RETURN this0
            }
            CALL {
                WITH this0
                CALL {
                    WITH this0
                    MATCH (this0)<-[create_this0:ACTED_IN]-(create_this1:Actor)
                    WITH collect({ node: create_this1, relationship: create_this0 }) AS edges
                    WITH edges, size(edges) AS totalCount
                    CALL {
                        WITH edges
                        UNWIND edges AS edge
                        WITH edge.node AS create_this1, edge.relationship AS create_this0
                        RETURN collect({ properties: { screenTime: create_this0.screenTime, __resolveType: \\"ActedIn\\" }, node: { name: create_this1.name, __resolveType: \\"Actor\\" } }) AS create_var2
                    }
                    RETURN { edges: create_var2, totalCount: totalCount } AS create_var3
                }
                RETURN this0 { .title, actorsConnection: create_var3 } AS create_var4
            }
            RETURN [create_var4] AS data"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"this0_title\\": \\"Forrest Gump\\",
                \\"this0_actors_connect0_node_param0\\": \\"Tom Hanks\\",
                \\"this0_actors_connect0_relationship_screenTime\\": {
                    \\"low\\": 60,
                    \\"high\\": 0
                },
                \\"resolvedCallbacks\\": {}
            }"
        `);
    });

    test("Update a movie while connecting a relationship that has properties(top level-connect)", async () => {
        const query = /* GraphQL */ `
            mutation {
                updateMovies(where: { title_EQ: "Forrest Gump" }, connect: { actors: { edge: { screenTime: 60 } } }) {
                    movies {
                        title
                        actorsConnection {
                            edges {
                                properties {
                                    screenTime
                                }
                                node {
                                    name
                                }
                            }
                        }
                    }
                }
            }
        `;

        const result = await translateQuery(neoSchema, query);

        expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
            "MATCH (this:Movie)
            WHERE this.title = $param0
            WITH *
            CALL {
            	WITH this
            	OPTIONAL MATCH (this_connect_actors0_node:Actor)
            	CALL {
            		WITH *
            		WITH collect(this_connect_actors0_node) as connectedNodes, collect(this) as parentNodes
            		CALL {
            			WITH connectedNodes, parentNodes
            			UNWIND parentNodes as this
            			UNWIND connectedNodes as this_connect_actors0_node
            			MERGE (this)<-[this_connect_actors0_relationship:ACTED_IN]-(this_connect_actors0_node)
            			SET this_connect_actors0_relationship.screenTime = $this_connect_actors0_relationship_screenTime
            		}
            	}
            WITH this, this_connect_actors0_node
            	RETURN count(*) AS connect_this_connect_actors_Actor0
            }
            WITH *
            CALL {
                WITH this
                MATCH (this)<-[update_this0:ACTED_IN]-(update_this1:Actor)
                WITH collect({ node: update_this1, relationship: update_this0 }) AS edges
                WITH edges, size(edges) AS totalCount
                CALL {
                    WITH edges
                    UNWIND edges AS edge
                    WITH edge.node AS update_this1, edge.relationship AS update_this0
                    RETURN collect({ properties: { screenTime: update_this0.screenTime, __resolveType: \\"ActedIn\\" }, node: { name: update_this1.name, __resolveType: \\"Actor\\" } }) AS update_var2
                }
                RETURN { edges: update_var2, totalCount: totalCount } AS update_var3
            }
            RETURN collect(DISTINCT this { .title, actorsConnection: update_var3 }) AS data"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"param0\\": \\"Forrest Gump\\",
                \\"this_connect_actors0_relationship_screenTime\\": {
                    \\"low\\": 60,
                    \\"high\\": 0
                },
                \\"resolvedCallbacks\\": {}
            }"
        `);
    });

    test("Update a movie while connecting a relationship that has properties(top level-connect)(with where on node)", async () => {
        const query = /* GraphQL */ `
            mutation {
                updateMovies(
                    where: { title_EQ: "Forrest Gump" }
                    connect: { actors: { where: { node: { name_EQ: "Tom Hanks" } }, edge: { screenTime: 60 } } }
                ) {
                    movies {
                        title
                        actorsConnection {
                            edges {
                                properties {
                                    screenTime
                                }
                                node {
                                    name
                                }
                            }
                        }
                    }
                }
            }
        `;

        const result = await translateQuery(neoSchema, query);

        expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
            "MATCH (this:Movie)
            WHERE this.title = $param0
            WITH *
            CALL {
            	WITH this
            	OPTIONAL MATCH (this_connect_actors0_node:Actor)
            	WHERE this_connect_actors0_node.name = $this_connect_actors0_node_param0
            	CALL {
            		WITH *
            		WITH collect(this_connect_actors0_node) as connectedNodes, collect(this) as parentNodes
            		CALL {
            			WITH connectedNodes, parentNodes
            			UNWIND parentNodes as this
            			UNWIND connectedNodes as this_connect_actors0_node
            			MERGE (this)<-[this_connect_actors0_relationship:ACTED_IN]-(this_connect_actors0_node)
            			SET this_connect_actors0_relationship.screenTime = $this_connect_actors0_relationship_screenTime
            		}
            	}
            WITH this, this_connect_actors0_node
            	RETURN count(*) AS connect_this_connect_actors_Actor0
            }
            WITH *
            CALL {
                WITH this
                MATCH (this)<-[update_this0:ACTED_IN]-(update_this1:Actor)
                WITH collect({ node: update_this1, relationship: update_this0 }) AS edges
                WITH edges, size(edges) AS totalCount
                CALL {
                    WITH edges
                    UNWIND edges AS edge
                    WITH edge.node AS update_this1, edge.relationship AS update_this0
                    RETURN collect({ properties: { screenTime: update_this0.screenTime, __resolveType: \\"ActedIn\\" }, node: { name: update_this1.name, __resolveType: \\"Actor\\" } }) AS update_var2
                }
                RETURN { edges: update_var2, totalCount: totalCount } AS update_var3
            }
            RETURN collect(DISTINCT this { .title, actorsConnection: update_var3 }) AS data"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"param0\\": \\"Forrest Gump\\",
                \\"this_connect_actors0_node_param0\\": \\"Tom Hanks\\",
                \\"this_connect_actors0_relationship_screenTime\\": {
                    \\"low\\": 60,
                    \\"high\\": 0
                },
                \\"resolvedCallbacks\\": {}
            }"
        `);
    });
});
