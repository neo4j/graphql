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
import { formatCypher, formatParams, translateQuery } from "../utils/tck-test-utils";

describe("https://github.com/neo4j/graphql/issues/5599", () => {
    let typeDefs: string;
    let neoSchema: Neo4jGraphQL;

    beforeAll(() => {
        typeDefs = /* GraphQL */ `
            type Movie @node {
                title: String!
                actors: [Actor!]! @relationship(type: "ACTED_IN", direction: IN)
            }

            type LeadActor @node {
                name: String!
                actedIn: [Movie!]! @relationship(type: "ACTED_IN", direction: OUT)
            }

            type Extra @node {
                name: String
                actedIn: [Movie!]! @relationship(type: "ACTED_IN", direction: OUT)
            }

            union Actor = LeadActor | Extra
        `;

        neoSchema = new Neo4jGraphQL({
            typeDefs,
        });
    });

    test("update with nested delete of an union", async () => {
        const query = /* GraphQL */ `
            mutation {
                updateMovies(
                    update: { actors: { LeadActor: [{ delete: [{ where: { node: { name: "Actor1" } } }] }] } }
                ) {
                    movies {
                        title
                    }
                }
            }
        `;

        const result = await translateQuery(neoSchema, query);

        expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
            "MATCH (this:Movie)
            WITH *
            CALL {
            WITH *
            OPTIONAL MATCH (this)<-[this_actors_LeadActor0_delete0_relationship:ACTED_IN]-(this_actors_LeadActor0_delete0:LeadActor)
            WHERE this_actors_LeadActor0_delete0.name = $updateMovies_args_update_actors0_delete_LeadActor0_where_this_actors_LeadActor0_delete0param0
            WITH this_actors_LeadActor0_delete0_relationship, collect(DISTINCT this_actors_LeadActor0_delete0) AS this_actors_LeadActor0_delete0_to_delete
            CALL {
            	WITH this_actors_LeadActor0_delete0_to_delete
            	UNWIND this_actors_LeadActor0_delete0_to_delete AS x
            	DETACH DELETE x
            }
            }
            RETURN collect(DISTINCT this { .title }) AS data"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"updateMovies_args_update_actors0_delete_LeadActor0_where_this_actors_LeadActor0_delete0param0\\": \\"Actor1\\",
                \\"updateMovies\\": {
                    \\"args\\": {
                        \\"update\\": {
                            \\"actors\\": {
                                \\"LeadActor\\": [
                                    {
                                        \\"delete\\": [
                                            {
                                                \\"where\\": {
                                                    \\"node\\": {
                                                        \\"name\\": \\"Actor1\\"
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
