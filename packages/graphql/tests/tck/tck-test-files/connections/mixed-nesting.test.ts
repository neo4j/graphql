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

describe("Mixed nesting", () => {
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

    test("Connection -> Relationship", async () => {
        const query = gql`
            query {
                movies(where: { title: "Forrest Gump" }) {
                    title
                    actorsConnection(where: { node: { name: "Tom Hanks" } }) {
                        edges {
                            screenTime
                            node {
                                name
                                movies(where: { title_NOT: "Forrest Gump" }) {
                                    title
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
            WHERE this_actor.name = $this_actorsConnection.args.where.node.name
            WITH collect({ screenTime: this_acted_in_relationship.screenTime, node: { name: this_actor.name, movies: [ (this_actor)-[:ACTED_IN]->(this_actor_movies:Movie)  WHERE (NOT this_actor_movies.title = $this_actor_movies_title_NOT) | this_actor_movies { .title } ] } }) AS edges
            RETURN { edges: edges, totalCount: size(edges) } AS actorsConnection
            }
            RETURN this { .title, actorsConnection } as this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"this_title\\": \\"Forrest Gump\\",
                \\"this_actor_movies_title_NOT\\": \\"Forrest Gump\\",
                \\"this_actorsConnection\\": {
                    \\"args\\": {
                        \\"where\\": {
                            \\"node\\": {
                                \\"name\\": \\"Tom Hanks\\"
                            }
                        }
                    }
                }
            }"
        `);
    });

    test("Connection -> Connection -> Relationship", async () => {
        const query = gql`
            query {
                movies(where: { title: "Forrest Gump" }) {
                    title
                    actorsConnection(where: { node: { name: "Tom Hanks" } }) {
                        edges {
                            screenTime
                            node {
                                name
                                moviesConnection(where: { node: { title_NOT: "Forrest Gump" } }) {
                                    edges {
                                        node {
                                            title
                                            actors(where: { name_NOT: "Tom Hanks" }) {
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
            CALL {
            WITH this_actor
            MATCH (this_actor)-[this_actor_acted_in_relationship:ACTED_IN]->(this_actor_movie:Movie)
            WHERE (NOT this_actor_movie.title = $this_actorsConnection.edges.node.moviesConnection.args.where.node.title_NOT)
            WITH collect({ node: { title: this_actor_movie.title, actors: [ (this_actor_movie)<-[:ACTED_IN]-(this_actor_movie_actors:Actor)  WHERE (NOT this_actor_movie_actors.name = $this_actor_movie_actors_name_NOT) | this_actor_movie_actors { .name } ] } }) AS edges
            RETURN { edges: edges, totalCount: size(edges) } AS moviesConnection
            }
            WITH collect({ screenTime: this_acted_in_relationship.screenTime, node: { name: this_actor.name, moviesConnection: moviesConnection } }) AS edges
            RETURN { edges: edges, totalCount: size(edges) } AS actorsConnection
            }
            RETURN this { .title, actorsConnection } as this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"this_title\\": \\"Forrest Gump\\",
                \\"this_actor_movie_actors_name_NOT\\": \\"Tom Hanks\\",
                \\"this_actorsConnection\\": {
                    \\"args\\": {
                        \\"where\\": {
                            \\"node\\": {
                                \\"name\\": \\"Tom Hanks\\"
                            }
                        }
                    },
                    \\"edges\\": {
                        \\"node\\": {
                            \\"moviesConnection\\": {
                                \\"args\\": {
                                    \\"where\\": {
                                        \\"node\\": {
                                            \\"title_NOT\\": \\"Forrest Gump\\"
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            }"
        `);
    });

    test("Relationship -> Connection", async () => {
        const query = gql`
            query {
                movies(where: { title: "Forrest Gump" }) {
                    title
                    actors(where: { name: "Tom Hanks" }) {
                        name
                        moviesConnection(where: { node: { title_NOT: "Forrest Gump" } }) {
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
        `;

        const req = createJwtRequest("secret", {});
        const result = await translateQuery(neoSchema, query, {
            req,
        });

        expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
            "MATCH (this:Movie)
            WHERE this.title = $this_title
            RETURN this { .title, actors: [ (this)<-[:ACTED_IN]-(this_actors:Actor)  WHERE this_actors.name = $this_actors_name | this_actors { .name, moviesConnection: apoc.cypher.runFirstColumn(\\"CALL {
            WITH this_actors
            MATCH (this_actors)-[this_actors_acted_in_relationship:ACTED_IN]->(this_actors_movie:Movie)
            WHERE (NOT this_actors_movie.title = $this_actors_moviesConnection.args.where.node.title_NOT)
            WITH collect({ screenTime: this_actors_acted_in_relationship.screenTime, node: { title: this_actors_movie.title } }) AS edges
            RETURN { edges: edges, totalCount: size(edges) } AS moviesConnection
            } RETURN moviesConnection\\", { this_actors: this_actors, this_actors_moviesConnection: $this_actors_moviesConnection }, false) } ] } as this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"this_title\\": \\"Forrest Gump\\",
                \\"this_actors_moviesConnection\\": {
                    \\"args\\": {
                        \\"where\\": {
                            \\"node\\": {
                                \\"title_NOT\\": \\"Forrest Gump\\"
                            }
                        }
                    }
                },
                \\"this_actors_name\\": \\"Tom Hanks\\"
            }"
        `);
    });
});
