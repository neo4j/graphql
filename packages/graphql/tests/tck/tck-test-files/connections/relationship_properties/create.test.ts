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
import { Neo4jGraphQL } from "../../../../../src";
import { createJwtRequest } from "../../../../utils/create-jwt-request";
import { formatCypher, translateQuery, formatParams } from "../../../utils/tck-test-utils";

describe("Relationship Properties Create Cypher", () => {
    const secret = "secret";
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
            config: { enableRegex: true, jwt: { secret } },
        });
    });

    test("Create movie with a relationship that has properties", async () => {
        const query = gql`
            mutation {
                createMovies(
                    input: [
                        {
                            title: "Forrest Gump"
                            actors: { create: [{ node: { name: "Tom Hanks" }, edge: { screenTime: 60 } }] }
                        }
                    ]
                ) {
                    movies {
                        title
                        actorsConnection {
                            edges {
                                screenTime
                                node {
                                    name
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
            "CALL {
            CREATE (this0:Movie)
            SET this0.title = $this0_title
            WITH this0
            CREATE (this0_actors0_node:Actor)
            SET this0_actors0_node.name = $this0_actors0_node_name
            WITH this0, this0_actors0_node
            CALL apoc.util.validate(NOT(apoc.util.validatePredicate(NOT(EXISTS((this0_actors0_node)-[:ACTED_IN]->(:Movie))), '@neo4j/graphql/RELATIONSHIP-REQUIREDActor.movies required', [0])), '@neo4j/graphql/RELATIONSHIP-REQUIRED', [0])
            MERGE (this0)<-[this0_actors0_relationship:ACTED_IN]-(this0_actors0_node)
            SET this0_actors0_relationship.screenTime = $this0_actors0_relationship_screenTime
            WITH this0
            CALL apoc.util.validate(NOT(apoc.util.validatePredicate(NOT(EXISTS((this0)<-[:ACTED_IN]-(:Actor))), '@neo4j/graphql/RELATIONSHIP-REQUIREDMovie.actors required', [0])), '@neo4j/graphql/RELATIONSHIP-REQUIRED', [0])
            RETURN this0
            }
            CALL {
            WITH this0
            MATCH (this0)<-[this0_acted_in_relationship:ACTED_IN]-(this0_actor:Actor)
            WITH collect({ screenTime: this0_acted_in_relationship.screenTime, node: { name: this0_actor.name } }) AS edges
            RETURN { edges: edges, totalCount: size(edges) } AS actorsConnection
            }
            RETURN
            this0 { .title, actorsConnection } AS this0"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"this0_title\\": \\"Forrest Gump\\",
                \\"this0_actors0_node_name\\": \\"Tom Hanks\\",
                \\"this0_actors0_relationship_screenTime\\": {
                    \\"low\\": 60,
                    \\"high\\": 0
                }
            }"
        `);
    });
});
