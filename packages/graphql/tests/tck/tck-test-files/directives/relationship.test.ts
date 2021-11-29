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

describe("Cypher relationship", () => {
    const secret = "secret";
    let typeDefs: DocumentNode;
    let neoSchema: Neo4jGraphQL;

    beforeAll(() => {
        typeDefs = gql`
            type Actor {
                name: String
                movies: [Movie] @relationship(type: "ACTED_IN", direction: OUT)
            }

            interface MovieInterface {
                id: ID
                title: String
                actors: [Actor] @relationship(type: "ACTED_IN", direction: IN)
            }

            type Movie implements MovieInterface {
                id: ID
                title: String
                actors: [Actor]
                topActor: Actor @relationship(type: "TOP_ACTOR", direction: OUT)
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
                movies {
                    title
                    topActor {
                        name
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
            RETURN this { .title, topActor: head([ (this)-[:TOP_ACTOR]->(this_topActor:Actor)   | this_topActor { .name } ]) } AS this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`"{}"`);
    });

    test("Many relation", async () => {
        const query = gql`
            {
                movies {
                    title
                    actors {
                        name
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
            RETURN this { .title, actors: [ (this)<-[:ACTED_IN]-(this_actors:Actor)   | this_actors { .name } ] } AS this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`"{}"`);
    });

    test("Nested relation", async () => {
        const query = gql`
            {
                movies {
                    title
                    topActor {
                        name
                        movies {
                            title
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
            RETURN this { .title, topActor: head([ (this)-[:TOP_ACTOR]->(this_topActor:Actor)   | this_topActor { .name, movies: [ (this_topActor)-[:ACTED_IN]->(this_topActor_movies:Movie)   | this_topActor_movies { .title } ] } ]) } AS this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`"{}"`);
    });

    test("Nested relation with params", async () => {
        const query = gql`
            {
                movies(where: { title: "some title" }) {
                    title
                    topActor(where: { name: "top actor" }) {
                        name
                        movies(where: { title: "top actor movie" }) {
                            title
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
            RETURN this { .title, topActor: head([ (this)-[:TOP_ACTOR]->(this_topActor:Actor)  WHERE this_topActor.name = $this_topActor_name | this_topActor { .name, movies: [ (this_topActor)-[:ACTED_IN]->(this_topActor_movies:Movie)  WHERE this_topActor_movies.title = $this_topActor_movies_title | this_topActor_movies { .title } ] } ]) } AS this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"this_title\\": \\"some title\\",
                \\"this_topActor_movies_title\\": \\"top actor movie\\",
                \\"this_topActor_name\\": \\"top actor\\"
            }"
        `);
    });
});
