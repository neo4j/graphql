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
import { TestSubscriptionsPlugin } from "../../../utils/TestSubscriptionPlugin";
import { Neo4jGraphQL } from "../../../../src";
import { createJwtRequest } from "../../../utils/create-jwt-request";
import { formatCypher, translateQuery, formatParams } from "../../utils/tck-test-utils";

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
            MATCH (this:Movie)
            WHERE this.id = $this_id
            WITH this, meta + { event: \\"delete\\", id: id(this), properties: { old: this { .* }, new: null }, timestamp: timestamp(), typename: \\"Movie\\" } AS meta
            DETACH DELETE this
            WITH meta
            UNWIND meta AS m
            RETURN collect(DISTINCT m) AS meta"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"this_id\\": \\"1\\"
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
            MATCH (this:Movie)
            WHERE this.id = $this_id
            WITH this, meta + { event: \\"delete\\", id: id(this), properties: { old: this { .* }, new: null }, timestamp: timestamp(), typename: \\"Movie\\" } AS meta
            WITH this, meta
            OPTIONAL MATCH (this)<-[this_actors0_relationship:ACTED_IN]-(this_actors0:Actor)
            WHERE this_actors0.name = $this_deleteMovies.args.delete.actors[0].where.node.name
            WITH this, meta, collect(DISTINCT this_actors0) as this_actors0_to_delete
            WITH this, this_actors0_to_delete, REDUCE(m=meta, n IN this_actors0_to_delete | m + { event: \\"delete\\", id: id(n), properties: { old: n { .* }, new: null }, timestamp: timestamp(), typename: \\"Actor\\" }) AS meta
            FOREACH(x IN this_actors0_to_delete | DETACH DELETE x)
            DETACH DELETE this
            WITH meta
            UNWIND meta AS m
            RETURN collect(DISTINCT m) AS meta"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"this_id\\": \\"1\\",
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
                }
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
            MATCH (this:Movie)
            WHERE this.id = $this_id
            WITH this, meta + { event: \\"delete\\", id: id(this), properties: { old: this { .* }, new: null }, timestamp: timestamp(), typename: \\"Movie\\" } AS meta
            WITH this, meta
            OPTIONAL MATCH (this)<-[this_actors0_relationship:ACTED_IN]-(this_actors0:Actor)
            WHERE this_actors0.name = $this_deleteMovies.args.delete.actors[0].where.node.name
            WITH this, meta, this_actors0
            OPTIONAL MATCH (this_actors0)-[this_actors0_movies0_relationship:ACTED_IN]->(this_actors0_movies0:Movie)
            WHERE this_actors0_movies0.id = $this_deleteMovies.args.delete.actors[0].delete.movies[0].where.node.id
            WITH this, meta, this_actors0, this_actors0_movies0
            OPTIONAL MATCH (this_actors0_movies0)<-[this_actors0_movies0_actors0_relationship:ACTED_IN]-(this_actors0_movies0_actors0:Actor)
            WHERE this_actors0_movies0_actors0.name = $this_deleteMovies.args.delete.actors[0].delete.movies[0].delete.actors[0].where.node.name
            WITH this, meta, this_actors0, this_actors0_movies0, collect(DISTINCT this_actors0_movies0_actors0) as this_actors0_movies0_actors0_to_delete
            WITH this, this_actors0, this_actors0_movies0, this_actors0_movies0_actors0_to_delete, REDUCE(m=meta, n IN this_actors0_movies0_actors0_to_delete | m + { event: \\"delete\\", id: id(n), properties: { old: n { .* }, new: null }, timestamp: timestamp(), typename: \\"Actor\\" }) AS meta
            FOREACH(x IN this_actors0_movies0_actors0_to_delete | DETACH DELETE x)
            WITH this, meta, this_actors0, collect(DISTINCT this_actors0_movies0) as this_actors0_movies0_to_delete
            WITH this, this_actors0, this_actors0_movies0_to_delete, REDUCE(m=meta, n IN this_actors0_movies0_to_delete | m + { event: \\"delete\\", id: id(n), properties: { old: n { .* }, new: null }, timestamp: timestamp(), typename: \\"Movie\\" }) AS meta
            FOREACH(x IN this_actors0_movies0_to_delete | DETACH DELETE x)
            WITH this, meta, collect(DISTINCT this_actors0) as this_actors0_to_delete
            WITH this, this_actors0_to_delete, REDUCE(m=meta, n IN this_actors0_to_delete | m + { event: \\"delete\\", id: id(n), properties: { old: n { .* }, new: null }, timestamp: timestamp(), typename: \\"Actor\\" }) AS meta
            FOREACH(x IN this_actors0_to_delete | DETACH DELETE x)
            DETACH DELETE this
            WITH meta
            UNWIND meta AS m
            RETURN collect(DISTINCT m) AS meta"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"this_id\\": \\"123\\",
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
                }
            }"
        `);
    });
});
