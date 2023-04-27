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

import { gql } from "graphql-tag";
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
                MATCH (this)-[this0:\`ACTED_IN\`]->(this1:\`Movie\`)
                WITH this1 { .title, rating: this1.ratingPropInDb } AS this1
                RETURN collect(this1) AS var2
            }
            RETURN this { .name, city: this.cityPropInDb, actedIn: var2 } AS this"
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
                MATCH (this)-[this0:\`ACTED_IN\`]->(this1:\`Movie\`)
                WITH { character: this0.characterPropInDb, screenTime: this0.screenTime, node: { title: this1.title, rating: this1.ratingPropInDb } } AS edge
                WITH collect(edge) AS edges
                WITH edges, size(edges) AS totalCount
                RETURN { edges: edges, totalCount: totalCount } AS var2
            }
            RETURN this { .name, city: this.cityPropInDb, actedInConnection: var2 } AS this"
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
            "UNWIND $create_param0 AS create_var7
            CALL {
                WITH create_var7
                CREATE (create_this0:\`Actor\`)
                SET
                    create_this0.name = create_var7.name,
                    create_this0.cityPropInDb = create_var7.city
                WITH create_this0, create_var7
                CALL {
                    WITH create_this0, create_var7
                    UNWIND create_var7.actedIn.create AS create_var8
                    WITH create_var8.node AS create_var9, create_var8.edge AS create_var10, create_this0
                    CREATE (create_this11:\`Movie\`)
                    SET
                        create_this11.title = create_var9.title,
                        create_this11.ratingPropInDb = create_var9.rating
                    MERGE (create_this0)-[create_this12:\`ACTED_IN\`]->(create_this11)
                    SET
                        create_this12.characterPropInDb = create_var10.character,
                        create_this12.screenTime = create_var10.screenTime
                    RETURN collect(NULL) AS create_var13
                }
                RETURN create_this0
            }
            CALL {
                WITH create_this0
                MATCH (create_this0)-[create_this1:\`ACTED_IN\`]->(create_this2:\`Movie\`)
                WITH create_this2 { .title, rating: create_this2.ratingPropInDb } AS create_this2
                RETURN collect(create_this2) AS create_var3
            }
            CALL {
                WITH create_this0
                MATCH (create_this0:\`Actor\`)-[create_this4:\`ACTED_IN\`]->(create_this5:\`Movie\`)
                WITH { character: create_this4.characterPropInDb, screenTime: create_this4.screenTime, node: { title: create_this5.title, rating: create_this5.ratingPropInDb } } AS edge
                WITH collect(edge) AS edges
                WITH edges, size(edges) AS totalCount
                RETURN { edges: edges, totalCount: totalCount } AS create_var6
            }
            RETURN collect(create_this0 { .name, city: create_this0.cityPropInDb, actedIn: create_var3, actedInConnection: create_var6 }) AS data"
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
