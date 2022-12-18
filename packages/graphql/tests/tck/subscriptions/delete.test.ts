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
import { TestSubscriptionsPlugin } from "../../utils/TestSubscriptionPlugin";
import { Neo4jGraphQL } from "../../../src";
import { createJwtRequest } from "../../utils/create-jwt-request";
import { formatCypher, translateQuery, formatParams } from "../utils/tck-test-utils";

describe("Subscriptions metadata on delete", () => {
    let typeDefs: DocumentNode;
    let neoSchema: Neo4jGraphQL;
    let plugin: TestSubscriptionsPlugin;

    beforeAll(() => {
        plugin = new TestSubscriptionsPlugin();
        typeDefs = gql`
            type Actor {
                name: String!
                movies: [Movie!]! @relationship(type: "ACTED_IN", direction: OUT)
            }

            type Movie {
                id: ID!
                actors: [Actor!]! @relationship(type: "ACTED_IN", direction: IN)
            }
        `;

        neoSchema = new Neo4jGraphQL({
            typeDefs,
            config: { enableRegex: true },
            plugins: {
                subscriptions: plugin,
            } as any,
        });
    });

    test("Simple delete", async () => {
        const query = gql`
            mutation {
                deleteMovies(where: { id: "1" }) {
                    nodesDeleted
                }
            }
        `;

        const req = createJwtRequest("secret", {});
        const result = await translateQuery(neoSchema, query, {
            req,
        });

        expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
            "WITH [] AS meta
            MATCH (this:\`Movie\`)
            WHERE this.id = $param0
            WITH this, meta + { event: \\"delete\\", id: id(this), properties: { old: this { .* }, new: null }, timestamp: timestamp(), typename: \\"Movie\\" } AS meta
            CALL {
            	WITH this
            	OPTIONAL MATCH (this)-[r]-()
            	WITH this, collect(DISTINCT r) AS relationships_to_delete
            	UNWIND relationships_to_delete AS x
            	WITH CASE
            		WHEN id(this)=id(startNode(x)) THEN { event: \\"delete_relationship\\", timestamp: timestamp(), id_from: id(this), id_to: id(endNode(x)), id: id(x), relationshipName: type(x), fromLabels: labels(this), toLabels: labels(endNode(x)), properties: { from: properties(this), to: properties(endNode(x)), relationship: x { .* } } }
            		WHEN id(this)=id(endNode(x)) THEN { event: \\"delete_relationship\\", timestamp: timestamp(), id_from: id(startNode(x)), id_to: id(this), id: id(x), relationshipName: type(x), fromLabels: labels(startNode(x)), toLabels: labels(this), properties: { from: properties(startNode(x)), to: properties(this), relationship: x { .* } } }
            	END AS meta
            	RETURN collect(DISTINCT meta) AS relationship_meta
            }
            WITH REDUCE(m=meta, r IN relationship_meta | m + r) AS meta, this
            DETACH DELETE this
            WITH collect(meta) AS meta
            WITH REDUCE(m=[], n IN meta | m + n) AS meta
            RETURN meta"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"param0\\": \\"1\\"
            }"
        `);
    });

    test("Nested delete", async () => {
        const query = gql`
            mutation {
                deleteMovies(where: { id: "1" }, delete: { actors: { where: { node: { name: "1" } } } }) {
                    nodesDeleted
                }
            }
        `;

        const req = createJwtRequest("secret", {});
        const result = await translateQuery(neoSchema, query, {
            req,
        });

        expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
            "WITH [] AS meta
            MATCH (this:\`Movie\`)
            WHERE this.id = $param0
            WITH this, meta + { event: \\"delete\\", id: id(this), properties: { old: this { .* }, new: null }, timestamp: timestamp(), typename: \\"Movie\\" } AS meta
            WITH this, meta
            OPTIONAL MATCH (this)<-[this_actors0_relationship:ACTED_IN]-(this_actors0:Actor)
            WHERE this_actors0.name = $this_deleteMovies_args_delete_actors0_where_Actorparam0
            WITH this, meta, collect(DISTINCT this_actors0) AS this_actors0_to_delete, this_actors0_relationship
            WITH this, this_actors0_to_delete, REDUCE(m=meta, n IN this_actors0_to_delete | m + { event: \\"delete\\", id: id(n), properties: { old: n { .* }, new: null }, timestamp: timestamp(), typename: \\"Actor\\" } + { event: \\"delete_relationship\\", timestamp: timestamp(), id_from: id(n), id_to: id(this), id: id(this_actors0_relationship), relationshipName: \\"ACTED_IN\\", fromTypename: \\"Actor\\", toTypename: \\"Movie\\", properties: { from: n { .* }, to: this { .* }, relationship: this_actors0_relationship { .* } } }) AS meta
            CALL {
            	WITH this_actors0_to_delete
            	UNWIND this_actors0_to_delete AS x
            	DETACH DELETE x
            	RETURN count(*) AS _
            }
            WITH this, collect(distinct meta) AS update_meta
            WITH this, REDUCE(m=[], n IN update_meta | m + n) AS meta
            DETACH DELETE this
            WITH collect(meta) AS meta
            WITH REDUCE(m=[], n IN meta | m + n) AS meta
            RETURN meta"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"param0\\": \\"1\\",
                \\"this_deleteMovies\\": {
                    \\"args\\": {
                        \\"delete\\": {
                            \\"actors\\": [
                                {
                                    \\"where\\": {
                                        \\"node\\": {
                                            \\"name\\": \\"1\\"
                                        }
                                    }
                                }
                            ]
                        }
                    }
                },
                \\"this_deleteMovies_args_delete_actors0_where_Actorparam0\\": \\"1\\"
            }"
        `);
    });
    test("Triple Nested Delete", async () => {
        const query = gql`
            mutation {
                deleteMovies(
                    where: { id: 123 }
                    delete: {
                        actors: {
                            where: { node: { name: "Actor to delete" } }
                            delete: {
                                movies: {
                                    where: { node: { id: 321 } }
                                    delete: { actors: { where: { node: { name: "Another actor to delete" } } } }
                                }
                            }
                        }
                    }
                ) {
                    nodesDeleted
                }
            }
        `;

        const req = createJwtRequest("secret", {});
        const result = await translateQuery(neoSchema, query, {
            req,
        });

        expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
            "WITH [] AS meta
            MATCH (this:\`Movie\`)
            WHERE this.id = $param0
            WITH this, meta + { event: \\"delete\\", id: id(this), properties: { old: this { .* }, new: null }, timestamp: timestamp(), typename: \\"Movie\\" } AS meta
            WITH this, meta
            OPTIONAL MATCH (this)<-[this_actors0_relationship:ACTED_IN]-(this_actors0:Actor)
            WHERE this_actors0.name = $this_deleteMovies_args_delete_actors0_where_Actorparam0
            WITH this, meta, this_actors0, this_actors0_relationship
            OPTIONAL MATCH (this_actors0)-[this_actors0_movies0_relationship:ACTED_IN]->(this_actors0_movies0:Movie)
            WHERE this_actors0_movies0.id = $this_deleteMovies_args_delete_actors0_delete_movies0_where_Movieparam0
            WITH this, meta, this_actors0, this_actors0_relationship, this_actors0_movies0, this_actors0_movies0_relationship
            OPTIONAL MATCH (this_actors0_movies0)<-[this_actors0_movies0_actors0_relationship:ACTED_IN]-(this_actors0_movies0_actors0:Actor)
            WHERE this_actors0_movies0_actors0.name = $this_deleteMovies_args_delete_actors0_delete_movies0_delete_actors0_where_Actorparam0
            WITH this, meta, this_actors0, this_actors0_relationship, this_actors0_movies0, this_actors0_movies0_relationship, collect(DISTINCT this_actors0_movies0_actors0) AS this_actors0_movies0_actors0_to_delete, this_actors0_movies0_actors0_relationship
            WITH this, this_actors0, this_actors0_relationship, this_actors0_movies0, this_actors0_movies0_relationship, this_actors0_movies0_actors0_to_delete, REDUCE(m=meta, n IN this_actors0_movies0_actors0_to_delete | m + { event: \\"delete\\", id: id(n), properties: { old: n { .* }, new: null }, timestamp: timestamp(), typename: \\"Actor\\" } + { event: \\"delete_relationship\\", timestamp: timestamp(), id_from: id(n), id_to: id(this_actors0_movies0), id: id(this_actors0_movies0_actors0_relationship), relationshipName: \\"ACTED_IN\\", fromTypename: \\"Actor\\", toTypename: \\"Movie\\", properties: { from: n { .* }, to: this_actors0_movies0 { .* }, relationship: this_actors0_movies0_actors0_relationship { .* } } }) AS meta
            CALL {
            	WITH this_actors0_movies0_actors0_to_delete
            	UNWIND this_actors0_movies0_actors0_to_delete AS x
            	DETACH DELETE x
            	RETURN count(*) AS _
            }
            WITH this, this_actors0, this_actors0_relationship, this_actors0_movies0, this_actors0_movies0_relationship, collect(distinct meta) AS update_meta
            WITH this, this_actors0, this_actors0_relationship, this_actors0_movies0, this_actors0_movies0_relationship, REDUCE(m=[], n IN update_meta | m + n) AS meta
            WITH this, meta, this_actors0, this_actors0_relationship, collect(DISTINCT this_actors0_movies0) AS this_actors0_movies0_to_delete, this_actors0_movies0_relationship
            WITH this, this_actors0, this_actors0_relationship, this_actors0_movies0_to_delete, REDUCE(m=meta, n IN this_actors0_movies0_to_delete | m + { event: \\"delete\\", id: id(n), properties: { old: n { .* }, new: null }, timestamp: timestamp(), typename: \\"Movie\\" } + { event: \\"delete_relationship\\", timestamp: timestamp(), id_from: id(this_actors0), id_to: id(n), id: id(this_actors0_movies0_relationship), relationshipName: \\"ACTED_IN\\", fromTypename: \\"Actor\\", toTypename: \\"Movie\\", properties: { from: this_actors0 { .* }, to: n { .* }, relationship: this_actors0_movies0_relationship { .* } } }) AS meta
            CALL {
            	WITH this_actors0_movies0_to_delete
            	UNWIND this_actors0_movies0_to_delete AS x
            	DETACH DELETE x
            	RETURN count(*) AS _
            }
            WITH this, this_actors0, this_actors0_relationship, collect(distinct meta) AS update_meta
            WITH this, this_actors0, this_actors0_relationship, REDUCE(m=[], n IN update_meta | m + n) AS meta
            WITH this, meta, collect(DISTINCT this_actors0) AS this_actors0_to_delete, this_actors0_relationship
            WITH this, this_actors0_to_delete, REDUCE(m=meta, n IN this_actors0_to_delete | m + { event: \\"delete\\", id: id(n), properties: { old: n { .* }, new: null }, timestamp: timestamp(), typename: \\"Actor\\" } + { event: \\"delete_relationship\\", timestamp: timestamp(), id_from: id(n), id_to: id(this), id: id(this_actors0_relationship), relationshipName: \\"ACTED_IN\\", fromTypename: \\"Actor\\", toTypename: \\"Movie\\", properties: { from: n { .* }, to: this { .* }, relationship: this_actors0_relationship { .* } } }) AS meta
            CALL {
            	WITH this_actors0_to_delete
            	UNWIND this_actors0_to_delete AS x
            	DETACH DELETE x
            	RETURN count(*) AS _
            }
            WITH this, collect(distinct meta) AS update_meta
            WITH this, REDUCE(m=[], n IN update_meta | m + n) AS meta
            DETACH DELETE this
            WITH collect(meta) AS meta
            WITH REDUCE(m=[], n IN meta | m + n) AS meta
            RETURN meta"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"param0\\": \\"123\\",
                \\"this_deleteMovies\\": {
                    \\"args\\": {
                        \\"delete\\": {
                            \\"actors\\": [
                                {
                                    \\"where\\": {
                                        \\"node\\": {
                                            \\"name\\": \\"Actor to delete\\"
                                        }
                                    },
                                    \\"delete\\": {
                                        \\"movies\\": [
                                            {
                                                \\"where\\": {
                                                    \\"node\\": {
                                                        \\"id\\": \\"321\\"
                                                    }
                                                },
                                                \\"delete\\": {
                                                    \\"actors\\": [
                                                        {
                                                            \\"where\\": {
                                                                \\"node\\": {
                                                                    \\"name\\": \\"Another actor to delete\\"
                                                                }
                                                            }
                                                        }
                                                    ]
                                                }
                                            }
                                        ]
                                    }
                                }
                            ]
                        }
                    }
                },
                \\"this_deleteMovies_args_delete_actors0_where_Actorparam0\\": \\"Actor to delete\\",
                \\"this_deleteMovies_args_delete_actors0_delete_movies0_where_Movieparam0\\": \\"321\\",
                \\"this_deleteMovies_args_delete_actors0_delete_movies0_delete_actors0_where_Actorparam0\\": \\"Another actor to delete\\"
            }"
        `);
    });
});
