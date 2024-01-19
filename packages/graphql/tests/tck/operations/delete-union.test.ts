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
import { Neo4jGraphQL } from "../../../src";
import { formatCypher, translateQuery, formatParams } from "../utils/tck-test-utils";

describe("Cypher Delete - union", () => {
    let typeDefs: DocumentNode;
    let neoSchema: Neo4jGraphQL;

    beforeAll(() => {
        typeDefs = gql`
            type Episode {
                runtime: Int!
                series: Series! @relationship(type: "HAS_EPISODE", direction: IN)
            }

            union Production = Movie | Series

            type Movie {
                title: String!
                runtime: Int!
                actors: [Actor!]! @relationship(type: "ACTED_IN", direction: IN, properties: "ActedIn")
            }

            type Series {
                title: String!
                episodes: [Episode!]! @relationship(type: "HAS_EPISODE", direction: OUT)
                actors: [Actor!]! @relationship(type: "ACTED_IN", direction: IN, properties: "ActedIn")
            }

            type Actor {
                name: String!
                actedIn: [Production!]! @relationship(type: "ACTED_IN", direction: OUT, properties: "ActedIn")
            }

            interface ActedIn @relationshipProperties {
                screenTime: Int!
            }
        `;

        neoSchema = new Neo4jGraphQL({
            typeDefs,
        });
    });

    test("Simple Delete", async () => {
        const query = gql`
            mutation {
                deleteActors(where: { name: "Keanu" }) {
                    nodesDeleted
                }
            }
        `;

        const result = await translateQuery(neoSchema, query);

        expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
            "MATCH (this:Actor)
            WHERE this.name = $param0
            DETACH DELETE this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"param0\\": \\"Keanu\\"
            }"
        `);
    });

    test("Single Nested Delete", async () => {
        const query = gql`
            mutation {
                deleteActors(
                    where: { name: "Keanu" }
                    delete: { actedIn: { Movie: { where: { node: { title: "Matrix" } } } } }
                ) {
                    nodesDeleted
                }
            }
        `;

        const result = await translateQuery(neoSchema, query);

        expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
            "MATCH (this:Actor)
            WHERE this.name = $param0
            WITH *
            CALL {
            WITH *
            OPTIONAL MATCH (this)-[this_actedIn_Movie0_relationship:ACTED_IN]->(this_actedIn_Movie0:Movie)
            WHERE this_actedIn_Movie0.title = $this_deleteActors_args_delete_actedIn_Movie0_where_this_actedIn_Movie0param0
            WITH this_actedIn_Movie0_relationship, collect(DISTINCT this_actedIn_Movie0) AS this_actedIn_Movie0_to_delete
            CALL {
            	WITH this_actedIn_Movie0_to_delete
            	UNWIND this_actedIn_Movie0_to_delete AS x
            	DETACH DELETE x
            }
            }
            DETACH DELETE this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"param0\\": \\"Keanu\\",
                \\"this_deleteActors\\": {
                    \\"args\\": {
                        \\"delete\\": {
                            \\"actedIn\\": {
                                \\"Movie\\": [
                                    {
                                        \\"where\\": {
                                            \\"node\\": {
                                                \\"title\\": \\"Matrix\\"
                                            }
                                        }
                                    }
                                ]
                            }
                        }
                    }
                },
                \\"this_deleteActors_args_delete_actedIn_Movie0_where_this_actedIn_Movie0param0\\": \\"Matrix\\"
            }"
        `);
    });

    test("Single Nested Delete, deleting multiple", async () => {
        const query = gql`
            mutation {
                deleteActors(
                    where: { name: "Keanu" }
                    delete: {
                        actedIn: {
                            Movie: [
                                { where: { node: { title: "Matrix" } } }
                                { where: { node: { title: "Matrix Reloaded" } } }
                            ]
                        }
                    }
                ) {
                    nodesDeleted
                }
            }
        `;

        const result = await translateQuery(neoSchema, query);

        expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
            "MATCH (this:Actor)
            WHERE this.name = $param0
            WITH *
            CALL {
            WITH *
            OPTIONAL MATCH (this)-[this_actedIn_Movie0_relationship:ACTED_IN]->(this_actedIn_Movie0:Movie)
            WHERE this_actedIn_Movie0.title = $this_deleteActors_args_delete_actedIn_Movie0_where_this_actedIn_Movie0param0
            WITH this_actedIn_Movie0_relationship, collect(DISTINCT this_actedIn_Movie0) AS this_actedIn_Movie0_to_delete
            CALL {
            	WITH this_actedIn_Movie0_to_delete
            	UNWIND this_actedIn_Movie0_to_delete AS x
            	DETACH DELETE x
            }
            }
            WITH *
            CALL {
            WITH *
            OPTIONAL MATCH (this)-[this_actedIn_Movie1_relationship:ACTED_IN]->(this_actedIn_Movie1:Movie)
            WHERE this_actedIn_Movie1.title = $this_deleteActors_args_delete_actedIn_Movie1_where_this_actedIn_Movie1param0
            WITH this_actedIn_Movie1_relationship, collect(DISTINCT this_actedIn_Movie1) AS this_actedIn_Movie1_to_delete
            CALL {
            	WITH this_actedIn_Movie1_to_delete
            	UNWIND this_actedIn_Movie1_to_delete AS x
            	DETACH DELETE x
            }
            }
            DETACH DELETE this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"param0\\": \\"Keanu\\",
                \\"this_deleteActors\\": {
                    \\"args\\": {
                        \\"delete\\": {
                            \\"actedIn\\": {
                                \\"Movie\\": [
                                    {
                                        \\"where\\": {
                                            \\"node\\": {
                                                \\"title\\": \\"Matrix\\"
                                            }
                                        }
                                    },
                                    {
                                        \\"where\\": {
                                            \\"node\\": {
                                                \\"title\\": \\"Matrix Reloaded\\"
                                            }
                                        }
                                    }
                                ]
                            }
                        }
                    }
                },
                \\"this_deleteActors_args_delete_actedIn_Movie0_where_this_actedIn_Movie0param0\\": \\"Matrix\\",
                \\"this_deleteActors_args_delete_actedIn_Movie1_where_this_actedIn_Movie1param0\\": \\"Matrix Reloaded\\"
            }"
        `);
    });

    test("Double Nested Delete", async () => {
        const query = gql`
            mutation {
                deleteActors(
                    where: { name: "Keanu" }
                    delete: {
                        actedIn: {
                            Movie: {
                                where: { node: { title: "Matrix" } }
                                delete: { actors: { where: { node: { name: "Gloria Foster" } } } }
                            }
                        }
                    }
                ) {
                    nodesDeleted
                }
            }
        `;

        const result = await translateQuery(neoSchema, query);

        expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
            "MATCH (this:Actor)
            WHERE this.name = $param0
            WITH *
            CALL {
            WITH *
            OPTIONAL MATCH (this)-[this_actedIn_Movie0_relationship:ACTED_IN]->(this_actedIn_Movie0:Movie)
            WHERE this_actedIn_Movie0.title = $this_deleteActors_args_delete_actedIn_Movie0_where_this_actedIn_Movie0param0
            WITH *
            CALL {
            WITH *
            OPTIONAL MATCH (this_actedIn_Movie0)<-[this_actedIn_Movie0_actors0_relationship:ACTED_IN]-(this_actedIn_Movie0_actors0:Actor)
            WHERE this_actedIn_Movie0_actors0.name = $this_deleteActors_args_delete_actedIn_Movie0_delete_actors0_where_this_actedIn_Movie0_actors0param0
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
            DETACH DELETE this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"param0\\": \\"Keanu\\",
                \\"this_deleteActors\\": {
                    \\"args\\": {
                        \\"delete\\": {
                            \\"actedIn\\": {
                                \\"Movie\\": [
                                    {
                                        \\"where\\": {
                                            \\"node\\": {
                                                \\"title\\": \\"Matrix\\"
                                            }
                                        },
                                        \\"delete\\": {
                                            \\"actors\\": [
                                                {
                                                    \\"where\\": {
                                                        \\"node\\": {
                                                            \\"name\\": \\"Gloria Foster\\"
                                                        }
                                                    }
                                                }
                                            ]
                                        }
                                    }
                                ]
                            }
                        }
                    }
                },
                \\"this_deleteActors_args_delete_actedIn_Movie0_where_this_actedIn_Movie0param0\\": \\"Matrix\\",
                \\"this_deleteActors_args_delete_actedIn_Movie0_delete_actors0_where_this_actedIn_Movie0_actors0param0\\": \\"Gloria Foster\\"
            }"
        `);
    });
});
