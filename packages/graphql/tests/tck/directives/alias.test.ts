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

            interface ActorActedInProps @relationshipProperties {
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
            "UNWIND $create_param0 AS create_var2
            CALL {
                WITH create_var2
                CREATE (create_this1:\`Actor\`)
                SET
                    create_this1.name = create_var2.name,
                    create_this1.cityPropInDb = create_var2.city
                WITH create_this1, create_var2
                CALL {
                    WITH create_this1, create_var2
                    UNWIND create_var2.actedIn.create AS create_var3
                    WITH create_var3.node AS create_var4, create_var3.edge AS create_var5, create_this1
                    CREATE (create_this6:\`Movie\`)
                    SET
                        create_this6.title = create_var4.title,
                        create_this6.ratingPropInDb = create_var4.rating
                    MERGE (create_this1)-[create_this7:ACTED_IN]->(create_this6)
                    SET
                        create_this7.characterPropInDb = create_var5.character,
                        create_this7.screenTime = create_var5.screenTime
                    RETURN collect(NULL) AS create_var8
                }
                RETURN create_this1
            }
            CALL {
                WITH create_this1
                MATCH (create_this1)-[create_this0:ACTED_IN]->(create_this1_actedIn:\`Movie\`)
                WITH create_this1_actedIn { .title, rating: create_this1_actedIn.ratingPropInDb } AS create_this1_actedIn
                RETURN collect(create_this1_actedIn) AS create_this1_actedIn
            }
            CALL {
                WITH create_this1
                MATCH (create_this1)-[create_this1_connection_actedInConnectionthis0:ACTED_IN]->(create_this1_Movie:\`Movie\`)
                WITH { character: create_this1_connection_actedInConnectionthis0.characterPropInDb, screenTime: create_this1_connection_actedInConnectionthis0.screenTime, node: { title: create_this1_Movie.title, rating: create_this1_Movie.ratingPropInDb } } AS edge
                WITH collect(edge) AS edges
                WITH edges, size(edges) AS totalCount
                RETURN { edges: edges, totalCount: totalCount } AS create_this1_actedInConnection
            }
            RETURN collect(create_this1 { .name, city: create_this1.cityPropInDb, actedIn: create_this1_actedIn, actedInConnection: create_this1_actedInConnection }) AS data"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"create_param0\\": [
                    {
                        \\"name\\": \\"Molly\\",
                        \\"city\\": \\"Sjömarken\\",
                        \\"actedIn\\": {
                            \\"create\\": [
                                {
                                    \\"node\\": {
                                        \\"title\\": \\"Molly's game\\",
                                        \\"rating\\": 5
                                    },
                                    \\"edge\\": {
                                        \\"character\\": \\"Molly\\",
                                        \\"screenTime\\": {
                                            \\"low\\": 120,
                                            \\"high\\": 0
                                        }
                                    }
                                }
                            ]
                        }
                    }
                ],
                \\"resolvedCallbacks\\": {}
            }"
        `);
    });
});
