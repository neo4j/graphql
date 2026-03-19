/*
 * Copyright (c) "Neo4j"
 * Neo4j Sweden AB [http://neo4j.com]
 */

import { Neo4jGraphQL } from "../../../src";
import { formatCypher, formatParams, translateQuery } from "../utils/tck-test-utils";

describe("https://github.com/neo4j/graphql/issues/387", () => {
    let typeDefs: string;
    let neoSchema: Neo4jGraphQL;

    beforeAll(() => {
        typeDefs = /* GraphQL */ `
            scalar URL

            type Place @node {
                name: String
                url_works: String
                    @cypher(
                        statement: """
                        return '' + '' as result
                        """
                        columnName: "result"
                    )
                url_fails: URL
                    @cypher(
                        statement: """
                        return '' + '' as result
                        """
                        columnName: "result"
                    )
                url_array_works: [String]
                    @cypher(
                        statement: """
                        return ['' + ''] as result
                        """
                        columnName: "result"
                    )
                url_array_fails: [URL]
                    @cypher(
                        statement: """
                        return ['' + ''] as result
                        """
                        columnName: "result"
                    )
            }
        `;

        neoSchema = new Neo4jGraphQL({
            typeDefs,
        });
    });

    test("Should project custom scalars from custom Cypher correctly", async () => {
        const query = /* GraphQL */ `
            {
                places {
                    url_works
                    url_fails
                    url_array_works
                    url_array_fails
                }
            }
        `;

        const result = await translateQuery(neoSchema, query);

        expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
            "CYPHER 5
            MATCH (this:Place)
            CALL (this) {
              CALL (this) {
                WITH this AS this
                return '' + '' as result
              }
              WITH result AS this0
              RETURN this0 AS var1
            }
            CALL (this) {
              CALL (this) {
                WITH this AS this
                return '' + '' as result
              }
              WITH result AS this2
              RETURN this2 AS var3
            }
            CALL (this) {
              CALL (this) {
                WITH this AS this
                return ['' + ''] as result
              }
              UNWIND result AS var4
              WITH var4 AS this5
              RETURN collect(this5) AS var6
            }
            CALL (this) {
              CALL (this) {
                WITH this AS this
                return ['' + ''] as result
              }
              UNWIND result AS var7
              WITH var7 AS this8
              RETURN collect(this8) AS var9
            }
            RETURN this { url_works: var1, url_fails: var3, url_array_works: var6, url_array_fails: var9 } AS this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`"{}"`);
    });
});
