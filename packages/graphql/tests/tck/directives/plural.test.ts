/*
 * Copyright (c) "Neo4j"
 * Neo4j Sweden AB [http://neo4j.com]
 */

import { Neo4jGraphQL } from "../../../src";
import { formatCypher, formatParams, translateQuery } from "../utils/tck-test-utils";

describe("Plural directive", () => {
    let typeDefs: string;
    let neoSchema: Neo4jGraphQL;

    beforeAll(() => {
        typeDefs = /* GraphQL */ `
            type Tech @plural(value: "Techs") @node {
                name: String
            }
        `;

        neoSchema = new Neo4jGraphQL({
            typeDefs,
        });
    });

    test("Select Tech with plural techs", async () => {
        const query = /* GraphQL */ `
            {
                techs {
                    name
                }
            }
        `;

        const result = await translateQuery(neoSchema, query);

        expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
            "CYPHER 5
            MATCH (this:Tech)
            RETURN this { .name } AS this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`"{}"`);
    });

    test("Count Tech with plural techs using aggregation", async () => {
        const query = /* GraphQL */ `
            {
                techsConnection {
                    aggregate {
                        count {
                            nodes
                        }
                    }
                }
            }
        `;

        const result = await translateQuery(neoSchema, query);

        expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
            "CYPHER 5
            CALL {
              MATCH (this:Tech)
              RETURN {nodes: count(DISTINCT this)} AS var0
            }
            RETURN {aggregate: {count: var0}} AS this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`"{}"`);
    });

    test("Create Tech with plural techs using aggregation", async () => {
        const query = /* GraphQL */ `
            mutation {
                createTechs(input: [{ name: "Highlander" }]) {
                    techs {
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
              CREATE (create_this1:Tech)
              SET create_this1.name = create_var0.name
              RETURN create_this1
            }
            RETURN collect(create_this1 { .name }) AS data"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"create_param0\\": [
                    {
                        \\"name\\": \\"Highlander\\"
                    }
                ]
            }"
        `);
    });

    test("Update Tech with plural techs using aggregation", async () => {
        const query = /* GraphQL */ `
            mutation {
                updateTechs(update: { name_SET: "Matrix" }) {
                    techs {
                        name
                    }
                }
            }
        `;

        const result = await translateQuery(neoSchema, query);

        expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
            "CYPHER 5
            MATCH (this:Tech)
            WITH *
            SET this.name = $param0
            WITH this
            RETURN this { .name } AS this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"param0\\": \\"Matrix\\"
            }"
        `);
    });

    test("Delete Tech with plural techs using aggregation", async () => {
        const query = /* GraphQL */ `
            mutation {
                deleteTechs(where: { name: { eq: "Matrix" } }) {
                    nodesDeleted
                }
            }
        `;

        const result = await translateQuery(neoSchema, query);

        expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
            "CYPHER 5
            MATCH (this:Tech)
            WHERE this.name = $param0
            DETACH DELETE this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"param0\\": \\"Matrix\\"
            }"
        `);
    });

    test("Query with aliases", async () => {
        const query = /* GraphQL */ `
            query {
                technologies: techs {
                    name
                }
            }
        `;

        const result = await translateQuery(neoSchema, query);

        expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
            "CYPHER 5
            MATCH (this:Tech)
            RETURN this { .name } AS this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`"{}"`);
    });
});
