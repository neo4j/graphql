/*
 * Copyright (c) "Neo4j"
 * Neo4j Sweden AB [http://neo4j.com]
 */

import { Neo4jGraphQL } from "../../../src";
import { formatCypher, formatParams, translateQuery } from "../utils/tck-test-utils";

describe("https://github.com/neo4j/graphql/issues/3215", () => {
    describe("union", () => {
        let neoSchema: Neo4jGraphQL;

        const typeDefs = `#graphql
            type Actor @node {
                name: String!
                age: Int!
            }
        `;

        beforeAll(() => {
            neoSchema = new Neo4jGraphQL({
                typeDefs,
            });
        });

        test("should ignore undefined parameters on NOT fields", async () => {
            const query = /* GraphQL */ `
                query MyQuery($name: String) {
                    actors(where: { age: { gt: 25 }, NOT: { name: { eq: $name } } }) {
                        name
                        age
                    }
                }
            `;

            const result = await translateQuery(neoSchema, query);

            expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
                "CYPHER 5
                MATCH (this:Actor)
                WHERE this.age > $param0
                RETURN this { .name, .age } AS this"
            `);

            expect(formatParams(result.params)).toMatchInlineSnapshot(`
                "{
                    \\"param0\\": {
                        \\"low\\": 25,
                        \\"high\\": 0
                    }
                }"
            `);
        });

        test("should ignore undefined parameters on boolean NOT", async () => {
            const query = /* GraphQL */ `
                query MyQuery($name: String) {
                    actors(where: { age: { gt: 25 }, NOT: { name: { eq: $name } } }) {
                        name
                        age
                    }
                }
            `;

            const result = await translateQuery(neoSchema, query);

            expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
                "CYPHER 5
                MATCH (this:Actor)
                WHERE this.age > $param0
                RETURN this { .name, .age } AS this"
            `);

            expect(formatParams(result.params)).toMatchInlineSnapshot(`
                "{
                    \\"param0\\": {
                        \\"low\\": 25,
                        \\"high\\": 0
                    }
                }"
            `);
        });
    });
});
