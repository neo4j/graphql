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
import { Neo4jGraphQL } from "../../../src";
import { createJwtRequest } from "../../utils/create-jwt-request";
import { formatCypher, translateQuery, formatParams } from "../utils/tck-test-utils";

describe("Cypher alias directive", () => {
    let typeDefs: DocumentNode;
    let neoSchema: Neo4jGraphQL;

    beforeAll(() => {
        typeDefs = gql`
            type Actor {
                name: String!
                city: String @alias(property: "cityPropInDb")
                actedIn: [Movie!]! @relationship(direction: OUT, type: "ACTED_IN", properties: "ActorActedInProps")
            }

            type Movie {
                title: String!
                rating: Float @alias(property: "ratingPropInDb")
            }

            interface ActorActedInProps {
                character: String! @alias(property: "characterPropInDb")
                screenTime: Int
            }
        `;

        neoSchema = new Neo4jGraphQL({
            typeDefs,
            config: { enableRegex: true },
        });
    });

    test("Simple relation", async () => {
        const query = gql`
            {
                actors {
                    name
                    city
                    actedIn {
                        title
                        rating
                    }
                }
            }
        `;

        const req = createJwtRequest("secret", {});
        const result = await translateQuery(neoSchema, query, {
            req,
        });

        expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
            "MATCH (this:\`Actor\`)
            CALL {
                WITH this
                MATCH (this)-[this0:ACTED_IN]->(this_actedIn:\`Movie\`)
                WITH this_actedIn { .title, rating: this_actedIn.ratingPropInDb } AS this_actedIn
                RETURN collect(this_actedIn) AS this_actedIn
            }
            RETURN this { .name, city: this.cityPropInDb, actedIn: this_actedIn } AS this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`"{}"`);
    });

    test("With relationship properties", async () => {
        const query = gql`
            {
                actors {
                    name
                    city
                    actedInConnection {
                        edges {
                            character
                            screenTime
                            node {
                                title
                                rating
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
            "MATCH (this:\`Actor\`)
            CALL {
                WITH this
                MATCH (this)-[this_connection_actedInConnectionthis0:ACTED_IN]->(this_Movie:\`Movie\`)
                WITH { character: this_connection_actedInConnectionthis0.characterPropInDb, screenTime: this_connection_actedInConnectionthis0.screenTime, node: { title: this_Movie.title, rating: this_Movie.ratingPropInDb } } AS edge
                WITH collect(edge) AS edges
                WITH edges, size(edges) AS totalCount
                RETURN { edges: edges, totalCount: totalCount } AS this_actedInConnection
            }
            RETURN this { .name, city: this.cityPropInDb, actedInConnection: this_actedInConnection } AS this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`"{}"`);
    });

    test("Create mutation", async () => {
        const query = gql`
            mutation {
                createActors(
                    input: [
                        {
                            name: "Molly"
                            city: "Sjömarken"
                            actedIn: {
                                create: {
                                    node: { title: "Molly's game", rating: 5.0 }
                                    edge: { character: "Molly", screenTime: 120 }
                                }
                            }
                        }
                    ]
                ) {
                    actors {
                        name
                        city
                        actedIn {
                            title
                            rating
                        }
                        actedInConnection {
                            edges {
                                character
                                screenTime
                                node {
                                    title
                                    rating
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
            CREATE (this0:Actor)
            SET this0.name = $this0_name
            SET this0.cityPropInDb = $this0_city
            WITH this0
            CREATE (this0_actedIn0_node:Movie)
            SET this0_actedIn0_node.title = $this0_actedIn0_node_title
            SET this0_actedIn0_node.ratingPropInDb = $this0_actedIn0_node_rating
            MERGE (this0)-[this0_actedIn0_relationship:ACTED_IN]->(this0_actedIn0_node)
            SET this0_actedIn0_relationship.characterPropInDb = $this0_actedIn0_relationship_character
            SET this0_actedIn0_relationship.screenTime = $this0_actedIn0_relationship_screenTime
            RETURN this0
            }
            CALL {
                WITH this0
                MATCH (this0)-[create_this0:ACTED_IN]->(this0_actedIn:\`Movie\`)
                WITH this0_actedIn { .title, rating: this0_actedIn.ratingPropInDb } AS this0_actedIn
                RETURN collect(this0_actedIn) AS this0_actedIn
            }
            CALL {
                WITH this0
                MATCH (this0)-[this0_connection_actedInConnectionthis0:ACTED_IN]->(this0_Movie:\`Movie\`)
                WITH { character: this0_connection_actedInConnectionthis0.characterPropInDb, screenTime: this0_connection_actedInConnectionthis0.screenTime, node: { title: this0_Movie.title, rating: this0_Movie.ratingPropInDb } } AS edge
                WITH collect(edge) AS edges
                WITH edges, size(edges) AS totalCount
                RETURN { edges: edges, totalCount: totalCount } AS this0_actedInConnection
            }
            RETURN [
            this0 { .name, city: this0.cityPropInDb, actedIn: this0_actedIn, actedInConnection: this0_actedInConnection }] AS data"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"this0_name\\": \\"Molly\\",
                \\"this0_city\\": \\"Sjömarken\\",
                \\"this0_actedIn0_node_title\\": \\"Molly's game\\",
                \\"this0_actedIn0_node_rating\\": 5,
                \\"this0_actedIn0_relationship_character\\": \\"Molly\\",
                \\"this0_actedIn0_relationship_screenTime\\": {
                    \\"low\\": 120,
                    \\"high\\": 0
                },
                \\"resolvedCallbacks\\": {}
            }"
        `);
    });
});
