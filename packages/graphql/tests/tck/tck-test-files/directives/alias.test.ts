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
import { Neo4jGraphQL } from "../../../../src";
import { createJwtRequest } from "../../../../src/utils/test/utils";
import { formatCypher, translateQuery, formatParams } from "../../utils/tck-test-utils";

describe("Cypher alias directive", () => {
    const secret = "secret";
    let typeDefs: DocumentNode;
    let neoSchema: Neo4jGraphQL;

    beforeAll(() => {
        typeDefs = gql`
            type Actor {
                name: String!
                city: String @alias(property: "cityPropInDb")
                actedIn: [Movie] @relationship(direction: OUT, type: "ACTED_IN", properties: "ActorActedInProps")
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
            config: { enableRegex: true, jwt: { secret } },
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
            "MATCH (this:Actor)
            RETURN this { .name, city: this.cityPropInDb, actedIn: [ (this)-[:ACTED_IN]->(this_actedIn:Movie)   | this_actedIn { .title, rating: this_actedIn.ratingPropInDb } ] } AS this"
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
            "MATCH (this:Actor)
            CALL {
            WITH this
            MATCH (this)-[this_acted_in_relationship:ACTED_IN]->(this_movie:Movie)
            WITH collect({ character: this_acted_in_relationship.characterPropInDb, screenTime: this_acted_in_relationship.screenTime, node: { title: this_movie.title, rating: this_movie.ratingPropInDb } }) AS edges
            RETURN { edges: edges, totalCount: size(edges) } AS actedInConnection
            }
            RETURN this { .name, city: this.cityPropInDb, actedInConnection } AS this"
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
            WITH this0, [ metaVal IN [{type: 'Created', name: 'Actor', id: id(this0), properties: this0}] WHERE metaVal IS NOT NULL AND metaVal.id IS NOT NULL ] as this0_mutateMeta
            CREATE (this0_actedIn0_node:Movie)
            SET this0_actedIn0_node.title = $this0_actedIn0_node_title
            SET this0_actedIn0_node.ratingPropInDb = $this0_actedIn0_node_rating
            MERGE (this0)-[this0_actedIn0_relationship:ACTED_IN]->(this0_actedIn0_node)
            SET this0_actedIn0_relationship.characterPropInDb = $this0_actedIn0_relationship_character
            SET this0_actedIn0_relationship.screenTime = $this0_actedIn0_relationship_screenTime
            RETURN this0, REDUCE(tmp1_this0_mutateMeta = [], tmp2_this0_mutateMeta IN COLLECT(this0_mutateMeta + [ metaVal IN [{type: 'Created', name: 'Movie', id: id(this0_actedIn0_node), properties: this0_actedIn0_node}] WHERE metaVal IS NOT NULL AND metaVal.id IS NOT NULL ]) | tmp1_this0_mutateMeta + tmp2_this0_mutateMeta) as this0_mutateMeta
            }
            WITH this0, this0_mutateMeta as mutateMeta
            CALL {
            WITH this0
            MATCH (this0)-[this0_acted_in_relationship:ACTED_IN]->(this0_movie:Movie)
            WITH collect({ character: this0_acted_in_relationship.characterPropInDb, screenTime: this0_acted_in_relationship.screenTime, node: { title: this0_movie.title, rating: this0_movie.ratingPropInDb } }) AS edges
            RETURN { edges: edges, totalCount: size(edges) } AS actedInConnection
            }
            RETURN mutateMeta, this0 { .name, city: this0.cityPropInDb, actedIn: [ (this0)-[:ACTED_IN]->(this0_actedIn:Movie)   | this0_actedIn { .title, rating: this0_actedIn.ratingPropInDb } ], actedInConnection } AS this0"
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
                }
            }"
        `);
    });
});
