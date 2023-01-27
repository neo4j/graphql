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

describe("Subscriptions metadata on update", () => {
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

    test("Simple update with subscriptions", async () => {
        const query = gql`
            mutation {
                updateMovies(where: { id: "1" }, update: { id: "2" }) {
                    movies {
                        id
                    }
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
            WITH this { .* } AS oldProps, this, meta
            CALL {
            	WITH *
            	SET this.id = $this_update_id
            	RETURN meta as update_meta
            }
            WITH *, update_meta as meta
            WITH this, meta + { event: \\"update\\", id: id(this), properties: { old: oldProps, new: this { .* } }, timestamp: timestamp(), typename: \\"Movie\\" } AS meta
            WITH *
            UNWIND (CASE meta WHEN [] then [null] else meta end) AS m
            RETURN collect(DISTINCT this { .id }) AS data, collect(DISTINCT m) as meta"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"param0\\": \\"1\\",
                \\"this_update_id\\": \\"2\\",
                \\"resolvedCallbacks\\": {}
            }"
        `);
    });

    test("Nested update with subscriptions", async () => {
        const query = gql`
            mutation {
                updateMovies(
                    where: { id: "1" }
                    update: {
                        id: "2"
                        actors: [{ where: { node: { name: "arthur" } }, update: { node: { name: "ford" } } }]
                    }
                ) {
                    movies {
                        id
                    }
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
            WITH this { .* } AS oldProps, this, meta
            CALL {
            	WITH *
            	SET this.id = $this_update_id
            	WITH this, meta
            CALL {
            	WITH this, meta
            	MATCH (this)<-[this_acted_in0_relationship:ACTED_IN]-(this_actors0:Actor)
            	WHERE this_actors0.name = $updateMovies_args_update_actors0_where_Actorparam0
            	WITH this_actors0 { .* } AS oldProps, this, meta, this_actors0
            	CALL {
            		WITH *
            		SET this_actors0.name = $this_update_actors0_name
            		RETURN meta as update_meta
            	}
            	WITH *, update_meta as meta
            	WITH this, this_actors0, meta + { event: \\"update\\", id: id(this_actors0), properties: { old: oldProps, new: this_actors0 { .* } }, timestamp: timestamp(), typename: \\"Actor\\" } AS meta
            	RETURN collect(meta) as update_meta
            }
            WITH this, REDUCE(m=meta, n IN update_meta | m + n) AS meta
            	RETURN meta as update_meta
            }
            WITH *, update_meta as meta
            WITH this, meta + { event: \\"update\\", id: id(this), properties: { old: oldProps, new: this { .* } }, timestamp: timestamp(), typename: \\"Movie\\" } AS meta
            WITH *
            UNWIND (CASE meta WHEN [] then [null] else meta end) AS m
            RETURN collect(DISTINCT this { .id }) AS data, collect(DISTINCT m) as meta"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"param0\\": \\"1\\",
                \\"this_update_id\\": \\"2\\",
                \\"updateMovies_args_update_actors0_where_Actorparam0\\": \\"arthur\\",
                \\"this_update_actors0_name\\": \\"ford\\",
                \\"updateMovies\\": {
                    \\"args\\": {
                        \\"update\\": {
                            \\"id\\": \\"2\\",
                            \\"actors\\": [
                                {
                                    \\"where\\": {
                                        \\"node\\": {
                                            \\"name\\": \\"arthur\\"
                                        }
                                    },
                                    \\"update\\": {
                                        \\"node\\": {
                                            \\"name\\": \\"ford\\"
                                        }
                                    }
                                }
                            ]
                        }
                    }
                },
                \\"resolvedCallbacks\\": {}
            }"
        `);
    });
});
