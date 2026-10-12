/*
 * Copyright (c) "Neo4j"
 * Neo4j Sweden AB [http://neo4j.com]
 */

import { Neo4jGraphQL } from "../../../../src";
import { formatCypher, formatParams, translateQuery } from "../../utils/tck-test-utils";

describe("Group By Directive - Top Level", () => {
    let typeDefs: string;
    let neoSchema: Neo4jGraphQL;

    beforeAll(() => {
        typeDefs = /* GraphQL */ `
            type Movie @node {
                title: String!
                released: Int! @groupBy
                other: Int! @groupBy
                actors: [Person!]! @relationship(type: "ACTED_IN", properties: "ActedInMovie", direction: IN)
            }
            type Person @node {
                name: String!
                born: Int! @groupBy
                actedIn: [Movie!]! @relationship(type: "ACTED_IN", properties: "ActedInMovie", direction: OUT)
            }

            type ActedInMovie @relationshipProperties {
                roles: [String!]!
                role: String!
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
                    groupBy(fields: { released: true }) {
                        edges {
                            node {
                                title
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
                RETURN this0.released AS released, {edges: collect({node: {title: this0.title}}), values: {}} AS var2
              }
              RETURN var2
            } AS var2
            RETURN {edges: var1, groupBy: var2} AS this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`"{}"`);
    });

    test("group by in top level query with values projection", async () => {
        const query = /* GraphQL */ `
            query {
                moviesConnection {
                    edges {
                        node {
                            title
                        }
                    }
                    groupBy(fields: { released: true }) {
                        values {
                            released
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
                RETURN this0.released AS released, {edges: collect({node: {__id: elementId(this0)}}), values: {released: this0.released}} AS var2
              }
              RETURN var2
            } AS var2
            RETURN {edges: var1, groupBy: var2} AS this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`"{}"`);
    });

    test("group by in top level query with node projection, paginated", async () => {
        const query = /* GraphQL */ `
            query {
                moviesConnection(first: 2) {
                    groupBy(fields: { released: true }) {
                        edges {
                            node {
                                title
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
              WITH *
              LIMIT $param0
              RETURN collect({node: {__id: elementId(this0), __resolveType: 'Movie'}}) AS var1
            }
            WITH *, COLLECT {
              CALL (edges) {
                UNWIND edges AS edge
                WITH edge.node AS this0
                RETURN this0.released AS released, {edges: collect({node: {title: this0.title}}), values: {}} AS var2
              }
              RETURN var2
            } AS var2
            RETURN {edges: var1, groupBy: var2} AS this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"param0\\": {
                    \\"low\\": 2,
                    \\"high\\": 0
                }
            }"
        `);
    });

    test("group by in top level query with aggregation and node projection", async () => {
        const query = /* GraphQL */ `
            query {
                moviesConnection {
                    groupBy(fields: { released: true }) {
                        aggregate {
                            count {
                                nodes
                            }
                            node {
                                title {
                                    longest
                                }
                            }
                        }
                        edges {
                            node {
                                title
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
              RETURN collect({node: {__id: elementId(this0), __resolveType: 'Movie'}}) AS var1
            }
            WITH *, COLLECT {
              CALL (edges) {
                UNWIND edges AS edge
                WITH edge.node AS this0
                WITH this0.released AS released, {edges: collect({node: {title: this0.title}}), values: {}, aggregate: collect({node: this0})} AS var2
                CALL (var2) {
                  WITH *
                  RETURN {nodes: size(var2.aggregate)} AS var3
                }
                CALL (var2) {
                  UNWIND var2.aggregate AS edge
                  WITH edge.node AS this0
                  WITH DISTINCT this0
                  ORDER BY size(this0.title) DESC
                  WITH collect(this0.title) AS list
                  RETURN {longest: head(list)} AS var4
                }
                RETURN var2 { .*, aggregate: {count: var3, node: {title: var4}} } AS var2
              }
              RETURN var2
            } AS var2
            RETURN {edges: var1, groupBy: var2} AS this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`"{}"`);
    });

    test("group by in top level query with aggregation and node projection, paginated", async () => {
        const query = /* GraphQL */ `
            query {
                moviesConnection(first: 2) {
                    groupBy(fields: { released: true }) {
                        aggregate {
                            count {
                                nodes
                            }
                            node {
                                title {
                                    longest
                                }
                            }
                        }
                        edges {
                            node {
                                title
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
              WITH *
              LIMIT $param0
              RETURN collect({node: {__id: elementId(this0), __resolveType: 'Movie'}}) AS var1
            }
            WITH *, COLLECT {
              CALL (edges) {
                UNWIND edges AS edge
                WITH edge.node AS this0
                WITH this0.released AS released, {edges: collect({node: {title: this0.title}}), values: {}, aggregate: collect({node: this0})} AS var2
                CALL (var2) {
                  WITH *
                  RETURN {nodes: size(var2.aggregate)} AS var3
                }
                CALL (var2) {
                  UNWIND var2.aggregate AS edge
                  WITH edge.node AS this0
                  WITH DISTINCT this0
                  ORDER BY size(this0.title) DESC
                  WITH collect(this0.title) AS list
                  RETURN {longest: head(list)} AS var4
                }
                RETURN var2 { .*, aggregate: {count: var3, node: {title: var4}} } AS var2
              }
              RETURN var2
            } AS var2
            RETURN {edges: var1, groupBy: var2} AS this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"param0\\": {
                    \\"low\\": 2,
                    \\"high\\": 0
                }
            }"
        `);
    });

    test("group by in top level query with aggregation only", async () => {
        const query = /* GraphQL */ `
            query {
                moviesConnection {
                    groupBy(fields: { released: true }) {
                        aggregate {
                            count {
                                nodes
                            }
                            node {
                                title {
                                    longest
                                }
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
              RETURN collect({node: {__id: elementId(this0), __resolveType: 'Movie'}}) AS var1
            }
            WITH *, COLLECT {
              CALL (edges) {
                UNWIND edges AS edge
                WITH edge.node AS this0
                WITH this0.released AS released, {edges: collect({node: {__id: elementId(this0)}}), values: {}, aggregate: collect({node: this0})} AS var2
                CALL (var2) {
                  WITH *
                  RETURN {nodes: size(var2.aggregate)} AS var3
                }
                CALL (var2) {
                  UNWIND var2.aggregate AS edge
                  WITH edge.node AS this0
                  WITH DISTINCT this0
                  ORDER BY size(this0.title) DESC
                  WITH collect(this0.title) AS list
                  RETURN {longest: head(list)} AS var4
                }
                RETURN var2 { .*, aggregate: {count: var3, node: {title: var4}} } AS var2
              }
              RETURN var2
            } AS var2
            RETURN {edges: var1, groupBy: var2} AS this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`"{}"`);
    });

    test("group by in top level query with aggregation only, paginated", async () => {
        const query = /* GraphQL */ `
            query {
                moviesConnection(first: 2) {
                    groupBy(fields: { released: true }) {
                        aggregate {
                            count {
                                nodes
                            }
                            node {
                                title {
                                    longest
                                }
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
              WITH *
              LIMIT $param0
              RETURN collect({node: {__id: elementId(this0), __resolveType: 'Movie'}}) AS var1
            }
            WITH *, COLLECT {
              CALL (edges) {
                UNWIND edges AS edge
                WITH edge.node AS this0
                WITH this0.released AS released, {edges: collect({node: {__id: elementId(this0)}}), values: {}, aggregate: collect({node: this0})} AS var2
                CALL (var2) {
                  WITH *
                  RETURN {nodes: size(var2.aggregate)} AS var3
                }
                CALL (var2) {
                  UNWIND var2.aggregate AS edge
                  WITH edge.node AS this0
                  WITH DISTINCT this0
                  ORDER BY size(this0.title) DESC
                  WITH collect(this0.title) AS list
                  RETURN {longest: head(list)} AS var4
                }
                RETURN var2 { .*, aggregate: {count: var3, node: {title: var4}} } AS var2
              }
              RETURN var2
            } AS var2
            RETURN {edges: var1, groupBy: var2} AS this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"param0\\": {
                    \\"low\\": 2,
                    \\"high\\": 0
                }
            }"
        `);
    });

    test("group by with filter on inner connection field", async () => {
        const query = /* GraphQL */ `
            query {
                moviesConnection {
                    groupBy(fields: { released: true }) {
                        values {
                            released
                        }
                        edges {
                            node {
                                title
                                actorsConnection(where: { node: { name: { startsWith: "C" } } }) {
                                    aggregate {
                                        count {
                                            nodes
                                        }
                                        edge {
                                            role {
                                                longest
                                            }
                                        }
                                        node {
                                            name {
                                                shortest
                                            }
                                        }
                                    }
                                    edges {
                                        node {
                                            name
                                        }
                                    }
                                }
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
              RETURN collect({node: {__id: elementId(this0), __resolveType: 'Movie'}}) AS var1
            }
            WITH *, COLLECT {
              CALL (edges) {
                UNWIND edges AS edge
                WITH edge.node AS this0
                CALL (this0) {
                  CALL (this0) {
                    MATCH (this0)<-[this2:ACTED_IN]-(this3:Person)
                    WHERE this3.name STARTS WITH $param0
                    RETURN {nodes: count(DISTINCT this3)} AS var4
                  }
                  CALL (this0) {
                    MATCH (this0)<-[this5:ACTED_IN]-(this6:Person)
                    WHERE this6.name STARTS WITH $param1
                    WITH DISTINCT this6
                    ORDER BY size(this6.name) DESC
                    WITH collect(this6.name) AS list
                    RETURN {shortest: last(list)} AS var7
                  }
                  CALL (this0) {
                    MATCH (this0)<-[this8:ACTED_IN]-(this9:Person)
                    WHERE this9.name STARTS WITH $param2
                    WITH DISTINCT this8
                    ORDER BY size(this8.role) DESC
                    WITH collect(this8.role) AS list
                    RETURN {longest: head(list)} AS var10
                  }
                  CALL (*) {
                    MATCH (this0)<-[this11:ACTED_IN]-(this12:Person)
                    WHERE this12.name STARTS WITH $param3
                    WITH collect({node: this12, relationship: this11}) AS edges
                    CALL (edges) {
                      UNWIND edges AS edge
                      WITH edge.node AS this12, edge.relationship AS this11
                      RETURN collect({node: {name: this12.name, __resolveType: 'Person'}}) AS var13
                    }
                    RETURN *
                  }
                  RETURN {edges: var13, aggregate: {count: var4, node: {name: var7}, edge: {role: var10}}} AS var14
                }
                RETURN this0.released AS released, {edges: collect({node: {title: this0.title, actorsConnection: var14}}), values: {released: this0.released}} AS var15
              }
              RETURN var15
            } AS var15
            RETURN {edges: var1, groupBy: var15} AS this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"param0\\": \\"C\\",
                \\"param1\\": \\"C\\",
                \\"param2\\": \\"C\\",
                \\"param3\\": \\"C\\"
            }"
        `);
    });
});
