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

describe("Interface Relationships - Delete delete", () => {
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

    test("Delete delete an interface relationship", async () => {
        const query = gql`
            mutation {
                deleteActors(delete: { actedIn: { where: { node: { title_STARTS_WITH: "The " } } } }) {
                    nodesDeleted
                    relationshipsDeleted
                }
            }
        `;

        const req = createJwtRequest("secret", {});
        const result = await translateQuery(neoSchema, query, {
            req,
        });

        expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
            "MATCH (this:\`Actor\`)
            WITH *
            CALL {
            WITH this
            OPTIONAL MATCH (this)-[this_actedIn_Movie0_relationship:\`ACTED_IN\`]->(this_actedIn_Movie0:Movie)
            WHERE this_actedIn_Movie0.title STARTS WITH $this_deleteActors_args_delete_actedIn0_where_this_actedIn_Movie0param0
            WITH this_actedIn_Movie0_relationship, collect(DISTINCT this_actedIn_Movie0) AS this_actedIn_Movie0_to_delete
            CALL {
            	WITH this_actedIn_Movie0_to_delete
            	UNWIND this_actedIn_Movie0_to_delete AS x
            	DETACH DELETE x
            }
            }
            WITH *
            CALL {
            WITH this
            OPTIONAL MATCH (this)-[this_actedIn_Series0_relationship:\`ACTED_IN\`]->(this_actedIn_Series0:Series)
            WHERE this_actedIn_Series0.title STARTS WITH $this_deleteActors_args_delete_actedIn0_where_this_actedIn_Series0param0
            WITH this_actedIn_Series0_relationship, collect(DISTINCT this_actedIn_Series0) AS this_actedIn_Series0_to_delete
            CALL {
            	WITH this_actedIn_Series0_to_delete
            	UNWIND this_actedIn_Series0_to_delete AS x
            	DETACH DELETE x
            }
            }
            DETACH DELETE this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"this_deleteActors\\": {
                    \\"args\\": {
                        \\"delete\\": {
                            \\"actedIn\\": [
                                {
                                    \\"where\\": {
                                        \\"node\\": {
                                            \\"title_STARTS_WITH\\": \\"The \\"
                                        }
                                    }
                                }
                            ]
                        }
                    }
                },
                \\"this_deleteActors_args_delete_actedIn0_where_this_actedIn_Movie0param0\\": \\"The \\",
                \\"this_deleteActors_args_delete_actedIn0_where_this_actedIn_Series0param0\\": \\"The \\"
            }"
        `);
    });

    test("Delete delete an interface relationship with nested delete", async () => {
        const query = gql`
            mutation {
                deleteActors(
                    delete: {
                        actedIn: {
                            where: { node: { title_STARTS_WITH: "The " } }
                            delete: { actors: { where: { node: { name: "Actor" } } } }
                        }
                    }
                ) {
                    nodesDeleted
                    relationshipsDeleted
                }
            }
        `;

        const req = createJwtRequest("secret", {});
        const result = await translateQuery(neoSchema, query, {
            req,
        });

        expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
            "MATCH (this:\`Actor\`)
            WITH *
            CALL {
            WITH this
            OPTIONAL MATCH (this)-[this_actedIn_Movie0_relationship:\`ACTED_IN\`]->(this_actedIn_Movie0:Movie)
            WHERE this_actedIn_Movie0.title STARTS WITH $this_deleteActors_args_delete_actedIn0_where_this_actedIn_Movie0param0
            WITH *
            CALL {
            WITH this, this_actedIn_Movie0
            OPTIONAL MATCH (this_actedIn_Movie0)<-[this_actedIn_Movie0_actors0_relationship:\`ACTED_IN\`]-(this_actedIn_Movie0_actors0:Actor)
            WHERE this_actedIn_Movie0_actors0.name = $this_deleteActors_args_delete_actedIn0_delete_actors0_where_this_actedIn_Movie0_actors0param0
            WITH this_actedIn_Movie0_actors0_relationship, collect(DISTINCT this_actedIn_Movie0_actors0) AS this_actedIn_Movie0_actors0_to_delete
            CALL {
            	WITH this_actedIn_Movie0_actors0_to_delete
            	UNWIND this_actedIn_Movie0_actors0_to_delete AS x
            	DETACH DELETE x
            }
            }
            WITH this_actedIn_Movie0_relationship, collect(DISTINCT this_actedIn_Movie0) AS this_actedIn_Movie0_to_delete
            CALL {
            	WITH this_actedIn_Movie0_to_delete
            	UNWIND this_actedIn_Movie0_to_delete AS x
            	DETACH DELETE x
            }
            }
            WITH *
            CALL {
            WITH this
            OPTIONAL MATCH (this)-[this_actedIn_Series0_relationship:\`ACTED_IN\`]->(this_actedIn_Series0:Series)
            WHERE this_actedIn_Series0.title STARTS WITH $this_deleteActors_args_delete_actedIn0_where_this_actedIn_Series0param0
            WITH *
            CALL {
            WITH this, this_actedIn_Series0
            OPTIONAL MATCH (this_actedIn_Series0)<-[this_actedIn_Series0_actors0_relationship:\`ACTED_IN\`]-(this_actedIn_Series0_actors0:Actor)
            WHERE this_actedIn_Series0_actors0.name = $this_deleteActors_args_delete_actedIn0_delete_actors0_where_this_actedIn_Series0_actors0param0
            WITH this_actedIn_Series0_actors0_relationship, collect(DISTINCT this_actedIn_Series0_actors0) AS this_actedIn_Series0_actors0_to_delete
            CALL {
            	WITH this_actedIn_Series0_actors0_to_delete
            	UNWIND this_actedIn_Series0_actors0_to_delete AS x
            	DETACH DELETE x
            }
            }
            WITH this_actedIn_Series0_relationship, collect(DISTINCT this_actedIn_Series0) AS this_actedIn_Series0_to_delete
            CALL {
            	WITH this_actedIn_Series0_to_delete
            	UNWIND this_actedIn_Series0_to_delete AS x
            	DETACH DELETE x
            }
            }
            DETACH DELETE this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"this_deleteActors\\": {
                    \\"args\\": {
                        \\"delete\\": {
                            \\"actedIn\\": [
                                {
                                    \\"delete\\": {
                                        \\"actors\\": [
                                            {
                                                \\"where\\": {
                                                    \\"node\\": {
                                                        \\"name\\": \\"Actor\\"
                                                    }
                                                }
                                            }
                                        ]
                                    },
                                    \\"where\\": {
                                        \\"node\\": {
                                            \\"title_STARTS_WITH\\": \\"The \\"
                                        }
                                    }
                                }
                            ]
                        }
                    }
                },
                \\"this_deleteActors_args_delete_actedIn0_where_this_actedIn_Movie0param0\\": \\"The \\",
                \\"this_deleteActors_args_delete_actedIn0_delete_actors0_where_this_actedIn_Movie0_actors0param0\\": \\"Actor\\",
                \\"this_deleteActors_args_delete_actedIn0_where_this_actedIn_Series0param0\\": \\"The \\",
                \\"this_deleteActors_args_delete_actedIn0_delete_actors0_where_this_actedIn_Series0_actors0param0\\": \\"Actor\\"
            }"
        `);
    });

    test("Delete delete an interface relationship with nested delete using _on to only delete from one implementation", async () => {
        const query = gql`
            mutation {
                deleteActors(
                    delete: {
                        actedIn: {
                            where: { node: { title_STARTS_WITH: "The " } }
                            delete: { _on: { Movie: { actors: { where: { node: { name: "Actor" } } } } } }
                        }
                    }
                ) {
                    nodesDeleted
                    relationshipsDeleted
                }
            }
        `;

        const req = createJwtRequest("secret", {});
        const result = await translateQuery(neoSchema, query, {
            req,
        });

        expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
            "MATCH (this:\`Actor\`)
            WITH *
            CALL {
            WITH this
            OPTIONAL MATCH (this)-[this_actedIn_Movie0_relationship:\`ACTED_IN\`]->(this_actedIn_Movie0:Movie)
            WHERE this_actedIn_Movie0.title STARTS WITH $this_deleteActors_args_delete_actedIn0_where_this_actedIn_Movie0param0
            WITH *
            CALL {
            WITH this, this_actedIn_Movie0
            OPTIONAL MATCH (this_actedIn_Movie0)<-[this_actedIn_Movie0_actors0_relationship:\`ACTED_IN\`]-(this_actedIn_Movie0_actors0:Actor)
            WHERE this_actedIn_Movie0_actors0.name = $this_deleteActors_args_delete_actedIn0_delete__on_Movie0_actors0_where_this_actedIn_Movie0_actors0param0
            WITH this_actedIn_Movie0_actors0_relationship, collect(DISTINCT this_actedIn_Movie0_actors0) AS this_actedIn_Movie0_actors0_to_delete
            CALL {
            	WITH this_actedIn_Movie0_actors0_to_delete
            	UNWIND this_actedIn_Movie0_actors0_to_delete AS x
            	DETACH DELETE x
            }
            }
            WITH this_actedIn_Movie0_relationship, collect(DISTINCT this_actedIn_Movie0) AS this_actedIn_Movie0_to_delete
            CALL {
            	WITH this_actedIn_Movie0_to_delete
            	UNWIND this_actedIn_Movie0_to_delete AS x
            	DETACH DELETE x
            }
            }
            WITH *
            CALL {
            WITH this
            OPTIONAL MATCH (this)-[this_actedIn_Series0_relationship:\`ACTED_IN\`]->(this_actedIn_Series0:Series)
            WHERE this_actedIn_Series0.title STARTS WITH $this_deleteActors_args_delete_actedIn0_where_this_actedIn_Series0param0
            WITH this_actedIn_Series0_relationship, collect(DISTINCT this_actedIn_Series0) AS this_actedIn_Series0_to_delete
            CALL {
            	WITH this_actedIn_Series0_to_delete
            	UNWIND this_actedIn_Series0_to_delete AS x
            	DETACH DELETE x
            }
            }
            DETACH DELETE this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"this_deleteActors\\": {
                    \\"args\\": {
                        \\"delete\\": {
                            \\"actedIn\\": [
                                {
                                    \\"delete\\": {
                                        \\"_on\\": {
                                            \\"Movie\\": [
                                                {
                                                    \\"actors\\": [
                                                        {
                                                            \\"where\\": {
                                                                \\"node\\": {
                                                                    \\"name\\": \\"Actor\\"
                                                                }
                                                            }
                                                        }
                                                    ]
                                                }
                                            ]
                                        }
                                    },
                                    \\"where\\": {
                                        \\"node\\": {
                                            \\"title_STARTS_WITH\\": \\"The \\"
                                        }
                                    }
                                }
                            ]
                        }
                    }
                },
                \\"this_deleteActors_args_delete_actedIn0_where_this_actedIn_Movie0param0\\": \\"The \\",
                \\"this_deleteActors_args_delete_actedIn0_delete__on_Movie0_actors0_where_this_actedIn_Movie0_actors0param0\\": \\"Actor\\",
                \\"this_deleteActors_args_delete_actedIn0_where_this_actedIn_Series0param0\\": \\"The \\"
            }"
        `);
    });

    test("Delete delete an interface relationship with nested delete using _on to override delete", async () => {
        const query = gql`
            mutation {
                deleteActors(
                    delete: {
                        actedIn: {
                            where: { node: { title_STARTS_WITH: "The " } }
                            delete: {
                                actors: { where: { node: { name: "Actor" } } }
                                _on: { Movie: { actors: { where: { node: { name: "Different Actor" } } } } }
                            }
                        }
                    }
                ) {
                    nodesDeleted
                    relationshipsDeleted
                }
            }
        `;

        const req = createJwtRequest("secret", {});
        const result = await translateQuery(neoSchema, query, {
            req,
        });

        expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
            "MATCH (this:\`Actor\`)
            WITH *
            CALL {
            WITH this
            OPTIONAL MATCH (this)-[this_actedIn_Movie0_relationship:\`ACTED_IN\`]->(this_actedIn_Movie0:Movie)
            WHERE this_actedIn_Movie0.title STARTS WITH $this_deleteActors_args_delete_actedIn0_where_this_actedIn_Movie0param0
            WITH *
            CALL {
            WITH this, this_actedIn_Movie0
            OPTIONAL MATCH (this_actedIn_Movie0)<-[this_actedIn_Movie0_actors0_relationship:\`ACTED_IN\`]-(this_actedIn_Movie0_actors0:Actor)
            WHERE this_actedIn_Movie0_actors0.name = $this_deleteActors_args_delete_actedIn0_delete__on_Movie0_actors0_where_this_actedIn_Movie0_actors0param0
            WITH this_actedIn_Movie0_actors0_relationship, collect(DISTINCT this_actedIn_Movie0_actors0) AS this_actedIn_Movie0_actors0_to_delete
            CALL {
            	WITH this_actedIn_Movie0_actors0_to_delete
            	UNWIND this_actedIn_Movie0_actors0_to_delete AS x
            	DETACH DELETE x
            }
            }
            WITH this_actedIn_Movie0_relationship, collect(DISTINCT this_actedIn_Movie0) AS this_actedIn_Movie0_to_delete
            CALL {
            	WITH this_actedIn_Movie0_to_delete
            	UNWIND this_actedIn_Movie0_to_delete AS x
            	DETACH DELETE x
            }
            }
            WITH *
            CALL {
            WITH this
            OPTIONAL MATCH (this)-[this_actedIn_Series0_relationship:\`ACTED_IN\`]->(this_actedIn_Series0:Series)
            WHERE this_actedIn_Series0.title STARTS WITH $this_deleteActors_args_delete_actedIn0_where_this_actedIn_Series0param0
            WITH *
            CALL {
            WITH this, this_actedIn_Series0
            OPTIONAL MATCH (this_actedIn_Series0)<-[this_actedIn_Series0_actors0_relationship:\`ACTED_IN\`]-(this_actedIn_Series0_actors0:Actor)
            WHERE this_actedIn_Series0_actors0.name = $this_deleteActors_args_delete_actedIn0_delete_actors0_where_this_actedIn_Series0_actors0param0
            WITH this_actedIn_Series0_actors0_relationship, collect(DISTINCT this_actedIn_Series0_actors0) AS this_actedIn_Series0_actors0_to_delete
            CALL {
            	WITH this_actedIn_Series0_actors0_to_delete
            	UNWIND this_actedIn_Series0_actors0_to_delete AS x
            	DETACH DELETE x
            }
            }
            WITH this_actedIn_Series0_relationship, collect(DISTINCT this_actedIn_Series0) AS this_actedIn_Series0_to_delete
            CALL {
            	WITH this_actedIn_Series0_to_delete
            	UNWIND this_actedIn_Series0_to_delete AS x
            	DETACH DELETE x
            }
            }
            DETACH DELETE this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"this_deleteActors\\": {
                    \\"args\\": {
                        \\"delete\\": {
                            \\"actedIn\\": [
                                {
                                    \\"delete\\": {
                                        \\"actors\\": [
                                            {
                                                \\"where\\": {
                                                    \\"node\\": {
                                                        \\"name\\": \\"Actor\\"
                                                    }
                                                }
                                            }
                                        ],
                                        \\"_on\\": {
                                            \\"Movie\\": [
                                                {
                                                    \\"actors\\": [
                                                        {
                                                            \\"where\\": {
                                                                \\"node\\": {
                                                                    \\"name\\": \\"Different Actor\\"
                                                                }
                                                            }
                                                        }
                                                    ]
                                                }
                                            ]
                                        }
                                    },
                                    \\"where\\": {
                                        \\"node\\": {
                                            \\"title_STARTS_WITH\\": \\"The \\"
                                        }
                                    }
                                }
                            ]
                        }
                    }
                },
                \\"this_deleteActors_args_delete_actedIn0_where_this_actedIn_Movie0param0\\": \\"The \\",
                \\"this_deleteActors_args_delete_actedIn0_delete__on_Movie0_actors0_where_this_actedIn_Movie0_actors0param0\\": \\"Different Actor\\",
                \\"this_deleteActors_args_delete_actedIn0_where_this_actedIn_Series0param0\\": \\"The \\",
                \\"this_deleteActors_args_delete_actedIn0_delete_actors0_where_this_actedIn_Series0_actors0param0\\": \\"Actor\\"
            }"
        `);
    });
});
