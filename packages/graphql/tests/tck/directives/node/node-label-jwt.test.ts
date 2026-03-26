/*
 * Copyright (c) "Neo4j"
 * Neo4j Sweden AB [http://neo4j.com]
 */

import { Neo4jGraphQL } from "../../../../src";
import { createBearerToken } from "../../../utils/create-bearer-token";
import { formatCypher, formatParams, translateQuery } from "../../utils/tck-test-utils";

describe("Label in Node directive", () => {
    const secret = "secret";
    let typeDefs: string;
    let neoSchema: Neo4jGraphQL;

    beforeAll(() => {
        typeDefs = /* GraphQL */ `
            type Actor @node(labels: ["Actor", "$jwt.personlabel"]) {
                name: String
                age: Int
                movies: [Movie!]! @relationship(type: "ACTED_IN", direction: OUT)
            }

            type Movie @node(labels: ["$jwt.movielabel"]) {
                id: ID
                title: String
                actors: [Actor!]! @relationship(type: "ACTED_IN", direction: IN)
            }
        `;

        neoSchema = new Neo4jGraphQL({
            typeDefs,
            features: { authorization: { key: secret } },
        });
    });

    test("Select Movie with label Film", async () => {
        const query = /* GraphQL */ `
            query {
                movies {
                    title
                }
            }
        `;

        const token = createBearerToken("secret", { movielabel: "Film" });
        const result = await translateQuery(neoSchema, query, { token });

        expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
            "CYPHER 5
            MATCH (this:Film)
            RETURN this { .title } AS this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`"{}"`);
    });

    test("Select Movie with label Film from Actors with additionalLabels", async () => {
        const query = /* GraphQL */ `
            query {
                actors(where: { age: { gt: 10 } }) {
                    name
                    movies(where: { title: { eq: "terminator" } }) {
                        title
                    }
                }
            }
        `;

        const token = createBearerToken("secret", { movielabel: "Film", personlabel: "Person" });
        const result = await translateQuery(neoSchema, query, { token });

        expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
            "CYPHER 5
            MATCH (this:Actor&Person)
            WHERE this.age > $param0
            CALL (this) {
              MATCH (this)-[this0:ACTED_IN]->(this1:Film)
              WHERE this1.title = $param1
              WITH DISTINCT this1
              WITH this1 { .title } AS this1
              RETURN collect(this1) AS var2
            }
            RETURN this { .name, movies: var2 } AS this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"param0\\": {
                    \\"low\\": 10,
                    \\"high\\": 0
                },
                \\"param1\\": \\"terminator\\"
            }"
        `);
    });

    test("Create Movie with label Film", async () => {
        const query = /* GraphQL */ `
            mutation {
                createMovies(input: { title: "Titanic" }) {
                    movies {
                        title
                    }
                }
            }
        `;

        const token = createBearerToken("secret", { movielabel: "Film", personlabel: "Person" });
        const result = await translateQuery(neoSchema, query, { token });

        expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
            "CYPHER 5
            UNWIND $create_param0 AS create_var0
            CALL (create_var0) {
              CREATE (create_this1:Film)
              SET create_this1.title = create_var0.title
              RETURN create_this1
            }
            RETURN collect(create_this1 { .title }) AS data"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"create_param0\\": [
                    {
                        \\"title\\": \\"Titanic\\"
                    }
                ]
            }"
        `);
    });
});
