/*
 * Copyright (c) "Neo4j"
 * Neo4j Sweden AB [http://neo4j.com]
 */

import { Neo4jGraphQL } from "../../../src";
import { formatCypher, formatParams, translateQuery } from "../utils/tck-test-utils";

describe("https://github.com/neo4j/graphql/issues/5030", () => {
    let typeDefs: string;
    let neoSchema: Neo4jGraphQL;

    beforeAll(() => {
        typeDefs = /* GraphQL */ `
            type Movie
                @fulltext(indexes: [{ indexName: "MovieTitle", queryName: "moviesByTitle", fields: ["title"] }])
                @node {
                title: String
                released: Int
            }
            type Query {
                customCypher(phrase: String!): [Movie!]!
                    @cypher(
                        statement: """
                        MATCH (m:Movie) RETURN m as this
                        """
                        columnName: "this"
                    )
            }
        `;

        neoSchema = new Neo4jGraphQL({
            typeDefs,
        });
    });

    test("custom cypher fields should works when used with argument named phrase", async () => {
        const query = /* GraphQL */ `
            query {
                customCypher(phrase: "hello") {
                    title
                }
            }
        `;

        const result = await translateQuery(neoSchema, query, {
            contextValues: {},
        });

        expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
            "CYPHER 5
            CALL {
              MATCH (m:Movie) RETURN m as this
            }
            WITH this AS this0
            WITH this0 { .title } AS this0
            RETURN this0 AS this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`"{}"`);
    });
});
