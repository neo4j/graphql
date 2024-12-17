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

import { Neo4jGraphQL } from "../../src";
import { formatCypher, formatParams, translateQuery } from "./utils/tck-test-utils";

describe("Nested Unions", () => {
    let typeDefs: string;
    let neoSchema: Neo4jGraphQL;

    beforeAll(() => {
        typeDefs = /* GraphQL */ `
            type Movie @node {
                title: String!
                actors: [Actor!]! @relationship(type: "ACTED_IN", direction: IN)
            }

            type Series @node {
                name: String!
                actors: [Actor!]! @relationship(type: "ACTED_IN", direction: IN)
            }

            union Production = Movie | Series

            type LeadActor @node {
                name: String!
                actedIn: [Production!]! @relationship(type: "ACTED_IN", direction: OUT)
            }

            type Extra @node {
                name: String
                actedIn: [Production!]! @relationship(type: "ACTED_IN", direction: OUT)
            }

            union Actor = LeadActor | Extra
        `;

        neoSchema = new Neo4jGraphQL({
            typeDefs,
        });
    });

    test("Nested Unions - Connect -> Connect", async () => {
        const query = /* GraphQL */ `
            mutation {
                updateMovies(
                    where: { title_EQ: "Movie" }
                    update: {
                        actors: {
                            LeadActor: {
                                connect: {
                                    where: { node: { name_EQ: "Actor" } }
                                    connect: { actedIn: { Series: { where: { node: { name_EQ: "Series" } } } } }
                                }
                            }
                        }
                    }
                ) {
                    movies {
                        title
                        actors {
                            ... on LeadActor {
                                name
                                actedIn {
                                    ... on Series {
                                        name
                                    }
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
            	OPTIONAL MATCH (this_actors_LeadActor0_connect0_node:LeadActor)
            	WHERE this_actors_LeadActor0_connect0_node.name = $this_actors_LeadActor0_connect0_node_param0
            	CALL {
            		WITH *
            		WITH collect(this_actors_LeadActor0_connect0_node) as connectedNodes, collect(this) as parentNodes
            		CALL {
            			WITH connectedNodes, parentNodes
            			UNWIND parentNodes as this
            			UNWIND connectedNodes as this_actors_LeadActor0_connect0_node
            			CREATE (this)<-[:ACTED_IN]-(this_actors_LeadActor0_connect0_node)
            		}
            	}
            WITH this, this_actors_LeadActor0_connect0_node
            CALL {
            	WITH this, this_actors_LeadActor0_connect0_node
            	OPTIONAL MATCH (this_actors_LeadActor0_connect0_node_actedIn_Series0_node:Series)
            	WHERE this_actors_LeadActor0_connect0_node_actedIn_Series0_node.name = $this_actors_LeadActor0_connect0_node_actedIn_Series0_node_param0
            	CALL {
            		WITH *
            		WITH this, collect(this_actors_LeadActor0_connect0_node_actedIn_Series0_node) as connectedNodes, collect(this_actors_LeadActor0_connect0_node) as parentNodes
            		CALL {
            			WITH connectedNodes, parentNodes
            			UNWIND parentNodes as this_actors_LeadActor0_connect0_node
            			UNWIND connectedNodes as this_actors_LeadActor0_connect0_node_actedIn_Series0_node
            			CREATE (this_actors_LeadActor0_connect0_node)-[:ACTED_IN]->(this_actors_LeadActor0_connect0_node_actedIn_Series0_node)
            		}
            	}
            WITH this, this_actors_LeadActor0_connect0_node, this_actors_LeadActor0_connect0_node_actedIn_Series0_node
            	RETURN count(*) AS connect_this_actors_LeadActor0_connect0_node_actedIn_Series_Series0
            }
            	RETURN count(*) AS connect_this_actors_LeadActor0_connect_LeadActor0
            }
            WITH *
            CALL {
                WITH this
                CALL {
                    WITH *
                    MATCH (this)<-[update_this0:ACTED_IN]-(update_this1:LeadActor)
                    CALL {
                        WITH update_this1
                        CALL {
                            WITH *
                            MATCH (update_this1)-[update_this2:ACTED_IN]->(update_this3:Movie)
                            WITH update_this3 { __resolveType: \\"Movie\\", __id: id(update_this3) } AS update_this3
                            RETURN update_this3 AS update_var4
                            UNION
                            WITH *
                            MATCH (update_this1)-[update_this5:ACTED_IN]->(update_this6:Series)
                            WITH update_this6 { .name, __resolveType: \\"Series\\", __id: id(update_this6) } AS update_this6
                            RETURN update_this6 AS update_var4
                        }
                        WITH update_var4
                        RETURN collect(update_var4) AS update_var4
                    }
                    WITH update_this1 { .name, actedIn: update_var4, __resolveType: \\"LeadActor\\", __id: id(update_this1) } AS update_this1
                    RETURN update_this1 AS update_var7
                    UNION
                    WITH *
                    MATCH (this)<-[update_this8:ACTED_IN]-(update_this9:Extra)
                    WITH update_this9 { __resolveType: \\"Extra\\", __id: id(update_this9) } AS update_this9
                    RETURN update_this9 AS update_var7
                }
                WITH update_var7
                RETURN collect(update_var7) AS update_var7
            }
            RETURN collect(DISTINCT this { .title, actors: update_var7 }) AS data"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"param0\\": \\"Movie\\",
                \\"this_actors_LeadActor0_connect0_node_param0\\": \\"Actor\\",
                \\"this_actors_LeadActor0_connect0_node_actedIn_Series0_node_param0\\": \\"Series\\",
                \\"resolvedCallbacks\\": {}
            }"
        `);
    });

    test("Nested Unions - Disconnect -> Disconnect", async () => {
        const query = /* GraphQL */ `
            mutation {
                updateMovies(
                    where: { title_EQ: "Movie" }
                    update: {
                        actors: {
                            LeadActor: {
                                disconnect: {
                                    where: { node: { name_EQ: "Actor" } }
                                    disconnect: { actedIn: { Series: { where: { node: { name_EQ: "Series" } } } } }
                                }
                            }
                        }
                    }
                ) {
                    movies {
                        title
                        actors {
                            ... on LeadActor {
                                name
                                actedIn {
                                    ... on Series {
                                        name
                                    }
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
            WITH this
            CALL {
            WITH this
            OPTIONAL MATCH (this)<-[this_actors_LeadActor0_disconnect0_rel:ACTED_IN]-(this_actors_LeadActor0_disconnect0:LeadActor)
            WHERE this_actors_LeadActor0_disconnect0.name = $updateMovies_args_update_actors_LeadActor0_disconnect0_where_LeadActor_this_actors_LeadActor0_disconnect0param0
            CALL {
            	WITH this_actors_LeadActor0_disconnect0, this_actors_LeadActor0_disconnect0_rel, this
            	WITH collect(this_actors_LeadActor0_disconnect0) as this_actors_LeadActor0_disconnect0, this_actors_LeadActor0_disconnect0_rel, this
            	UNWIND this_actors_LeadActor0_disconnect0 as x
            	DELETE this_actors_LeadActor0_disconnect0_rel
            }
            CALL {
            WITH this, this_actors_LeadActor0_disconnect0
            OPTIONAL MATCH (this_actors_LeadActor0_disconnect0)-[this_actors_LeadActor0_disconnect0_actedIn_Series0_rel:ACTED_IN]->(this_actors_LeadActor0_disconnect0_actedIn_Series0:Series)
            WHERE this_actors_LeadActor0_disconnect0_actedIn_Series0.name = $updateMovies_args_update_actors_LeadActor0_disconnect0_disconnect_actedIn_Series0_where_Series_this_actors_LeadActor0_disconnect0_actedIn_Series0param0
            CALL {
            	WITH this_actors_LeadActor0_disconnect0_actedIn_Series0, this_actors_LeadActor0_disconnect0_actedIn_Series0_rel, this_actors_LeadActor0_disconnect0
            	WITH collect(this_actors_LeadActor0_disconnect0_actedIn_Series0) as this_actors_LeadActor0_disconnect0_actedIn_Series0, this_actors_LeadActor0_disconnect0_actedIn_Series0_rel, this_actors_LeadActor0_disconnect0
            	UNWIND this_actors_LeadActor0_disconnect0_actedIn_Series0 as x
            	DELETE this_actors_LeadActor0_disconnect0_actedIn_Series0_rel
            }
            RETURN count(*) AS disconnect_this_actors_LeadActor0_disconnect0_actedIn_Series_Series
            }
            RETURN count(*) AS disconnect_this_actors_LeadActor0_disconnect_LeadActor
            }
            WITH *
            CALL {
                WITH this
                CALL {
                    WITH *
                    MATCH (this)<-[update_this0:ACTED_IN]-(update_this1:LeadActor)
                    CALL {
                        WITH update_this1
                        CALL {
                            WITH *
                            MATCH (update_this1)-[update_this2:ACTED_IN]->(update_this3:Movie)
                            WITH update_this3 { __resolveType: \\"Movie\\", __id: id(update_this3) } AS update_this3
                            RETURN update_this3 AS update_var4
                            UNION
                            WITH *
                            MATCH (update_this1)-[update_this5:ACTED_IN]->(update_this6:Series)
                            WITH update_this6 { .name, __resolveType: \\"Series\\", __id: id(update_this6) } AS update_this6
                            RETURN update_this6 AS update_var4
                        }
                        WITH update_var4
                        RETURN collect(update_var4) AS update_var4
                    }
                    WITH update_this1 { .name, actedIn: update_var4, __resolveType: \\"LeadActor\\", __id: id(update_this1) } AS update_this1
                    RETURN update_this1 AS update_var7
                    UNION
                    WITH *
                    MATCH (this)<-[update_this8:ACTED_IN]-(update_this9:Extra)
                    WITH update_this9 { __resolveType: \\"Extra\\", __id: id(update_this9) } AS update_this9
                    RETURN update_this9 AS update_var7
                }
                WITH update_var7
                RETURN collect(update_var7) AS update_var7
            }
            RETURN collect(DISTINCT this { .title, actors: update_var7 }) AS data"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"param0\\": \\"Movie\\",
                \\"updateMovies_args_update_actors_LeadActor0_disconnect0_where_LeadActor_this_actors_LeadActor0_disconnect0param0\\": \\"Actor\\",
                \\"updateMovies_args_update_actors_LeadActor0_disconnect0_disconnect_actedIn_Series0_where_Series_this_actors_LeadActor0_disconnect0_actedIn_Series0param0\\": \\"Series\\",
                \\"updateMovies\\": {
                    \\"args\\": {
                        \\"update\\": {
                            \\"actors\\": {
                                \\"LeadActor\\": [
                                    {
                                        \\"disconnect\\": [
                                            {
                                                \\"where\\": {
                                                    \\"node\\": {
                                                        \\"name_EQ\\": \\"Actor\\"
                                                    }
                                                },
                                                \\"disconnect\\": {
                                                    \\"actedIn\\": {
                                                        \\"Series\\": [
                                                            {
                                                                \\"where\\": {
                                                                    \\"node\\": {
                                                                        \\"name_EQ\\": \\"Series\\"
                                                                    }
                                                                }
                                                            }
                                                        ]
                                                    }
                                                }
                                            }
                                        ]
                                    }
                                ]
                            }
                        }
                    }
                },
                \\"resolvedCallbacks\\": {}
            }"
        `);
    });
});
