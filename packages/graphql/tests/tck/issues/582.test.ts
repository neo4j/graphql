/*
 * Copyright (c) "Neo4j"
 * Neo4j Sweden AB [http://neo4j.com]
 */

import { Neo4jGraphQL } from "../../../src";
import { formatCypher, formatParams, translateQuery } from "../utils/tck-test-utils";

describe("#582", () => {
    let typeDefs: string;
    let neoSchema: Neo4jGraphQL;

    beforeAll(() => {
        typeDefs = /* GraphQL */ `
            type Entity @node {
                children: [Entity!]! @relationship(type: "EDGE", properties: "Edge", direction: OUT)
                parents: [Entity!]! @relationship(type: "EDGE", properties: "Edge", direction: IN)
                type: String!
            }

            type Edge @relationshipProperties {
                type: String!
            }
        `;

        neoSchema = new Neo4jGraphQL({
            typeDefs,
        });
    });

    test("should be able to nest connection where inputs", async () => {
        const query = /* GraphQL */ `
            query ($where: EntityWhere) {
                entities(where: $where) {
                    type
                }
            }
        `;

        const result = await translateQuery(neoSchema, query, {
            variableValues: {
                where: {
                    type: { eq: "Cat" },
                    childrenConnection: {
                        some: {
                            node: {
                                type: { eq: "Dog" },
                                parentsConnection: {
                                    some: {
                                        node: {
                                            type: { eq: "Bird" },
                                        },
                                    },
                                },
                            },
                        },
                    },
                },
            },
        });

        expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
            "CYPHER 5
            MATCH (this:Entity)
            WHERE (this.type = $param0 AND EXISTS {
              MATCH (this)-[this0:EDGE]->(this1:Entity)
              WHERE (this1.type = $param1 AND EXISTS {
                MATCH (this1)<-[this2:EDGE]-(this3:Entity)
                WHERE this3.type = $param2
              })
            })
            RETURN this { .type } AS this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"param0\\": \\"Cat\\",
                \\"param1\\": \\"Dog\\",
                \\"param2\\": \\"Bird\\"
            }"
        `);
    });

    test("should be able to nest connection where inputs down more levels", async () => {
        const query = /* GraphQL */ `
            query ($where: EntityWhere) {
                entities(where: $where) {
                    type
                }
            }
        `;

        const result = await translateQuery(neoSchema, query, {
            variableValues: {
                where: {
                    type: { eq: "Cat" },
                    childrenConnection: {
                        some: {
                            node: {
                                type: { eq: "Dog" },
                                parentsConnection: {
                                    some: {
                                        node: {
                                            type: { eq: "Bird" },
                                            childrenConnection: {
                                                some: {
                                                    node: {
                                                        type: { eq: "Fish" },
                                                    },
                                                },
                                            },
                                        },
                                    },
                                },
                            },
                        },
                    },
                },
            },
        });

        expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
            "CYPHER 5
            MATCH (this:Entity)
            WHERE (this.type = $param0 AND EXISTS {
              MATCH (this)-[this0:EDGE]->(this1:Entity)
              WHERE (this1.type = $param1 AND EXISTS {
                MATCH (this1)<-[this2:EDGE]-(this3:Entity)
                WHERE (this3.type = $param2 AND EXISTS {
                  MATCH (this3)-[this4:EDGE]->(this5:Entity)
                  WHERE this5.type = $param3
                })
              })
            })
            RETURN this { .type } AS this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"param0\\": \\"Cat\\",
                \\"param1\\": \\"Dog\\",
                \\"param2\\": \\"Bird\\",
                \\"param3\\": \\"Fish\\"
            }"
        `);
    });
});
