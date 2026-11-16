/*
 * Copyright (c) "Neo4j"
 * Neo4j Sweden AB [http://neo4j.com]
 */

import type { UniqueType } from "../../../utils/graphql-types";
import { TestHelper } from "../../../utils/tests-helper";

/*
 * Copyright (c) "Neo4j"
 * Neo4j Sweden AB [http://neo4j.com]
 */

import { Neo4jGraphQL } from "../../../../src";
import { formatCypher, formatParams, translateQuery } from "../../../tck/utils/tck-test-utils";

describe("Group By Directive - Top Level", () => {
    let typeDefs: string;
    let neoSchema: Neo4jGraphQL;

    beforeAll(() => {
        typeDefs = /* GraphQL */ `
            type Movie @node {
                title: String!
                year: Int! @groupBy @cypher(statement: "RETURN this.year % 2 as year", columnName: "year")
                other: Int! @groupBy
            }
        `;

        neoSchema = new Neo4jGraphQL({
            typeDefs,
        });
    });

    test("group by in top level query with node projection", async () => {
        const query = /* GraphQL */ `
            query {
                moviesConnection {
                    edges {
                        node {
                            title
                        }
                    }
                    groupBy(fields: { year: true, other: true }) {
                        edges {
                            node {
                                title
                                year
                                other
                            }
                        }
                    }
                }
            }
        `;

        const result = await translateQuery(neoSchema, query);

        expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
            "CYPHER 5
            MATCH (this0:Movie)
            WITH collect({node: this0}) AS edges
            CALL (edges) {
              UNWIND edges AS edge
              WITH edge.node AS this0
              RETURN collect({node: {title: this0.title, __resolveType: 'Movie'}}) AS var1
            }
            WITH *, COLLECT {
              CALL (edges) {
                UNWIND edges AS edge
                WITH edge.node AS this0
                CALL (this0) {
                  CALL (this0) {
                    WITH this0 AS this
                    RETURN this.year % 2 as year
                  }
                  WITH year AS this2
                  RETURN this2 AS var3
                }
                RETURN var3 AS year, this0.other AS other, {edges: collect({node: {title: this0.title, year: var3, other: this0.other}})} AS var4
              }
              RETURN var4
            } AS var4
            RETURN {edges: var1, groupBy: var4} AS this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`"{}"`);
    });
});
