/*
 * Copyright (c) "Neo4j"
 * Neo4j Sweden AB [http://neo4j.com]
 */

import { Neo4jGraphQL } from "../../../src";
import { formatCypher, formatParams, translateQuery } from "../utils/tck-test-utils";

describe("Cypher autogenerate directive", () => {
    let typeDefs: string;
    let neoSchema: Neo4jGraphQL;

    beforeAll(() => {
        typeDefs = /* GraphQL */ `
            type Movie @node {
                id: ID! @id
                name: String!
            }
        `;

        neoSchema = new Neo4jGraphQL({
            typeDefs,
        });
    });

    test("Simple Create", async () => {
        const query = /* GraphQL */ `
            mutation {
                createMovies(input: [{ name: "dan" }]) {
                    movies {
                        id
                        name
                    }
                }
            }
        `;

        const result = await translateQuery(neoSchema, query);

        expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
            "CYPHER 5
            UNWIND $create_param0 AS create_var0
            CALL (create_var0) {
              CREATE (create_this1:Movie)
              SET
                create_this1.id = randomUUID(),
                create_this1.name = create_var0.name
              RETURN create_this1
            }
            RETURN collect(create_this1 { .id, .name }) AS data"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"create_param0\\": [
                    {
                        \\"name\\": \\"dan\\"
                    }
                ]
            }"
        `);
    });

    test("Simple Update", async () => {
        const query = /* GraphQL */ `
            mutation {
                updateMovies(update: { name_SET: "dan" }) {
                    movies {
                        id
                        name
                    }
                }
            }
        `;

        const result = await translateQuery(neoSchema, query);

        expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
            "CYPHER 5
            MATCH (this:Movie)
            WITH *
            SET this.name = $param0
            WITH this
            RETURN this { .id, .name } AS this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"param0\\": \\"dan\\"
            }"
        `);
    });
});
