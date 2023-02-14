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

describe("Mixed nesting", () => {
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
            "MATCH (this:\`Movie\`)
            WHERE this.title = $param0
            CALL {
                WITH this
                MATCH (this)<-[this_connection_actorsConnectionthis0:ACTED_IN]-(this_Actor:\`Actor\`)
                WHERE this_Actor.name = $this_connection_actorsConnectionparam0
                CALL {
                    WITH this_Actor
                    MATCH (this_Actor)-[this_connection_actorsConnectionthis1:ACTED_IN]->(this_Actor_movies:\`Movie\`)
                    WHERE NOT (this_Actor_movies.title = $this_connection_actorsConnectionparam1)
                    WITH this_Actor_movies { .title } AS this_Actor_movies
                    RETURN collect(this_Actor_movies) AS this_Actor_movies
                }
                WITH { screenTime: this_connection_actorsConnectionthis0.screenTime, node: { name: this_Actor.name, movies: this_Actor_movies } } AS edge
                WITH collect(edge) AS edges
                WITH edges, size(edges) AS totalCount
                RETURN { edges: edges, totalCount: totalCount } AS this_actorsConnection
            }
            RETURN this { .title, actorsConnection: this_actorsConnection } AS this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"param0\\": \\"Forrest Gump\\",
                \\"this_connection_actorsConnectionparam0\\": \\"Tom Hanks\\",
                \\"this_connection_actorsConnectionparam1\\": \\"Forrest Gump\\"
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
            "MATCH (this:\`Movie\`)
            WHERE this.title = $param0
            CALL {
                WITH this
                MATCH (this)<-[this_connection_actorsConnectionthis0:ACTED_IN]-(this_Actor:\`Actor\`)
                WHERE this_Actor.name = $this_connection_actorsConnectionparam0
                CALL {
                    WITH this_Actor
                    MATCH (this_Actor)-[this_Actor_connection_moviesConnectionthis0:ACTED_IN]->(this_Actor_Movie:\`Movie\`)
                    WHERE NOT (this_Actor_Movie.title = $this_Actor_connection_moviesConnectionparam0)
                    CALL {
                        WITH this_Actor_Movie
                        MATCH (this_Actor_Movie)<-[this_Actor_connection_moviesConnectionthis1:ACTED_IN]-(this_Actor_Movie_actors:\`Actor\`)
                        WHERE NOT (this_Actor_Movie_actors.name = $this_Actor_connection_moviesConnectionparam1)
                        WITH this_Actor_Movie_actors { .name } AS this_Actor_Movie_actors
                        RETURN collect(this_Actor_Movie_actors) AS this_Actor_Movie_actors
                    }
                    WITH { node: { title: this_Actor_Movie.title, actors: this_Actor_Movie_actors } } AS edge
                    WITH collect(edge) AS edges
                    WITH edges, size(edges) AS totalCount
                    RETURN { edges: edges, totalCount: totalCount } AS this_Actor_moviesConnection
                }
                WITH { screenTime: this_connection_actorsConnectionthis0.screenTime, node: { name: this_Actor.name, moviesConnection: this_Actor_moviesConnection } } AS edge
                WITH collect(edge) AS edges
                WITH edges, size(edges) AS totalCount
                RETURN { edges: edges, totalCount: totalCount } AS this_actorsConnection
            }
            RETURN this { .title, actorsConnection: this_actorsConnection } AS this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"param0\\": \\"Forrest Gump\\",
                \\"this_connection_actorsConnectionparam0\\": \\"Tom Hanks\\",
                \\"this_Actor_connection_moviesConnectionparam0\\": \\"Forrest Gump\\",
                \\"this_Actor_connection_moviesConnectionparam1\\": \\"Tom Hanks\\"
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
            "MATCH (this:\`Movie\`)
            WHERE this.title = $param0
            CALL {
                WITH this
                MATCH (this)<-[this0:ACTED_IN]-(this_actors:\`Actor\`)
                WHERE this_actors.name = $param1
                CALL {
                    WITH this_actors
                    MATCH (this_actors)-[this_actors_connection_moviesConnectionthis0:ACTED_IN]->(this_actors_Movie:\`Movie\`)
                    WHERE NOT (this_actors_Movie.title = $this_actors_connection_moviesConnectionparam0)
                    WITH { screenTime: this_actors_connection_moviesConnectionthis0.screenTime, node: { title: this_actors_Movie.title } } AS edge
                    WITH collect(edge) AS edges
                    WITH edges, size(edges) AS totalCount
                    RETURN { edges: edges, totalCount: totalCount } AS this_actors_moviesConnection
                }
                WITH this_actors { .name, moviesConnection: this_actors_moviesConnection } AS this_actors
                RETURN collect(this_actors) AS this_actors
            }
            RETURN this { .title, actors: this_actors } AS this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"param0\\": \\"Forrest Gump\\",
                \\"param1\\": \\"Tom Hanks\\",
                \\"this_actors_connection_moviesConnectionparam0\\": \\"Forrest Gump\\"
            }"
        `);
    });
});
