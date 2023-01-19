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
import { Neo4jGraphQL } from "../../../../src";
import { createJwtRequest } from "../../../utils/create-jwt-request";
import { formatCypher, translateQuery, formatParams } from "../../utils/tck-test-utils";

describe("Cypher -> Connections -> Relationship Properties -> Update", () => {
    let typeDefs: DocumentNode;
    let neoSchema: Neo4jGraphQL;

    beforeAll(() => {
        typeDefs = gql`
            type Movie {
                title: String!
                actors: [Actor!]! @relationship(type: "ACTED_IN", properties: "ActedIn", direction: IN)
            }

            type Actor {
                name: String!
                movies: [Movie!]! @relationship(type: "ACTED_IN", properties: "ActedIn", direction: OUT)
            }

            interface ActedIn {
                screenTime: Int!
            }
        `;

        neoSchema = new Neo4jGraphQL({
            typeDefs,
            config: { enableRegex: true },
        });
    });

    test("Update a relationship property on a relationship between two specified nodes (update -> update)", async () => {
        const query = gql`
            mutation {
                updateMovies(
                    where: { title: "Forrest Gump" }
                    update: {
                        actors: [{ where: { node: { name: "Tom Hanks" } }, update: { edge: { screenTime: 60 } } }]
                    }
                ) {
                    movies {
                        title
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
            	MATCH (this)<-[this_acted_in0_relationship:ACTED_IN]-(this_actors0:Actor)
            	WHERE this_actors0.name = $updateMovies_args_update_actors0_where_Actorparam0
            	SET this_acted_in0_relationship.screenTime = $updateMovies.args.update.actors[0].update.edge.screenTime
            	RETURN count(*) AS update_this_actors0
            }
            RETURN collect(DISTINCT this { .title }) AS data"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"param0\\": \\"Forrest Gump\\",
                \\"updateMovies_args_update_actors0_where_Actorparam0\\": \\"Tom Hanks\\",
                \\"updateMovies\\": {
                    \\"args\\": {
                        \\"update\\": {
                            \\"actors\\": [
                                {
                                    \\"where\\": {
                                        \\"node\\": {
                                            \\"name\\": \\"Tom Hanks\\"
                                        }
                                    },
                                    \\"update\\": {
                                        \\"edge\\": {
                                            \\"screenTime\\": {
                                                \\"low\\": 60,
                                                \\"high\\": 0
                                            }
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

    test("Update properties on both the relationship and end node in a nested update (update -> update)", async () => {
        const query = gql`
            mutation {
                updateMovies(
                    where: { title: "Forrest Gump" }
                    update: {
                        actors: [
                            {
                                where: { node: { name: "Tom Hanks" } }
                                update: { edge: { screenTime: 60 }, node: { name: "Tom Hanks" } }
                            }
                        ]
                    }
                ) {
                    movies {
                        title
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
            	MATCH (this)<-[this_acted_in0_relationship:ACTED_IN]-(this_actors0:Actor)
            	WHERE this_actors0.name = $updateMovies_args_update_actors0_where_Actorparam0
            	SET this_acted_in0_relationship.screenTime = $updateMovies.args.update.actors[0].update.edge.screenTime
            	SET this_actors0.name = $this_update_actors0_name
            	RETURN count(*) AS update_this_actors0
            }
            RETURN collect(DISTINCT this { .title }) AS data"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"param0\\": \\"Forrest Gump\\",
                \\"updateMovies_args_update_actors0_where_Actorparam0\\": \\"Tom Hanks\\",
                \\"this_update_actors0_name\\": \\"Tom Hanks\\",
                \\"updateMovies\\": {
                    \\"args\\": {
                        \\"update\\": {
                            \\"actors\\": [
                                {
                                    \\"where\\": {
                                        \\"node\\": {
                                            \\"name\\": \\"Tom Hanks\\"
                                        }
                                    },
                                    \\"update\\": {
                                        \\"node\\": {
                                            \\"name\\": \\"Tom Hanks\\"
                                        },
                                        \\"edge\\": {
                                            \\"screenTime\\": {
                                                \\"low\\": 60,
                                                \\"high\\": 0
                                            }
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
