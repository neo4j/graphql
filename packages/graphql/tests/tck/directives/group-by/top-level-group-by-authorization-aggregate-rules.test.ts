/*
 * Copyright (c) "Neo4j"
 * Neo4j Sweden AB [http://neo4j.com]
 */

import { Neo4jGraphQL } from "../../../../src";
import { formatCypher, formatParams, translateQuery } from "../../utils/tck-test-utils";

describe("Group By Directive - Top Level - @authorization with aggregation in filter and validate rules set on field", () => {
    let typeDefs: string;
    let neoSchema: Neo4jGraphQL;

    beforeAll(() => {
        typeDefs = /* GraphQL */ `
            type Movie @node {
                title: String!
                    @authorization(
                        filter: [
                            {
                                where: {
                                    node: {
                                        actorsConnection: {
                                            aggregate: { node: { name: { shortestLength: { gt: 2 } } } }
                                        }
                                    }
                                }
                            }
                        ]
                    )
                released: Int!
                    @groupBy
                    @authorization(
                        validate: [
                            {
                                where: {
                                    node: {
                                        actorsConnection: {
                                            aggregate: { node: { name: { shortestLength: { gt: 2 } } } }
                                        }
                                    }
                                }
                            }
                        ]
                    )
                other: Int! @groupBy
                actors: [Person!]! @relationship(type: "ACTED_IN", properties: "ActedInMovie", direction: IN)
            }
            type Person @node {
                name: String! @authorization(filter: [{ where: { node: { name: { eq: "someName" } } } }])
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
            CALL (this0) {
              MATCH (this0)<-[this1:ACTED_IN]-(this2:Person)
              WITH DISTINCT this2
              RETURN min(size(this2.name)) > $param0 AS var3
            }
            WITH *
            CALL apoc.util.validate(NOT ($isAuthenticated = true AND var3 = true), '@neo4j/graphql/FORBIDDEN', [])
            WITH collect({node: this0}) AS edges
            CALL (edges) {
              UNWIND edges AS edge
              WITH edge.node AS this0
              RETURN collect({node: {__id: elementId(this0), __resolveType: 'Movie'}}) AS var4
            }
            WITH *, COLLECT {
              CALL (edges) {
                UNWIND edges AS edge
                WITH edge.node AS this0
                RETURN this0.released AS released, this0.other AS other, {edges: collect({node: {__id: elementId(this0)}}), values: {released: this0.released, other: this0.other}} AS var5
              }
              RETURN var5
            } AS var5
            RETURN {edges: var4, groupBy: var5} AS this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"param0\\": 2,
                \\"isAuthenticated\\": false
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
            CALL (this0) {
              MATCH (this0)<-[this1:ACTED_IN]-(this2:Person)
              WITH DISTINCT this2
              RETURN min(size(this2.name)) > $param0 AS var3
            }
            CALL (this0) {
              MATCH (this0)<-[this4:ACTED_IN]-(this5:Person)
              WITH DISTINCT this5
              RETURN min(size(this5.name)) > $param1 AS var6
            }
            WITH *
            WHERE (($isAuthenticated = true AND var3 = true) AND ($isAuthenticated = true AND var6 = true))
            WITH collect({node: this0}) AS edges, count(this0) AS totalCount
            CALL (edges) {
              UNWIND edges AS edge
              WITH edge.node AS this0
              WITH *
              LIMIT $param3
              RETURN collect({node: {title: this0.title, __resolveType: 'Movie'}}) AS var7
            }
            WITH *, COLLECT {
              CALL (edges) {
                UNWIND edges AS edge
                WITH edge.node AS this0
                RETURN this0.released AS released, this0.other AS other, {edges: collect({node: {title: this0.title}}), values: {}} AS var8
              }
              RETURN var8
            } AS var8
            RETURN {edges: var7, totalCount: totalCount, groupBy: var8} AS this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"param0\\": 2,
                \\"param1\\": 2,
                \\"isAuthenticated\\": false,
                \\"param3\\": {
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
            CALL (this0) {
              MATCH (this0)<-[this1:ACTED_IN]-(this2:Person)
              WITH DISTINCT this2
              RETURN min(size(this2.name)) > $param0 AS var3
            }
            WITH *
            WHERE ($isAuthenticated = true AND var3 = true)
            WITH collect({node: this0}) AS edges
            CALL (edges) {
              UNWIND edges AS edge
              WITH edge.node AS this0
              WITH *
              LIMIT $param2
              RETURN collect({node: {__id: elementId(this0), __resolveType: 'Movie'}}) AS var4
            }
            WITH *, COLLECT {
              CALL (edges) {
                UNWIND edges AS edge
                WITH edge.node AS this0
                RETURN this0.released AS released, this0.other AS other, {edges: collect({node: {title: this0.title}}), values: {}} AS var5
              }
              RETURN var5
            } AS var5
            RETURN {edges: var4, groupBy: var5} AS this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"param0\\": 2,
                \\"isAuthenticated\\": false,
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
              CALL (this) {
                MATCH (this)<-[this0:ACTED_IN]-(this1:Person)
                WITH DISTINCT this1
                RETURN min(size(this1.name)) > $param0 AS var2
              }
              WITH *
              WHERE ($isAuthenticated = true AND var2 = true)
              RETURN {nodes: count(DISTINCT this)} AS var3
            }
            CALL {
              MATCH (this:Movie)
              CALL (this) {
                MATCH (this)<-[this4:ACTED_IN]-(this5:Person)
                WITH DISTINCT this5
                RETURN min(size(this5.name)) > $param2 AS var6
              }
              WITH *
              WHERE ($isAuthenticated = true AND var6 = true)
              WITH DISTINCT this
              ORDER BY size(this.title) DESC
              WITH collect(this.title) AS list
              RETURN {longest: head(list)} AS var7
            }
            CALL (*) {
              MATCH (this8:Movie)
              CALL (this8) {
                MATCH (this8)<-[this9:ACTED_IN]-(this10:Person)
                WITH DISTINCT this10
                RETURN min(size(this10.name)) > $param3 AS var11
              }
              WITH *
              WHERE ($isAuthenticated = true AND var11 = true)
              WITH collect({node: this8}) AS edges
              CALL (edges) {
                UNWIND edges AS edge
                WITH edge.node AS this8
                WITH *
                LIMIT $param4
                RETURN collect({node: {title: this8.title, __resolveType: 'Movie'}}) AS var12
              }
              RETURN *
            }
            RETURN {edges: var12, aggregate: {count: var3, node: {title: var7}}} AS this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"param0\\": 2,
                \\"isAuthenticated\\": false,
                \\"param2\\": 2,
                \\"param3\\": 2,
                \\"param4\\": {
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
            CALL (this0) {
              MATCH (this0)<-[this1:ACTED_IN]-(this2:Person)
              WITH DISTINCT this2
              RETURN min(size(this2.name)) > $param0 AS var3
            }
            WITH *
            WHERE ($isAuthenticated = true AND var3 = true)
            WITH collect({node: this0}) AS edges
            CALL (edges) {
              UNWIND edges AS edge
              WITH edge.node AS this0
              WITH *
              LIMIT $param2
              RETURN collect({node: {__id: elementId(this0), __resolveType: 'Movie'}}) AS var4
            }
            WITH *, COLLECT {
              CALL (edges) {
                UNWIND edges AS edge
                WITH edge.node AS this0
                WITH this0.released AS released, this0.other AS other, {edges: collect({node: {__id: elementId(this0)}}), values: {}, aggregate: collect({node: this0})} AS var5
                CALL (var5) {
                  WITH *
                  RETURN {nodes: size(var5.aggregate)} AS var6
                }
                CALL (var5) {
                  UNWIND var5.aggregate AS edge
                  WITH edge.node AS this0
                  WITH DISTINCT this0
                  ORDER BY size(this0.title) DESC
                  WITH collect(this0.title) AS list
                  RETURN {longest: head(list)} AS var7
                }
                RETURN var5 { .*, aggregate: {count: var6, node: {title: var7}} } AS var5
              }
              RETURN var5
            } AS var5
            RETURN {edges: var4, groupBy: var5} AS this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"param0\\": 2,
                \\"isAuthenticated\\": false,
                \\"param2\\": {
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
            CALL (this0) {
              MATCH (this0)<-[this1:ACTED_IN]-(this2:Person)
              WITH DISTINCT this2
              RETURN min(size(this2.name)) > $param0 AS var3
            }
            CALL (this0) {
              MATCH (this0)<-[this4:ACTED_IN]-(this5:Person)
              WITH DISTINCT this5
              RETURN min(size(this5.name)) > $param1 AS var6
            }
            WITH *
            WHERE (($isAuthenticated = true AND var3 = true) AND ($isAuthenticated = true AND var6 = true))
            WITH collect({node: this0}) AS edges
            CALL (edges) {
              UNWIND edges AS edge
              WITH edge.node AS this0
              WITH *
              LIMIT $param3
              RETURN collect({node: {__id: elementId(this0), __resolveType: 'Movie'}}) AS var7
            }
            WITH *, COLLECT {
              CALL (edges) {
                UNWIND edges AS edge
                WITH edge.node AS this0
                WITH this0.released AS released, this0.other AS other, {edges: collect({node: {title: this0.title}}), values: {}, aggregate: collect({node: this0})} AS var8
                CALL (var8) {
                  WITH *
                  RETURN {nodes: size(var8.aggregate)} AS var9
                }
                CALL (var8) {
                  UNWIND var8.aggregate AS edge
                  WITH edge.node AS this0
                  WITH DISTINCT this0
                  ORDER BY size(this0.title) DESC
                  WITH collect(this0.title) AS list
                  RETURN {longest: head(list)} AS var10
                }
                RETURN var8 { .*, aggregate: {count: var9, node: {title: var10}} } AS var8
              }
              RETURN var8
            } AS var8
            RETURN {edges: var7, groupBy: var8} AS this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"param0\\": 2,
                \\"param1\\": 2,
                \\"isAuthenticated\\": false,
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
            CALL (this0) {
              MATCH (this0)<-[this1:ACTED_IN]-(this2:Person)
              WITH DISTINCT this2
              RETURN min(size(this2.name)) > $param0 AS var3
            }
            CALL (this0) {
              MATCH (this0)<-[this4:ACTED_IN]-(this5:Person)
              WITH DISTINCT this5
              RETURN min(size(this5.name)) > $param1 AS var6
            }
            WITH *
            WHERE ($isAuthenticated = true AND var3 = true)
            CALL apoc.util.validate(NOT ($isAuthenticated = true AND var6 = true), '@neo4j/graphql/FORBIDDEN', [])
            WITH collect({node: this0}) AS edges
            CALL (edges) {
              UNWIND edges AS edge
              WITH edge.node AS this0
              RETURN collect({node: {__id: elementId(this0), __resolveType: 'Movie'}}) AS var7
            }
            WITH *, COLLECT {
              CALL (edges) {
                UNWIND edges AS edge
                WITH edge.node AS this0
                CALL (this0) {
                  CALL (this0) {
                    MATCH (this0)<-[this8:ACTED_IN]-(this9:Person)
                    WHERE ($isAuthenticated = true AND ($param3 IS NOT NULL AND this9.name = $param3))
                    RETURN {nodes: count(DISTINCT this9)} AS var10
                  }
                  CALL (this0) {
                    MATCH (this0)<-[this11:ACTED_IN]-(this12:Person)
                    WHERE ($isAuthenticated = true AND ($param3 IS NOT NULL AND this12.name = $param3))
                    WITH DISTINCT this12
                    ORDER BY size(this12.name) DESC
                    WITH collect(this12.name) AS list
                    RETURN {shortest: last(list)} AS var13
                  }
                  CALL (this0) {
                    MATCH (this0)<-[this14:ACTED_IN]-(this15:Person)
                    WHERE ($isAuthenticated = true AND ($param3 IS NOT NULL AND this15.name = $param3))
                    WITH DISTINCT this14
                    ORDER BY size(this14.role) DESC
                    WITH collect(this14.role) AS list
                    RETURN {longest: head(list)} AS var16
                  }
                  CALL (*) {
                    MATCH (this0)<-[this17:ACTED_IN]-(this18:Person)
                    WHERE ($isAuthenticated = true AND ($param4 IS NOT NULL AND this18.name = $param4))
                    WITH collect({node: this18, relationship: this17}) AS edges
                    CALL (edges) {
                      UNWIND edges AS edge
                      WITH edge.node AS this18, edge.relationship AS this17
                      RETURN collect({node: {name: this18.name, __resolveType: 'Person'}}) AS var19
                    }
                    RETURN *
                  }
                  RETURN {edges: var19, aggregate: {count: var10, node: {name: var13}, edge: {role: var16}}} AS var20
                }
                RETURN this0.released AS released, this0.other AS other, {edges: collect({node: {title: this0.title, actorsConnection: var20}}), values: {released: this0.released, other: this0.other}} AS var21
              }
              RETURN var21
            } AS var21
            RETURN {edges: var7, groupBy: var21} AS this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"param0\\": 2,
                \\"param1\\": 2,
                \\"isAuthenticated\\": false,
                \\"param3\\": \\"someName\\",
                \\"param4\\": \\"someName\\"
            }"
        `);
    });
});
