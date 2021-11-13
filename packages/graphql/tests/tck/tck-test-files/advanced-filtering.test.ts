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
import { Neo4jGraphQL } from "../../../src";
import { createJwtRequest } from "../../../src/utils/test/utils";
import { formatCypher, translateQuery, formatParams, setTestEnvVars, unsetTestEnvVars } from "../utils/tck-test-utils";

describe("Cypher Advanced Filtering", () => {
    const secret = "secret";
    let typeDefs: DocumentNode;
    let neoSchema: Neo4jGraphQL;

    beforeAll(() => {
        typeDefs = gql`
            type Movie {
                _id: ID
                id: ID
                title: String
                actorCount: Int
                budget: BigInt
                genres: [Genre] @relationship(type: "IN_GENRE", direction: OUT)
            }

            type Genre {
                name: String
                movies: [Movie] @relationship(type: "IN_GENRE", direction: IN)
            }
        `;

        neoSchema = new Neo4jGraphQL({
            typeDefs,
            config: { enableRegex: true, jwt: { secret } },
        });
        setTestEnvVars("NEO4J_GRAPHQL_ENABLE_REGEX=1");
    });

    afterAll(() => {
        unsetTestEnvVars(undefined);
    });
    test("IN", async () => {
        const query = gql`
            {
                movies(where: { _id_IN: ["123"] }) {
                    _id
                }
            }
        `;

        const req = createJwtRequest("secret", {});
        const result = await translateQuery(neoSchema, query, {
            req,
        });

        expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
            "MATCH (this:Movie)
            WHERE this._id IN $this__id_IN
            RETURN this { ._id } AS this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"this__id_IN\\": [
                    \\"123\\"
                ]
            }"
        `);
    });

    test("REGEX", async () => {
        const query = gql`
            {
                movies(where: { id_MATCHES: "(?i)123.*" }) {
                    id
                }
            }
        `;

        const req = createJwtRequest("secret", {});
        const result = await translateQuery(neoSchema, query, {
            req,
        });

        expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
            "MATCH (this:Movie)
            WHERE this.id =~ $this_id_MATCHES
            RETURN this { .id } AS this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"this_id_MATCHES\\": \\"(?i)123.*\\"
            }"
        `);
    });

    test("NOT", async () => {
        const query = gql`
            {
                movies(where: { id_NOT: "123" }) {
                    id
                }
            }
        `;

        const req = createJwtRequest("secret", {});
        const result = await translateQuery(neoSchema, query, {
            req,
        });

        expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
            "MATCH (this:Movie)
            WHERE (NOT this.id = $this_id_NOT)
            RETURN this { .id } AS this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"this_id_NOT\\": \\"123\\"
            }"
        `);
    });

    test("NOT_IN", async () => {
        const query = gql`
            {
                movies(where: { id_NOT_IN: ["123"] }) {
                    id
                }
            }
        `;

        const req = createJwtRequest("secret", {});
        const result = await translateQuery(neoSchema, query, {
            req,
        });

        expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
            "MATCH (this:Movie)
            WHERE (NOT this.id IN $this_id_NOT_IN)
            RETURN this { .id } AS this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"this_id_NOT_IN\\": [
                    \\"123\\"
                ]
            }"
        `);
    });

    test("CONTAINS", async () => {
        const query = gql`
            {
                movies(where: { id_CONTAINS: "123" }) {
                    id
                }
            }
        `;

        const req = createJwtRequest("secret", {});
        const result = await translateQuery(neoSchema, query, {
            req,
        });

        expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
            "MATCH (this:Movie)
            WHERE this.id CONTAINS $this_id_CONTAINS
            RETURN this { .id } AS this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"this_id_CONTAINS\\": \\"123\\"
            }"
        `);
    });

    test("NOT_CONTAINS", async () => {
        const query = gql`
            {
                movies(where: { id_NOT_CONTAINS: "123" }) {
                    id
                }
            }
        `;

        const req = createJwtRequest("secret", {});
        const result = await translateQuery(neoSchema, query, {
            req,
        });

        expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
            "MATCH (this:Movie)
            WHERE (NOT this.id CONTAINS $this_id_NOT_CONTAINS)
            RETURN this { .id } AS this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"this_id_NOT_CONTAINS\\": \\"123\\"
            }"
        `);
    });

    test("STARTS_WITH", async () => {
        const query = gql`
            {
                movies(where: { id_STARTS_WITH: "123" }) {
                    id
                }
            }
        `;

        const req = createJwtRequest("secret", {});
        const result = await translateQuery(neoSchema, query, {
            req,
        });

        expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
            "MATCH (this:Movie)
            WHERE this.id STARTS WITH $this_id_STARTS_WITH
            RETURN this { .id } AS this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"this_id_STARTS_WITH\\": \\"123\\"
            }"
        `);
    });

    test("NOT_STARTS_WITH", async () => {
        const query = gql`
            {
                movies(where: { id_NOT_STARTS_WITH: "123" }) {
                    id
                }
            }
        `;

        const req = createJwtRequest("secret", {});
        const result = await translateQuery(neoSchema, query, {
            req,
        });

        expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
            "MATCH (this:Movie)
            WHERE (NOT this.id STARTS WITH $this_id_NOT_STARTS_WITH)
            RETURN this { .id } AS this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"this_id_NOT_STARTS_WITH\\": \\"123\\"
            }"
        `);
    });

    test("ENDS_WITH", async () => {
        const query = gql`
            {
                movies(where: { id_ENDS_WITH: "123" }) {
                    id
                }
            }
        `;

        const req = createJwtRequest("secret", {});
        const result = await translateQuery(neoSchema, query, {
            req,
        });

        expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
            "MATCH (this:Movie)
            WHERE this.id ENDS WITH $this_id_ENDS_WITH
            RETURN this { .id } AS this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"this_id_ENDS_WITH\\": \\"123\\"
            }"
        `);
    });

    test("NOT_ENDS_WITH", async () => {
        const query = gql`
            {
                movies(where: { id_NOT_ENDS_WITH: "123" }) {
                    id
                }
            }
        `;

        const req = createJwtRequest("secret", {});
        const result = await translateQuery(neoSchema, query, {
            req,
        });

        expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
            "MATCH (this:Movie)
            WHERE (NOT this.id ENDS WITH $this_id_NOT_ENDS_WITH)
            RETURN this { .id } AS this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"this_id_NOT_ENDS_WITH\\": \\"123\\"
            }"
        `);
    });

    test("LT", async () => {
        const query = gql`
            {
                movies(where: { actorCount_LT: 123 }) {
                    actorCount
                }
            }
        `;

        const req = createJwtRequest("secret", {});
        const result = await translateQuery(neoSchema, query, {
            req,
        });

        expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
            "MATCH (this:Movie)
            WHERE this.actorCount < $this_actorCount_LT
            RETURN this { .actorCount } AS this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"this_actorCount_LT\\": {
                    \\"low\\": 123,
                    \\"high\\": 0
                }
            }"
        `);
    });

    test("LT BigInt", async () => {
        const query = gql`
            {
                movies(where: { budget_LT: 9223372036854775807 }) {
                    budget
                }
            }
        `;

        const req = createJwtRequest("secret", {});
        const result = await translateQuery(neoSchema, query, {
            req,
        });

        expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
            "MATCH (this:Movie)
            WHERE this.budget < $this_budget_LT
            RETURN this { .budget } AS this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"this_budget_LT\\": {
                    \\"low\\": -1,
                    \\"high\\": 2147483647
                }
            }"
        `);
    });

    test("LTE", async () => {
        const query = gql`
            {
                movies(where: { actorCount_LTE: 123 }) {
                    actorCount
                }
            }
        `;

        const req = createJwtRequest("secret", {});
        const result = await translateQuery(neoSchema, query, {
            req,
        });

        expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
            "MATCH (this:Movie)
            WHERE this.actorCount <= $this_actorCount_LTE
            RETURN this { .actorCount } AS this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"this_actorCount_LTE\\": {
                    \\"low\\": 123,
                    \\"high\\": 0
                }
            }"
        `);
    });

    test("LTE BigInt", async () => {
        const query = gql`
            {
                movies(where: { budget_LTE: 9223372036854775807 }) {
                    budget
                }
            }
        `;

        const req = createJwtRequest("secret", {});
        const result = await translateQuery(neoSchema, query, {
            req,
        });

        expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
            "MATCH (this:Movie)
            WHERE this.budget <= $this_budget_LTE
            RETURN this { .budget } AS this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"this_budget_LTE\\": {
                    \\"low\\": -1,
                    \\"high\\": 2147483647
                }
            }"
        `);
    });

    test("GT", async () => {
        const query = gql`
            {
                movies(where: { actorCount_GT: 123 }) {
                    actorCount
                }
            }
        `;

        const req = createJwtRequest("secret", {});
        const result = await translateQuery(neoSchema, query, {
            req,
        });

        expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
            "MATCH (this:Movie)
            WHERE this.actorCount > $this_actorCount_GT
            RETURN this { .actorCount } AS this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"this_actorCount_GT\\": {
                    \\"low\\": 123,
                    \\"high\\": 0
                }
            }"
        `);
    });

    test("GT BigInt", async () => {
        const query = gql`
            {
                movies(where: { budget_GT: 9223372036854775000 }) {
                    budget
                }
            }
        `;

        const req = createJwtRequest("secret", {});
        const result = await translateQuery(neoSchema, query, {
            req,
        });

        expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
            "MATCH (this:Movie)
            WHERE this.budget > $this_budget_GT
            RETURN this { .budget } AS this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"this_budget_GT\\": {
                    \\"low\\": -808,
                    \\"high\\": 2147483647
                }
            }"
        `);
    });

    test("GTE", async () => {
        const query = gql`
            {
                movies(where: { actorCount_GTE: 123 }) {
                    actorCount
                }
            }
        `;

        const req = createJwtRequest("secret", {});
        const result = await translateQuery(neoSchema, query, {
            req,
        });

        expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
            "MATCH (this:Movie)
            WHERE this.actorCount >= $this_actorCount_GTE
            RETURN this { .actorCount } AS this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"this_actorCount_GTE\\": {
                    \\"low\\": 123,
                    \\"high\\": 0
                }
            }"
        `);
    });

    test("GTE BigInt", async () => {
        const query = gql`
            {
                movies(where: { budget_GTE: 9223372036854775000 }) {
                    budget
                }
            }
        `;

        const req = createJwtRequest("secret", {});
        const result = await translateQuery(neoSchema, query, {
            req,
        });

        expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
            "MATCH (this:Movie)
            WHERE this.budget >= $this_budget_GTE
            RETURN this { .budget } AS this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"this_budget_GTE\\": {
                    \\"low\\": -808,
                    \\"high\\": 2147483647
                }
            }"
        `);
    });

    test("Relationship equality", async () => {
        const query = gql`
            {
                movies(where: { genres: { name: "some genre" } }) {
                    actorCount
                }
            }
        `;

        const req = createJwtRequest("secret", {});
        const result = await translateQuery(neoSchema, query, {
            req,
        });

        expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
            "MATCH (this:Movie)
            WHERE EXISTS((this)-[:IN_GENRE]->(:Genre)) AND ANY(this_genres IN [(this)-[:IN_GENRE]->(this_genres:Genre) | this_genres] WHERE this_genres.name = $this_genres_name)
            RETURN this { .actorCount } AS this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"this_genres_name\\": \\"some genre\\"
            }"
        `);
    });

    test("Relationship NOT", async () => {
        const query = gql`
            {
                movies(where: { genres_NOT: { name: "some genre" } }) {
                    actorCount
                }
            }
        `;

        const req = createJwtRequest("secret", {});
        const result = await translateQuery(neoSchema, query, {
            req,
        });

        expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
            "MATCH (this:Movie)
            WHERE EXISTS((this)-[:IN_GENRE]->(:Genre)) AND NONE(this_genres_NOT IN [(this)-[:IN_GENRE]->(this_genres_NOT:Genre) | this_genres_NOT] WHERE this_genres_NOT.name = $this_genres_NOT_name)
            RETURN this { .actorCount } AS this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"this_genres_NOT_name\\": \\"some genre\\"
            }"
        `);
    });

    test("Node and relationship properties equality", async () => {
        const query = gql`
            {
                movies(where: { genresConnection: { node: { name: "some genre" } } }) {
                    actorCount
                }
            }
        `;

        const req = createJwtRequest("secret", {});
        const result = await translateQuery(neoSchema, query, {
            req,
        });

        expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
            "MATCH (this:Movie)
            WHERE EXISTS((this)-[:IN_GENRE]->(:Genre)) AND ANY(this_genresConnection_Genre_map IN [(this)-[this_genresConnection_Genre_MovieGenresRelationship:IN_GENRE]->(this_genresConnection_Genre:Genre)  | { node: this_genresConnection_Genre, relationship: this_genresConnection_Genre_MovieGenresRelationship } ] WHERE this_genresConnection_Genre_map.node.name = $this_movies.where.genresConnection.node.name)
            RETURN this { .actorCount } AS this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"this_movies\\": {
                    \\"where\\": {
                        \\"genresConnection\\": {
                            \\"node\\": {
                                \\"name\\": \\"some genre\\"
                            }
                        }
                    }
                }
            }"
        `);
    });

    test("Node and relationship properties NOT", async () => {
        const query = gql`
            {
                movies(where: { genresConnection_NOT: { node: { name: "some genre" } } }) {
                    actorCount
                }
            }
        `;

        const req = createJwtRequest("secret", {});
        const result = await translateQuery(neoSchema, query, {
            req,
        });

        expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
            "MATCH (this:Movie)
            WHERE EXISTS((this)-[:IN_GENRE]->(:Genre)) AND NONE(this_genresConnection_NOT_Genre_map IN [(this)-[this_genresConnection_NOT_Genre_MovieGenresRelationship:IN_GENRE]->(this_genresConnection_NOT_Genre:Genre)  | { node: this_genresConnection_NOT_Genre, relationship: this_genresConnection_NOT_Genre_MovieGenresRelationship } ] WHERE this_genresConnection_NOT_Genre_map.node.name = $this_movies.where.genresConnection_NOT.node.name)
            RETURN this { .actorCount } AS this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"this_movies\\": {
                    \\"where\\": {
                        \\"genresConnection_NOT\\": {
                            \\"node\\": {
                                \\"name\\": \\"some genre\\"
                            }
                        }
                    }
                }
            }"
        `);
    });
});
