/*
 * Copyright (c) "Neo4j"
 * Neo4j Sweden AB [http://neo4j.com]
 */

import { Neo4jGraphQL } from "../../../../src";
import { formatCypher, formatParams, translateQuery } from "../../utils/tck-test-utils";

describe("Group By Directive - Top Level - @authorization validate on types", () => {
    let typeDefs: string;
    let neoSchema: Neo4jGraphQL;

    beforeAll(() => {
        typeDefs = /* GraphQL */ `
            type Movie @node @authorization(validate: [{ where: { node: { title: { eq: "someTitle" } } } }]) {
                title: String!
                released: Int! @groupBy @authorization(validate: [{ where: { node: { other: { eq: 1 } } } }])
                other: Int! @groupBy
                actors: [Person!]! @relationship(type: "ACTED_IN", properties: "ActedInMovie", direction: IN)
            }
            type Person @node {
                name: String! @authorization(validate: [{ where: { node: { name: { eq: "someName" } } } }])
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
            features: {
                authorization: {
                    key: "secret",
                },
            },
        });
    });

    test("Movies grouped by released and other, only project values - auth rule on Movie applies + released field", async () => {
        const query = /* GraphQL */ `
            {
                moviesConnection {
                    groupBy(fields: { released: true, other: true }) {
                        values {
                            released
                            other
                        }
                    }
                }
            }
        `;

        const result = await translateQuery(neoSchema, query);

        expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
            "CYPHER 5
            MATCH (this0:Movie)
            CALL apoc.util.validate(NOT ($isAuthenticated = true AND ($param1 IS NOT NULL AND this0.title = $param1)), '@neo4j/graphql/FORBIDDEN', [])
            CALL apoc.util.validate(NOT ($isAuthenticated = true AND ($param2 IS NOT NULL AND this0.other = $param2)), '@neo4j/graphql/FORBIDDEN', [])
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
                RETURN this0.released AS released, this0.other AS other, {edges: collect({node: {__id: elementId(this0)}}), values: {released: this0.released, other: this0.other}} AS var2
              }
              RETURN var2
            } AS var2
            RETURN {edges: var1, groupBy: var2} AS this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"isAuthenticated\\": false,
                \\"param1\\": \\"someTitle\\",
                \\"param2\\": 1
            }"
        `);
    });

    test("Paginated movies + grouped movies, project nodes and grouped nodes - only auth rule on Movie applies", async () => {
        const query = /* GraphQL */ `
            {
                moviesConnection(first: 2) {
                    groupBy(fields: { released: true, other: true }) {
                        edges {
                            node {
                                title
                            }
                        }
                    }
                    edges {
                        node {
                            title
                        }
                        cursor
                    }
                    pageInfo {
                        hasNextPage
                        endCursor
                    }
                }
            }
        `;

        const result = await translateQuery(neoSchema, query);

        expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
            "CYPHER 5
            MATCH (this0:Movie)
            CALL apoc.util.validate(NOT ($isAuthenticated = true AND ($param1 IS NOT NULL AND this0.title = $param1)), '@neo4j/graphql/FORBIDDEN', [])
            WITH collect({node: this0}) AS edges, count(this0) AS totalCount
            CALL (edges) {
              UNWIND edges AS edge
              WITH edge.node AS this0
              WITH *
              LIMIT $param2
              RETURN collect({node: {title: this0.title, __resolveType: 'Movie'}}) AS var1
            }
            WITH *, COLLECT {
              CALL (edges) {
                UNWIND edges AS edge
                WITH edge.node AS this0
                RETURN this0.released AS released, this0.other AS other, {edges: collect({node: {title: this0.title}}), values: {}} AS var2
              }
              RETURN var2
            } AS var2
            RETURN {edges: var1, totalCount: totalCount, groupBy: var2} AS this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"isAuthenticated\\": false,
                \\"param1\\": \\"someTitle\\",
                \\"param2\\": {
                    \\"low\\": 2,
                    \\"high\\": 0
                }
            }"
        `);
    });

    test("Paginated movies + grouped movies, project grouped nodes - only auth rule on Movie applies", async () => {
        const query = /* GraphQL */ `
            {
                moviesConnection(first: 2) {
                    groupBy(fields: { released: true, other: true }) {
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
            CALL apoc.util.validate(NOT ($isAuthenticated = true AND ($param1 IS NOT NULL AND this0.title = $param1)), '@neo4j/graphql/FORBIDDEN', [])
            WITH collect({node: this0}) AS edges
            CALL (edges) {
              UNWIND edges AS edge
              WITH edge.node AS this0
              WITH *
              LIMIT $param2
              RETURN collect({node: {__id: elementId(this0), __resolveType: 'Movie'}}) AS var1
            }
            WITH *, COLLECT {
              CALL (edges) {
                UNWIND edges AS edge
                WITH edge.node AS this0
                RETURN this0.released AS released, this0.other AS other, {edges: collect({node: {title: this0.title}}), values: {}} AS var2
              }
              RETURN var2
            } AS var2
            RETURN {edges: var1, groupBy: var2} AS this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"isAuthenticated\\": false,
                \\"param1\\": \\"someTitle\\",
                \\"param2\\": {
                    \\"low\\": 2,
                    \\"high\\": 0
                }
            }"
        `);
    });

    test("Control", async () => {
        const query = /* GraphQL */ `
            {
                moviesConnection(first: 10) {
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
        `;

        const result = await translateQuery(neoSchema, query);

        expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
            "CYPHER 5
            CALL {
              MATCH (this:Movie)
              CALL apoc.util.validate(NOT ($isAuthenticated = true AND ($param1 IS NOT NULL AND this.title = $param1)), '@neo4j/graphql/FORBIDDEN', [])
              RETURN {nodes: count(DISTINCT this)} AS var0
            }
            CALL {
              MATCH (this:Movie)
              CALL apoc.util.validate(NOT ($isAuthenticated = true AND ($param1 IS NOT NULL AND this.title = $param1)), '@neo4j/graphql/FORBIDDEN', [])
              WITH DISTINCT this
              ORDER BY size(this.title) DESC
              WITH collect(this.title) AS list
              RETURN {longest: head(list)} AS var1
            }
            CALL (*) {
              MATCH (this2:Movie)
              CALL apoc.util.validate(NOT ($isAuthenticated = true AND ($param2 IS NOT NULL AND this2.title = $param2)), '@neo4j/graphql/FORBIDDEN', [])
              WITH collect({node: this2}) AS edges
              CALL (edges) {
                UNWIND edges AS edge
                WITH edge.node AS this2
                WITH *
                LIMIT $param3
                RETURN collect({node: {title: this2.title, __resolveType: 'Movie'}}) AS var3
              }
              RETURN *
            }
            RETURN {edges: var3, aggregate: {count: var0, node: {title: var1}}} AS this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"isAuthenticated\\": false,
                \\"param1\\": \\"someTitle\\",
                \\"param2\\": \\"someTitle\\",
                \\"param3\\": {
                    \\"low\\": 10,
                    \\"high\\": 0
                }
            }"
        `);
    });
    test("Paginated aggregate on grouped movies - only auth rule on Movie applies", async () => {
        const query = /* GraphQL */ `
            {
                moviesConnection(first: 10) {
                    groupBy(fields: { released: true, other: true }) {
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
            CALL apoc.util.validate(NOT ($isAuthenticated = true AND ($param1 IS NOT NULL AND this0.title = $param1)), '@neo4j/graphql/FORBIDDEN', [])
            CALL apoc.util.validate(NOT ($isAuthenticated = true AND ($param2 IS NOT NULL AND this0.title = $param2)), '@neo4j/graphql/FORBIDDEN', [])
            WITH collect({node: this0}) AS edges
            CALL (edges) {
              UNWIND edges AS edge
              WITH edge.node AS this0
              WITH *
              LIMIT $param3
              RETURN collect({node: {__id: elementId(this0), __resolveType: 'Movie'}}) AS var1
            }
            WITH *, COLLECT {
              CALL (edges) {
                UNWIND edges AS edge
                WITH edge.node AS this0
                WITH this0.released AS released, this0.other AS other, {edges: collect({node: {__id: elementId(this0)}}), values: {}, aggregate: collect({node: this0})} AS var2
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
                \\"isAuthenticated\\": false,
                \\"param1\\": \\"someTitle\\",
                \\"param2\\": \\"someTitle\\",
                \\"param3\\": {
                    \\"low\\": 10,
                    \\"high\\": 0
                }
            }"
        `);
    });

    test("Paginated aggregate on grouped movies, project nodes - only auth rule on Movie applies", async () => {
        const query = /* GraphQL */ `
            {
                moviesConnection(first: 10) {
                    groupBy(fields: { released: true, other: true }) {
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
            CALL apoc.util.validate(NOT ($isAuthenticated = true AND ($param1 IS NOT NULL AND this0.title = $param1)), '@neo4j/graphql/FORBIDDEN', [])
            CALL apoc.util.validate(NOT ($isAuthenticated = true AND ($param2 IS NOT NULL AND this0.title = $param2)), '@neo4j/graphql/FORBIDDEN', [])
            WITH collect({node: this0}) AS edges
            CALL (edges) {
              UNWIND edges AS edge
              WITH edge.node AS this0
              WITH *
              LIMIT $param3
              RETURN collect({node: {__id: elementId(this0), __resolveType: 'Movie'}}) AS var1
            }
            WITH *, COLLECT {
              CALL (edges) {
                UNWIND edges AS edge
                WITH edge.node AS this0
                WITH this0.released AS released, this0.other AS other, {edges: collect({node: {title: this0.title}}), values: {}, aggregate: collect({node: this0})} AS var2
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
                \\"isAuthenticated\\": false,
                \\"param1\\": \\"someTitle\\",
                \\"param2\\": \\"someTitle\\",
                \\"param3\\": {
                    \\"low\\": 10,
                    \\"high\\": 0
                }
            }"
        `);
    });

    test("Aggregate operations on actors for grouped movies - auth on Movie, released, name apply", async () => {
        const query = /* GraphQL */ `
            {
                moviesConnection {
                    groupBy(fields: { released: true, other: true }) {
                        values {
                            released
                            other
                        }
                        edges {
                            node {
                                title
                                actorsConnection {
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
            CALL apoc.util.validate(NOT ($isAuthenticated = true AND ($param1 IS NOT NULL AND this0.title = $param1)), '@neo4j/graphql/FORBIDDEN', [])
            CALL apoc.util.validate(NOT ($isAuthenticated = true AND ($param2 IS NOT NULL AND this0.other = $param2)), '@neo4j/graphql/FORBIDDEN', [])
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
                    CALL apoc.util.validate(NOT ($isAuthenticated = true AND ($param3 IS NOT NULL AND this3.name = $param3)), '@neo4j/graphql/FORBIDDEN', [])
                    RETURN {nodes: count(DISTINCT this3)} AS var4
                  }
                  CALL (this0) {
                    MATCH (this0)<-[this5:ACTED_IN]-(this6:Person)
                    CALL apoc.util.validate(NOT ($isAuthenticated = true AND ($param3 IS NOT NULL AND this6.name = $param3)), '@neo4j/graphql/FORBIDDEN', [])
                    WITH DISTINCT this6
                    ORDER BY size(this6.name) DESC
                    WITH collect(this6.name) AS list
                    RETURN {shortest: last(list)} AS var7
                  }
                  CALL (this0) {
                    MATCH (this0)<-[this8:ACTED_IN]-(this9:Person)
                    CALL apoc.util.validate(NOT ($isAuthenticated = true AND ($param3 IS NOT NULL AND this9.name = $param3)), '@neo4j/graphql/FORBIDDEN', [])
                    WITH DISTINCT this8
                    ORDER BY size(this8.role) DESC
                    WITH collect(this8.role) AS list
                    RETURN {longest: head(list)} AS var10
                  }
                  CALL (*) {
                    MATCH (this0)<-[this11:ACTED_IN]-(this12:Person)
                    CALL apoc.util.validate(NOT ($isAuthenticated = true AND ($param4 IS NOT NULL AND this12.name = $param4)), '@neo4j/graphql/FORBIDDEN', [])
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
                RETURN this0.released AS released, this0.other AS other, {edges: collect({node: {title: this0.title, actorsConnection: var14}}), values: {released: this0.released, other: this0.other}} AS var15
              }
              RETURN var15
            } AS var15
            RETURN {edges: var1, groupBy: var15} AS this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"isAuthenticated\\": false,
                \\"param1\\": \\"someTitle\\",
                \\"param2\\": 1,
                \\"param3\\": \\"someName\\",
                \\"param4\\": \\"someName\\"
            }"
        `);
    });
});
