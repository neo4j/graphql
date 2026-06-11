/*
 * Copyright (c) "Neo4j"
 * Neo4j Sweden AB [http://neo4j.com]
 */

import { Neo4jGraphQL } from "../../../src";
import { formatCypher, formatParams, translateQuery } from "../utils/tck-test-utils";

describe("context-variable-not-always-resolved-on-cypher-queries", () => {
    let neoSchema: Neo4jGraphQL;

    const typeDefs = /* GraphQL */ `
        type Expr
            @node(labels: ["Exprlabel", "$context.tenant", "Resource"])
            @mutation(operations: [])
            @limit(default: 100, max: 300) {
            iri: ID! @id @alias(property: "uri")
            realizationOf: [Work!]! @relationship(type: "realizationOf", direction: OUT)
            relToUnion: [unionTarget!]! @relationship(type: "relToUnion", direction: OUT)
            relToInterface: [interfaceTarget!]! @relationship(type: "relToInterface", direction: OUT)
        }
        type Work
            @node(labels: ["WorkLabel", "$context.tenant", "Resource"])
            @mutation(operations: [])
            @limit(default: 100, max: 300) {
            iri: ID! @id @alias(property: "uri")
            hasResourceType: [ResourceType!]! @relationship(type: "hasResourceType", direction: OUT)
        }
        type ResourceType @mutation(operations: []) @limit(default: 1, max: 1000) @node {
            iri: ID! @id @alias(property: "uri")
        }

        type coreFrag implements interfaceTarget
            @node(labels: ["coreFrag", "$context.tenant", "Resource"])
            @mutation(operations: [])
            @limit(default: 100, max: 1000) {
            iri: ID! @id @alias(property: "uri")
        }
        type coreRoot @node(labels: ["coreRoot", "Resource"]) @mutation(operations: []) @limit(default: 100, max: 300) {
            iri: ID! @id @alias(property: "uri")
        }

        union unionTarget = coreRoot | coreFrag

        interface interfaceTarget {
            iri: ID!
        }
    `;

    beforeAll(() => {
        neoSchema = new Neo4jGraphQL({
            typeDefs,
        });
    });

    test("should apply dynamic label with filter", async () => {
        const query = /* GraphQL */ `
            query {
                exprs(
                    where: {
                        realizationOf: {
                            some: {
                                hasResourceType: { some: { iri: { eq: "http://data.somesite.com/crown/test-id" } } }
                            }
                        }
                    }
                    limit: 1
                ) {
                    iri
                }
            }
        `;

        const result = await translateQuery(neoSchema, query, {
            contextValues: {
                cypherParams: {
                    tenant: "test",
                },
            },
        });

        expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
            "CYPHER 5
            MATCH (this:Exprlabel&test&Resource)
            WHERE EXISTS {
              MATCH (this)-[:realizationOf]->(this0:WorkLabel&test&Resource)
              WHERE EXISTS {
                MATCH (this0)-[:hasResourceType]->(this1:ResourceType)
                WHERE this1.uri = $param0
              }
            }
            WITH *
            LIMIT $param1
            RETURN this { iri: this.uri } AS this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"tenant\\": \\"test\\",
                \\"param0\\": \\"http://data.somesite.com/crown/test-id\\",
                \\"param1\\": {
                    \\"low\\": 1,
                    \\"high\\": 0
                }
            }"
        `);
    });

    test("should apply dynamic label with filter when queried an union", async () => {
        const query = /* GraphQL */ `
            query {
                exprs(
                    where: {
                        realizationOf: {
                            some: {
                                hasResourceType: { some: { iri: { eq: "http://data.somesite.com/crown/test-id" } } }
                            }
                        }
                    }
                    limit: 1
                ) {
                    iri
                    relToUnion {
                        ... on coreFrag {
                            iri
                        }
                    }
                }
            }
        `;

        const result = await translateQuery(neoSchema, query, {
            contextValues: {
                cypherParams: {
                    tenant: "test",
                },
            },
        });

        expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
            "CYPHER 5
            MATCH (this:Exprlabel&test&Resource)
            WHERE EXISTS {
              MATCH (this)-[:realizationOf]->(this0:WorkLabel&test&Resource)
              WHERE EXISTS {
                MATCH (this0)-[:hasResourceType]->(this1:ResourceType)
                WHERE this1.uri = $param0
              }
            }
            WITH *
            LIMIT $param1
            CALL (this) {
              CALL (*) {
                WITH *
                MATCH (this)-[this2:relToUnion]->(this3:coreRoot&Resource)
                WITH this3 { __resolveType: 'coreRoot', __id: elementId(this3) } AS var4
                RETURN var4
                UNION
                WITH *
                MATCH (this)-[this5:relToUnion]->(this6:coreFrag&test&Resource)
                WITH this6 { iri: this6.uri, __resolveType: 'coreFrag', __id: elementId(this6) } AS var4
                RETURN var4
              }
              WITH var4
              RETURN collect(var4) AS var4
            }
            RETURN this { iri: this.uri, relToUnion: var4 } AS this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"tenant\\": \\"test\\",
                \\"param0\\": \\"http://data.somesite.com/crown/test-id\\",
                \\"param1\\": {
                    \\"low\\": 1,
                    \\"high\\": 0
                }
            }"
        `);
    });

    test("should apply dynamic label with filter when queried an interface", async () => {
        const query = /* GraphQL */ `
            query {
                exprs(
                    where: {
                        realizationOf: {
                            some: {
                                hasResourceType: { some: { iri: { eq: "http://data.somesite.com/crown/test-id" } } }
                            }
                        }
                    }
                    limit: 1
                ) {
                    iri
                    relToInterface {
                        ... on coreFrag {
                            iri
                        }
                    }
                }
            }
        `;

        const result = await translateQuery(neoSchema, query, {
            contextValues: {
                cypherParams: {
                    tenant: "test",
                },
            },
        });

        expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
            "CYPHER 5
            MATCH (this:Exprlabel&test&Resource)
            WHERE EXISTS {
              MATCH (this)-[:realizationOf]->(this0:WorkLabel&test&Resource)
              WHERE EXISTS {
                MATCH (this0)-[:hasResourceType]->(this1:ResourceType)
                WHERE this1.uri = $param0
              }
            }
            WITH *
            LIMIT $param1
            CALL (this) {
              CALL (*) {
                WITH *
                MATCH (this)-[this2:relToInterface]->(this3:coreFrag&test&Resource)
                WITH this3 { iri: this3.uri, __resolveType: 'coreFrag', __id: elementId(this3) } AS var4
                RETURN var4
              }
              WITH var4
              RETURN collect(var4) AS var4
            }
            RETURN this { iri: this.uri, relToInterface: var4 } AS this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"tenant\\": \\"test\\",
                \\"param0\\": \\"http://data.somesite.com/crown/test-id\\",
                \\"param1\\": {
                    \\"low\\": 1,
                    \\"high\\": 0
                }
            }"
        `);
    });
});
