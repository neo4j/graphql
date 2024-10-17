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

import { Neo4jGraphQL } from "../../../src";
import { TestCDCEngine } from "../../utils/builders/TestCDCEngine";
import { formatCypher, formatParams, translateQuery } from "../utils/tck-test-utils";

describe("Subscriptions metadata on update", () => {
    let typeDefs: string;
    let neoSchema: Neo4jGraphQL;

    beforeAll(() => {
        typeDefs = /* GraphQL */ `
            type Actor @node {
                name: String!
                movies: [Movie!]! @relationship(type: "ACTED_IN", direction: OUT)
            }

            type Movie @node {
                id: ID!
                actors: [Actor!]! @relationship(type: "ACTED_IN", direction: IN)
            }
        `;

        neoSchema = new Neo4jGraphQL({
            typeDefs,
            features: {
                subscriptions: new TestCDCEngine(),
            },
        });
    });

    test("Simple update with subscriptions", async () => {
        const query = /* GraphQL */ `
            mutation {
                updateMovies(where: { id_EQ: "1" }, update: { id: "2" }) {
                    movies {
                        id
                    }
                }
            }
        `;

        const result = await translateQuery(neoSchema, query);

        expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
            "MATCH (this:Movie)
            WHERE this.id = $param0
            SET this.id = $this_update_id
            RETURN collect(DISTINCT this { .id }) AS data"
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
        const query = /* GraphQL */ `
            mutation {
                updateMovies(
                    where: { id_EQ: "1" }
                    update: {
                        id: "2"
                        actors: [{ where: { node: { name_EQ: "arthur" } }, update: { node: { name: "ford" } } }]
                    }
                ) {
                    movies {
                        id
                    }
                }
            }
        `;

        const result = await translateQuery(neoSchema, query);

        expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
            "MATCH (this:Movie)
            WHERE this.id = $param0
            SET this.id = $this_update_id
            WITH this
            CALL {
            	WITH this
            	MATCH (this)<-[this_acted_in0_relationship:ACTED_IN]-(this_actors0:Actor)
            	WHERE this_actors0.name = $updateMovies_args_update_actors0_where_this_actors0param0
            	SET this_actors0.name = $this_update_actors0_name
            	RETURN count(*) AS update_this_actors0
            }
            RETURN collect(DISTINCT this { .id }) AS data"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"param0\\": \\"1\\",
                \\"this_update_id\\": \\"2\\",
                \\"updateMovies_args_update_actors0_where_this_actors0param0\\": \\"arthur\\",
                \\"this_update_actors0_name\\": \\"ford\\",
                \\"updateMovies\\": {
                    \\"args\\": {
                        \\"update\\": {
                            \\"id\\": \\"2\\",
                            \\"actors\\": [
                                {
                                    \\"where\\": {
                                        \\"node\\": {
                                            \\"name_EQ\\": \\"arthur\\"
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
