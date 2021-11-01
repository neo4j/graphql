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

describe("Relationship Properties Cypher", () => {
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

    test("Projecting node and relationship properties with no arguments", async () => {
        const query = gql`
            query {
                movies(where: { title: "Forrest Gump" }) {
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
        `;

        const req = createJwtRequest("secret", {});
        const result = await translateQuery(neoSchema, query, {
            req,
        });

        expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
            "MATCH (this:Movie)
            WHERE this.title = $this_title
            CALL {
            WITH this
            MATCH (this)<-[this_acted_in_relationship:ACTED_IN]-(this_actor:Actor)
            WITH collect({ screenTime: this_acted_in_relationship.screenTime, node: { name: this_actor.name } }) AS edges
            RETURN { edges: edges, totalCount: size(edges) } AS actorsConnection
            }
            RETURN this { .title, actorsConnection } as this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"this_title\\": \\"Forrest Gump\\"
            }"
        `);
    });

    test("Projecting node and relationship properties with where argument", async () => {
        const query = gql`
            query {
                movies(where: { title: "Forrest Gump" }) {
                    title
                    actorsConnection(where: { node: { name: "Tom Hanks" } }) {
                        edges {
                            screenTime
                            node {
                                name
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
            "MATCH (this:Movie)
            WHERE this.title = $this_title
            CALL {
            WITH this
            MATCH (this)<-[this_acted_in_relationship:ACTED_IN]-(this_actor:Actor)
            WHERE this_actor.name = $this_actorsConnection.args.where.node.name
            WITH collect({ screenTime: this_acted_in_relationship.screenTime, node: { name: this_actor.name } }) AS edges
            RETURN { edges: edges, totalCount: size(edges) } AS actorsConnection
            }
            RETURN this { .title, actorsConnection } as this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"this_actorsConnection\\": {
                    \\"args\\": {
                        \\"where\\": {
                            \\"node\\": {
                                \\"name\\": \\"Tom Hanks\\"
                            }
                        }
                    }
                },
                \\"this_title\\": \\"Forrest Gump\\"
            }"
        `);
    });

    test("Projecting node and relationship properties with sort argument", async () => {
        const query = gql`
            query {
                movies(where: { title: "Forrest Gump" }) {
                    title
                    actorsConnection(sort: { edge: { screenTime: DESC } }) {
                        edges {
                            screenTime
                            node {
                                name
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
            "MATCH (this:Movie)
            WHERE this.title = $this_title
            CALL {
            WITH this
            MATCH (this)<-[this_acted_in_relationship:ACTED_IN]-(this_actor:Actor)
            WITH this_acted_in_relationship, this_actor
            ORDER BY this_acted_in_relationship.screenTime DESC
            WITH collect({ screenTime: this_acted_in_relationship.screenTime, node: { name: this_actor.name } }) AS edges
            RETURN { edges: edges, totalCount: size(edges) } AS actorsConnection
            }
            RETURN this { .title, actorsConnection } as this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"this_title\\": \\"Forrest Gump\\"
            }"
        `);
    });

    test("Projecting twice nested node and relationship properties with no arguments", async () => {
        const query = gql`
            query {
                movies(where: { title: "Forrest Gump" }) {
                    title
                    actorsConnection {
                        edges {
                            screenTime
                            node {
                                name
                                moviesConnection {
                                    edges {
                                        screenTime
                                        node {
                                            title
                                        }
                                    }
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
            "MATCH (this:Movie)
            WHERE this.title = $this_title
            CALL {
            WITH this
            MATCH (this)<-[this_acted_in_relationship:ACTED_IN]-(this_actor:Actor)
            CALL {
            WITH this_actor
            MATCH (this_actor)-[this_actor_acted_in_relationship:ACTED_IN]->(this_actor_movie:Movie)
            WITH collect({ screenTime: this_actor_acted_in_relationship.screenTime, node: { title: this_actor_movie.title } }) AS edges
            RETURN { edges: edges, totalCount: size(edges) } AS moviesConnection
            }
            WITH collect({ screenTime: this_acted_in_relationship.screenTime, node: { name: this_actor.name, moviesConnection: moviesConnection } }) AS edges
            RETURN { edges: edges, totalCount: size(edges) } AS actorsConnection
            }
            RETURN this { .title, actorsConnection } as this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"this_title\\": \\"Forrest Gump\\"
            }"
        `);
    });

    test("Projecting thrice nested node and relationship properties with no arguments", async () => {
        const query = gql`
            query {
                movies(where: { title: "Forrest Gump" }) {
                    title
                    actorsConnection {
                        edges {
                            screenTime
                            node {
                                name
                                moviesConnection {
                                    edges {
                                        screenTime
                                        node {
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
            "MATCH (this:Movie)
            WHERE this.title = $this_title
            CALL {
            WITH this
            MATCH (this)<-[this_acted_in_relationship:ACTED_IN]-(this_actor:Actor)
            CALL {
            WITH this_actor
            MATCH (this_actor)-[this_actor_acted_in_relationship:ACTED_IN]->(this_actor_movie:Movie)
            CALL {
            WITH this_actor_movie
            MATCH (this_actor_movie)<-[this_actor_movie_acted_in_relationship:ACTED_IN]-(this_actor_movie_actor:Actor)
            WITH collect({ screenTime: this_actor_movie_acted_in_relationship.screenTime, node: { name: this_actor_movie_actor.name } }) AS edges
            RETURN { edges: edges, totalCount: size(edges) } AS actorsConnection
            }
            WITH collect({ screenTime: this_actor_acted_in_relationship.screenTime, node: { title: this_actor_movie.title, actorsConnection: actorsConnection } }) AS edges
            RETURN { edges: edges, totalCount: size(edges) } AS moviesConnection
            }
            WITH collect({ screenTime: this_acted_in_relationship.screenTime, node: { name: this_actor.name, moviesConnection: moviesConnection } }) AS edges
            RETURN { edges: edges, totalCount: size(edges) } AS actorsConnection
            }
            RETURN this { .title, actorsConnection } as this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"this_title\\": \\"Forrest Gump\\"
            }"
        `);
    });
});
