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

import { Neo4jGraphQLAuthJWTPlugin } from "@neo4j/graphql-plugin-auth";
import { gql } from "apollo-server";
import type { DocumentNode } from "graphql";
import { Neo4jGraphQL } from "../../src";
import { createJwtRequest } from "../utils/create-jwt-request";
import { formatCypher, translateQuery, formatParams } from "./utils/tck-test-utils";

describe("Nested Unions", () => {
    let typeDefs: DocumentNode;
    let neoSchema: Neo4jGraphQL;

    beforeAll(() => {
        typeDefs = gql`
            type Movie {
                title: String!
                actors: [Actor!]! @relationship(type: "ACTED_IN", direction: IN)
            }

            type Series {
                name: String!
                actors: [Actor!]! @relationship(type: "ACTED_IN", direction: IN)
            }

            union Production = Movie | Series

            type LeadActor {
                name: String!
                actedIn: [Production!]! @relationship(type: "ACTED_IN", direction: OUT)
            }

            type Extra {
                name: String
                actedIn: [Production!]! @relationship(type: "ACTED_IN", direction: OUT)
            }

            union Actor = LeadActor | Extra
        `;

        neoSchema = new Neo4jGraphQL({
            typeDefs,
            config: { enableRegex: true },
            plugins: {
                auth: new Neo4jGraphQLAuthJWTPlugin({
                    secret: "secret",
                }),
            },
        });
    });

    test("Nested Unions - Connect -> Connect", async () => {
        const query = gql`
            mutation {
                updateMovies(
                    where: { title: "Movie" }
                    connect: {
                        actors: {
                            LeadActor: {
                                where: { node: { name: "Actor" } }
                                connect: { actedIn: { Series: { where: { node: { name: "Series" } } } } }
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

        const req = createJwtRequest("secret", {});
        const result = await translateQuery(neoSchema, query, {
            req,
        });

        expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
            "MATCH (this:\`Movie\`)
            WHERE this.title = $param0
            WITH this
            CALL {
            	WITH this
            	OPTIONAL MATCH (this_connect_actors_LeadActor0_node:LeadActor)
            	WHERE this_connect_actors_LeadActor0_node.name = $this_connect_actors_LeadActor0_node_param0
            	CALL {
            		WITH *
            		WITH collect(this_connect_actors_LeadActor0_node) as connectedNodes, collect(this) as parentNodes
            		CALL {
            			WITH connectedNodes, parentNodes
            			UNWIND parentNodes as this
            			UNWIND connectedNodes as this_connect_actors_LeadActor0_node
            			MERGE (this)<-[:ACTED_IN]-(this_connect_actors_LeadActor0_node)
            			RETURN count(*) AS _
            		}
            		RETURN count(*) AS _
            	}
            WITH this, this_connect_actors_LeadActor0_node
            CALL {
            	WITH this, this_connect_actors_LeadActor0_node
            	OPTIONAL MATCH (this_connect_actors_LeadActor0_node_actedIn_Series0_node:Series)
            	WHERE this_connect_actors_LeadActor0_node_actedIn_Series0_node.name = $this_connect_actors_LeadActor0_node_actedIn_Series0_node_param0
            	CALL {
            		WITH *
            		WITH this, collect(this_connect_actors_LeadActor0_node_actedIn_Series0_node) as connectedNodes, collect(this_connect_actors_LeadActor0_node) as parentNodes
            		CALL {
            			WITH connectedNodes, parentNodes
            			UNWIND parentNodes as this_connect_actors_LeadActor0_node
            			UNWIND connectedNodes as this_connect_actors_LeadActor0_node_actedIn_Series0_node
            			MERGE (this_connect_actors_LeadActor0_node)-[:ACTED_IN]->(this_connect_actors_LeadActor0_node_actedIn_Series0_node)
            			RETURN count(*) AS _
            		}
            		RETURN count(*) AS _
            	}
            WITH this, this_connect_actors_LeadActor0_node, this_connect_actors_LeadActor0_node_actedIn_Series0_node
            	RETURN count(*) AS connect_this_connect_actors_LeadActor0_node_actedIn_Series_Series
            }
            	RETURN count(*) AS connect_this_connect_actors_LeadActor_LeadActor
            }
            WITH *
            CALL {
                WITH this
                CALL {
                    WITH *
                    MATCH (this)<-[update_this0:ACTED_IN]-(this_actors:\`LeadActor\`)
                    CALL {
                        WITH this_actors
                        CALL {
                            WITH *
                            MATCH (this_actors)-[update_this1:ACTED_IN]->(this_actors_actedIn:\`Movie\`)
                            WITH this_actors_actedIn { __resolveType: \\"Movie\\" } AS this_actors_actedIn
                            RETURN this_actors_actedIn AS this_actors_actedIn
                            UNION
                            WITH *
                            MATCH (this_actors)-[update_this2:ACTED_IN]->(this_actors_actedIn:\`Series\`)
                            WITH this_actors_actedIn  { __resolveType: \\"Series\\",  .name } AS this_actors_actedIn
                            RETURN this_actors_actedIn AS this_actors_actedIn
                        }
                        WITH this_actors_actedIn
                        RETURN collect(this_actors_actedIn) AS this_actors_actedIn
                    }
                    WITH this_actors  { __resolveType: \\"LeadActor\\",  .name, actedIn: this_actors_actedIn } AS this_actors
                    RETURN this_actors AS this_actors
                    UNION
                    WITH *
                    MATCH (this)<-[update_this3:ACTED_IN]-(this_actors:\`Extra\`)
                    WITH this_actors { __resolveType: \\"Extra\\" } AS this_actors
                    RETURN this_actors AS this_actors
                }
                WITH this_actors
                RETURN collect(this_actors) AS this_actors
            }
            RETURN collect(DISTINCT this { .title, actors: this_actors }) AS data"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"param0\\": \\"Movie\\",
                \\"this_connect_actors_LeadActor0_node_param0\\": \\"Actor\\",
                \\"this_connect_actors_LeadActor0_node_actedIn_Series0_node_param0\\": \\"Series\\",
                \\"resolvedCallbacks\\": {}
            }"
        `);
    });

    test("Nested Unions - Disconnect -> Disconnect", async () => {
        const query = gql`
            mutation {
                updateMovies(
                    where: { title: "Movie" }
                    disconnect: {
                        actors: {
                            LeadActor: {
                                where: { node: { name: "Actor" } }
                                disconnect: { actedIn: { Series: { where: { node: { name: "Series" } } } } }
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

        const req = createJwtRequest("secret", {});
        const result = await translateQuery(neoSchema, query, {
            req,
        });

        expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
            "MATCH (this:\`Movie\`)
            WHERE this.title = $param0
            WITH this
            CALL {
            WITH this
            OPTIONAL MATCH (this)<-[this_disconnect_actors_LeadActor0_rel:ACTED_IN]-(this_disconnect_actors_LeadActor0:LeadActor)
            WHERE this_disconnect_actors_LeadActor0.name = $updateMovies_args_disconnect_actors_LeadActor0_where_LeadActor_this_disconnect_actors_LeadActor0param0
            CALL {
            	WITH this_disconnect_actors_LeadActor0, this_disconnect_actors_LeadActor0_rel, this
            	WITH collect(this_disconnect_actors_LeadActor0) as this_disconnect_actors_LeadActor0, this_disconnect_actors_LeadActor0_rel, this
            	UNWIND this_disconnect_actors_LeadActor0 as x
            	DELETE this_disconnect_actors_LeadActor0_rel
            	RETURN count(*) AS _
            }
            CALL {
            WITH this, this_disconnect_actors_LeadActor0
            OPTIONAL MATCH (this_disconnect_actors_LeadActor0)-[this_disconnect_actors_LeadActor0_actedIn_Series0_rel:ACTED_IN]->(this_disconnect_actors_LeadActor0_actedIn_Series0:Series)
            WHERE this_disconnect_actors_LeadActor0_actedIn_Series0.name = $updateMovies_args_disconnect_actors_LeadActor0_disconnect_actedIn_Series0_where_Series_this_disconnect_actors_LeadActor0_actedIn_Series0param0
            CALL {
            	WITH this_disconnect_actors_LeadActor0_actedIn_Series0, this_disconnect_actors_LeadActor0_actedIn_Series0_rel, this_disconnect_actors_LeadActor0
            	WITH collect(this_disconnect_actors_LeadActor0_actedIn_Series0) as this_disconnect_actors_LeadActor0_actedIn_Series0, this_disconnect_actors_LeadActor0_actedIn_Series0_rel, this_disconnect_actors_LeadActor0
            	UNWIND this_disconnect_actors_LeadActor0_actedIn_Series0 as x
            	DELETE this_disconnect_actors_LeadActor0_actedIn_Series0_rel
            	RETURN count(*) AS _
            }
            RETURN count(*) AS disconnect_this_disconnect_actors_LeadActor0_actedIn_Series_Series
            }
            RETURN count(*) AS disconnect_this_disconnect_actors_LeadActor_LeadActor
            }
            WITH *
            CALL {
                WITH this
                CALL {
                    WITH *
                    MATCH (this)<-[update_this0:ACTED_IN]-(this_actors:\`LeadActor\`)
                    CALL {
                        WITH this_actors
                        CALL {
                            WITH *
                            MATCH (this_actors)-[update_this1:ACTED_IN]->(this_actors_actedIn:\`Movie\`)
                            WITH this_actors_actedIn { __resolveType: \\"Movie\\" } AS this_actors_actedIn
                            RETURN this_actors_actedIn AS this_actors_actedIn
                            UNION
                            WITH *
                            MATCH (this_actors)-[update_this2:ACTED_IN]->(this_actors_actedIn:\`Series\`)
                            WITH this_actors_actedIn  { __resolveType: \\"Series\\",  .name } AS this_actors_actedIn
                            RETURN this_actors_actedIn AS this_actors_actedIn
                        }
                        WITH this_actors_actedIn
                        RETURN collect(this_actors_actedIn) AS this_actors_actedIn
                    }
                    WITH this_actors  { __resolveType: \\"LeadActor\\",  .name, actedIn: this_actors_actedIn } AS this_actors
                    RETURN this_actors AS this_actors
                    UNION
                    WITH *
                    MATCH (this)<-[update_this3:ACTED_IN]-(this_actors:\`Extra\`)
                    WITH this_actors { __resolveType: \\"Extra\\" } AS this_actors
                    RETURN this_actors AS this_actors
                }
                WITH this_actors
                RETURN collect(this_actors) AS this_actors
            }
            RETURN collect(DISTINCT this { .title, actors: this_actors }) AS data"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"param0\\": \\"Movie\\",
                \\"updateMovies_args_disconnect_actors_LeadActor0_where_LeadActor_this_disconnect_actors_LeadActor0param0\\": \\"Actor\\",
                \\"updateMovies_args_disconnect_actors_LeadActor0_disconnect_actedIn_Series0_where_Series_this_disconnect_actors_LeadActor0_actedIn_Series0param0\\": \\"Series\\",
                \\"updateMovies\\": {
                    \\"args\\": {
                        \\"disconnect\\": {
                            \\"actors\\": {
                                \\"LeadActor\\": [
                                    {
                                        \\"where\\": {
                                            \\"node\\": {
                                                \\"name\\": \\"Actor\\"
                                            }
                                        },
                                        \\"disconnect\\": {
                                            \\"actedIn\\": {
                                                \\"Series\\": [
                                                    {
                                                        \\"where\\": {
                                                            \\"node\\": {
                                                                \\"name\\": \\"Series\\"
                                                            }
                                                        }
                                                    }
                                                ]
                                            }
                                        }
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
