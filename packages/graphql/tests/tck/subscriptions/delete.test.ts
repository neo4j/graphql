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
            DETACH DELETE this
            WITH meta
            UNWIND meta AS m
            RETURN collect(DISTINCT m) AS meta"
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
            WITH *
            CALL {
            WITH this, meta
            WITH this, meta, [] as inner_meta
            OPTIONAL MATCH (this)<-[this_actors0_relationship:ACTED_IN]-(this_actors0:Actor)
            WHERE this_actors0.name = $this_deleteMovies_args_delete_actors0_where_Actorparam0
            WITH this, inner_meta, this_actors0_relationship, collect(DISTINCT this_actors0) as this_actors0_to_delete
            CALL {
            	WITH this_actors0_relationship, this_actors0_to_delete, this
            	UNWIND this_actors0_to_delete as x
            	WITH { event: \\"delete\\", id: id(x), properties: { old: x { .* }, new: null }, timestamp: timestamp(), typename: \\"Actor\\" } as node_meta, x, this_actors0_relationship, this
            	DETACH DELETE x
            	RETURN collect(node_meta) as delete_meta
            }
            WITH inner_meta, collect(delete_meta) as delete_meta
            RETURN  REDUCE(m=inner_meta, n IN delete_meta | m + n) as inner_meta
            }
            WITH this, meta, collect(inner_meta) as inner_meta
            WITH this, REDUCE(m=meta, n IN inner_meta | m + n) as meta
            DETACH DELETE this
            WITH meta
            UNWIND meta AS m
            RETURN collect(DISTINCT m) AS meta"
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
            WITH *
            CALL {
            WITH this, meta
            WITH this, meta, [] as inner_meta
            OPTIONAL MATCH (this)<-[this_actors0_relationship:ACTED_IN]-(this_actors0:Actor)
            WHERE this_actors0.name = $this_deleteMovies_args_delete_actors0_where_Actorparam0
            CALL {
            WITH this, this_actors0, this_actors0_relationship, inner_meta
            OPTIONAL MATCH (this_actors0)-[this_actors0_movies0_relationship:ACTED_IN]->(this_actors0_movies0:Movie)
            WHERE this_actors0_movies0.id = $this_deleteMovies_args_delete_actors0_delete_movies0_where_Movieparam0
            CALL {
            WITH this, this_actors0, this_actors0_relationship, this_actors0_movies0, this_actors0_movies0_relationship, inner_meta
            OPTIONAL MATCH (this_actors0_movies0)<-[this_actors0_movies0_actors0_relationship:ACTED_IN]-(this_actors0_movies0_actors0:Actor)
            WHERE this_actors0_movies0_actors0.name = $this_deleteMovies_args_delete_actors0_delete_movies0_delete_actors0_where_Actorparam0
            WITH this, this_actors0, this_actors0_relationship, this_actors0_movies0, this_actors0_movies0_relationship, inner_meta, this_actors0_movies0_actors0_relationship, collect(DISTINCT this_actors0_movies0_actors0) as this_actors0_movies0_actors0_to_delete
            CALL {
            	WITH this_actors0_movies0_actors0_relationship, this_actors0_movies0_actors0_to_delete, this, this_actors0, this_actors0_relationship, this_actors0_movies0, this_actors0_movies0_relationship
            	UNWIND this_actors0_movies0_actors0_to_delete as x
            	WITH { event: \\"delete\\", id: id(x), properties: { old: x { .* }, new: null }, timestamp: timestamp(), typename: \\"Actor\\" } as node_meta, x, this_actors0_movies0_actors0_relationship, this, this_actors0, this_actors0_relationship, this_actors0_movies0, this_actors0_movies0_relationship
            	DETACH DELETE x
            	RETURN collect(node_meta) as delete_meta
            }
            WITH collect(delete_meta) as delete_meta, inner_meta
            RETURN REDUCE(m=inner_meta, n IN delete_meta | m + n) as delete_meta
            }
            WITH this, this_actors0, this_actors0_relationship, this_actors0_movies0, this_actors0_movies0_relationship, REDUCE(m=inner_meta, n IN delete_meta | m + n) as inner_meta
            WITH this, this_actors0, this_actors0_relationship, inner_meta, this_actors0_movies0_relationship, collect(DISTINCT this_actors0_movies0) as this_actors0_movies0_to_delete
            CALL {
            	WITH this_actors0_movies0_relationship, this_actors0_movies0_to_delete, this, this_actors0, this_actors0_relationship
            	UNWIND this_actors0_movies0_to_delete as x
            	WITH { event: \\"delete\\", id: id(x), properties: { old: x { .* }, new: null }, timestamp: timestamp(), typename: \\"Movie\\" } as node_meta, x, this_actors0_movies0_relationship, this, this_actors0, this_actors0_relationship
            	DETACH DELETE x
            	RETURN collect(node_meta) as delete_meta
            }
            WITH collect(delete_meta) as delete_meta, inner_meta
            RETURN REDUCE(m=inner_meta, n IN delete_meta | m + n) as delete_meta
            }
            WITH this, this_actors0, this_actors0_relationship, REDUCE(m=inner_meta, n IN delete_meta | m + n) as inner_meta
            WITH this, inner_meta, this_actors0_relationship, collect(DISTINCT this_actors0) as this_actors0_to_delete
            CALL {
            	WITH this_actors0_relationship, this_actors0_to_delete, this
            	UNWIND this_actors0_to_delete as x
            	WITH { event: \\"delete\\", id: id(x), properties: { old: x { .* }, new: null }, timestamp: timestamp(), typename: \\"Actor\\" } as node_meta, x, this_actors0_relationship, this
            	DETACH DELETE x
            	RETURN collect(node_meta) as delete_meta
            }
            WITH inner_meta, collect(delete_meta) as delete_meta
            RETURN  REDUCE(m=inner_meta, n IN delete_meta | m + n) as inner_meta
            }
            WITH this, meta, collect(inner_meta) as inner_meta
            WITH this, REDUCE(m=meta, n IN inner_meta | m + n) as meta
            DETACH DELETE this
            WITH meta
            UNWIND meta AS m
            RETURN collect(DISTINCT m) AS meta"
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
