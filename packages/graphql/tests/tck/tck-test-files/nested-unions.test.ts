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
import { DocumentNode } from "graphql";
import { Neo4jGraphQL } from "../../../src";
import { createJwtRequest } from "../../../tests/utils/create-jwt-request";
import { formatCypher, translateQuery, formatParams } from "../utils/tck-test-utils";

describe("Nested Unions", () => {
    const secret = "secret";
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
            config: { enableRegex: true, jwt: { secret } },
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
            "MATCH (this:Movie)
            WHERE this.title = $this_title
            WITH this
            CALL {
            	WITH this
            	OPTIONAL MATCH (this_connect_actors_LeadActor0_node:LeadActor)
            	WHERE this_connect_actors_LeadActor0_node.name = $this_connect_actors_LeadActor0_node_name
            	FOREACH(_ IN CASE this WHEN NULL THEN [] ELSE [1] END |
            		FOREACH(_ IN CASE this_connect_actors_LeadActor0_node WHEN NULL THEN [] ELSE [1] END |
            			MERGE (this)<-[:ACTED_IN]-(this_connect_actors_LeadActor0_node)
            		)
            	)
            WITH this, this_connect_actors_LeadActor0_node
            CALL {
            	WITH this, this_connect_actors_LeadActor0_node
            	OPTIONAL MATCH (this_connect_actors_LeadActor0_node_actedIn_Series0_node:Series)
            	WHERE this_connect_actors_LeadActor0_node_actedIn_Series0_node.name = $this_connect_actors_LeadActor0_node_actedIn_Series0_node_name
            	FOREACH(_ IN CASE this_connect_actors_LeadActor0_node WHEN NULL THEN [] ELSE [1] END |
            		FOREACH(_ IN CASE this_connect_actors_LeadActor0_node_actedIn_Series0_node WHEN NULL THEN [] ELSE [1] END |
            			MERGE (this_connect_actors_LeadActor0_node)-[:ACTED_IN]->(this_connect_actors_LeadActor0_node_actedIn_Series0_node)
            		)
            	)
            	RETURN count(*)
            }
            	RETURN count(*)
            }
            RETURN this { .title, actors:  [this_actors IN [(this)<-[:ACTED_IN]-(this_actors) WHERE (\\"LeadActor\\" IN labels(this_actors)) OR (\\"Extra\\" IN labels(this_actors)) | head( [ this_actors IN [this_actors] WHERE (\\"LeadActor\\" IN labels(this_actors)) | this_actors { __resolveType: \\"LeadActor\\",  .name, actedIn:  [this_actors_actedIn IN [(this_actors)-[:ACTED_IN]->(this_actors_actedIn) WHERE (\\"Movie\\" IN labels(this_actors_actedIn)) OR (\\"Series\\" IN labels(this_actors_actedIn)) | head( [ this_actors_actedIn IN [this_actors_actedIn] WHERE (\\"Movie\\" IN labels(this_actors_actedIn)) | this_actors_actedIn { __resolveType: \\"Movie\\" }  ] + [ this_actors_actedIn IN [this_actors_actedIn] WHERE (\\"Series\\" IN labels(this_actors_actedIn)) | this_actors_actedIn { __resolveType: \\"Series\\",  .name } ] ) ] WHERE this_actors_actedIn IS NOT NULL]  } ] + [ this_actors IN [this_actors] WHERE (\\"Extra\\" IN labels(this_actors)) | this_actors { __resolveType: \\"Extra\\" }  ] ) ] WHERE this_actors IS NOT NULL]  } AS this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"this_title\\": \\"Movie\\",
                \\"this_connect_actors_LeadActor0_node_name\\": \\"Actor\\",
                \\"this_connect_actors_LeadActor0_node_actedIn_Series0_node_name\\": \\"Series\\"
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
            "MATCH (this:Movie)
            WHERE this.title = $this_title
            WITH this
            CALL {
            WITH this
            OPTIONAL MATCH (this)<-[this_disconnect_actors_LeadActor0_rel:ACTED_IN]-(this_disconnect_actors_LeadActor0:LeadActor)
            WHERE this_disconnect_actors_LeadActor0.name = $updateMovies.args.disconnect.actors.LeadActor[0].where.node.name
            FOREACH(_ IN CASE this_disconnect_actors_LeadActor0 WHEN NULL THEN [] ELSE [1] END |
            DELETE this_disconnect_actors_LeadActor0_rel
            )
            WITH this, this_disconnect_actors_LeadActor0
            CALL {
            WITH this, this_disconnect_actors_LeadActor0
            OPTIONAL MATCH (this_disconnect_actors_LeadActor0)-[this_disconnect_actors_LeadActor0_actedIn_Series0_rel:ACTED_IN]->(this_disconnect_actors_LeadActor0_actedIn_Series0:Series)
            WHERE this_disconnect_actors_LeadActor0_actedIn_Series0.name = $updateMovies.args.disconnect.actors.LeadActor[0].disconnect.actedIn.Series[0].where.node.name
            FOREACH(_ IN CASE this_disconnect_actors_LeadActor0_actedIn_Series0 WHEN NULL THEN [] ELSE [1] END |
            DELETE this_disconnect_actors_LeadActor0_actedIn_Series0_rel
            )
            RETURN count(*)
            }
            RETURN count(*)
            }
            RETURN this { .title, actors:  [this_actors IN [(this)<-[:ACTED_IN]-(this_actors) WHERE (\\"LeadActor\\" IN labels(this_actors)) OR (\\"Extra\\" IN labels(this_actors)) | head( [ this_actors IN [this_actors] WHERE (\\"LeadActor\\" IN labels(this_actors)) | this_actors { __resolveType: \\"LeadActor\\",  .name, actedIn:  [this_actors_actedIn IN [(this_actors)-[:ACTED_IN]->(this_actors_actedIn) WHERE (\\"Movie\\" IN labels(this_actors_actedIn)) OR (\\"Series\\" IN labels(this_actors_actedIn)) | head( [ this_actors_actedIn IN [this_actors_actedIn] WHERE (\\"Movie\\" IN labels(this_actors_actedIn)) | this_actors_actedIn { __resolveType: \\"Movie\\" }  ] + [ this_actors_actedIn IN [this_actors_actedIn] WHERE (\\"Series\\" IN labels(this_actors_actedIn)) | this_actors_actedIn { __resolveType: \\"Series\\",  .name } ] ) ] WHERE this_actors_actedIn IS NOT NULL]  } ] + [ this_actors IN [this_actors] WHERE (\\"Extra\\" IN labels(this_actors)) | this_actors { __resolveType: \\"Extra\\" }  ] ) ] WHERE this_actors IS NOT NULL]  } AS this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"this_title\\": \\"Movie\\",
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
                }
            }"
        `);
    });
});
