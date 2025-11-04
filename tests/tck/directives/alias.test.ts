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

describe("Cypher alias directive", () => {
    let typeDefs: string;
    let neoSchema: Neo4jGraphQL;

    beforeAll(() => {
        typeDefs = /* GraphQL */ `
            type Actor {
                name: String!
                city: String @alias(property: "cityPropInDb")
                actedIn: [Movie!]! @relationship(direction: OUT, type: "ACTED_IN", properties: "ActorActedInProps")
            }

            type Movie {
                title: String!
                rating: Float @alias(property: "ratingPropInDb")
            }

            type ActorActedInProps @relationshipProperties {
                character: String! @alias(property: "characterPropInDb")
                screenTime: Int
            }
        `;

        neoSchema = new Neo4jGraphQL({
            typeDefs,
        });
    });

    test("Simple relation", async () => {
        const query = /* GraphQL */ `
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

        const result = await translateQuery(neoSchema, query);

        expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
            "MATCH (this:Actor)
            CALL {
                WITH this
                MATCH (this)-[this0:ACTED_IN]->(this1:Movie)
                WITH this1 { .title, rating: this1.ratingPropInDb } AS this1
                RETURN collect(this1) AS var2
            }
            RETURN this { .name, city: this.cityPropInDb, actedIn: var2 } AS this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`"{}"`);
    });

    test("With relationship properties", async () => {
        const query = /* GraphQL */ `
            {
                actors {
                    name
                    city
                    actedInConnection {
                        edges {
                            properties {
                                character
                                screenTime
                            }
                            node {
                                title
                                rating
                            }
                        }
                    }
                }
            }
        `;

        const result = await translateQuery(neoSchema, query);

        expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
            "MATCH (this:Actor)
            CALL {
                WITH this
                MATCH (this)-[this0:ACTED_IN]->(this1:Movie)
                WITH collect({ node: this1, relationship: this0 }) AS edges
                WITH edges, size(edges) AS totalCount
                CALL {
                    WITH edges
                    UNWIND edges AS edge
                    WITH edge.node AS this1, edge.relationship AS this0
                    RETURN collect({ properties: { character: this0.characterPropInDb, screenTime: this0.screenTime, __resolveType: \\"ActorActedInProps\\" }, node: { title: this1.title, rating: this1.ratingPropInDb, __resolveType: \\"Movie\\" } }) AS var2
                }
                RETURN { edges: var2, totalCount: totalCount } AS var3
            }
            RETURN this { .name, city: this.cityPropInDb, actedInConnection: var3 } AS this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`"{}"`);
    });

    test("Create mutation", async () => {
        const query = /* GraphQL */ `
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
                                properties {
                                    character
                                    screenTime
                                }
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

        const result = await translateQuery(neoSchema, query);

        expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
            "UNWIND $create_param0 AS create_var0
            CALL {
                WITH create_var0
                CREATE (create_this1:Actor)
                SET
                    create_this1.name = create_var0.name,
                    create_this1.cityPropInDb = create_var0.city
                WITH create_this1, create_var0
                CALL {
                    WITH create_this1, create_var0
                    UNWIND create_var0.actedIn.create AS create_var2
                    CREATE (create_this3:Movie)
                    SET
                        create_this3.title = create_var2.node.title,
                        create_this3.ratingPropInDb = create_var2.node.rating
                    MERGE (create_this1)-[create_this4:ACTED_IN]->(create_this3)
                    SET
                        create_this4.characterPropInDb = create_var2.edge.character,
                        create_this4.screenTime = create_var2.edge.screenTime
                    RETURN collect(NULL) AS create_var5
                }
                RETURN create_this1
            }
            CALL {
                WITH create_this1
                MATCH (create_this1)-[create_this6:ACTED_IN]->(create_this7:Movie)
                WITH create_this7 { .title, rating: create_this7.ratingPropInDb } AS create_this7
                RETURN collect(create_this7) AS create_var8
            }
            CALL {
                WITH create_this1
                MATCH (create_this1)-[create_this9:ACTED_IN]->(create_this10:Movie)
                WITH collect({ node: create_this10, relationship: create_this9 }) AS edges
                WITH edges, size(edges) AS totalCount
                CALL {
                    WITH edges
                    UNWIND edges AS edge
                    WITH edge.node AS create_this10, edge.relationship AS create_this9
                    RETURN collect({ properties: { character: create_this9.characterPropInDb, screenTime: create_this9.screenTime, __resolveType: \\"ActorActedInProps\\" }, node: { title: create_this10.title, rating: create_this10.ratingPropInDb, __resolveType: \\"Movie\\" } }) AS create_var11
                }
                RETURN { edges: create_var11, totalCount: totalCount } AS create_var12
            }
            RETURN collect(create_this1 { .name, city: create_this1.cityPropInDb, actedIn: create_var8, actedInConnection: create_var12 }) AS data"
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
                                    \\"edge\\": {
                                        \\"character\\": \\"Molly\\",
                                        \\"screenTime\\": {
                                            \\"low\\": 120,
                                            \\"high\\": 0
                                        }
                                    },
                                    \\"node\\": {
                                        \\"title\\": \\"Molly's game\\",
                                        \\"rating\\": 5
                                    }
                                }
                            ]
                        }
                    }
                ]
            }"
        `);
    });
});
